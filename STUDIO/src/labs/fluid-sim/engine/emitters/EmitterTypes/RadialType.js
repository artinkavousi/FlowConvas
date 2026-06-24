// Radial — a continuous ring of fluid flowing outward from the anchor.
import { clamp01, makeSplat } from '../samplerHelpers.js';
import { registerType } from './_registry.js';

export const meta = { id: 'radial', label: 'Radial', defaults: { segments: 20, radius: 0.07 } };

export function sampleSplats(emitter, env) {
    const count = Math.max(3, Math.round(emitter.segments * Math.min(1.5, env.density)));
    const ringR = emitter.width * 0.5;
    const splats = [];
    for (let i = 0; i < count; i += 1) {
        const angle = emitter.direction + (i / count) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = clamp01(emitter.x + cos * ringR);
        const y = clamp01(emitter.y + sin * ringR);
        splats.push(makeSplat(emitter, x, y, cos * env.speed, sin * env.speed, env.intensity, env.radius));
    }
    return splats;
}

registerType({ ...meta, sampleSplats });
