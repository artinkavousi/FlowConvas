// Line — a continuous line of fluid between two endpoints. The whole line emits
// every frame, with a gentle flow perpendicular to it (a soft curtain/sheet).
import { clamp01, makeSplat, mix } from '../samplerHelpers.js';
import { registerType } from './_registry.js';

export const meta = { id: 'line', label: 'Line', defaults: { x2: 0.7, y2: 0.5, radius: 0.08 } };

export function sampleSplats(emitter, env) {
    const dxL = emitter.x2 - emitter.x;
    const dyL = emitter.y2 - emitter.y;
    const len = Math.hypot(dxL, dyL) || 0.0001;
    // One sample roughly every ~1.4% of canvas, scaled by flow density.
    const count = Math.max(4, Math.min(64, Math.round((len / 0.014) * env.density)));
    // Unit normal (perpendicular) — the flow direction off the line.
    let nx = -dyL / len;
    let ny = dxL / len;
    // Bias the normal toward the emitter's `direction` so the user can choose
    // which side the sheet flows toward.
    if (Math.cos(emitter.direction) * nx + Math.sin(emitter.direction) * ny < 0) { nx = -nx; ny = -ny; }
    const splats = [];
    for (let i = 0; i < count; i += 1) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        const jitter = (Math.random() - 0.5) * emitter.spread * 0.04;
        const x = clamp01(mix(emitter.x, emitter.x2, t) + nx * jitter);
        const y = clamp01(mix(emitter.y, emitter.y2, t) + ny * jitter);
        splats.push(makeSplat(emitter, x, y, nx * env.speed, ny * env.speed, env.intensity, env.radius));
    }
    return splats;
}

registerType({ ...meta, sampleSplats });
