// TslNoise.module.js
// Universal TSL noise primitives: triangle-wave + fractal 3D vector/scalar noise for GPU shaders
// and compute kernels. Animated by a time input — drop into any colorNode/positionNode or compute
// Fn that needs organic motion (particle advection, displacement, flow fields).
//
// Ported verbatim from ref/AURORA/src/PARTICLESYSTEM/physic/noise.ts (the noise that drives MLS-MPM
// particle motion). Already method-chained TSL — no operator rewrite needed.

import { float, Fn, Loop, vec3 } from 'three/tsl';

/** Triangle wave function (scalar). */
const tri = /*@__PURE__*/ Fn(([x]) => {
  return x.fract().sub(0.5).abs();
}).setLayout({
  name: 'tri',
  type: 'float',
  inputs: [{ name: 'x', type: 'float' }],
});

/** Triangle wave function (vector). */
const trivec = /*@__PURE__*/ Fn(([x]) => {
  return x.fract().sub(0.5).abs();
}).setLayout({
  name: 'trivec',
  type: 'vec3',
  inputs: [{ name: 'x', type: 'vec3' }],
});

/** 3D triangle-based noise primitive. */
const tri3 = /*@__PURE__*/ Fn(([p]) => {
  return vec3(
    tri(p.z.add(tri(p.y.mul(1.0)))),
    tri(p.z.add(tri(p.x.mul(1.0)))),
    tri(p.y.add(tri(p.x.mul(1.0)))),
  );
}).setLayout({
  name: 'tri3',
  type: 'vec3',
  inputs: [{ name: 'p', type: 'vec3' }],
});

/**
 * Generates a 3D vector noise value from position, speed, and time.
 * Fractal-based approach with 4 octaves.
 */
export const triNoise3Dvec = /*@__PURE__*/ Fn(([position, speed, time]) => {
  const p = vec3(position).toVar();
  const z = float(1.4).toVar();
  const rz = vec3(0.0).toVar();
  const bp = vec3(p).toVar();

  Loop({ start: float(0.0), end: float(3.0), type: 'float', condition: '<=' }, () => {
    const dg = vec3(tri3(bp.mul(2.0))).toVar();
    p.addAssign(dg.add(time.mul(float(0.1).mul(speed))));
    bp.mulAssign(1.8);
    z.mulAssign(1.5);
    p.mulAssign(1.2);

    const t = trivec(p.zxy.add(trivec(p.xyz.add(trivec(p.yzx))))).toVar();
    rz.addAssign(t.div(z));
    bp.addAssign(0.14);
  });

  return rz;
}).setLayout({
  name: 'triNoise3Dvec',
  type: 'vec3',
  inputs: [
    { name: 'position', type: 'vec3' },
    { name: 'speed', type: 'float' },
    { name: 'time', type: 'float' },
  ],
});

/** Scalar version of triNoise3Dvec (returns x component). */
export const triNoise3D = /*@__PURE__*/ Fn(([position, time]) => {
  return triNoise3Dvec(position, float(1.0), time).x;
}).setLayout({
  name: 'triNoise3D',
  type: 'float',
  inputs: [
    { name: 'position', type: 'vec3' },
    { name: 'time', type: 'float' },
  ],
});
