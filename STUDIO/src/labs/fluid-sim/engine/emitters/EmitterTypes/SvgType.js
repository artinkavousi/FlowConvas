// SVG — a continuous stroke of fluid along an SVG path (flattened to a polyline).
import { Vector2 } from 'three/webgpu';
import { clamp01, makeSplat, defaultSvgPoints, getPolylineLength, samplePolyline } from '../samplerHelpers.js';
import { registerType } from './_registry.js';

export const meta = { id: 'svg', label: 'SVG', defaults: { segments: 28, radius: 0.06 } };

export function sampleSplats(emitter, env) {
    const points = emitter.points?.length >= 2 ? emitter.points : defaultSvgPoints();
    const totalLength = getPolylineLength(points);
    const count = Math.max(6, Math.min(80, Math.round((totalLength / 0.012) * env.density)));
    const splats = [];
    for (let i = 0; i < count; i += 1) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        const p = samplePolyline(points, t * totalLength);
        const tangent = p.tangent.lengthSq() > 0 ? p.tangent.normalize() : new Vector2(1, 0);
        const normal = tangent.clone().rotateAround(new Vector2(0, 0), Math.PI * 0.5);
        splats.push(makeSplat(emitter, p.x, p.y, normal.x * env.speed, normal.y * env.speed, env.intensity, env.radius));
    }
    return splats;
}

registerType({ ...meta, sampleSplats });
