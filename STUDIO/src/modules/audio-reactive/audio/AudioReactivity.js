// AudioReactivity — the single object the rest of the app talks to.
//
// Owns the graph, the extractor, the beat tracker, the modulation matrix,
// and a small bank of LFOs + sample-and-holds available as matrix sources.
//
// Exposes a backward-compatible snapshot so the EmitterSystem, the
// PerformanceHUD, and the existing GUI keep working unchanged:
//   { enabled, energy, bass, mid, treble, beat, spectrum }
//
// Richer consumers (the upcoming Audio v2 GUI panel) call getFrame() for the
// full AudioFrame.

import { AudioGraph } from './AudioGraph.js';
import { FeatureExtractor } from './FeatureExtractor.js';
import { BeatTracker } from './BeatTracker.js';
import { ModulationMatrix } from './ModulationMatrix.js';
import { LFO, SampleAndHold } from './Modulators.js';
import { getRoutePreset, routePresets } from './routePresets.js';
import { MacroStore } from './MacroStore.js';
import { AudioBus } from './AudioBus.js';

export class AudioReactivity {
    constructor() {
        this.graph = new AudioGraph();
        this.extractor = new FeatureExtractor(this.graph);
        this.beatTracker = new BeatTracker();
        this.matrix = new ModulationMatrix();
        this.bus = new AudioBus();
        this.lfos = [new LFO(), new LFO(), new LFO()];
        // Defaults: lfos[0] = slow smooth wander, lfos[1] = 1/2 beat sine, lfos[2] = fast tri
        this.lfos[0].shape = 'smooth'; this.lfos[0].freq = 0.08;
        this.lfos[1].shape = 'sine';   this.lfos[1].beatSync = '1/2';
        this.lfos[2].shape = 'tri';    this.lfos[2].freq = 0.6;
        for (const lfo of this.lfos) lfo.lastValue = 0;
        this.sahs = [new SampleAndHold(), new SampleAndHold()];
        // v2: user-defined macros (linear combinations of sources). Persist
        // across reloads; surfaced as matrix source path `macro.<id>`.
        this.macros = new MacroStore();

        this.currentMode = 'off';                  // string preset name or 'custom'
        this.matrix.setRoutes(getRoutePreset(this.currentMode));
        this._workletWanted = false;
        this._workletAttached = false;

        this._snapshot = {
            enabled: false,
            energy: 0, bass: 0, mid: 0, treble: 0,
            beat: false,
            bpm: 0,
            confidence: 0,
            spectrum: new Array(16).fill(0),
            frame: null
        };

        this._lastDt = 1 / 60;
    }

    // --- legacy getters (so old GUI / HUD code keeps reading audio.bass etc.)

    get enabled() { return this.graph.isRunning(); }
    get energy()  { return this._snapshot.energy; }
    get bass()    { return this._snapshot.bass; }
    get mid()     { return this._snapshot.mid; }
    get treble()  { return this._snapshot.treble; }
    get beat()    { return this._snapshot.beat; }
    get spectrum(){ return this._snapshot.spectrum; }
    get bpm()     { return this._snapshot.bpm; }

    // --- source control --------------------------------------------------

    async startMic() { await this.graph.start('mic'); }
    async startFile(payload) { await this.graph.start('file', payload); }
    async startTone(payload) { await this.graph.start('tone', payload); }
    async stop() { await this.graph.stop(); }

    setGain(value) { this.graph.setGain(value); }
    setMuted(muted) { this.graph.setMuted(muted); }

    // Old GUI calls audio.stop() / startMic() too — keep that surface.
    on(event, handler) { return this.graph.on(event, handler); }

    // --- modulation matrix control --------------------------------------

    /**
     * Choose a built-in matrix preset.
     * @param {'off'|'balanced'|'pulse'|'cinema'|'custom'|Array} mode
     */
    setMode(mode, config) {
        if (mode === this.currentMode) return;
        // When switching modes, first restore any active routes' base values
        // so the new preset starts from a clean config baseline.
        if (this.matrix.active && config) this.matrix.disable(config);
        this.currentMode = mode;
        if (mode === 'custom') return;
        const routes = getRoutePreset(mode);
        this.matrix.setRoutes(routes);
    }

    setRoutes(routes) {
        this.currentMode = 'custom';
        this.matrix.setRoutes(routes);
    }

    setAmount(value) { this.matrix.setAmount(value); }

