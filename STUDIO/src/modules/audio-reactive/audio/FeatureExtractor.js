// FeatureExtractor — turns a Web Audio AnalyserNode into a musical AudioFrame.
//
// What it gives you (each frame):
//   bands:   {sub, bass, lowMid, mid, highMid, presence, air}  0..1, perceptual
//   loudness: {rms, peak, crest, aWeighted}                    0..1ish, A-weighted is the musically useful one
//   spectral: {centroid, spread, flatness}                     0..1, "brightness" / "spikiness" / "noisiness"
//   flux:     scalar                                           positive half-wave spectral flux
//   onsets:   {sub, bass, lowMid, mid, highMid, presence, air, global}
//             each onset has {value, edge, adaptiveThreshold}
//   raw:      Float32Array of bin dBFS                         for visualisers
//
// The "legacy" mirror at the bottom keeps {energy, bass, mid, treble, spectrum}
// so old consumers (EmitterSystem name-matching path during migration, HUD)
// keep working until they're refactored.

const BAND_DEFS = [
    { id: 'sub',      hzLow: 20,    hzHigh: 60 },
    { id: 'bass',     hzLow: 60,    hzHigh: 150 },
    { id: 'lowMid',   hzLow: 150,   hzHigh: 400 },
    { id: 'mid',      hzLow: 400,   hzHigh: 1200 },
    { id: 'highMid',  hzLow: 1200,  hzHigh: 3500 },
    { id: 'presence', hzLow: 3500,  hzHigh: 7000 },
    { id: 'air',      hzLow: 7000,  hzHigh: 16000 }
];

// Per-band defaults — bass needs more debounce than air to avoid double-kicks.
const ONSET_DEBOUNCE_MS = {
    sub: 90, bass: 90, lowMid: 60, mid: 45, highMid: 30, presence: 25, air: 25, global: 40
};

export class FeatureExtractor {
    constructor(graph) {
        this.graph = graph;
        // External (worklet) frame override. When set, process() uses these
        // pre-computed magnitudes/RMS/peak instead of pulling from the analyser.
        // Shape: { rms, peak, mags: Float32Array, sampleRate, fftSize }.
        this.workletFrame = null;
        this.frame = createFrame();
        this.binBuffer = null;
        this.prevMagnitude = null;
        this.bandRanges = null;
        this.aWeights = null;
        this.fftSize = 0;
        this.sampleRate = 0;
        // Per-band onset state (median tracker over ~1 s)
        this.onsetHistoryLen = 60; // ~1 s at 60 fps
        this.onsetHistory = {};
        this.onsetIndex = 0;
        this.lastOnsetMs = {};
        for (const band of BAND_DEFS) {
            this.onsetHistory[band.id] = new Float32Array(this.onsetHistoryLen);
            this.lastOnsetMs[band.id] = 0;
        }
        this.onsetHistory.global = new Float32Array(this.onsetHistoryLen);
        this.lastOnsetMs.global = 0;
        // Silence gate (long-window RMS)
        this.silenceRms = 0;
        this.silenceGateThreshold = 0.002; // linear amplitude
        // Time-domain buffer for RMS/peak
        this.timeBuffer = null;
    }

