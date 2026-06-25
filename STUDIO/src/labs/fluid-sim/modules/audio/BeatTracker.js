// BeatTracker — locks BPM and phase from an onset envelope.
//
// Approach: keep a ~6 s ring buffer of the global-onset signal sampled at a
// fixed 90 Hz; periodically autocorrelate to find the dominant tempo period
// in [70, 200] BPM; phase-lock by tracking the time of the strongest recent
// onset modulo the period.
//
// Exposes:
//   frame.beat = {
//     bpm, confidence (0..1),
//     phase, phase8, phase16, barPhase,
//     pulse,                // 1.0 on beat, decays exponentially
//     edge,                 // true on the frame the beat crosses
//     subdivisions: { quarter, eighth, sixteenth }  // edges only
//   }
//
// Tap tempo: call `tap()` two or more times; rolling average of intervals sets
// a manual BPM lock that overrides autocorrelation for ~8 s.

const SAMPLE_HZ = 90;
const WINDOW_SECONDS = 6;
const SAMPLE_LEN = SAMPLE_HZ * WINDOW_SECONDS;
const MIN_BPM = 70;
const MAX_BPM = 200;
const PULSE_DECAY = 8; // exponential decay rate (per second)
const MANUAL_LOCK_MS = 8000;

export class BeatTracker {
    constructor() {
        this.envelope = new Float32Array(SAMPLE_LEN);
        this.writeIndex = 0;
        this.timeAccumulator = 0;
        this.bpm = 120;
        this.confidence = 0;
        this.phase = 0;             // 0..1 within a beat
        this.pulse = 0;
        this.edge = false;
        this.lastBeatMs = 0;
        this.manualBpm = 0;
        this.manualLockedUntil = 0;
        this.taps = [];
        this.frame = {
            bpm: 120,
            confidence: 0,
            phase: 0,
            phase8: 0,
            phase16: 0,
            barPhase: 0,
            pulse: 0,
            edge: false,
            subdivisions: { quarter: false, eighth: false, sixteenth: false }
        };
        this._lastSubBeat = { quarter: -1, eighth: -1, sixteenth: -1 };
        this._reanalyseAcc = 0;
    }

    process(audioFrame, dt) {
        // 1) Feed the onset envelope at our fixed sample rate.
        this.timeAccumulator += dt;
        const samplePeriod = 1 / SAMPLE_HZ;
        const onset = audioFrame.onsets.global.value;
        while (this.timeAccumulator >= samplePeriod) {
            this.envelope[this.writeIndex] = onset;
            this.writeIndex = (this.writeIndex + 1) % SAMPLE_LEN;
            this.timeAccumulator -= samplePeriod;
        }

        // 2) Re-analyse tempo a few times per second (cheap autocorrelation).
        this._reanalyseAcc += dt;
        if (this._reanalyseAcc >= 0.25) {
            this._reanalyseAcc = 0;
            this._analyseTempo();
        }

        // 3) If manual tap lock is active, use it.
        const now = performance.now();
        if (this.manualBpm > 0 && now < this.manualLockedUntil) {
            this.bpm = this.manualBpm;
            this.confidence = Math.max(this.confidence, 0.9);
        }

        // 4) Advance phase based on bpm.
        const period = 60 / this.bpm;
        this.phase = (this.phase + dt / period) % 1;

        // 5) Determine if a beat edge occurred this frame.
        let edge = false;
        if (audioFrame.onsets.global.edge && this.confidence > 0.25) {
            // Reset phase to 0 when a strong onset matches expected beat window.
            const phaseDist = Math.min(this.phase, 1 - this.phase);
            if (phaseDist < 0.18) {
                this.phase = 0;
                edge = true;
            }
        }
        // Failsafe: detect phase wraparound even without onset
        if (!edge && this.phase < 0.02 && (now - this.lastBeatMs) > period * 1000 * 0.7) {
            edge = true;
        }
        if (edge) {
            this.pulse = 1;
            this.lastBeatMs = now;
            this.edge = true;
        } else {
            this.edge = false;
            this.pulse *= Math.exp(-PULSE_DECAY * dt);
        }

        // 6) Compute subdivision phases + edges.
        const phase8 = (this.phase * 2) % 1;
        const phase16 = (this.phase * 4) % 1;
        const barPhase = (this.phase / 4) % 1;
        const subdivisions = this.frame.subdivisions;

        // Quarter (= phase 0 wrap): same as edge above
        subdivisions.quarter = edge;
        // Eighth: trigger when phase8 wraps
        const eighthIndex = Math.floor(this.phase * 2);
        subdivisions.eighth = eighthIndex !== this._lastSubBeat.eighth;
        this._lastSubBeat.eighth = eighthIndex;
        // Sixteenth: similar
        const sixteenthIndex = Math.floor(this.phase * 4);
        subdivisions.sixteenth = sixteenthIndex !== this._lastSubBeat.sixteenth;
        this._lastSubBeat.sixteenth = sixteenthIndex;

        // 7) Write the frame object.
        const f = this.frame;
        f.bpm = this.bpm;
        f.confidence = this.confidence;
        f.phase = this.phase;
        f.phase8 = phase8;
        f.phase16 = phase16;
        f.barPhase = barPhase;
        f.pulse = this.pulse;
        f.edge = edge;

        document.documentElement.dataset.fluidAudioBpm = this.bpm.toFixed(1);
        document.documentElement.dataset.fluidAudioBeatConfidence = this.confidence.toFixed(2);

        return f;
    }

