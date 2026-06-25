// TslVegetationMath.module.js
// Source-derived WebGPU/TSL vegetation helpers from momentchan/false-earth.
// Ports the reusable math behind False Earth's terrain, wind, PCG seeds, Bezier grass blades,
// slope alignment, easing, and HSV color shifting.

import {
  Fn,
  If,
  abs,
  acos,
  atan,
  clamp,
  cos,
  cross,
  dot,
  float,
  fract,
  int,
  length,
  max,
  mix,
  mx_fractal_noise_float,
  mx_hsvtorgb,
  mx_rgbtohsv,
  normalize,
  pow,
  select,
  sin,
  smoothstep,
  sqrt,
  step,
  uint,
  vec2,
  vec3,
} from 'three/tsl';

export const falseEarthVegetationProvenance = {
  source: 'https://github.com/momentchan/false-earth',
  sourceCommit: '74cc91cb2764fbb75aee201d92752e4da37ad311',
  submodule: 'packages/three-core',
  submoduleCommit: '61bde95d850c756e2a0d425b29fbd762e38a0c71',
  files: [
    'src/core/shaders/terrainHelpers.ts',
    'src/core/shaders/windHelpers.ts',
    'src/components/grass/core/shaderHelpers.ts',
    'packages/three-core/src/utils/tsl/math.ts',
    'packages/three-core/src/utils/tsl/color.ts',
  ],
  license: 'MIT',
};

const PI_F = float(Math.PI);
const TWO_PI_F = float(Math.PI * 2);
const PCG_MUL = 747796405;
const PCG_ADD = 2891336453;
const PCG_OUT = 277803737;
const PCG_MAX = 4294967295.0;

export const safeNormalize2D = (v) => {
  const m2 = dot(v, v);
  const len = sqrt(m2);
  const threshold = float(1e-6);
  return select(len.greaterThan(threshold), v.div(len), vec2(1.0, 0.0));
};

export const normalizeAngle = (angle) => atan(sin(angle), cos(angle));

export const easeInOutCubic = (t) => {
  const clampedT = t.clamp(0.0, 1.0);
  const val1 = clampedT.mul(clampedT).mul(clampedT).mul(4.0);
  const p = clampedT.sub(1.0);
  const val2 = p.mul(p).mul(p).mul(4.0).add(1.0);
  return mix(val1, val2, step(0.5, clampedT));
};

export const easeOutCubic = (t) => {
  const x = t.clamp(0.0, 1.0);
  const oneMinusX = float(1.0).sub(x);
  return float(1.0).sub(oneMinusX.mul(oneMinusX).mul(oneMinusX));
};

export const easeOutExpo = (t) => {
  const x = t.clamp(0.0, 1.0);
  return float(1.0).sub(pow(float(2.0), x.mul(-10.0)));
};

export const bezier3 = (p0, p1, p2, p3, t) => {
  const u = float(1.0).sub(t);
  const u2 = u.mul(u);
  const u3 = u2.mul(u);
  const t2 = t.mul(t);
  const t3 = t2.mul(t);
  return p0
    .mul(u3)
    .add(p1.mul(3.0).mul(u2).mul(t))
    .add(p2.mul(3.0).mul(u).mul(t2))
    .add(p3.mul(t3));
};

export const bezier3Tangent = (p0, p1, p2, p3, t) => {
  const u = float(1.0).sub(t);
  const u2 = u.mul(u);
  const ut = u.mul(t);
  const t2 = t.mul(t);
  return p1
    .sub(p0)
    .mul(u2)
    .mul(3.0)
    .add(p2.sub(p1).mul(ut).mul(6.0))
    .add(p3.sub(p2).mul(t2).mul(3.0));
};

export const shiftHSV = Fn(([color, shift]) => {
  const hsv = mx_rgbtohsv(color);
  const h = fract(hsv.x.add(shift.x));
  const s = clamp(hsv.y.add(shift.y), 0.0, 1.0);
  const v = clamp(hsv.z.add(shift.z), 0.0, 1.0);
  return mx_hsvtorgb(vec3(h, s, v));
});

