import * as THREE from 'three/webgpu';
import {
  cameraPosition,
  color,
  faceDirection,
  float,
  Fn,
  Loop,
  mix,
  normalize,
  positionGeometry,
  positionWorld,
  step,
  sub,
  time,
  uniform,
  vec3,
} from 'three/tsl';
import { lengthSqrt, smoothRange, srgbToLinear, whiteNoise2D } from '../math/TslSplineColorRamp.module.js';

export const tslVolumetricRaymarchShellDefaults = {
  iterations: 72,
  stepSize: 0.018,
  density: 0.55,
  noiseFactor: 0.015,
  colorA: '#f7b26c',
  colorB: '#131019',
};

export function createTslVolumetricRaymarchShellMaterial(options = {}) {
  const state = { ...tslVolumetricRaymarchShellDefaults, ...options };
  const uniforms = {
    iterations: uniform(float(state.iterations)),
    stepSize: uniform(float(state.stepSize)),
    density: uniform(float(state.density)),
    noiseFactor: uniform(float(state.noiseFactor)),
    colorA: uniform(color(new THREE.Color(state.colorA))),
    colorB: uniform(color(new THREE.Color(state.colorB))),
  };

  const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide });
  material.colorNode = Fn(() => {
    const objCoords = positionGeometry.mul(vec3(1, 1, -1)).xzy;
    const isBackface = step(0.0, faceDirection.negate());
    const startCoords = mix(objCoords, cameraPosition.mul(vec3(0.0)), isBackface);
    const rayDir = normalize(sub(cameraPosition, positionWorld)).mul(vec3(1, 1, -1)).xzy.negate();
    const rayPos = startCoords.sub(rayDir.mul(whiteNoise2D(objCoords.xy).mul(uniforms.noiseFactor)));
    const colorAcc = vec3(0);
    const alphaAcc = float(0);

    Loop(uniforms.iterations, () => {
      rayPos.addAssign(rayDir.mul(uniforms.stepSize));
      const radial = lengthSqrt(rayPos);
      const band = smoothRange(radial, 1.0, 0.0, 0.0, 1.0);
      const pulse = time.mul(0.2).sin().mul(0.5).add(0.5);
      const localAlpha = band.mul(uniforms.density).mul(0.08);
      const localColor = mix(uniforms.colorB, uniforms.colorA, band.mul(pulse).saturate());
      const weight = alphaAcc.oneMinus().mul(localAlpha);
      colorAcc.assign(mix(colorAcc, localColor, weight));
      alphaAcc.assign(mix(alphaAcc, 1.0, localAlpha));
    });

    return srgbToLinear(colorAcc);
  })();

  function update(next = {}) {
    Object.assign(state, next);
    uniforms.iterations.value = Number(state.iterations ?? tslVolumetricRaymarchShellDefaults.iterations);
    uniforms.stepSize.value = Number(state.stepSize ?? tslVolumetricRaymarchShellDefaults.stepSize);
    uniforms.density.value = Number(state.density ?? tslVolumetricRaymarchShellDefaults.density);
    uniforms.noiseFactor.value = Number(state.noiseFactor ?? tslVolumetricRaymarchShellDefaults.noiseFactor);
    uniforms.colorA.value.set(String(state.colorA ?? tslVolumetricRaymarchShellDefaults.colorA));
    uniforms.colorB.value.set(String(state.colorB ?? tslVolumetricRaymarchShellDefaults.colorB));
  }

  update(state);
  return { material, uniforms, state, update, dispose: () => material.dispose() };
}
