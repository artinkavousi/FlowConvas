// Spline — a continuous cubic-bezier ribbon of fluid, flowing off its normal.
import { Vector2 } from 'three/webgpu';
import { clamp01, makeSplat, cubicBezier, cubicBezierTangent } from '../samplerHelpers.js';
import { registerType } from './_registry.js';

export const meta = {
    id: 'spline', label: 'Spline',
    defaults: { x2: 0.34, y2: 0.72, x3: 0.7, y3: 0.34, x4: 0.82, y4: 0.32, segments: 28, radius: 0.07 }
};

export function sampleSplats(emitter, env) {
    const count = Math.max(6, Math.round(emitter.segments * Math.min(1.5, env.density)));
    const splats = [];
    for (let i = 0; i < count; i += 1) {
        const t = (i + 0.5) / count;
        const point = cubicBezier(emitter, t);
        const tangent = cubicBezierTangent(emitter, t);
        const normal = tangent.lengthSq() > 0
            ? tangent.normalize().rotateAround(new Vector2(0, 0), Math.PI * 0.5)
            : new Vector2(Math.cos(emitter.direction), Math.sin(emitter.direction));
        const jitter = (Math.random() - 0.5) * emitter.spread * 0.03;
        const x = clamp01(point.x + normal.x * jitter);
        const y = clamp01(point.y + normal.y * jitter);
        splats.push(makeSplat(emitter, x, y, normal.x * env.speed, normal.y * env.speed, env.intensity, env.radius));
    }
    return splats;
}

registerType({ ...meta, sampleSplats });