    /**
     * Read one frame off the analyser. Idempotent if called multiple times in
     * the same animation frame (still fills the same `this.frame` object).
     */
    process(dt) {
        const analyser = this.graph.getAnalyser();
        if (!analyser) {
            this.decay(dt);
            return this.frame;
        }

        this.ensureBuffers(analyser);

        // --- magnitudes + RMS/peak: prefer worklet frame when present ---
        let rms; let peak; let magnitudes;
        if (this.workletFrame) {
            rms = this.workletFrame.rms;
            peak = this.workletFrame.peak;
            // Worklet supplies linear magnitudes directly.
            magnitudes = this.workletFrame.mags;
        } else {
            analyser.getFloatFrequencyData(this.binBuffer); // dBFS, range ~[-100, 0]
            analyser.getFloatTimeDomainData(this.timeBuffer); // [-1, 1]
            let sumSq = 0; peak = 0;
            for (let i = 0; i < this.timeBuffer.length; i += 1) {
                const v = this.timeBuffer[i];
                sumSq += v * v;
                const a = v < 0 ? -v : v;
                if (a > peak) peak = a;
            }
            rms = Math.sqrt(sumSq / Math.max(this.timeBuffer.length, 1));
            // Defer the dB→linear conversion until just before we use mags.
        }
        this.silenceRms = this.silenceRms * 0.97 + rms * 0.03;
        const silenceGate = this.silenceRms < this.silenceGateThreshold ? 0 : 1;

        // Frequency bands (linear magnitudes from dBFS) — worklet may have
        // already supplied them as `magnitudes` above.
        if (!magnitudes) {
            magnitudes = this.dbToLinear(this.binBuffer);
        }
        const bands = this.frame.bands;
        const spec = this.frame.spectral;

        for (let i = 0; i < BAND_DEFS.length; i += 1) {
            const range = this.bandRanges[i];
            let sum = 0;
            for (let b = range.startBin; b < range.endBin; b += 1) {
                sum += magnitudes[b];
            }
            const mean = sum / Math.max(range.endBin - range.startBin, 1);
            const val = clamp01(mean * range.gain) * silenceGate;
            bands[BAND_DEFS[i].id] = val;
        }

        // A-weighted loudness
        let aSum = 0;
        let aCount = 0;
        for (let b = 1; b < magnitudes.length; b += 1) {
            aSum += magnitudes[b] * this.aWeights[b];
            aCount += this.aWeights[b];
        }
        const aWeighted = clamp01((aSum / Math.max(aCount, 1)) * 4.0) * silenceGate;

        // Spectral centroid + spread + flatness
        let cNum = 0;
        let cDen = 0;
        let geomLogSum = 0;
        let arithSum = 0;
        let count = 0;
        for (let b = 1; b < magnitudes.length; b += 1) {
            const m = magnitudes[b];
            const f = b / magnitudes.length; // normalised "frequency"
            cNum += f * m;
            cDen += m;
            if (m > 1e-7) {
                geomLogSum += Math.log(m);
                count += 1;
            }
            arithSum += m;
        }
        const centroid = clamp01(cDen > 1e-6 ? cNum / cDen : 0);
        // Spread = sqrt(sum((f-centroid)^2 * m) / sum(m))
        let sNum = 0;
        for (let b = 1; b < magnitudes.length; b += 1) {
            const f = b / magnitudes.length;
            sNum += (f - centroid) * (f - centroid) * magnitudes[b];
        }
        const spread = clamp01(Math.sqrt(cDen > 1e-6 ? sNum / cDen : 0) * 3.0);
        const arithMean = arithSum / Math.max(magnitudes.length - 1, 1);
        const geomMean = count > 0 ? Math.exp(geomLogSum / count) : 0;
        const flatness = clamp01(arithMean > 1e-7 ? geomMean / arithMean : 0);

        spec.centroid = centroid;
        spec.spread = spread;
        spec.flatness = flatness;

        // Spectral flux (half-wave rectified)
        let flux = 0;
        if (this.prevMagnitude) {
            for (let b = 1; b < magnitudes.length; b += 1) {
                const d = magnitudes[b] - this.prevMagnitude[b];
                if (d > 0) flux += d;
            }
            flux /= Math.max(magnitudes.length - 1, 1);
            flux = clamp01(flux * 12);
        }
        this.frame.flux = flux * silenceGate;
        // Save magnitude for next flux
        if (!this.prevMagnitude || this.prevMagnitude.length !== magnitudes.length) {
            this.prevMagnitude = new Float32Array(magnitudes.length);
        }
        this.prevMagnitude.set(magnitudes);

        // Loudness / RMS
        const loud = this.frame.loudness;
        loud.rms = rms;
        loud.peak = peak;
        loud.crest = rms > 1e-6 ? peak / rms : 0;
        loud.aWeighted = aWeighted;

        // Per-band onsets: instantaneous diff vs previous frame, gated by
        // adaptive threshold derived from the past second of that band's energy.
        const now = performance.now();
        this.onsetIndex = (this.onsetIndex + 1) % this.onsetHistoryLen;
        for (const band of BAND_DEFS) {
            const id = band.id;
            const prev = this.frame.prevBands[id] || 0;
            const cur = bands[id];
            const rise = Math.max(0, cur - prev);
            this.onsetHistory[id][this.onsetIndex] = rise;
            // adaptive threshold = median + 1.6 * MAD
            const stats = robustStats(this.onsetHistory[id]);
            const adaptive = stats.median + 1.6 * stats.mad + 0.015;
            const edge = rise > adaptive && (now - this.lastOnsetMs[id]) > ONSET_DEBOUNCE_MS[id];
            if (edge) this.lastOnsetMs[id] = now;
            const o = this.frame.onsets[id];
            o.value = rise;
            o.adaptiveThreshold = adaptive;
            o.edge = edge;
            this.frame.prevBands[id] = cur;
        }

        // Global onset (max of bands) drives the beat tracker.
        let maxRise = 0;
        for (const band of BAND_DEFS) {
            const o = this.frame.onsets[band.id];
            if (o.value > maxRise) maxRise = o.value;
        }
        this.onsetHistory.global[this.onsetIndex] = maxRise;
        const gStats = robustStats(this.onsetHistory.global);
        const gAdaptive = gStats.median + 1.6 * gStats.mad + 0.02;
        const gEdge = maxRise > gAdaptive && (now - this.lastOnsetMs.global) > ONSET_DEBOUNCE_MS.global;
        if (gEdge) this.lastOnsetMs.global = now;
        this.frame.onsets.global.value = maxRise;
        this.frame.onsets.global.adaptiveThreshold = gAdaptive;
        this.frame.onsets.global.edge = gEdge;

        // Legacy mirror for old consumers
        const legacy = this.frame.legacy;
        legacy.bass = Math.max(bands.sub, bands.bass);
        legacy.mid = Math.max(bands.lowMid, bands.mid);
        legacy.treble = Math.max(bands.highMid, bands.presence, bands.air);
        legacy.energy = clamp01(legacy.bass * 0.45 + legacy.mid * 0.35 + legacy.treble * 0.25 + aWeighted * 0.15);
        legacy.beat = this.frame.onsets.global.edge;
        // Spectrum (16 bands) for visualisers
        const spectrum = legacy.spectrum;
        const lin = magnitudes;
        const bucket = lin.length / spectrum.length;
        for (let i = 0; i < spectrum.length; i += 1) {
            const start = Math.floor(i * bucket);
            const end = Math.floor((i + 1) * bucket);
            let s = 0;
            for (let b = start; b < end; b += 1) s += lin[b];
            spectrum[i] = clamp01((s / Math.max(end - start, 1)) * 4.0);
        }

        // Debug dataset (cheap)
        document.documentElement.dataset.fluidAudioEnergy = legacy.energy.toFixed(3);
        document.documentElement.dataset.fluidAudioBeat = String(legacy.beat);
        document.documentElement.dataset.fluidAudioBpmInput = legacy.energy.toFixed(3);

        this.frame.silenceGate = silenceGate;
        this.frame.timestamp = now;
        return this.frame;
    }

