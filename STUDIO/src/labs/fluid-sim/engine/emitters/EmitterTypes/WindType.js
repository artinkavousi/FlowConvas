// Wind — a steady directional push on the velocity field in a region. No dye.
import { clamp01, makeVelocityOnlySplat } from '../samplerHelpers.js';
import { registerType } from './_registry.js';

export const meta = { id: 'wind', label: 'Wind', defaults: { color: '#88a4ff', radius: 0.12 } };

export function sampleSplats(emitter, env) {
    const radius = Math.max(emitter.radius, 0.04);
    const dx = Math.cos(emitter.direction) * env.speed;
    const dy = Math.sin(emitter.direction) * env.speed;
    const count = Math.max(2, Math.round((2 + emitter.spread * 5) * env.density));
    const splats = [];
    for (let i = 0; i < count; i += 1) {
        const jr = Math.sqrt(Math.random()) * radius * 0.7;
        const ja = Math.random() * Math.PI * 2;
        splats.push(makeVelocityOnlySplat(emitter, clamp01(emitter.x + Math.cos(ja) * jr), clamp01(emitter.y + Math.sin(ja) * jr), dx, dy));
    }
    return splats;
}

registerType({ ...meta, sampleSplats });