export const pcgHash = Fn(([u]) => {
  const state = uint(u).mul(uint(PCG_MUL)).add(uint(PCG_ADD));
  let word = state.shiftRight(state.shiftRight(uint(28)).add(uint(4))).bitXor(state);
  word = word.mul(uint(PCG_OUT));
  word = word.shiftRight(uint(22)).bitXor(word);
  return float(word).div(float(PCG_MAX));
}).setLayout({
  name: 'falseEarthPcgHash',
  type: 'float',
  inputs: [{ name: 'u', type: 'uint' }],
});

export const hash2to1 = Fn(([x, y]) => {
  const seed = uint(x).mul(uint(1597334677)).add(uint(y).mul(uint(3812015801)));
  return pcgHash(seed);
}).setLayout({
  name: 'falseEarthHash2to1',
  type: 'float',
  inputs: [
    { name: 'x', type: 'int' },
    { name: 'y', type: 'int' },
  ],
});

export const hash2to2 = Fn(([x, y]) => {
  const seed1 = uint(x).mul(uint(1597334677)).add(uint(y).mul(uint(3812015801)));
  const seed2 = uint(x).mul(uint(3812015801)).add(uint(y).mul(uint(1597334677)));
  return vec2(pcgHash(seed1), pcgHash(seed2));
}).setLayout({
  name: 'falseEarthHash2to2',
  type: 'vec2',
  inputs: [
    { name: 'x', type: 'int' },
    { name: 'y', type: 'int' },
  ],
});

export function getTerrainHeight(terrainAmp, terrainFreq, terrainSeed) {
  return Fn(([xz]) => {
    const samplePos = xz.add(vec2(0.001));
    const noiseValue = mx_fractal_noise_float(samplePos.mul(terrainFreq).add(vec2(terrainSeed, float(0.0))));
    return noiseValue.mul(terrainAmp);
  });
}

export function getTerrainNormal(terrainHeightFn) {
  return Fn(([xz]) => {
    const baseEpsilon = float(0.1);
    const minDist = max(abs(xz.x), abs(xz.y));
    const epsilon = max(baseEpsilon, minDist.mul(0.01));
    const h = terrainHeightFn(xz);
    const hx = terrainHeightFn(xz.add(vec2(epsilon, float(0.0))));
    const hz = terrainHeightFn(xz.add(vec2(float(0.0), epsilon)));
    const p1 = vec3(epsilon, hx.sub(h), float(0.0));
    const p2 = vec3(float(0.0), hz.sub(h), epsilon);
    const normal = cross(p2, p1);
    const len = length(normal);
    return select(len.greaterThan(float(0.0001)), normalize(normal), vec3(float(0.0), float(1.0), float(0.0)));
  });
}

export const rotateAxis = Fn(([v, axis, angle]) => {
  const axisNorm = normalize(axis);
  const proj = axisNorm.mul(dot(axisNorm, v));
  return proj.add(v.sub(proj).mul(cos(angle))).add(cross(axisNorm, v).mul(sin(angle)));
});

export function calculateWindStrength(worldXZ, windDir, windScale, time, windSpeed, windStrength) {
  const windDirNorm = safeNormalize2D(windDir);
  const windUv = worldXZ.mul(windScale).add(windDirNorm.mul(time).mul(windSpeed));
  const windStrength01 = mx_fractal_noise_float(windUv);
  return clamp(windStrength01.sub(float(-1.0)).div(float(2.0)).mul(windStrength), 0.0, 1.0);
}

