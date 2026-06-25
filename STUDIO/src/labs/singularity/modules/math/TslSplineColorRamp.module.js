import {
  Fn,
  If,
  clamp,
  dot,
  float,
  fract,
  mat3,
  mix,
  mul,
  pow,
  sin,
  step,
  sub,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

export const catmullRomColor = /* @__PURE__ */ Fn(([t, d, c, b, a]) => {
  return mul(
    0.5,
    mul(2.0, b)
      .add(a.negate().add(c).mul(t))
      .add(mul(2.0, a).sub(mul(5.0, b)).add(mul(4.0, c)).sub(d).mul(t).mul(t))
      .add(a.negate().add(mul(3.0, b)).sub(mul(3.0, c)).add(d).mul(t).mul(t).mul(t)),
  );
}, { t: 'float', d: 'vec3', c: 'vec3', b: 'vec3', a: 'vec3', return: 'vec3' });

export const colorRamp3BSpline = /* @__PURE__ */ Fn(([t, a, b, c]) => {
  const ab = b.w.sub(a.w);
  const bc = c.w.sub(b.w);
  const iab = t.sub(a.w).div(ab).saturate();
  const ibc = t.sub(b.w).div(bc).saturate();
  const p = vec3(sub(1.0, iab), iab.sub(ibc), ibc);

  const ca = catmullRomColor(p.x, a.xyz, a.xyz, b.xyz, c.xyz);
  const cb = catmullRomColor(p.y, a.xyz, b.xyz, c.xyz, c.xyz);
  const cc = c.xyz;

  If(t.lessThan(b.w), () => {
    return ca.xyz;
  });

  If(t.lessThan(c.w), () => {
    return cb.xyz;
  });

  return cc.xyz;
}, { t: 'float', a: 'vec4', b: 'vec4', c: 'vec4', return: 'vec3' });

export const colorRamp4BSpline = /* @__PURE__ */ Fn(([t, a, b, c, d]) => {
  const ab = b.w.sub(a.w);
  const bc = c.w.sub(b.w);
  const cd = d.w.sub(c.w);
  const iab = t.sub(a.w).div(ab).saturate();
  const ibc = t.sub(b.w).div(bc).saturate();
  const icd = t.sub(c.w).div(cd).saturate();
  const p = vec4(sub(1.0, iab), iab.sub(ibc), ibc.sub(icd), icd);

  const ca = catmullRomColor(p.x, a.xyz, a.xyz, b.xyz, c.xyz);
  const cb = catmullRomColor(p.y, a.xyz, b.xyz, c.xyz, d.xyz);
  const cc = catmullRomColor(p.z, b.xyz, c.xyz, d.xyz, d.xyz);
  const cdv = d.xyz;

  If(t.lessThan(b.w), () => {
    return ca.xyz;
  });

  If(t.lessThan(c.w), () => {
    return cb.xyz;
  });

  If(t.lessThan(d.w), () => {
    return cc.xyz;
  });

  return cdv.xyz;
}, { t: 'float', a: 'vec4', b: 'vec4', c: 'vec4', d: 'vec4', return: 'vec3' });

export const colorRamp3Linear = /* @__PURE__ */ Fn(([t, a, b, c]) => {
  const ab = b.w.sub(a.w);
  const bc = c.w.sub(b.w);
  const iab = clamp(t.sub(a.w).div(ab), 0.0, 1.0);
  const ibc = clamp(t.sub(b.w).div(bc), 0.0, 1.0);
  return a.xyz.mul(sub(1.0, iab)).add(b.xyz.mul(iab.sub(ibc))).add(c.xyz.mul(ibc));
});

export const srgbToLinear = /* @__PURE__ */ Fn(([rgb]) => {
  return mix(rgb.div(12.92), pow(rgb.add(0.055).div(1.055), vec3(2.4)), step(0.04045, rgb));
});

export const linearToSrgb = /* @__PURE__ */ Fn(([lin]) => {
  const low = lin.mul(12.92);
  const high = pow(lin, vec3(1.0 / 2.4)).mul(1.055).sub(0.055);
  return mix(low, high, step(0.0031308, lin));
});

export const whiteNoise2D = (coord) => fract(sin(dot(coord, vec2(12.9898, 78.233))).mul(43758.5453));

export const lengthSqrt = /* @__PURE__ */ Fn(([v]) => {
  return v.x.mul(v.x).add(v.y.mul(v.y)).add(v.z.mul(v.z)).sqrt();
});

export const smoothRange = /* @__PURE__ */ Fn(([value, inMin, inMax, outMin, outMax]) => {
  const t = clamp(value.sub(inMin).div(inMax.sub(inMin)), 0.0, 1.0);
  const smoothT = t.mul(t).mul(float(3.0).sub(t.mul(2.0)));
  return mix(outMin, outMax, smoothT);
});

export const rotateAxis = /* @__PURE__ */ Fn(([axis, angle]) => {
  const s = angle.sin();
  const c = angle.cos();
  const oc = sub(1.0, c);
  return mat3(
    axis.x.mul(axis.x).mul(oc).add(c),
    axis.x.mul(axis.y).mul(oc).sub(axis.z.mul(s)),
    axis.x.mul(axis.z).mul(oc).add(axis.y.mul(s)),
    axis.y.mul(axis.x).mul(oc).add(axis.z.mul(s)),
    axis.y.mul(axis.y).mul(oc).add(c),
    axis.y.mul(axis.z).mul(oc).sub(axis.x.mul(s)),
    axis.z.mul(axis.x).mul(oc).sub(axis.y.mul(s)),
    axis.z.mul(axis.y).mul(oc).add(axis.x.mul(s)),
    axis.z.mul(axis.z).mul(oc).add(c),
  );
});