    decay(dt) {
        const k = Math.exp(-dt * 6);
        const bands = this.frame.bands;
        for (const band of BAND_DEFS) {
            bands[band.id] *= k;
            this.frame.prevBands[band.id] *= k;
            const o = this.frame.onsets[band.id];
            o.value *= k;
            o.edge = false;
        }
        this.frame.onsets.global.value *= k;
        this.frame.onsets.global.edge = false;
        const loud = this.frame.loudness;
        loud.rms *= k; loud.peak *= k; loud.aWeighted *= k;
        const legacy = this.frame.legacy;
        legacy.bass *= k; legacy.mid *= k; legacy.treble *= k; legacy.energy *= k;
        legacy.beat = false;
        for (let i = 0; i < legacy.spectrum.length; i += 1) legacy.spectrum[i] *= k;
        this.frame.flux *= k;
        this.frame.silenceGate = 0;
    }

    ensureBuffers(analyser) {
        if (analyser.fftSize !== this.fftSize || this.graph.getSampleRate() !== this.sampleRate) {
            this.fftSize = analyser.fftSize;
            this.sampleRate = this.graph.getSampleRate();
            this.binBuffer = new Float32Array(analyser.frequencyBinCount);
            this.timeBuffer = new Float32Array(analyser.fftSize);
            this.prevMagnitude = new Float32Array(analyser.frequencyBinCount);
            this.bandRanges = computeBandRanges(BAND_DEFS, this.sampleRate, analyser.frequencyBinCount);
            this.aWeights = computeAWeighting(this.sampleRate, analyser.frequencyBinCount);
        }
    }

