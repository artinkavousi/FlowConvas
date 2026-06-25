// TslGpuGrassField.module.js
// Compact False Earth-derived WebGPU/TSL grass field.
// It preserves the core source behavior in a reusable ARTINOS module: procedural blade geometry,
// PCG jitter, terrain-following placement, per-blade variation, yaw, bend, wind sway, and color ramp.

import * as THREE from 'three/webgpu';
import {
  Fn,
  abs,
  cos,
  dot,
  float,
  instanceIndex,
  int,
  length,
  mix,
  oneMinus,
  positionLocal,
  pow,
  select,
  sin,
  smoothstep,
  time,
  uint,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import {
  getTerrainHeight,
  hash2to1,
  hash2to2,
  shiftHSV,
  safeNormalize2D,
} from '../../math/TslVegetationMath.module.js';

export const tslGpuGrassFieldDefaults = {
  bladesPerAxis: 192,
  areaSize: 30,
  segments: 8,
  amplitude: 1.35,
  frequency: 0.075,
  seed: 0,
  bladeHeightMin: 0.42,
  bladeHeightMax: 1.45,
  bladeWidthMin: 0.035,
  bladeWidthMax: 0.105,
  bendAmount: 0.34,
  yawRandomness: 1,
  jitter: 0.9,
  windStrength: 0.55,
  windSpeed: 1.15,
  windScale: 0.18,
  windDirX: 0.72,
  windDirZ: 0.42,
  baseColor: '#071511',
  tipColor: '#4fbf7c',
  rimColor: '#20e0c5',
  hueShift: 0,
  cameraHeight: 10.5,
  cameraDistance: 19,
  pixelRatio: 1.5,
};

export const falseEarthGrassProvenance = {
  source: 'https://github.com/momentchan/false-earth',
  sourceCommit: '74cc91cb2764fbb75aee201d92752e4da37ad311',
  files: [
    'src/components/grass/GrassWebGPU.tsx',
    'src/components/grass/GrassLOD.tsx',
    'src/components/grass/core/config.ts',
    'src/components/grass/core/grassGeometry.ts',
    'src/components/grass/core/grassCompute.ts',
    'src/components/grass/core/grassMaterial.ts',
    'src/components/grass/core/shaderHelpers.ts',
  ],
  license: 'MIT',
};

function clampBladesPerAxis(value) {
  return Math.max(24, Math.min(384, Math.floor(value || tslGpuGrassFieldDefaults.bladesPerAxis)));
}

function makeBladeGeometry(segments) {
  const bladeGeometry = new THREE.PlaneGeometry(1, 1, 1, Math.max(1, Math.floor(segments)));
  bladeGeometry.translate(0, 0.5, 0);
  return bladeGeometry;
}

export function createTslGpuGrassField(canvas, options = {}) {
  let state = { ...tslGpuGrassFieldDefaults, ...options };
  let bladesPerAxis = clampBladesPerAxis(state.bladesPerAxis);
  let bladeCount = bladesPerAxis * bladesPerAxis;

  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, state.pixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const rendererReady = renderer.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 220);
  camera.position.set(0, state.cameraHeight, state.cameraDistance);
  camera.lookAt(0, 0.8, 0);

  const areaU = uniform(state.areaSize);
  const ampU = uniform(state.amplitude);
  const freqU = uniform(state.frequency);
  const seedU = uniform(state.seed);
  const heightMinU = uniform(state.bladeHeightMin);
  const heightMaxU = uniform(state.bladeHeightMax);
  const widthMinU = uniform(state.bladeWidthMin);
  const widthMaxU = uniform(state.bladeWidthMax);
  const bendU = uniform(state.bendAmount);
  const yawU = uniform(state.yawRandomness);
  const jitterU = uniform(state.jitter);
  const windStrengthU = uniform(state.windStrength);
  const windSpeedU = uniform(state.windSpeed);
  const windScaleU = uniform(state.windScale);
  const windDirU = uniform(new THREE.Vector2(state.windDirX, state.windDirZ));
  const baseColorU = uniform(new THREE.Color(state.baseColor));
  const tipColorU = uniform(new THREE.Color(state.tipColor));
  const rimColorU = uniform(new THREE.Color(state.rimColor));
  const hueShiftU = uniform(state.hueShift);

  const terrainHeight = getTerrainHeight(ampU, freqU, seedU);

  const grassMaterial = new THREE.MeshStandardNodeMaterial({
    side: THREE.DoubleSide,
    roughness: 0.78,
    metalness: 0.08,
    transparent: true,
  });

  const bladeWorldXZ = Fn(() => {
    const axis = uint(bladesPerAxis);
    const gridX = instanceIndex.mod(axis);
    const gridZ = instanceIndex.div(axis);
    const half = float(bladesPerAxis - 1).mul(0.5);
    const spacing = areaU.div(float(bladesPerAxis));
    const globalX = int(gridX);
    const globalZ = int(gridZ);
    const jitter = hash2to2(globalX, globalZ).sub(vec2(0.5)).mul(spacing).mul(jitterU);
    const x = float(gridX).sub(half).mul(spacing).add(jitter.x);
    const z = float(gridZ).sub(half).mul(spacing).add(jitter.y);
    return vec2(x, z);
  });

  grassMaterial.positionNode = Fn(() => {
    const bladeXZ = bladeWorldXZ();
    const dist01 = length(bladeXZ).div(areaU.mul(0.5));
    const visible = oneMinus(smoothstep(0.94, 1.0, dist01));
    const h1 = hash2to1(int(instanceIndex), int(instanceIndex).add(17));
    const h2 = hash2to1(int(instanceIndex).add(37), int(instanceIndex).add(71));
    const h3 = hash2to1(int(instanceIndex).add(103), int(instanceIndex).add(193));
    const bladeHeight = mix(heightMinU, heightMaxU, h1).mul(visible);
    const bladeWidth = mix(widthMinU, widthMaxU, h2).mul(visible);
    const terrainY = terrainHeight(bladeXZ);

    const local = positionLocal;
    const bladeUv = uv();
    const t = bladeUv.y;
    const rootLock = pow(t, float(1.8));
    const widthMask = oneMinus(pow(t, float(1.55))).mul(float(1.0).add(t.mul(0.24)));
    const windDir = safeNormalize2D(windDirU);
    const windWave = sin(dot(bladeXZ, windDir).mul(windScaleU).add(time.mul(windSpeedU)).add(h3.mul(6.28318)));
    const windPush = windWave.mul(windStrengthU).mul(rootLock).mul(bladeHeight).mul(0.42);
    const naturalBend = bendU.mul(h2.mul(0.7).add(0.35)).mul(rootLock).mul(bladeHeight);
    const yaw = h3.mul(6.28318).mul(yawU).add(windWave.mul(windStrengthU).mul(0.28));
    const sx = sin(yaw);
    const cx = cos(yaw);

    const side = local.x.mul(bladeWidth).mul(widthMask);
    const forward = naturalBend.add(windPush);
    const localX = side.mul(cx).sub(forward.mul(sx));
    const localZ = side.mul(sx).add(forward.mul(cx));
    const localY = local.y.mul(bladeHeight).mul(float(1.0).sub(abs(local.x).mul(0.08)));

    return vec3(bladeXZ.x.add(localX), terrainY.add(localY), bladeXZ.y.add(localZ));
  })();

  grassMaterial.colorNode = Fn(() => {
    const bladeUv = uv();
    const t = bladeUv.y;
    const bladeSeed = hash2to1(int(instanceIndex).add(211), int(instanceIndex).add(409));
    const midrib = smoothstep(0.0, 0.5, abs(bladeUv.x.sub(0.5))).mul(0.1);
    const heightColor = mix(baseColorU, tipColorU, smoothstep(0.08, 1.0, t));
    const seedShade = mix(float(0.68), float(1.25), bladeSeed);
    const rim = rimColorU.mul(pow(t, float(2.5))).mul(0.18);
    const color = heightColor.mul(seedShade).add(rim).sub(vec3(midrib));
    return vec4(shiftHSV(color, vec3(hueShiftU, float(0), float(0))), 1);
  })();

  grassMaterial.emissiveNode = Fn(() => {
    const bladeUv = uv();
    return rimColorU.mul(pow(bladeUv.y, float(3.0))).mul(windStrengthU).mul(0.08);
  })();

  let grassGeometry = makeBladeGeometry(state.segments);
  const grassMesh = new THREE.Mesh(grassGeometry, grassMaterial);
  grassMesh.count = bladeCount;
  grassMesh.frustumCulled = false;
  scene.add(grassMesh);

  const terrainMaterial = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, transparent: true });
  terrainMaterial.colorNode = Fn(() => {
    const local = positionLocal;
    const dist = length(local.xy).div(areaU.mul(0.5));
    const edge = smoothstep(0.35, 1.0, dist);
    return vec4(baseColorU.add(rimColorU.mul(edge.mul(0.16))), 1);
  })();
  terrainMaterial.positionNode = Fn(() => {
    const local = positionLocal;
    const h = terrainHeight(local.xy);
    return vec4(local.x, local.y, h.sub(0.035), 1);
  })();

  let terrainGeometry = new THREE.PlaneGeometry(state.areaSize, state.areaSize, 96, 96);
  const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
  terrainMesh.rotation.x = -Math.PI / 2;
  terrainMesh.frustumCulled = false;
  scene.add(terrainMesh);

  scene.add(new THREE.HemisphereLight(0xbdf8ff, 0x03110d, 1.15));
  const key = new THREE.DirectionalLight(0xd8fff2, 2.6);
  key.position.set(-6, 10, 5);
  scene.add(key);

  let disposed = false;
  let frames = 0;

  function resize(width = canvas.clientWidth || 1, height = canvas.clientHeight || 1) {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function rebuild() {
    bladesPerAxis = clampBladesPerAxis(state.bladesPerAxis);
    bladeCount = bladesPerAxis * bladesPerAxis;
    const nextGrass = makeBladeGeometry(state.segments);
    grassMesh.geometry.dispose();
    grassMesh.geometry = nextGrass;
    grassGeometry = nextGrass;
    grassMesh.count = bladeCount;

    const nextTerrain = new THREE.PlaneGeometry(state.areaSize, state.areaSize, 96, 96);
    terrainMesh.geometry.dispose();
    terrainMesh.geometry = nextTerrain;
    terrainGeometry = nextTerrain;
  }

  rendererReady.then(() => {
    if (disposed) return;
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
      frames += 1;
    });
  });

  function update(next = {}) {
    const prevAxis = state.bladesPerAxis;
    const prevSegments = state.segments;
    const prevArea = state.areaSize;
    state = { ...state, ...next };
    if (next.areaSize !== undefined) areaU.value = Number(state.areaSize);
    if (next.amplitude !== undefined) ampU.value = Number(state.amplitude);
    if (next.frequency !== undefined) freqU.value = Number(state.frequency);
    if (next.seed !== undefined) seedU.value = Number(state.seed);
    if (next.bladeHeightMin !== undefined) heightMinU.value = Number(state.bladeHeightMin);
    if (next.bladeHeightMax !== undefined) heightMaxU.value = Number(state.bladeHeightMax);
    if (next.bladeWidthMin !== undefined) widthMinU.value = Number(state.bladeWidthMin);
    if (next.bladeWidthMax !== undefined) widthMaxU.value = Number(state.bladeWidthMax);
    if (next.bendAmount !== undefined) bendU.value = Number(state.bendAmount);
    if (next.yawRandomness !== undefined) yawU.value = Number(state.yawRandomness);
    if (next.jitter !== undefined) jitterU.value = Number(state.jitter);
    if (next.windStrength !== undefined) windStrengthU.value = Number(state.windStrength);
    if (next.windSpeed !== undefined) windSpeedU.value = Number(state.windSpeed);
    if (next.windScale !== undefined) windScaleU.value = Number(state.windScale);
    if (next.windDirX !== undefined || next.windDirZ !== undefined) windDirU.value.set(Number(state.windDirX), Number(state.windDirZ));
    if (next.baseColor !== undefined) baseColorU.value.set(String(state.baseColor));
    if (next.tipColor !== undefined) tipColorU.value.set(String(state.tipColor));
    if (next.rimColor !== undefined) rimColorU.value.set(String(state.rimColor));
    if (next.hueShift !== undefined) hueShiftU.value = Number(state.hueShift);
    if (next.pixelRatio !== undefined) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Number(state.pixelRatio)));
    if (next.cameraHeight !== undefined || next.cameraDistance !== undefined) {
      camera.position.set(0, Number(state.cameraHeight), Number(state.cameraDistance));
      camera.lookAt(0, 0.8, 0);
    }
    if (state.bladesPerAxis !== prevAxis || state.segments !== prevSegments || state.areaSize !== prevArea) rebuild();
  }

  resize();
  update(options);

  return {
    renderer,
    scene,
    camera,
    grassMesh,
    terrainMesh,
    grassMaterial,
    terrainMaterial,
    get state() {
      return state;
    },
    update,
    resize,
    getStats() {
      return { frames, bladesPerAxis, bladeCount, width: canvas.clientWidth || 0, height: canvas.clientHeight || 0 };
    },
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      scene.remove(grassMesh, terrainMesh);
      grassGeometry.dispose();
      terrainGeometry.dispose();
      grassMaterial.dispose();
      terrainMaterial.dispose();
      renderer.dispose();
    },
  };
}
