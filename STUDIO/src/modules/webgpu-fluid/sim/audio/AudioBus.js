// AudioBus — small pub/sub layer over the per-frame AudioFrame.
//
// AudioReactivity.update() returns the freshest AudioFrame; the AudioBus
// inspects edge fields on it and dispatches typed events to listeners.
// Consumers (emitters, particle V2 system, fluid audio-flash) can subscribe
// declaratively instead of inspecting frame.beat.edge themselves.
//
// Events:
//   'beat'       — fires on beat.edge (one frame). Payload: { phase, bpm, confidence }
//   'bar'        — fires on bar boundary. Payload: { beatsPerBar }
//   'onset'      — fires on any band onset. Payload: { band, value, strength }
//   'subdivision'— fires on beat phase divisions (1/4, 1/8, 1/16). Payload: { div, idx }
//   'silence'    — fires when entering / leaving silence. Payload: { entering }
//
// API:
//   bus.on(event, handler) -> unsubscribe()
//   bus.tick(audioFrame, dtSec)
//
// Listeners receive (payload). Handlers should be allocation-free.

export class AudioBus {
    constructor() {
        this.listeners = new Map();   // event -> Set<handler>
        this._lastBeatPhase = 0;
        this._lastSubIdx = { '1/4': -1, '1/8': -1, '1/16': -1 };
        this._lastBarPhase = 0;
        this._silent = true;
        this._silenceTime = 0;
        // Latency offset — delays event delivery by N ms. Used by latency
        // calibration so visual reactions match audible click.
        this.latencyMs = 0;
        this._queue = [];             // [{ at, event, payload }]
    }

    setLatencyMs(ms) {
        this.latencyMs = Math.max(0, Math.min(500, ms || 0));
    }

    on(event, handler) {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event).add(handler);
        return () => this.off(event, handler);
    }

    off(event, handler) {
        this.listeners.get(event)?.delete(handler);
    }

    emit(event, payload) {
        if (this.latencyMs > 0) {
            this._queue.push({ at: performance.now() + this.latencyMs, event, payload });
            return;
        }
        this._dispatch(event, payload);
    }

    _dispatch(event, payload) {
        const set = this.listeners.get(event);
        if (!set) return;
        for (const h of set) {
            try { h(payload); } catch (err) { /* swallow listener errors */ }
        }
    }

    _drainQueue() {
        if (this._queue.length === 0) return;
        const now = performance.now();
        // Queue is roughly time-ordered (emit() is called per frame), so linear scan is fine.
        while (this._queue.length > 0 && this._queue[0].at <= now) {
            const e = this._queue.shift();
            this._dispatch(e.event, e.payload);
        }
    }

    tick(audioFrame, dt = 1 / 60) {
        this._drainQueue();
        if (!audioFrame) return;
        const beat = audioFrame.beat;
        const onsets = audioFrame.onsets;
        const energy = audioFrame.loudness?.aWeighted ?? audioFrame.loudness?.rms ?? 0;

        // Silence enter/leave (0.5 s hysteresis).
        if (energy < 0.04) {
            this._silenceTime += dt;
            if (!this._silent && this._silenceTime > 0.5) {
                this._silent = true;
                this.emit('silence', { entering: true });
            }
        } else {
            this._silenceTime = 0;
            if (this._silent) {
                this._silent = false;
                this.emit('silence', { entering: false });
            }
        }

        if (!beat) return;

        // Beat edge
        if (beat.edge) {
            this.emit('beat', {
                phase: beat.phase || 0,
                bpm: beat.bpm || 0,
                confidence: beat.confidence || 0
            });
        }

        // Subdivision events derived from barPhase.
        const phase = Number.isFinite(beat.barPhase) ? beat.barPhase : (beat.phase || 0);
        const SUBS = [['1/4', 4], ['1/8', 8], ['1/16', 16]];
        for (const [name, n] of SUBS) {
            const idx = Math.floor(phase * n);
            if (idx !== this._lastSubIdx[name]) {
                this._lastSubIdx[name] = idx;
                this.emit('subdivision', { div: name, idx });
            }
        }

        // Bar boundary
        if (this._lastBarPhase > phase + 0.1) {
            // phase wrapped → bar edge
            this.emit('bar', { beatsPerBar: 4 });
        }
        this._lastBarPhase = phase;

        // Band onset edges
        if (onsets) {
            for (const band of Object.keys(onsets)) {
                const o = onsets[band];
                if (o?.edge) {
                    this.emit('onset', { band, value: o.value || 0, strength: o.strength || o.value || 0 });
                }
            }
        }
    }
}
