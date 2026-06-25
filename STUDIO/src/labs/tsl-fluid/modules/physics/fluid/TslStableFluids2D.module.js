// TslStableFluids2D.module.js
// 2D Eulerian (grid) Navier-Stokes "stable fluids" solver with RGB dye, written as native
// WebGPU/TSL compute kernels. Built ON the universal cores TslComputeField2D (storage) and
// TslGridSampling (index/bilinear math). Ports every kernel + the exact per-frame compute
// order from the "TSL_Fluid" CodePen (pashafd/OPVGJav): force/dye injection, semi-Lagrangian
// advection, Jacobi viscosity diffusion, vorticity confinement, divergence, Jacobi pressure
// solve, projection, slip boundaries, and dye dissipation.
//
// Ported faithfully from REF/tsl-fluid/script.js (initFluidSimulation + computeStep).
// Deviation: forceRadius / forceStrength / colorStrength are uniforms here (the source baked
// them as JS constants, so its GUI sliders for them were inert); same math, now live-tunable.

import {
  Fn,
  If,
  uniform,
  float,
  uint,
  vec2,
  vec3,
  instanceIndex,
  abs,
  clamp,
  length,
  normalize,
  time,
  floor,
  fract,
  exp,
} from 'three/tsl';
import { createTslComputeField2D } from '../../webgpu/TslComputeField2D.module.js';
import { createGridSampling } from '../../math/TslGridSampling.module.js';

export const tslStableFluids2DDefaults = {
  gridSize: 512,
  dt: 0.026,
  viscosity: 0.0001,
  vorticity: 0.8,
  dissipation: 0.995,
  velocityDissipationOffset: 0.005,
  forceRadius: 0.02,
  forceStrength: 2.0,
  colorStrength: 0.5,
  jacobiIterations: 20,
  colorCycleSpeed: 0.3,
};

const FIELD_NAMES = [
  'velocityX',
  'velocityY',
  'velocityXTemp',
  'velocityYTemp',
  'densityR',
  'densityG',
  'densityB',
  'densityRTemp',
  'densityGTemp',
  'densityBTemp',
  'pressure',
  'divergence',
  'vorticity',
];

