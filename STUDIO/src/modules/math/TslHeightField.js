// TslHeightField.module.js
// Universal TSL procedural height field — FBM height + finite-difference surface normal, plus an
// axis-angle vector rotation helper. Sample it in a compute kernel or a positionNode to displace and
// shade any plane/instanced surface (terrain, ground for scatter systems, displacement fields).
//
// Ported verbatim from REF/false-earth/src/core/shaders/terrainHelpers.ts.
// Already method-chained TSL — no operator rewrite needed.

import {
  Fn,
  vec2,
  vec3,
  float,
  normalize,
  cross,
  length,
  max,
  abs,
  select,
  dot,
  cos,
  sin,
  mx_fractal_noise_float,
} from 'three/tsl';

/**
 * Returns a TSL Fn that calculates terrain height at an XZ position.
 * @param terrainAmp  amplitude (uniform or float node)
 * @param terrainFreq frequency (uniform or float node)
 * @param terrainSeed seed offset (uniform or float node)
 * @returns Fn([xz:vec2]) -> float height
 */
export function getTerrainHeight(terrainAmp, terrainFreq, terrainSeed) {
  return Fn(([xz]) => {
    const samplePos = xz.add(vec2(0.001)); // Offset to avoid origin artifacts
    const noiseValue = mx_fractal_noise_float(
      samplePos.mul(terrainFreq).add(vec2(terrainSeed, float(0.0)))
    );
    return noiseValue.mul(terrainAmp);
  });
}

/**
 * Returns a TSL Fn that calculates the terrain normal via finite differences.
 * @param getTerrainHeight the Fn returned by getTerrainHeight() — height and normal MUST share one instance
 * @returns Fn([xz:vec2]) -> vec3 unit normal (Y-up)
 */
export function getTerrainNormal(getTerrainHeight) {
  return Fn(([xz]) => {
    const baseEpsilon = float(0.1);
    const minDist = max(abs(xz.x), abs(xz.y));
    const epsilon = max(baseEpsilon, minDist.mul(0.01));

    const h = getTerrainHeight(xz);
    const hx = getTerrainHeight(xz.add(vec2(epsilon, float(0.0))));
    const hz = getTerrainHeight(xz.add(vec2(float(0.0), epsilon)));

    // Standard finite-difference method for Y-up
    const p1 = vec3(epsilon, hx.sub(h), float(0.0));
    const p2 = vec3(float(0.0), hz.sub(h), epsilon);

    // Cross product order for Y-up
    const normal = cross(p2, p1);
    const len = length(normal);

    // Handle edge case where normal is zero (flat surface)
    const threshold = float(0.0001);
    const defaultNormal = vec3(float(0.0), float(1.0), float(0.0));
    return select(len.greaterThan(threshold), normalize(normal), defaultNormal);
  });
}

/**
 * Rotates a vector around an axis by a given angle (Rodrigues' rotation).
 * @param v     vector to rotate
 * @param axis  rotation axis
 * @param angle rotation angle in radians
 */
export const rotateAxis = /*@__PURE__*/ Fn(([v, axis, angle]) => {
  const axisNorm = normalize(axis);
  const proj = axisNorm.mul(dot(axisNorm, v));
  return proj
    .add(v.sub(proj).mul(cos(angle)))
    .add(cross(axisNorm, v).mul(sin(angle)));
});
