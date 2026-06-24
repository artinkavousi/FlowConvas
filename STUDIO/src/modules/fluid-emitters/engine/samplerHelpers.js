// samplerHelpers — shared math used by the per-type emitter modules.
//
// Pulled out of EmitterSystem.js so each EmitterTypes/*.js can import the
// same primitives without a circular dep on the orchestrator. All functions
// are pure (no module-level state apart from the scratch Color, which is
// reused frame-to-frame to keep splat creation allocation-light).

import { Color, Vector2 } from 'three/webgpu';

const scratchColor = new Color();

/** Produce a splat object the FluidSimulation can ingest. `radius` defaults to
 *  the emitter's radius but can be overridden (e.g. audio-pumped size). */
export function makeSplat(emitter, x, y, dx, dy, intensity, radius) {
    scratchColor.copy(emitter.color).multiplyScalar(2.25 * intensity);
    return {
        x, y, dx, dy,
        radius: radius != null ? radius : emitter.radius,
        color: scratchColor.clone()
    };
}

/** Velocity-only splat: near-zero dye so it perturbs the flow without painting.
 *  Used by Wind / Attractor field emitters. */
export function makeVelocityOnlySplat(emitter, x, y, dx, dy) {
    return {
        x, y, dx, dy,
        radius: emitter.radius,
        color: { r: 0.0008, g: 0.0008, b: 0.0008 }
    };
}

export function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
export function mix(a, b, t) { return a * (1 - t) + b * t; }

/** Cubic bezier point at t (0..1) for spline emitters. */
export function cubicBezier(emitter, t) {
    const inv = 1 - t;
    const a = inv * inv * inv;
    const b = 3 * inv * inv * t;
    const c = 3 * inv * t * t;
    const d = t * t * t;
    return new Vector2(
        a * emitter.x + b * emitter.x2 + c * emitter.x3 + d * emitter.x4,
        a * emitter.y + b * emitter.y2 + c * emitter.y3 + d * emitter.y4
    );
}

/** Cubic bezier tangent at t. */
export function cubicBezierTangent(emitter, t) {
    const inv = 1 - t;
    return new Vector2(
        3 * inv * inv * (emitter.x2 - emitter.x) + 6 * inv * t * (emitter.x3 - emitter.x2) + 3 * t * t * (emitter.x4 - emitter.x3),
        3 * inv * inv * (emitter.y2 - emitter.y) + 6 * inv * t * (emitter.y3 - emitter.y2) + 3 * t * t * (emitter.y4 - emitter.y3)
    );
}

/** Arc-length of a polyline. */
export function getPolylineLength(points) {
    let length = 0;
    for (let i = 1; i < points.length; i += 1) {
        length += distance(points[i - 1], points[i]);
    }
    return Math.max(length, 0.0001);
}

/** Sample a polyline at `targetDistance` along its arc-length. */
export function samplePolyline(points, targetDistance) {
    let remaining = targetDistance;
    for (let i = 1; i < points.length; i += 1) {
        const previous = points[i - 1];
        const next = points[i];
        const segmentLength = Math.max(distance(previous, next), 0.0001);
        if (remaining <= segmentLength || i === points.length - 1) {
            const t = Math.min(1, Math.max(0, remaining / segmentLength));
            return {
                x: mix(previous.x, next.x, t),
                y: mix(previous.y, next.y, t),
                tangent: new Vector2(next.x - previous.x, next.y - previous.y)
            };
        }
        remaining -= segmentLength;
    }
    const last = points[points.length - 1];
    const beforeLast = points[points.length - 2] || last;
    return {
        x: last.x,
        y: last.y,
        tangent: new Vector2(last.x - beforeLast.x, last.y - beforeLast.y)
    };
}

export function getCentroid(points) {
    const sum = points.reduce((accumulator, point) => {
        accumulator.x += point.x;
        accumulator.y += point.y;
        return accumulator;
    }, { x: 0, y: 0 });
    return {
        x: sum.x / Math.max(points.length, 1),
        y: sum.y / Math.max(points.length, 1)
    };
}

export function distance(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }

export function defaultBrushPoints() {
    return [
        { x: 0.18, y: 0.38 },
        { x: 0.36, y: 0.62 },
        { x: 0.58, y: 0.42 },
        { x: 0.8,  y: 0.58 }
    ];
}

export function defaultVectorPoints() {
    return [
        { x: 0.5,  y: 0.75 },
        { x: 0.72, y: 0.55 },
        { x: 0.62, y: 0.28 },
        { x: 0.38, y: 0.28 },
        { x: 0.28, y: 0.55 }
    ];
}

export function defaultSvgPoints() {
    return [
        { x: 0.2,  y: 0.5 },
        { x: 0.32, y: 0.7 },
        { x: 0.48, y: 0.42 },
        { x: 0.64, y: 0.66 },
        { x: 0.8,  y: 0.46 }
    ];
}

/** Procedural image mask used as the fallback when no real image is loaded. */
export function imageMaskValue(u, v, threshold) {
    const centeredX = u - 0.5;
    const centeredY = v - 0.5;
    const radial = 1 - Math.min(1, Math.hypot(centeredX, centeredY) * 1.9);
    const stripes = (Math.sin(u * Math.PI * 5) * Math.cos(v * Math.PI * 4) + 1) * 0.5;
    const value = radial * 0.72 + stripes * 0.28;
    return value >= threshold ? value : 0;
}
