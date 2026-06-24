// Area — fills a rectangle with a steady field of fluid drifting along `direction`.
import { clamp01, makeSplat } from '../samplerHelpers.js';
import { registerType } from './_registry.js';

export const meta = { id: 'area', label: 'Area', defaults: { segments: 18, width: 0.28, height: 0.18, radius: 0.09 } };

export function sampleSplats(emitter, env) {
    const count = Math.max(4, Math.round(emitter.segments * Math.min(1.5, env.density)));
    const fx = Math.cos(emitter.direction);
    const fy = Math.sin(emitter.direction);
    const splats = [];
    for (let i = 0; i < count; i += 1) {
        const u = (Math.random() - 0.5) * emitter.width;
        const v = (Math.random() - 0.5) * emitter.height;
        const x = clamp01(emitter.x + u);
        const y = clamp01(emitter.y + v);
        splats.push(makeSplat(emitter, x, y, fx * env.speed, fy * env.speed, env.intensity, env.radius));
    }
    return splats;
}

registerType({ ...meta, sampleSplats });
