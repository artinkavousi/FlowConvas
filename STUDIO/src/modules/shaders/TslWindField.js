// TslWindField.module.js
// Domain-reusable TSL wind field for foliage. A fractal-noise wind strength field over world XZ
// (animated by time), wind-facing yaw, and a set of helpers that push/sway bezier-blade control
// points and tip vertices. Drop into any grass/foliage/cloth-ish material to get coherent,
// directional, gusting wind motion.
//
// Ported from REF/false-earth/src/core/shaders/windHelpers.ts (field + facing) and
// src/components/grass/core/shaderHelpers.ts (push/sway/vertex-sway/getWindDirection).
// Deviation: getWindDirection used the project's external safeNormalize2D; here it uses the local
// safeNormalize (identical 2D behaviour) so the module is self-contained. Method-chained TSL — no
// operator rewrite needed.

import {
  vec2,
  vec3,
  float,
  atan,
  sin,
  cos,
  dot,
  sqrt,
  select,
  normalize,
  mix,
  mod,
  smoothstep,
  PI,
  TWO_PI,
  mx_fractal_noise_float,
  remapClamp,
} from 'three/tsl';

/** Safely normalize a 2D vector, returning (1,0) if length is ~0. */
export function safeNormalize(v) {
  const m2 = dot(v, v);
  const normalized = v.mul(float(1.0).div(sqrt(m2)));
  const fallback = vec2(1.0, 0.0);
  return select(m2.greaterThan(float(1e-6)), normalized, fallback);
}

/** Normalize an angle to [-PI, PI]. */
export function normalizeAngle(angle) {
  return atan(sin(angle), cos(angle));
}

/**
 * Fractal-noise wind strength at a world XZ position.
 * @returns float remapped from noise [-1,1] to [0, windStrength].
 */
export function calculateWindStrength(worldXZ, windDir, windScale, time, windSpeed, windStrength) {
  const windDirNorm = safeNormalize(windDir);
  const windUv = worldXZ.mul(windScale).add(windDirNorm.mul(time).mul(windSpeed));
  const windStrength01 = mx_fractal_noise_float(windUv);
  return remapClamp(windStrength01, float(-1.0), float(1.0), float(0.0), windStrength);
}

/** Apply wind-facing yaw to a base angle and normalize to [0,1]. */
export function applyWindFacingAndNormalize(baseAngle, windStrength01, windDir, windFacing) {
  const windAngle = atan(windDir.y, windDir.x);
  const angleDiff = atan(sin(windAngle.sub(baseAngle)), cos(windAngle.sub(baseAngle)));
  const facingAngle = baseAngle.add(angleDiff.mul(windFacing.mul(windStrength01)));
  return normalizeAngle(facingAngle).add(PI).div(TWO_PI);
}

/** Returns a function giving the world-space wind direction (vec3, Y=0) from a vec2 wind dir. */
export function getWindDirection(uWindDir) {
  return () => {
    const windDir2D = safeNormalize(uWindDir);
    return vec3(windDir2D.x, 0.0, windDir2D.y);
  };
}

/** Returns a function that pushes bezier control points along the wind (tip strongest). */
export function applyWindPush(getWindDirection) {
  return (p1, p2, p3, windStrength, height) => {
    const windDir = getWindDirection();
    const windScale = windStrength;
    const tipPush = windScale.mul(height).mul(0.25);
    const midPush1 = windScale.mul(height).mul(0.08);
    const midPush2 = windScale.mul(height).mul(0.15);
    const p1Pushed = p1.add(windDir.mul(midPush1));
    const p2Pushed = p2.add(windDir.mul(midPush2));
    const p3Pushed = p3.add(windDir.mul(tipPush));
    return { p1: p1Pushed, p2: p2Pushed, p3: p3Pushed };
  };
}

/** Returns a function that sways bezier control points (gusting low + high freq, cross-wind twist). */
export function applyWindSway(getWindDirection, uTime, uWindSwayFreqMin, uWindSwayFreqMax, uWindSwayStrength) {
  return (p1, p2, p3, windStrength, height, perBladeHash01, t, worldXZ) => {
    const W = getWindDirection();
    const CW = normalize(vec3(W.z.negate(), float(0.0), W.x));
    const windDir2 = vec2(W.x, W.z);

    const seed = mod(perBladeHash01.mul(3.567), float(1.0));
    const gust = float(0.65).add(float(0.35).mul(sin(uTime.mul(0.35).add(seed.mul(6.28318)))));

    const wave = dot(worldXZ, windDir2).mul(0.15);
    const baseFreq = mix(uWindSwayFreqMin, uWindSwayFreqMax, seed);
    const phase = perBladeHash01.mul(6.28318).add(wave);

    const low = sin(uTime.mul(baseFreq).add(phase).add(t.mul(2.2)));
    const high = sin(uTime.mul(baseFreq.mul(5.0)).add(phase.mul(1.7)).add(t.mul(5.0)));

    const amp = height.mul(windStrength);
    const swayLow = amp.mul(gust).mul(uWindSwayStrength);
    const swayHigh = amp.mul(0.8).mul(uWindSwayStrength);

    const dir = normalize(W.add(CW.mul(high.mul(0.35))));

    const p1Sway = p1.add(dir.mul(low.mul(swayLow).mul(0.25).add(high.mul(swayHigh).mul(0.25).mul(0.3))));
    const p2Sway = p2.add(dir.mul(low.mul(swayLow).mul(0.55).add(high.mul(swayHigh).mul(0.55).mul(0.6))));
    const p3Sway = p3.add(dir.mul(low.mul(swayLow).mul(1.0).add(high.mul(swayHigh).mul(1.0))));

    return { p1: p1Sway, p2: p2Sway, p3: p3Sway };
  };
}

/** Returns a function that computes a tip-vertex sway offset (perpendicular to the blade axis). */
export function applyVertexSway(getWindDirection, uTime, uWindSwayFreqMin, uWindSwayFreqMax, uWindSwayStrength) {
  return (side, t, height, windStrength, perBladeHash01, worldXZ) => {
    const topSwayMask = smoothstep(float(0.5), float(1.0), t);

    const W = getWindDirection();
    const windDir2 = vec2(W.x, W.z);

    const seed = mod(perBladeHash01.mul(3.567), float(1.0));
    const gust = float(0.65).add(float(0.35).mul(sin(uTime.mul(0.35).add(seed.mul(6.28318)))));

    const wave = dot(worldXZ, windDir2).mul(0.15);
    const baseFreq = mix(uWindSwayFreqMin, uWindSwayFreqMax, seed);
    const phase = perBladeHash01.mul(6.28318).add(wave);

    const low = sin(uTime.mul(baseFreq).add(phase).add(t.mul(2.2)));
    const high = sin(uTime.mul(baseFreq.mul(5.0)).add(phase.mul(1.7)).add(t.mul(5.0)));

    const amp = height.mul(windStrength);
    const swayLow = amp.mul(gust).mul(uWindSwayStrength);
    const swayHigh = amp.mul(0.8).mul(uWindSwayStrength);

    const swayAmount = low.mul(swayLow).add(high.mul(swayHigh));
    return side.mul(swayAmount).mul(topSwayMask);
  };
}
