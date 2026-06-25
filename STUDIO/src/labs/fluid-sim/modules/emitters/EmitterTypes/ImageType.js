// Image — a continuous dye stencil sampled from a loaded image (alpha/luma CDF),
// with a procedural fallback before an image is loaded.
import { clamp01, makeSplat, imageMaskValue } from '../samplerHelpers.js';
import { sampleImage } from '../sampling/imageSampler.js';
import { registerType } from './_registry.js';

export const meta = { id: 'image', label: 'Image', defaults: { width: 0.36, height: 0.24, radius: 0.05 } };

export function sampleSplats(emitter, env) {
    const count = Math.max(16, Math.min(512, Math.round(emitter.imageSamples * Math.min(1.2, env.density))));
    const speed = env.speed * 0.25;
    const cos = Math.cos(emitter.direction);
    const sin = Math.sin(emitter.direction);
    const splats = [];

    if (emitter._imageHandle) {
        const points = sampleImage(emitter._imageHandle, {
            samples: count,
            threshold: emitter.imageThreshold ?? emitter.threshold,
            channel: emitter.imageChannel || 'luma'
        });
        for (let i = 0; i < points.length; i += 1) {
            const p = points[i];
            const x = clamp01(emitter.x + (p.x - 0.5) * emitter.width);
            const y = clamp01(emitter.y + (p.y - 0.5) * emitter.height);
            splats.push(makeSplat(emitter, x, y, cos * speed, sin * speed, env.intensity * (p.weight || 1), env.radius));
        }
        return splats;
    }

    const columns = Math.ceil(Math.sqrt(count * 1.4));
    const rows = Math.ceil(count / columns);
    for (let i = 0; i < count; i += 1) {
        const u = columns <= 1 ? 0.5 : (i % columns) / (columns - 1);
        const v = rows <= 1 ? 0.5 : Math.floor(i / columns) / (rows - 1);
        const mask = imageMaskValue(u, v, emitter.threshold);
        if (mask <= 0) continue;
        const x = clamp01(emitter.x + (u - 0.5) * emitter.width);
        const y = clamp01(emitter.y + (v - 0.5) * emitter.height);
        splats.push(makeSplat(emitter, x, y, cos * speed, sin * speed, env.intensity * mask, env.radius));
    }
    return splats;
}

registerType({ ...meta, sampleSplats });
