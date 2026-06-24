// featureProcessorSource — the source text of the AudioWorkletProcessor,
// stored as a string so it can be turned into a Blob URL at runtime (no
// extra build config needed).
//
// The processor:
//   - accumulates 128-sample blocks into a window of `fftSize` samples
//   - computes RMS + peak per window
//   - runs a real radix-2 FFT on a Hann-windowed copy
//   - posts { rms, peak, mags } to the main thread once per window
//
// The main-thread FeatureExtractor receives these messages and feeds them
// into the existing per-frame pipeline as if they came from the AnalyserNode.

export const FEATURE_PROCESSOR_SOURCE = `
class FeatureProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() { return []; }

    constructor(options) {
        super();
        const opts = (options && options.processorOptions) || {};
        this.fftSize = opts.fftSize || 2048;
        this.buffer = new Float32Array(this.fftSize);
        this.writeIndex = 0;
        this.windowFn = makeHann(this.fftSize);
        this.scratchReal = new Float32Array(this.fftSize);
        this.scratchImag = new Float32Array(this.fftSize);
        this.magnitudes = new Float32Array(this.fftSize / 2);
    }

    process(inputs) {
        const channels = inputs[0];
        if (!channels || channels.length === 0) return true;
        const block = channels[0];
        if (!block || block.length === 0) return true;
        // Accumulate into ring buffer.
        for (let i = 0; i < block.length; i++) {
            this.buffer[this.writeIndex] = block[i];
            this.writeIndex = (this.writeIndex + 1) % this.fftSize;
            if (this.writeIndex === 0) this._postWindow();
        }
        return true;
    }

    _postWindow() {
        const n = this.fftSize;
        let sumSq = 0; let peak = 0;
        for (let i = 0; i < n; i++) {
            const v = this.buffer[i];
            sumSq += v * v;
            const a = v < 0 ? -v : v;
            if (a > peak) peak = a;
            // Windowed copy for FFT
            this.scratchReal[i] = v * this.windowFn[i];
            this.scratchImag[i] = 0;
        }
        fftRadix2(this.scratchReal, this.scratchImag, n);
        // Magnitudes (linear). Main thread converts to its dBFS-ish band math.
        const half = n / 2;
        for (let i = 0; i < half; i++) {
            const re = this.scratchReal[i], im = this.scratchImag[i];
            this.magnitudes[i] = Math.sqrt(re * re + im * im) * (2 / n);
        }
        const rms = Math.sqrt(sumSq / n);
        // Transfer the mags buffer to avoid copy. We send a fresh allocation
        // each time because transferring leaves our buffer detached.
        const out = new Float32Array(half);
        out.set(this.magnitudes);
        this.port.postMessage({ rms, peak, mags: out, sampleRate, fftSize: n }, [out.buffer]);
    }
}

function makeHann(n) {
    const w = new Float32Array(n);
    for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
    return w;
}

// Iterative radix-2 Cooley–Tukey FFT, in-place. Assumes n is a power of 2.
function fftRadix2(real, imag, n) {
    // Bit-reverse permutation
    let j = 0;
    for (let i = 0; i < n; i++) {
        if (i < j) {
            const tr = real[i]; real[i] = real[j]; real[j] = tr;
            const ti = imag[i]; imag[i] = imag[j]; imag[j] = ti;
        }
        let m = n >> 1;
        while (m >= 1 && j >= m) { j -= m; m >>= 1; }
        j += m;
    }
    // Butterfly
    for (let size = 2; size <= n; size <<= 1) {
        const half = size >> 1;
        const phi = -Math.PI / half;
        const wr0 = Math.cos(phi), wi0 = Math.sin(phi);
        for (let off = 0; off < n; off += size) {
            let wr = 1, wi = 0;
            for (let k = 0; k < half; k++) {
                const i0 = off + k;
                const i1 = i0 + half;
                const tr = wr * real[i1] - wi * imag[i1];
                const ti = wr * imag[i1] + wi * real[i1];
                real[i1] = real[i0] - tr; imag[i1] = imag[i0] - ti;
                real[i0] += tr; imag[i0] += ti;
                const nwr = wr * wr0 - wi * wi0;
                wi = wr * wi0 + wi * wr0;
                wr = nwr;
            }
        }
    }
}

registerProcessor('fluid-feature-processor', FeatureProcessor);
`;
