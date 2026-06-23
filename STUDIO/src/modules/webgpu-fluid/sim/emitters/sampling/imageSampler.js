// imageSampler — real image loading + alpha/luma sampling for the Image
// emitter. Replaces the procedural radial+stripes fake.
//
// API
//   loadImage(srcOrFile) -> Promise<ImageHandle>
//   sampleImage(handle, { samples, threshold, channel })
//       -> [{x, y, weight}] in 0..1 within the image bounds
//
// Inputs:
//   srcOrFile : string (data URL / regular URL) | File | Blob
//   threshold : 0..1 normalized — pixels with chosen channel value above
//               this are eligible
//   channel   : 'alpha' | 'luma' | 'r' | 'g' | 'b'
//
// Sampling strategy: build a cumulative-distribution from the chosen channel
// over a downsampled grid, then inverse-CDF sample N points. This gives
// densest emission in the brightest/most-opaque regions instead of uniform.
//
// The handle caches the source image + its imageData; sampling is per-call
// but deterministic if the same RNG seed is supplied.

const DEFAULT_SAMPLES = 256;
const DEFAULT_THRESHOLD = 0.18;
const GRID_RESOLUTION = 96; // downsampled grid the CDF is built over

export async function loadImage(srcOrFile) {
    const url = await sourceToObjectUrl(srcOrFile);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(new Error(`Image load failed: ${e?.message || e?.type || 'unknown'}`));
        img.src = url;
    });
    // Rasterise into a fixed-size canvas (preserve aspect).
    const canvas = document.createElement('canvas');
    const aspect = img.naturalWidth / Math.max(img.naturalHeight, 1);
    let cw = GRID_RESOLUTION;
    let ch = GRID_RESOLUTION;
    if (aspect >= 1) ch = Math.max(8, Math.round(GRID_RESOLUTION / aspect));
    else cw = Math.max(8, Math.round(GRID_RESOLUTION * aspect));
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, cw, ch);
    const imageData = ctx.getImageData(0, 0, cw, ch);
    // Free the object URL if we created one.
    if (srcOrFile instanceof Blob) URL.revokeObjectURL(url);
    return {
        width: cw,
        height: ch,
        imageData,
        natural: { width: img.naturalWidth, height: img.naturalHeight }
    };
}

export function sampleImage(handle, opts = {}) {
    if (!handle?.imageData) return [];
    const samples = Math.max(8, opts.samples ?? DEFAULT_SAMPLES);
    const threshold = clamp01(opts.threshold ?? DEFAULT_THRESHOLD);
    const channel = opts.channel || 'luma';
    const data = handle.imageData.data;
    const w = handle.width;
    const h = handle.height;
    const cellCount = w * h;

    // Build CDF over the chosen channel.
    const cdf = new Float32Array(cellCount);
    let total = 0;
    for (let i = 0; i < cellCount; i += 1) {
        const px = i * 4;
        const value = pickChannel(data, px, channel);
        const weighted = value > threshold ? (value - threshold) / Math.max(1 - threshold, 1e-4) : 0;
        total += weighted;
        cdf[i] = total;
    }
    if (total <= 0) return [];

    // Inverse-CDF sample.
    const points = [];
    for (let s = 0; s < samples; s += 1) {
        const r = Math.random() * total;
        const idx = upperBound(cdf, r);
        const x = idx % w;
        const y = Math.floor(idx / w);
        // Jitter within the cell so points don't visibly snap to grid.
        const jx = Math.random();
        const jy = Math.random();
        const u = (x + jx) / w;
        const v = (y + jy) / h;
        points.push({ x: u, y: 1 - v, weight: 1 });
    }
    return points;
}

function pickChannel(data, px, channel) {
    if (channel === 'r') return data[px]     / 255;
    if (channel === 'g') return data[px + 1] / 255;
    if (channel === 'b') return data[px + 2] / 255;
    if (channel === 'alpha') return data[px + 3] / 255;
    // luma
    return (0.2126 * data[px] + 0.7152 * data[px + 1] + 0.0722 * data[px + 2]) / 255;
}

function upperBound(arr, target) {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (arr[mid] <= target) lo = mid + 1;
        else hi = mid;
    }
    return Math.min(lo, arr.length - 1);
}

async function sourceToObjectUrl(src) {
    if (src instanceof Blob || src instanceof File) {
        return URL.createObjectURL(src);
    }
    if (typeof src === 'string') return src;
    throw new Error('Unsupported image source — expected URL, File, or Blob');
}

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
