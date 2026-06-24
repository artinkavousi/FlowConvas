// Attractor — a steady radial velocity field around the anchor. No dye.
// Positive speed pulls inward; flip `direction` toward the anchor for a swirl.
import { clamp01, makeVelocityOnlySplat } from '../samplerHelpers.js';
import { registerType } from './_registry.js';

export const meta = { id: 'attractor', label: 'Attractor', defaults: { color: '#c84cff', radius: 0.12, force: 400, spread: 0.4 } };

export function sampleSplats(emitter, env) {
    const radius = Math.max(emitter.radius, 0.06);
    const rotational = emitter.direction || 0;
    const count = Math.max(4, Math.round((4 + emitter.spread * 8) * env.density));
    const splats = [];
    for (let i = 0; i < count; i += 1) {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.3;
        const r = radius * (0.6 + Math.random() * 0.6);
        const px = emitter.x + Math.cos(a) * r;
        const py = emitter.y + Math.sin(a) * r;
        const ux = (emitter.x - px) / Math.max(r, 0.001);
        const uy = (emitter.y - py) / Math.max(r, 0.001);
        const dx = ux * env.speed + (-uy) * env.speed * rotational;
        const dy = uy * env.speed + (ux) * env.speed * rotational;
        splats.push(makeVelocityOnlySplat(emitter, clamp01(px), clamp01(py), dx, dy));
    }
    return splats;
}

registerType({ ...meta, sampleSplats });
