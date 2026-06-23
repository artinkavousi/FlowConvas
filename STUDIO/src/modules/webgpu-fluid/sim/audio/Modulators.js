// Modulators — small, allocation-free signal shapers used by the matrix.
//
// EnvelopeFollower
//   .process(value, dt, attackMs, releaseMs) -> smoothed value
//   Asymmetric attack/release. The route owns one per-target. This is what
//   makes "bass → bloom" feel like a real instrument instead of a step function.
//
// LFO
//   .process(dt, opts) -> -1..1
//   Free-running, or beat-synced via .setBeatPhase(barPhase).
//   Waveforms: sine, tri, saw, square, smooth (Perlin-ish smooth noise).
//
// SampleAndHold
//   .latch(value)            update internal target
//   .process(dt, releaseMs)  smoothed approach to target
//   Use case: hue picks a new value per beat/onset edge and slides to it.
//
// BeatClock
//   .process(barPhase, subdivision) -> 0..1 ramp at chosen subdivision
//
// Curves (pure functions)
//   applyCurve(value, curveSpec) -> 0..1
//   Supported: linear, pow, s, exp, step, custom (4-point bezier — minimal).

export class EnvelopeFollower {
    constructor() { this.value = 0; }
    process(target, dt, attackMs, releaseMs) {
        // Convert ms time-constants into a per-frame lerp coefficient.
        // A simple 1 - exp(-dt / tau) is exact for first-order smoothing.
        const tau = (target > this.value ? attackMs : releaseMs) * 0.001;
        const k = tau <= 0 ? 1 : 1 - Math.exp(-dt / Math.max(tau, 0.0005));
        this.value += (target - this.value) * k;
        return this.value;
    }
    reset(value = 0) { this.value = value; }
}

export class LFO {
    constructor() {
        this.phase = 0;
        this.freq = 0.25;        // Hz when free-running
        this.shape = 'sine';     // sine | tri | saw | square | smooth
        this.beatSync = null;    // null | '1/1' | '1/2' | '1/4' | '1/8' | '1/16' | '3/4' | '5/4'
        this.barPhase = 0;       // updated externally when beat-synced
        // Smooth-noise state (linear interpolation between sampled-and-held random points)
        this._sn = { a: 0, b: 0, t: 0, rate: 1 };
    }
    setBeatPhase(barPhase) { this.barPhase = barPhase; }

    process(dt) {
        let p;
        if (this.beatSync) {
            const sub = BEAT_SYNC_MUL[this.beatSync] ?? 1;
            p = ((this.barPhase * sub) % 1 + 1) % 1;
            this.phase = p;
        } else {
            this.phase = (this.phase + dt * this.freq) % 1;
            p = this.phase;
        }
        switch (this.shape) {
            case 'tri': {
                const v = p < 0.5 ? p * 4 - 1 : 3 - p * 4;
                return v;
            }
            case 'saw': return p * 2 - 1;
            case 'square': return p < 0.5 ? 1 : -1;
            case 'smooth': {
                const sn = this._sn;
                sn.t += dt * this.freq;
                while (sn.t >= 1) {
                    sn.t -= 1;
                    sn.a = sn.b;
                    sn.b = Math.random() * 2 - 1;
                }
                // Smoothstep interpolation
                const t = sn.t;
                const s = t * t * (3 - 2 * t);
                return sn.a * (1 - s) + sn.b * s;
            }
            case 'sine':
            default:
                return Math.sin(p * Math.PI * 2);
        }
    }
}

const BEAT_SYNC_MUL = {
    '4/1': 0.25,
    '2/1': 0.5,
    '1/1': 1,
    '1/2': 2,
    '1/4': 4,
    '1/8': 8,
    '1/16': 16,
    '3/4': 4 / 3,
    '5/4': 4 / 5
};

export class SampleAndHold {
    constructor() { this.value = 0; this.target = 0; }
    latch(value) { this.target = value; }
    process(dt, releaseMs = 120) {
        const tau = releaseMs * 0.001;
        const k = tau <= 0 ? 1 : 1 - Math.exp(-dt / Math.max(tau, 0.0005));
        this.value += (this.target - this.value) * k;
        return this.value;
    }
    reset(v = 0) { this.value = v; this.target = v; }
}

export function applyCurve(value, spec) {
    const v = Math.max(0, Math.min(1, value));
    if (!spec || spec.type === 'linear') return v;
    switch (spec.type) {
        case 'pow': {
            const k = Math.max(0.0001, spec.k ?? 1);
            return Math.pow(v, k);
        }
        case 's': {
            // smoothstep-like S curve
            return v * v * (3 - 2 * v);
        }
        case 'exp': {
            const k = spec.k ?? 4;
            return (Math.exp(k * v) - 1) / (Math.exp(k) - 1);
        }
        case 'step': {
            const t = spec.threshold ?? 0.5;
            return v < t ? 0 : 1;
        }
        case 'custom': {
            // 4 control points y0..y3 spaced uniformly on x — cubic Bezier-ish.
            const y0 = spec.y0 ?? 0;
            const y1 = spec.y1 ?? 0.33;
            const y2 = spec.y2 ?? 0.66;
            const y3 = spec.y3 ?? 1;
            const u = 1 - v;
            return u * u * u * y0
                 + 3 * u * u * v * y1
                 + 3 * u * v * v * y2
                 + v * v * v * y3;
        }
        default:
            return v;
    }
}
