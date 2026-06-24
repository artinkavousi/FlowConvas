// Brush — a continuous stroke of fluid along a polyline, flowing off its normal.
import { Vector2 } from 'three/webgpu';
import { clamp01, makeSplat, defaultBrushPoints, getPolylineLength, samplePolyline } from '../samplerHelpers.js';
import { registerType } from './_registry.js';

export const meta = { id: 'brush', label: 'Brush', defaults: { segments: 24, radius: 0.07 } };

export function sampleSplats(emitter, env) {
    const points = emitter.points?.length >= 2 ? emitter.points : defaultBrushPoints();
    const totalLength = getPolylineLength(points);
    const count = Math.max(6, Math.min(64, Math.round((totalLength / 0.014) * env.density)));
    const splats = [];
    for (let i = 0; i < count; i += 1) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        const p = samplePolyline(points, t * totalLength);
        const tangent = p.tangent.lengthSq() > 0 ? p.tangent.normalize() : new Vector2(1, 0);
        const normal = tangent.clone().rotateAround(new Vector2(0, 0), Math.PI * 0.5);
        const jitter = (Math.random() - 0.5) * emitter.spread * 0.025;
        const x = clamp01(p.x + normal.x * jitter);
        const y = clamp01(p.y + normal.y * jitter);
        splats.push(makeSplat(emitter, x, y, normal.x * env.speed, normal.y * env.speed, env.intensity, env.radius));
    }
    return splats;
}

registerType({ ...meta, sampleSplats });