    dbToLinear(db) {
        // dBFS → linear. Returns a reused scratch buffer.
        if (!this._linBuf || this._linBuf.length !== db.length) {
            this._linBuf = new Float32Array(db.length);
        }
        for (let i = 0; i < db.length; i += 1) {
            const v = db[i];
            // -100 dBFS or below → 0; clamp upper end so peak transients don't blow up the math.
            this._linBuf[i] = v <= -100 ? 0 : Math.pow(10, v / 20);
        }
        return this._linBuf;
    }
}

function createFrame() {
    const bands = {};
    const prevBands = {};
    const onsets = {};
    for (const band of BAND_DEFS) {
        bands[band.id] = 0;
        prevBands[band.id] = 0;
        onsets[band.id] = { value: 0, edge: false, adaptiveThreshold: 0 };
    }
    onsets.global = { value: 0, edge: false, adaptiveThreshold: 0 };
    return {
        timestamp: 0,
        silenceGate: 0,
        bands,
        prevBands,
        onsets,
        flux: 0,
        spectral: { centroid: 0, spread: 0, flatness: 0 },
        loudness: { rms: 0, peak: 0, crest: 0, aWeighted: 0 },
        // Backward-compatible snapshot fields:
        legacy: {
            energy: 0,
            bass: 0,
            mid: 0,
            treble: 0,
            beat: false,
            spectrum: new Float32Array(16)
        }
    };
}

function computeBandRanges(defs, sampleRate, binCount) {
    const hzPerBin = sampleRate / 2 / binCount;
    return defs.map((band) => {
        const startBin = Math.max(1, Math.floor(band.hzLow / hzPerBin));
        const endBin = Math.min(binCount, Math.ceil(band.hzHigh / hzPerBin));
        // Wider bands collect more energy by area — normalise so each band's
        // 0..1 range is roughly comparable for typical music.
        const width = Math.max(endBin - startBin, 1);
        const gain = 6.5 / Math.sqrt(width);
        return { startBin, endBin, gain };
    });
}

function computeAWeighting(sampleRate, binCount) {
    // IEC 61672-1 A-weighting on FFT bins. Returns linear gain per bin.
    const weights = new Float32Array(binCount);
    const hzPerBin = sampleRate / 2 / binCount;
    for (let b = 0; b < binCount; b += 1) {
        const f = b * hzPerBin;
        if (f <= 0) { weights[b] = 0; continue; }
        const f2 = f * f;
        const num = 12200 * 12200 * f2 * f2;
        const den = (f2 + 20.6 * 20.6) * Math.sqrt((f2 + 107.7 * 107.7) * (f2 + 737.9 * 737.9)) * (f2 + 12200 * 12200);
        const ra = num / Math.max(den, 1e-12);
        // Normalise so 1 kHz ≈ 1.0
        weights[b] = ra * 2.0;
    }
    return weights;
}

function robustStats(buffer) {
    // Compute median + median-absolute-deviation over a small buffer.
    // Allocations here are bounded — buffers are small (60 floats).
    const sorted = Array.from(buffer).sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1];
    const dev = sorted.map((v) => Math.abs(v - median)).sort((a, b) => a - b);
    const mad = dev[dev.length >> 1];
    return { median, mad };
}

function clamp01(value) {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
}

export { BAND_DEFS };
