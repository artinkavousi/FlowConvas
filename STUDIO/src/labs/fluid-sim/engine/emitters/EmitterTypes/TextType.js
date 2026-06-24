// Text — a continuous dye stencil of the emitter's text (gentle drift so the
// letters stay readable). Samples glyph pixels via the canvas rasterizer.
import { makeSplat } from '../samplerHelpers.js';
import { registerType } from './_registry.js';
import { sampleText } from '../sampling/textSampler.js';

export const meta = { id: 'text', label: 'Text', defaults: { text: 'FLUID', width: 0.46, height: 0.16, radius: 0.05 } };

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

function getTextPoints(emitter) {
    if (emitter.useGlyphRaster !== false) {
        const local = sampleText({ text: emitter.text, width: emitter.width, height: emitter.height, samples: emitter.textSamples ?? 120 });
        if (local.length === 0) return [{ x: emitter.x, y: emitter.y }];
        const left = emitter.x - emitter.width * 0.5;
        const bottom = emitter.y - emitter.height * 0.5;
        return local.map((p) => ({ x: clamp01(left + p.x * emitter.width), y: clamp01(bottom + p.y * emitter.height) }));
    }
    const characters = [...(String(emitter.text || 'FLUID').trim() || 'FLUID')].slice(0, 16);
    const points = [];
    const charWidth = emitter.width / Math.max(characters.length, 1);
    const left = emitter.x - emitter.width * 0.5;
    const bottom = emitter.y - emitter.height * 0.5;
    characters.forEach((ch, index) => {
        const code = ch.charCodeAt(0);
        const samples = Math.max(2, Math.min(5, Math.ceil(charWidth / Math.max(emitter.width, 0.001) * 18)));
        for (let row = 0; row < 3; row += 1) {
            for (let col = 0; col < samples; col += 1) {
                const edge = row === 0 || row === 2 || col === 0 || col === samples - 1;
                if (!edge && ((code >> ((row + col) % 6)) & 1) === 0) continue;
                points.push({
                    x: clamp01(left + charWidth * (index + 0.5) + (col / Math.max(samples - 1, 1) - 0.5) * charWidth * 0.72),
                    y: clamp01(bottom + (row / 2) * emitter.height)
                });
            }
        }
    });
    return points.length ? points : [{ x: emitter.x, y: emitter.y }];
}

export function sampleSplats(emitter, env) {
    const pts = getTextPoints(emitter);
    // Gentle drift so the stencil reads; speed kept low.
    const speed = env.speed * 0.25;
    const cos = Math.cos(emitter.direction);
    const sin = Math.sin(emitter.direction);
    const splats = [];
    for (let i = 0; i < pts.length; i += 1) {
        const p = pts[i];
        splats.push(makeSplat(emitter, p.x, p.y, cos * speed, sin * speed, env.intensity, env.radius));
    }
    return splats;
}

registerType({ ...meta, sampleSplats });
