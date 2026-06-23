// textSampler — real glyph rasterisation for the Text emitter.
//
// Replaces the 3-row bitmap approximation in EmitterSystem.getTextPoints with
// a canvas-based sampler: render the text into an offscreen canvas, scan the
// alpha channel, and produce a point cloud in normalized 0..1 space within
// the emitter's bounding box.
//
// API
//   sampleText({ text, width, height, samples, font, threshold })
//     -> Float32Array of [u, v] pairs in [0..1]
//
// Cached by a key derived from all inputs so repeated calls for unchanged
// strings cost only a hash lookup.

const CANVAS_RESOLUTION = 256;          // longest side, in pixels
const DEFAULT_FONT = '700 200px "Segoe UI", system-ui, sans-serif';
const DEFAULT_ALPHA_THRESHOLD = 96;

let scratchCanvas = null;
let scratchCtx = null;
const cache = new Map();
const MAX_CACHE_ENTRIES = 32;

function ensureCanvas() {
    if (scratchCanvas) return;
    scratchCanvas = document.createElement('canvas');
    scratchCtx = scratchCanvas.getContext('2d', { willReadFrequently: true });
}

/**
 * @param {object} opts
 * @param {string} opts.text       text to render (truncated to 32 chars)
 * @param {number} opts.width      emitter bounding width (0..1)
 * @param {number} opts.height     emitter bounding height (0..1)
 * @param {number} [opts.samples=128]  approximate point cloud size
 * @param {string} [opts.font]     CSS font shorthand
 * @param {number} [opts.threshold=96]  alpha threshold (0..255)
 * @returns Array<{x:number,y:number}>  points in 0..1 within the emitter bbox
 */
export function sampleText({ text, width, height, samples = 128, font = DEFAULT_FONT, threshold = DEFAULT_ALPHA_THRESHOLD }) {
    const safeText = String(text || 'FLUID').slice(0, 32);
    if (!safeText.trim()) {
        return [];
    }
    const cacheKey = `${safeText}|${font}|${width.toFixed(3)}|${height.toFixed(3)}|${samples}|${threshold}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    ensureCanvas();

    // Aspect-correct canvas: longest side = CANVAS_RESOLUTION.
    const aspect = width / Math.max(height, 1e-4);
    let cw = CANVAS_RESOLUTION;
    let ch = CANVAS_RESOLUTION;
    if (aspect >= 1) {
        ch = Math.max(8, Math.round(CANVAS_RESOLUTION / aspect));
    } else {
        cw = Math.max(8, Math.round(CANVAS_RESOLUTION * aspect));
    }
    scratchCanvas.width = cw;
    scratchCanvas.height = ch;

    // Background clear + measure-fit-render text.
    scratchCtx.clearRect(0, 0, cw, ch);
    scratchCtx.fillStyle = '#fff';
    scratchCtx.textAlign = 'center';
    scratchCtx.textBaseline = 'middle';

    // Auto-size: shrink font until text fits comfortably.
    let fontPx = ch * 0.86;
    scratchCtx.font = font.replace(/\d+px/, `${Math.round(fontPx)}px`);
    let measured = scratchCtx.measureText(safeText);
    while (measured.width > cw * 0.94 && fontPx > 12) {
        fontPx *= 0.92;
        scratchCtx.font = font.replace(/\d+px/, `${Math.round(fontPx)}px`);
        measured = scratchCtx.measureText(safeText);
    }
    scratchCtx.fillText(safeText, cw / 2, ch / 2);

    // Walk pixels, collect candidates, reservoir-sample to N.
    const imageData = scratchCtx.getImageData(0, 0, cw, ch);
    const data = imageData.data;
    const candidates = [];
    for (let y = 0; y < ch; y += 1) {
        for (let x = 0; x < cw; x += 1) {
            const alpha = data[(y * cw + x) * 4 + 3];
            if (alpha > threshold) {
                candidates.push((x + 0.5) / cw);
                candidates.push((y + 0.5) / ch);
            }
        }
    }
    if (candidates.length === 0) {
        cache.set(cacheKey, []);
        return [];
    }
    const candidateCount = candidates.length / 2;
    const target = Math.min(samples, candidateCount);
    const stride = Math.max(1, Math.floor(candidateCount / target));
    const points = [];
    for (let i = 0; i < candidateCount; i += stride) {
        const u = candidates[i * 2];
        const v = candidates[i * 2 + 1];
        // Convert from canvas-space (top-left origin) to emitter-local 0..1
        // with bottom-left origin (the sim convention).
        points.push({ x: u, y: 1 - v });
        if (points.length >= target) break;
    }

    // Trim oldest entries if cache is full.
    if (cache.size >= MAX_CACHE_ENTRIES) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
    }
    cache.set(cacheKey, points);
    return points;
}

export function clearTextCache() {
    cache.clear();
}