export function createTslStableFluids2D(options = {}) {
  const settings = { ...tslStableFluids2DDefaults, ...options };
  const GRID_SIZE = Math.max(2, Math.floor(settings.gridSize));
  const GRID_COUNT = GRID_SIZE * GRID_SIZE;

  const field = createTslComputeField2D({ width: GRID_SIZE, height: GRID_SIZE });
  field.makeMany(FIELD_NAMES);
  const f = field.fields;
  const {
    velocityX,
    velocityY,
    velocityXTemp,
    velocityYTemp,
    densityR,
    densityG,
    densityB,
    densityRTemp,
    densityGTemp,
    densityBTemp,
    pressure,
    divergence,
    vorticity,
  } = f;

  // --- Uniforms (live-tunable) ---
  const dt = uniform(float(settings.dt));
  const gridSize = uniform(float(GRID_SIZE));
  const mousePos = uniform(vec2());
  const mouseVel = uniform(vec2());
  const viscosity = uniform(float(settings.viscosity));
  const vorticityStrength = uniform(float(settings.vorticity));
  const densityDissipation = uniform(float(settings.dissipation));
  const velocityDissipation = uniform(float(settings.dissipation));
  const colorCycleSpeed = uniform(float(settings.colorCycleSpeed));
  const forceRadius = uniform(float(settings.forceRadius));
  const forceStrength = uniform(float(settings.forceStrength));
  const colorStrength = uniform(float(settings.colorStrength));

  const { getIdx, bilinearSample } = createGridSampling(gridSize);

  // --- Kernels (ported verbatim) ---
  const computeForces = Fn(() => {
    const i = instanceIndex;
    const x = float(i.mod(uint(gridSize)));
    const y = float(i.div(uint(gridSize)));
    const pos = vec2(x, y).div(gridSize);

    const dist = length(pos.sub(mousePos));
    const gaussian = exp(dist.mul(dist).div(forceRadius.mul(forceRadius)).mul(-1));

    const force = mouseVel.mul(forceStrength).mul(gaussian).mul(dt).mul(100);
    velocityX.element(i).addAssign(force.x);
    velocityY.element(i).addAssign(force.y);

    const forceMagnitude = length(mouseVel).mul(1000);

    const t = time.mul(colorCycleSpeed);
    const hue = fract(t);
    const K = vec3(1.0, 2.0 / 3.0, 1.0 / 3.0);
    const color = abs(fract(vec3(hue).add(K)).mul(6.0).sub(vec3(3.0))).sub(vec3(1.0));
    const finalColor = clamp(color, 0.0, 1.0);

    const densityForce = gaussian.mul(colorStrength).mul(forceMagnitude).mul(dt);
    densityR.element(i).addAssign(densityForce.mul(finalColor.x));
    densityG.element(i).addAssign(densityForce.mul(finalColor.y));
    densityB.element(i).addAssign(densityForce.mul(finalColor.z));
  })().compute(GRID_COUNT);

  const createAdvect = (fieldX, fieldY, fieldXOut, fieldYOut, dissipationValue) =>
    Fn(() => {
      const i = instanceIndex;
      const x = float(i.mod(uint(gridSize)));
      const y = float(i.div(uint(gridSize)));
      const vx = fieldX.element(i);
      const vy = fieldY.element(i);
      const px = x.sub(dt.mul(vx).mul(gridSize));
      const py = y.sub(dt.mul(vy).mul(gridSize));
      fieldXOut.element(i).assign(bilinearSample(fieldX, px, py).mul(dissipationValue));
      fieldYOut.element(i).assign(bilinearSample(fieldY, px, py).mul(dissipationValue));
    })().compute(GRID_COUNT);

  const createAdvectScalar = (fld, fldOut, velX, velY, dissipationValue) =>
    Fn(() => {
      const i = instanceIndex;
      const x = float(i.mod(uint(gridSize)));
      const y = float(i.div(uint(gridSize)));
      const vx = velX.element(i);
      const vy = velY.element(i);
      const px = x.sub(dt.mul(vx).mul(gridSize));
      const py = y.sub(dt.mul(vy).mul(gridSize));
      fldOut.element(i).assign(bilinearSample(fld, px, py).mul(dissipationValue));
    })().compute(GRID_COUNT);

  const createDiffuse = (fieldX, fieldY, fieldXOut, fieldYOut) =>
    Fn(() => {
      const i = instanceIndex;
      const x = float(i.mod(uint(gridSize)));
      const y = float(i.div(uint(gridSize)));
      const alpha = dt.mul(viscosity).mul(gridSize).mul(gridSize);
      const beta = float(1).add(alpha.mul(4));
      const xC = fieldX.element(i);
      const yC = fieldY.element(i);
      const xL = fieldX.element(getIdx(x.sub(1), y));
      const xR = fieldX.element(getIdx(x.add(1), y));
      const xB = fieldX.element(getIdx(x, y.sub(1)));
      const xT = fieldX.element(getIdx(x, y.add(1)));
      const yL = fieldY.element(getIdx(x.sub(1), y));
      const yR = fieldY.element(getIdx(x.add(1), y));
      const yB = fieldY.element(getIdx(x, y.sub(1)));
      const yT = fieldY.element(getIdx(x, y.add(1)));
      fieldXOut.element(i).assign(xC.add(alpha.mul(xL.add(xR).add(xB).add(xT))).div(beta));
      fieldYOut.element(i).assign(yC.add(alpha.mul(yL.add(yR).add(yB).add(yT))).div(beta));
    })().compute(GRID_COUNT);

  const computeDivergence = Fn(() => {
    const i = instanceIndex;
    const x = float(i.mod(uint(gridSize)));
    const y = float(i.div(uint(gridSize)));
    const xL = velocityX.element(getIdx(x.sub(1), y));
    const xR = velocityX.element(getIdx(x.add(1), y));
    const yB = velocityY.element(getIdx(x, y.sub(1)));
    const yT = velocityY.element(getIdx(x, y.add(1)));
    const div = float(0.5).mul(xR.sub(xL).add(yT.sub(yB)));
    divergence.element(i).assign(div);
  })().compute(GRID_COUNT);

  const computePressure = Fn(() => {
    const i = instanceIndex;
    const x = float(i.mod(uint(gridSize)));
    const y = float(i.div(uint(gridSize)));
    const pL = pressure.element(getIdx(x.sub(1), y));
    const pR = pressure.element(getIdx(x.add(1), y));
    const pB = pressure.element(getIdx(x, y.sub(1)));
    const pT = pressure.element(getIdx(x, y.add(1)));
    const div = divergence.element(i);
    pressure.element(i).assign(pL.add(pR).add(pB).add(pT).sub(div).mul(0.25));
  })().compute(GRID_COUNT);

  const computeProject = Fn(() => {
    const i = instanceIndex;
    const x = float(i.mod(uint(gridSize)));
    const y = float(i.div(uint(gridSize)));
    const pL = pressure.element(getIdx(x.sub(1), y));
    const pR = pressure.element(getIdx(x.add(1), y));
    const pB = pressure.element(getIdx(x, y.sub(1)));
    const pT = pressure.element(getIdx(x, y.add(1)));
    velocityX.element(i).subAssign(float(0.5).mul(pR.sub(pL)));
    velocityY.element(i).subAssign(float(0.5).mul(pT.sub(pB)));
  })().compute(GRID_COUNT);

  const computeVorticityField = Fn(() => {
    const i = instanceIndex;
    const x = float(i.mod(uint(gridSize)));
    const y = float(i.div(uint(gridSize)));
    const L = velocityY.element(getIdx(x.sub(1), y));
    const R = velocityY.element(getIdx(x.add(1), y));
    const B = velocityX.element(getIdx(x, y.sub(1)));
    const T = velocityX.element(getIdx(x, y.add(1)));
    vorticity.element(i).assign(float(0.5).mul(R.sub(L).sub(T.sub(B))));
  })().compute(GRID_COUNT);

  const applyVorticityForce = Fn(() => {
    const i = instanceIndex;
    const x = float(i.mod(uint(gridSize)));
    const y = float(i.div(uint(gridSize)));
    const vL = abs(vorticity.element(getIdx(x.sub(1), y)));
    const vR = abs(vorticity.element(getIdx(x.add(1), y)));
    const vB = abs(vorticity.element(getIdx(x, y.sub(1))));
    const vT = abs(vorticity.element(getIdx(x, y.add(1))));
    const vC = vorticity.element(i);
    const force = vec2(vT.sub(vB), vR.sub(vL));
    If(length(force).greaterThan(0.00001), () => {
      const forceNorm = normalize(force);
      const fx = forceNorm.y.mul(vC).mul(vorticityStrength).mul(dt);
      const fy = forceNorm.x.mul(vC).mul(-1).mul(vorticityStrength).mul(dt);
      velocityX.element(i).addAssign(fx);
      velocityY.element(i).addAssign(fy);
    });
  })().compute(GRID_COUNT);

  const computeBoundary = Fn(() => {
    const i = instanceIndex;
    const x = float(i.mod(uint(gridSize)));
    const y = float(i.div(uint(gridSize)));
    If(x.equal(0), () => {
      velocityX.element(i).assign(velocityX.element(getIdx(1, y)).negate());
      velocityY.element(i).assign(velocityY.element(getIdx(1, y)));
    });
    If(x.equal(gridSize.sub(1)), () => {
      velocityX.element(i).assign(velocityX.element(getIdx(gridSize.sub(2), y)).negate());
      velocityY.element(i).assign(velocityY.element(getIdx(gridSize.sub(2), y)));
    });
    If(y.equal(0), () => {
      velocityY.element(i).assign(velocityY.element(getIdx(x, 1)).negate());
      velocityX.element(i).assign(velocityX.element(getIdx(x, 1)));
    });
    If(y.equal(gridSize.sub(1)), () => {
      velocityY.element(i).assign(velocityY.element(getIdx(x, gridSize.sub(2))).negate());
      velocityX.element(i).assign(velocityX.element(getIdx(x, gridSize.sub(2))));
    });
  })().compute(GRID_COUNT);

  const advectVelocity = createAdvect(velocityX, velocityY, velocityXTemp, velocityYTemp, velocityDissipation);
  const advectDensityR = createAdvectScalar(densityR, densityRTemp, velocityX, velocityY, densityDissipation);
  const advectDensityG = createAdvectScalar(densityG, densityGTemp, velocityX, velocityY, densityDissipation);
  const advectDensityB = createAdvectScalar(densityB, densityBTemp, velocityX, velocityY, densityDissipation);
  const diffuseVelocity = createDiffuse(velocityX, velocityY, velocityXTemp, velocityYTemp);

  const copyVelocity = Fn(() => {
    const i = instanceIndex;
    velocityX.element(i).assign(velocityXTemp.element(i));
    velocityY.element(i).assign(velocityYTemp.element(i));
  })().compute(GRID_COUNT);

  const copyDensity = Fn(() => {
    const i = instanceIndex;
    densityR.element(i).assign(densityRTemp.element(i));
    densityG.element(i).assign(densityGTemp.element(i));
    densityB.element(i).assign(densityBTemp.element(i));
  })().compute(GRID_COUNT);

  const clearPressure = Fn(() => {
    pressure.element(instanceIndex).assign(0);
  })().compute(GRID_COUNT);

  // --- Per-frame compute order (verbatim) ---
  async function step(renderer) {
    await renderer.computeAsync(computeForces);
    await renderer.computeAsync(computeBoundary);

    await renderer.computeAsync(advectVelocity);
    await renderer.computeAsync(copyVelocity);
    await renderer.computeAsync(computeBoundary);

    if (settings.viscosity > 0) {
      for (let i = 0; i < settings.jacobiIterations; i++) {
        await renderer.computeAsync(diffuseVelocity);
        await renderer.computeAsync(copyVelocity);
        await renderer.computeAsync(computeBoundary);
      }
    }

    if (settings.vorticity > 0) {
      await renderer.computeAsync(computeVorticityField);
      await renderer.computeAsync(applyVorticityForce);
      await renderer.computeAsync(computeBoundary);
    }

    await renderer.computeAsync(computeDivergence);
    await renderer.computeAsync(clearPressure);
    for (let i = 0; i < settings.jacobiIterations; i++) {
      await renderer.computeAsync(computePressure);
    }
    await renderer.computeAsync(computeProject);
    await renderer.computeAsync(computeBoundary);

    await Promise.all([
      renderer.computeAsync(advectDensityR),
      renderer.computeAsync(advectDensityG),
      renderer.computeAsync(advectDensityB),
    ]);
    await renderer.computeAsync(copyDensity);
  }

  /** Feed pointer state (normalized, y-up) — drives the force + dye injection. */
  function setPointer(x, y, vx, vy) {
    mousePos.value.set(x, y);
    mouseVel.value.set(vx, vy);
  }

  /** Live-update tunables. Mirrors the source GUI's dissipation/offset coupling. */
  function setParams(params = {}) {
    if (params.viscosity !== undefined) {
      settings.viscosity = params.viscosity;
      viscosity.value = params.viscosity;
    }
    if (params.vorticity !== undefined) {
      settings.vorticity = params.vorticity;
      vorticityStrength.value = params.vorticity;
    }
    if (params.colorCycleSpeed !== undefined) colorCycleSpeed.value = params.colorCycleSpeed;
    if (params.forceRadius !== undefined) forceRadius.value = params.forceRadius;
    if (params.forceStrength !== undefined) forceStrength.value = params.forceStrength;
    if (params.colorStrength !== undefined) colorStrength.value = params.colorStrength;
    if (params.jacobiIterations !== undefined) settings.jacobiIterations = Math.floor(params.jacobiIterations);
    if (params.velocityDissipationOffset !== undefined) settings.velocityDissipationOffset = params.velocityDissipationOffset;
    if (params.dissipation !== undefined) {
      settings.dissipation = params.dissipation;
      densityDissipation.value = params.dissipation;
      const offset = settings.velocityDissipationOffset;
      velocityDissipation.value = params.dissipation - offset > 0.9 ? params.dissipation - offset : 0.9;
    }
  }

  return {
    settings,
    gridSize,
    gridSizeValue: GRID_SIZE,
    fields: { densityR, densityG, densityB },
    uniforms: { dt, mousePos, mouseVel, viscosity, vorticityStrength, colorCycleSpeed, forceRadius, forceStrength, colorStrength },
    step,
    setPointer,
    setParams,
    dispose() {
      field.dispose();
    },
  };
}
