import * as THREE from 'three/webgpu';
import {
  abs,
  cameraPosition,
  color,
  equirectUV,
  faceDirection,
  float,
  Fn,
  Loop,
  mix,
  modelWorldMatrix,
  normalize,
  positionGeometry,
  positionWorld,
  remapClamp,
  step,
  sub,
  texture,
  time,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';
import {
  colorRamp3BSpline,
  lengthSqrt,
  linearToSrgb,
  rotateAxis,
  smoothRange,
  srgbToLinear,
  whiteNoise2D,
} from '../math/TslSplineColorRamp.module.js';

export const singularityBlackHoleDefaults = {
  iterations: 128,
  stepSize: 0.0071,
  noiseFactor: 0.01,
  power: 0.3,
  originRadius: 0.13,
  bandWidth: 0.03,
  rampCol1: '#f2b56f',
  rampPos1: 0.05,
  rampCol2: '#240d08',
  rampPos2: 0.425,
  rampCol3: '#000000',
  rampPos3: 1,
  rampEmission: 2,
  emissionColor: '#242117',
  backgroundIntensity: 2,
};

function makeFallbackTexture(colorBytes) {
  const tex = new THREE.DataTexture(new Uint8Array(colorBytes), 1, 1, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function loadTexture(url, setup) {
  if (!url) return makeFallbackTexture([4, 4, 8, 255]);
  const tex = new THREE.TextureLoader().load(url);
  setup?.(tex);
  return tex;
}

function colorUniform(initial) {
  const c = new THREE.Color(initial);
  return uniform(color(c.r, c.g, c.b));
}

function setColorUniform(target, value) {
  target.value.set(String(value));
}

export function createSingularityBlackHole(scene, options = {}) {
  const state = { ...singularityBlackHoleDefaults, ...options };
  const noiseDeepTexture = loadTexture(state.noiseUrl, (tex) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  });
  noiseDeepTexture.wrapS = THREE.RepeatWrapping;
  noiseDeepTexture.wrapT = THREE.RepeatWrapping;

  const starsTexture = loadTexture(state.nebulaUrl, (tex) => {
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
  });
  starsTexture.mapping = THREE.EquirectangularReflectionMapping;
  starsTexture.colorSpace = THREE.SRGBColorSpace;

  const uniforms = {
    iterations: uniform(float(state.iterations)),
    stepSize: uniform(float(state.stepSize)),
    noiseFactor: uniform(float(state.noiseFactor)),
    power: uniform(float(state.power)),
    originRadius: uniform(float(state.originRadius)),
    width: uniform(float(state.bandWidth)),
    rampCol1: colorUniform(state.rampCol1),
    rampPos1: uniform(float(state.rampPos1)),
    rampCol2: colorUniform(state.rampCol2),
    rampPos2: uniform(float(state.rampPos2)),
    rampCol3: colorUniform(state.rampCol3),
    rampPos3: uniform(float(state.rampPos3)),
    rampEmission: uniform(float(state.rampEmission)),
    emissionColor: colorUniform(state.emissionColor),
    backgroundIntensity: uniform(float(state.backgroundIntensity)),
  };

  const container = new THREE.Group();
  const geometry = new THREE.SphereGeometry(1, 16, 16);
  const material = new THREE.MeshStandardNodeMaterial({ side: THREE.DoubleSide });

  material.colorNode = Fn(() => {
    const stepSize = uniforms.stepSize;
    const noiseAmp = uniforms.noiseFactor;
    const power = uniforms.power;
    const originRadius = uniforms.originRadius;
    const bandWidth = uniforms.width;
    const iterCount = uniforms.iterations;

    const objCoords = positionGeometry.mul(vec3(1, 1, -1)).xzy;
    const isBackface = step(0.0, faceDirection.negate());
    const camPointObj = cameraPosition.mul(modelWorldMatrix).mul(vec3(1, 1, -1)).xzy;
    const startCoords = mix(objCoords, camPointObj.xyz, isBackface);
    const viewInWorld = normalize(sub(cameraPosition, positionWorld)).mul(vec3(1, 1, -1)).xzy;
    const rayDir = viewInWorld.negate();
    const noiseWhite = whiteNoise2D(objCoords.xy).mul(noiseAmp);
    const jitter = rayDir.mul(noiseWhite);
    const rayPos = startCoords.sub(jitter);
    const colorAcc = vec3(0);
    const alphaAcc = float(0.0);

    Loop(iterCount, () => {
      const rNorm = normalize(rayPos);
      const rLen = lengthSqrt(rayPos);
      const steerMag = stepSize.mul(power).div(rLen.mul(rLen));
      const steeringRange = remapClamp(rLen, 1.0, 0.5, 0.0, 1.0);
      const steer = rNorm.mul(steerMag.mul(steeringRange));
      const steeredDir = rayDir.sub(steer).normalize();
      const advance = rayDir.mul(stepSize);
      rayPos.addAssign(advance);

      const xyLen = lengthSqrt(rayPos.mul(vec3(1, 1, 0)));
      const rotPhase = xyLen.mul(4.270).sub(time.mul(0.1));
      const uvRot = rayPos.mul(rotateAxis(vec3(0, 0, 1), rotPhase));
      const diskUv = uvRot.mul(2);
      const noiseDeep = texture(noiseDeepTexture, diskUv);

      const bandMin = bandWidth.negate();
      const bandEnds = vec3(bandMin, 0.0, bandWidth);
      const dz = sub(bandEnds, vec3(rayPos.z));
      const zQuad = dz.mul(dz).div(bandWidth);
      const zBand = bandWidth.sub(zQuad).div(bandWidth).max(0.0);

      const noiseAmp3 = noiseDeep.rgb.mul(zBand);
      const noiseAmpLen = lengthSqrt(noiseAmp3);
      const noiseNormal = texture(noiseDeepTexture, diskUv.mul(1.002)).rgb.mul(zBand);
      const noiseNormalLen = lengthSqrt(noiseNormal);
      const rampInput = xyLen.add(noiseAmpLen.sub(0.780).mul(1.5)).add(noiseAmpLen.sub(noiseNormalLen).mul(19.750));

      const rampA = vec4(uniforms.rampCol1, uniforms.rampPos1);
      const rampB = vec4(uniforms.rampCol2, uniforms.rampPos2);
      const rampC = vec4(uniforms.rampCol3, uniforms.rampPos3);
      const baseCol = colorRamp3BSpline(rampInput.x, rampA, rampB, rampC);
      const emissiveCol = baseCol.mul(uniforms.rampEmission).add(uniforms.emissionColor);

      const rLenNow = lengthSqrt(rayPos);
      const insideCore = rLenNow.lessThan(originRadius);
      const shadedCol = mix(emissiveCol, vec3(0), insideCore);
      const zAbs = abs(rayPos.z);
      const aNoise = noiseAmpLen.sub(0.750).mul(-0.60);
      const aPre = zAbs.add(aNoise);
      const aRadial = smoothRange(xyLen, 1.0, 0.0, 0.0, 1.0);
      const aBand = smoothRange(aPre, bandWidth, 0.0, 0.0, aRadial);
      const alphaLocal = mix(aBand, 1.0, insideCore);
      const weight = alphaAcc.oneMinus().mul(alphaLocal);
      const newColor = mix(colorAcc, shadedCol, weight);
      const newAlpha = mix(alphaAcc, 1.0, alphaLocal);

      rayPos.addAssign(advance);
      rayDir.assign(steeredDir);
      colorAcc.assign(newColor);
      alphaAcc.assign(newAlpha);
    });

    const dirForEnv = rayDir.mul(vec3(1, -1, 1)).xzy;
    const env = linearToSrgb(texture(starsTexture, equirectUV(dirForEnv)).rgb.mul(uniforms.backgroundIntensity));
    const trans = float(1.0).sub(alphaAcc);
    const finalRGB = mix(colorAcc, env, trans.mul(1.0));
    return srgbToLinear(finalRGB);
  })();
  material.emissiveNode = material.colorNode;

  const mesh = new THREE.Mesh(geometry, material);
  container.add(mesh);
  scene.add(container);

  function update(next = {}) {
    Object.assign(state, next);
    uniforms.iterations.value = Number(state.iterations ?? singularityBlackHoleDefaults.iterations);
    uniforms.stepSize.value = Number(state.stepSize ?? singularityBlackHoleDefaults.stepSize);
    uniforms.noiseFactor.value = Number(state.noiseFactor ?? singularityBlackHoleDefaults.noiseFactor);
    uniforms.power.value = Number(state.power ?? singularityBlackHoleDefaults.power);
    uniforms.originRadius.value = Number(state.originRadius ?? singularityBlackHoleDefaults.originRadius);
    uniforms.width.value = Number(state.bandWidth ?? singularityBlackHoleDefaults.bandWidth);
    uniforms.rampPos1.value = Number(state.rampPos1 ?? singularityBlackHoleDefaults.rampPos1);
    uniforms.rampPos2.value = Number(state.rampPos2 ?? singularityBlackHoleDefaults.rampPos2);
    uniforms.rampPos3.value = Number(state.rampPos3 ?? singularityBlackHoleDefaults.rampPos3);
    uniforms.rampEmission.value = Number(state.rampEmission ?? singularityBlackHoleDefaults.rampEmission);
    uniforms.backgroundIntensity.value = Number(state.backgroundIntensity ?? singularityBlackHoleDefaults.backgroundIntensity);
    setColorUniform(uniforms.rampCol1, state.rampCol1 ?? singularityBlackHoleDefaults.rampCol1);
    setColorUniform(uniforms.rampCol2, state.rampCol2 ?? singularityBlackHoleDefaults.rampCol2);
    setColorUniform(uniforms.rampCol3, state.rampCol3 ?? singularityBlackHoleDefaults.rampCol3);
    setColorUniform(uniforms.emissionColor, state.emissionColor ?? singularityBlackHoleDefaults.emissionColor);
  }

  update(state);

  return {
    group: container,
    mesh,
    geometry,
    material,
    uniforms,
    state,
    update,
    dispose() {
      scene.remove(container);
      geometry.dispose();
      material.dispose();
      noiseDeepTexture.dispose();
      starsTexture.dispose();
    },
  };
}
