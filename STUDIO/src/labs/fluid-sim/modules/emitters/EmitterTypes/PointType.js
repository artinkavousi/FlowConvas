// Point — a soft continuous source: a small steady fountain of fluid at the
// anchor, drifting along `direction`.
import { clamp01, makeSplat } from '../samplerHelpers.js';
import { registerType } from './_registry.js';

export const meta = { id: 'point', label: 'Point', defaults: { radius: 0.1 } };

export function sampleSplats(emitter, env) {
    const count = Math.max(1, Math.round(2 * env.density));
    const cos = Math.cos(emitter.direction);
    const sin = Math.sin(emitter.direction);
    const splats = [];
    for (let i = 0; i < count; i += 1) {
        const jx = (Math.random() - 0.5) * emitter.spread * 0.12;
        const jy = (Math.random() - 0.5) * emitter.spread * 0.12;
        const dx = (cos + (Math.random() - 0.5) * emitter.spread) * env.speed;
        const dy = (sin + (Math.random() - 0.5) * emitter.spread) * env.speed;
        splats.push(makeSplat(emitter, clamp01(emitter.x + jx), clamp01(emitter.y + jy), dx, dy, env.intensity, env.radius));
    }
    return splats;
}

registerType({ ...meta, sampleSplats });