export function applyWindFacingAndNormalize(baseAngle, windStrength01, windDir, windFacing) {
  const windAngle = atan(windDir.y, windDir.x);
  const angleDiff = atan(sin(windAngle.sub(baseAngle)), cos(windAngle.sub(baseAngle)));
  const facingAngle = baseAngle.add(angleDiff.mul(windFacing.mul(windStrength01)));
  return normalizeAngle(facingAngle).add(PI_F).div(TWO_PI_F);
}

export const getBezierControlPoints = (discreteType, height, bend) => {
  const p1Type0 = vec3(0.0, height.mul(0.4), bend.mul(0.5));
  const p2Type0 = vec3(0.0, height.mul(0.75), bend.mul(0.7));
  const p1Type1 = vec3(0.0, height.mul(0.35), bend.mul(0.6));
  const p2Type1 = vec3(0.0, height.mul(0.7), bend.mul(0.8));
  const p1Type2 = vec3(0.0, height.mul(0.3), bend.mul(0.7));
  const p2Type2 = vec3(0.0, height.mul(0.65), bend.mul(1.0));
  const isType0 = discreteType.equal(float(0.0));
  const isType1 = discreteType.equal(float(1.0));
  return {
    p1: select(isType0, p1Type0, select(isType1, p1Type1, p1Type2)),
    p2: select(isType0, p2Type0, select(isType1, p2Type1, p2Type2)),
  };
};

export function applyWindPush(getWindDirection) {
  return (p1, p2, p3, windStrength, height) => {
    const windDir = getWindDirection();
    const tipPush = windStrength.mul(height).mul(0.25);
    const midPush1 = windStrength.mul(height).mul(0.08);
    const midPush2 = windStrength.mul(height).mul(0.15);
    return {
      p1: p1.add(windDir.mul(midPush1)),
      p2: p2.add(windDir.mul(midPush2)),
      p3: p3.add(windDir.mul(tipPush)),
    };
  };
}

export function applyVertexSway(getWindDirection, uTime, uWindSwayFreqMin, uWindSwayFreqMax, uWindSwayStrength) {
  return (side, t, height, windStrength, perBladeHash01, worldXZ) => {
    const topSwayMask = smoothstep(float(0.5), float(1.0), t);
    const windDir = getWindDirection();
    const windDir2 = vec2(windDir.x, windDir.z);
    const seed = fract(perBladeHash01.mul(3.567));
    const gust = float(0.65).add(float(0.35).mul(sin(uTime.mul(0.35).add(seed.mul(6.28318)))));
    const wave = dot(worldXZ, windDir2).mul(0.15);
    const baseFreq = mix(uWindSwayFreqMin, uWindSwayFreqMax, seed);
    const phase = perBladeHash01.mul(6.28318).add(wave);
    const low = sin(uTime.mul(baseFreq).add(phase).add(t.mul(2.2)));
    const high = sin(uTime.mul(baseFreq.mul(5.0)).add(phase.mul(1.7)).add(t.mul(5.0)));
    const amp = height.mul(windStrength);
    const swayLow = amp.mul(gust).mul(uWindSwayStrength);
    const swayHigh = amp.mul(0.8).mul(uWindSwayStrength);
    return side.mul(low.mul(swayLow).add(high.mul(swayHigh))).mul(topSwayMask);
  };
}

export function applySlopeAlignment(terrainNormal, lpos, tangentRotated, sideRotated, normalRotated) {
  const up = vec3(float(0.0), float(1.0), float(0.0));
  const axis = cross(up, terrainNormal);
  const dotProd = clamp(dot(up, terrainNormal), float(-1.0), float(1.0));
  const angle = acos(dotProd);
  If(length(axis).greaterThan(float(0.001)), () => {
    const axisNorm = normalize(axis);
    lpos.assign(rotateAxis(lpos, axisNorm, angle));
    tangentRotated.assign(rotateAxis(tangentRotated, axisNorm, angle));
    sideRotated.assign(rotateAxis(sideRotated, axisNorm, angle));
    normalRotated.assign(rotateAxis(normalRotated, axisNorm, angle));
  });
}