    _analyseTempo() {
        // Autocorrelate the envelope for lags in [minLag, maxLag] = BPM range.
        const minLag = Math.floor((60 / MAX_BPM) * SAMPLE_HZ);
        const maxLag = Math.ceil((60 / MIN_BPM) * SAMPLE_HZ);

        // Detrended copy of envelope (subtract mean) — improves SNR
        let mean = 0;
        for (let i = 0; i < SAMPLE_LEN; i += 1) mean += this.envelope[i];
        mean /= SAMPLE_LEN;

        let bestLag = -1;
        let bestScore = 0;
        for (let lag = minLag; lag <= maxLag; lag += 1) {
            let sum = 0;
            // Only correlate over the most recent half of the window — keeps
            // the tracker responsive to tempo changes within ~3 s.
            const n = Math.floor(SAMPLE_LEN / 2);
            for (let i = 0; i < n; i += 1) {
                const idxA = (this.writeIndex - 1 - i + SAMPLE_LEN) % SAMPLE_LEN;
                const idxB = (idxA - lag + SAMPLE_LEN) % SAMPLE_LEN;
                sum += (this.envelope[idxA] - mean) * (this.envelope[idxB] - mean);
            }
            if (sum > bestScore) {
                bestScore = sum;
                bestLag = lag;
            }
        }

        if (bestLag <= 0) {
            this.confidence *= 0.92;
            return;
        }

        const candidateBpm = (60 * SAMPLE_HZ) / bestLag;
        // Avoid sudden jumps; lerp toward candidate when confidence is high
        const norm = Math.min(1, bestScore / 0.6);
        this.confidence = this.confidence * 0.6 + norm * 0.4;
        const blend = Math.min(0.5, this.confidence);
        this.bpm = this.bpm * (1 - blend) + candidateBpm * blend;
        // Clamp inside sensible range
        if (this.bpm < MIN_BPM) this.bpm = MIN_BPM;
        if (this.bpm > MAX_BPM) this.bpm = MAX_BPM;
    }

    tap() {
        const now = performance.now();
        const last = this.taps[this.taps.length - 1] || 0;
        if (now - last > 2000) {
            // Reset rolling window on long pauses.
            this.taps = [];
        }
        this.taps.push(now);
        if (this.taps.length > 6) this.taps.shift();
        if (this.taps.length < 2) return;
        let sum = 0;
        for (let i = 1; i < this.taps.length; i += 1) sum += this.taps[i] - this.taps[i - 1];
        const avg = sum / (this.taps.length - 1);
        const bpm = clamp(60000 / avg, MIN_BPM, MAX_BPM);
        this.manualBpm = bpm;
        this.manualLockedUntil = now + MANUAL_LOCK_MS;
    }

    setBpm(bpm) {
        this.manualBpm = clamp(bpm, MIN_BPM, MAX_BPM);
        this.manualLockedUntil = performance.now() + MANUAL_LOCK_MS;
    }
}

function clamp(value, lo, hi) {
    return Math.max(lo, Math.min(hi, value));
}
