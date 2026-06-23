// Heat — a continuous warm plume that rises (drives buoyancy when temperature
// is enabled; reads as a hot rising column regardless via the upward bias).
import { clamp01, makeSplat } from '../samplerHelpers.js';
import { registerType } from './_registry.js';

export const meta = { id: 'heat', label: 'Heat', defaults: { color: '#ff9844', radius: 0.1 } };

export function sampleSplats(emitter, env) {
    const count = Math.max(1, Math.round(2 * env.density));
    const splats = [];
    for (let i = 0; i < count; i += 1) {
        const x = clamp01(emitter.x + (Math.random() - 0.5) * emitter.spread * 0.12);
        const y = clamp01(emitter.y + (Math.random() - 0.5) * emitter.spread * 0.05);
        const dx = (Math.random() - 0.5) * env.speed * 0.4;
        const dy = Math.abs(env.speed) * (0.7 + Math.random() * 0.4);   // up (sim y=0 bottom)
        splats.push(makeSplat(emitter, x, y, dx, dy, env.intensity, env.radius));
    }
    return splats;
}

registerType({ ...meta, sampleSplats });