    /**
     * Per-frame update.
     *   - Sample features off the analyser.
     *   - Track beat / BPM.
     *   - Advance LFOs (beat-synced ones get current barPhase).
     *   - Apply matrix to mutate config.
     * Returns the legacy snapshot (kept stable for existing consumers).
     */
    update(config, dt) {
        const dtSafe = Number.isFinite(dt) && dt > 0 ? dt : (1 / 60);
        this._lastDt = dtSafe;

        // Honour the live config knobs the existing GUI writes into.
        // 1) Binding mode dropdown — swap route preset if the user changed it.
        const requestedMode = config.AUDIO_BINDING_MODE || 'off';
        if (requestedMode !== this.currentMode && requestedMode !== 'custom') {
            this.setMode(requestedMode, config);
        }
        // 1b) Opt-in AudioWorklet backend — attach lazily once a source is
        // running, detach if user disabled it. Falls back silently on failure.
        const wantWorklet = !!config.AUDIO_USE_WORKLET;
        if (wantWorklet !== this._workletWanted) {
            this._workletWanted = wantWorklet;
            if (wantWorklet && this.graph.isRunning() && !this._workletAttached) {
                this.graph.enableWorklet((payload) => {
                    this.extractor.workletFrame = payload;
                }).then((ok) => { this._workletAttached = !!ok; if (!ok) this._workletWanted = false; });
            } else if (!wantWorklet && this._workletAttached) {
                this.graph.disableWorklet();
                this._workletAttached = false;
                this.extractor.workletFrame = null;
            }
        }
        // 2) Global amount = AUDIO_FX_AMOUNT * AUDIO_GAIN, clamped.
        const fxAmount = Number.isFinite(config.AUDIO_FX_AMOUNT) ? config.AUDIO_FX_AMOUNT : 1;
        const gain = Number.isFinite(config.AUDIO_GAIN) ? config.AUDIO_GAIN : 1;
        this.matrix.setAmount(Math.max(0, Math.min(2, fxAmount * gain)));
        // 3) Soft gate via AUDIO_ENABLED — when off, treat as mode='off' for this frame.
        const softGate = config.AUDIO_ENABLED !== false;

        const features = this.extractor.process(dtSafe);
        const beat = this.beatTracker.process(features, dtSafe);

        // Attach beat data to the frame so the matrix can resolve `beat.*` paths.
        features.beat = beat;
        // Evaluate user macros into frame.macro so routes can use `macro.<id>`.
        this.macros.evaluateInto(features);

        // Advance modulators
        for (const lfo of this.lfos) {
            lfo.setBeatPhase(beat.barPhase);
            lfo.lastValue = lfo.process(dtSafe);
        }
        // Default SAH behaviour: latch spectral centroid on each beat (slow palette wander)
        if (beat.edge) {
            this.sahs[0].latch(features.spectral.centroid);
            this.sahs[1].latch(features.bands.bass);
        }
        for (const sah of this.sahs) sah.process(dtSafe, 400);

        // Apply matrix
        const matrixOn = softGate && this.currentMode !== 'off' && this.graph.isRunning();
        if (!matrixOn) {
            if (this.matrix.active) this.matrix.disable(config);
        } else {
            this.matrix.update(features, config, { lfos: this.lfos, sahs: this.sahs }, dtSafe);
        }

        // Dispatch event-style audio bus signals (beat/onset/bar/subdivision/silence)
        // so subscribers can react declaratively. Existing audioFrame consumers
        // are unchanged; this is purely additive.
        if (Number.isFinite(config.AUDIO_LATENCY_MS)) {
            this.bus.setLatencyMs(config.AUDIO_LATENCY_MS);
        }
        this.bus.tick(features, dtSafe);

        // Write legacy snapshot
        const snap = this._snapshot;
        const legacy = features.legacy;
        snap.enabled = this.graph.isRunning();
        snap.energy = legacy.energy;
        snap.bass = legacy.bass;
        snap.mid = legacy.mid;
        snap.treble = legacy.treble;
        snap.beat = beat.edge;
        snap.bpm = beat.bpm;
        snap.confidence = beat.confidence;
        // Spectrum: copy Float32Array → plain array for downstream consumers expecting indexable arrays
        for (let i = 0; i < snap.spectrum.length; i += 1) {
            snap.spectrum[i] = legacy.spectrum[i];
        }
        snap.frame = features;

        document.documentElement.dataset.fluidAudioBinding = this.currentMode;
        return snap;
    }

    snapshot() {
        return this._snapshot;
    }

    getFrame() {
        return this._snapshot.frame;
    }

    /**
     * Compatibility shim — the old GUI calls audioBindings.restore(config) when
     * the user toggles the binding mode in the dropdown. We forward to disable().
     */
    restore(config) {
        this.matrix.disable(config);
    }

    /** Tap-tempo, exposed for the GUI button. */
    tap() { this.beatTracker.tap(); }

    /** List of built-in mode names for GUI dropdowns. */
    static get modes() {
        return Object.keys(routePresets);
    }
}
