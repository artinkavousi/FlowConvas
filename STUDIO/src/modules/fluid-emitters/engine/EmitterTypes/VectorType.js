// Vector — a closed polygon outline that continuously pushes fluid outward.
import { Vector2 } from 'three/webgpu';
import { clamp01, makeSplat, defaultVectorPoints, getPolylineLength, samplePolyline, getCentroid } from '../samplerHelpers.js';
import { registerType } from './_registry.js';

export const meta = { id: 'vector', label: 'Vector', defaults: { segments: 28, radius: 0.07 } };

export function sampleSplats(emitter, env) {
    const points = emitter.points?.length >= 3 ? emitter.points : defaultVectorPoints();
    const closed = [...points, points[0]];
    const totalLength = getPolylineLength(closed);
    const count = Math.max(8, Math.min(64, Math.round((totalLength / 0.014) * env.density)));
    const center = getCentroid(points);
    const splats = [];
    for (let i = 0; i < count; i += 1) {
        const t = i / count;
        const p = samplePolyline(closed, t * totalLength);
        let ox = p.x - center.x;
        let oy = p.y - center.y;
        const ol = Math.hypot(ox, oy) || 0.0001;
        ox /= ol; oy /= ol;
        splats.push(makeSplat(emitter, p.x, p.y, ox * env.speed, oy * env.speed, env.intensity, env.radius));
    }
    return splats;
}

registerType({ ...meta, sampleSplats });
