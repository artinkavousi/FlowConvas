// TslVatLifecycleInstances.module.js
// False Earth-derived VAT lifecycle instancing module for rose-like animated vegetation.
// Loads the real False Earth Rose GLB/VAT assets and drives source-style delay/grow/keep/die
// lifecycle phases through a GPU-resident StructuredArray.

import * as THREE from 'three/webgpu';
import {
  Fn,
  If,
  abs,
  cameraPosition,
  clamp,
  cos,
  cross,
  dot,
  float,
  fract,
  hash,
  instanceIndex,
  length,
  mix,
  normalize,
  positionLocal,
  positionWorld,
  sin,
  smoothstep,
  texture,
  time,
  transformNormalToView,
  uniform,
  uint,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { StructuredArray } from '../../webgpu/TslStructuredArray.module.js';
import { getTerrainHeight, shiftHSV } from '../../math/TslVegetationMath.module.js';

export const tslVatLifecycleDefaults = {
  assetRoot: '/labs/false-earth',
  count: 900,
  radius: 12,
  spawnRadius: 3.5,
  scaleMin: 8,
  scaleMax: 20,
  delayMin: 0,
  delayMax: 1.2,
  growMin: 2,
  growMax: 5,
  keepMin: 2,
  keepMax: 5,
  dieMin: 2,
  dieMax: 5,
  amplitude: 1.35,
  frequency: 0.075,
  seed: 0,
  green: '#325825',
  green2: '#699555',
  petalHueShift: 0.5,
  hueRandomness: 0.12,
  emissiveColor: '#ffffff',
  emissiveIntensity: 0.4,
  fresnelIntensity: 0.22,
  windStrength: 0.45,
  windSpeed: 0.8,
  windDirX: 0.75,
  windDirZ: -0.45,
  cameraHeight: 18,
  cameraDistance: 34,
  pixelRatio: 1.5,
  previewSeededLifecycle: true,
  renderVatMesh: true,
  vatMaterialMode: 'source',
};

export const falseEarthVatLifecycleProvenance = {
  source: 'https://github.com/momentchan/false-earth',
  sourceCommit: '74cc91cb2764fbb75aee201d92752e4da37ad311',
  files: [
    'src/components/Rose/Rose.tsx',
    'src/components/Rose/RoseLOD.tsx',
    'src/components/Rose/core/config.ts',
    'src/components/Rose/core/vatCompute.ts',
    'src/components/Rose/core/vatMaterial.ts',
    'src/components/Rose/hooks/useRoseCompute.ts',
    'src/components/Rose/hooks/useRoseUniforms.ts',
    'public/vat/Rose.glb',
    'public/vat/Rose_pos.exr',
    'public/vat/Rose_nrm.png',
  ],
  license: 'MIT',
};

function clampCount(value) {
  return Math.max(32, Math.min(2200, Math.floor(value || tslVatLifecycleDefaults.count)));
}

async function loadJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  return res.json();
}

function firstMesh(root) {
  let found = null;
  root.traverse((node) => {
    if (!found && node.isMesh && node.geometry) found = node;
  });
  return found;
}

function setupVatGeometry(geometry, meta) {
  const g = geometry.clone();
  const positionAttr = g.getAttribute('position');
  const vertexCount = positionAttr?.count || 0;
  const uv1Array = new Float32Array(vertexCount * 2);
  const positionArray = new Float32Array(vertexCount * 3);
  const padding = Number(meta.padding ?? 2);
  const adjustedFramesCount = Number(meta.frameCount || 1) + padding;
  const textureWidth = Number(meta.textureWidth || 1);
  const textureHeight = Number(meta.textureHeight || Math.max(1, vertexCount));

  for (let i = 0; i < vertexCount; i += 1) {
    const columnIndex = Math.floor(i / textureHeight);
    const verticalIndex = i % textureHeight;
    uv1Array[2 * i + 0] = (columnIndex * adjustedFramesCount + 0.5) / textureWidth;
    uv1Array[2 * i + 1] = (verticalIndex + 0.5) / textureHeight;
    positionArray[3 * i + 0] = positionAttr.getX(i) * -1;
    positionArray[3 * i + 1] = positionAttr.getY(i);
    positionArray[3 * i + 2] = positionAttr.getZ(i);
  }

  g.setAttribute('uv1', new THREE.BufferAttribute(uv1Array, 2));
  g.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
  if (!g.getAttribute('color')) {
    const colors = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount; i += 1) {
      const y = g.getAttribute('position').getY(i);
      const isPetal = y > 0.12 ? 0.7 : 0.0;
      colors[i * 3 + 0] = isPetal;
      colors[i * 3 + 1] = isPetal;
      colors[i * 3 + 2] = isPetal;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }
  return g;
}

function configureTexture(tex, colorSpace = THREE.NoColorSpace) {
  tex.colorSpace = colorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

export async function createTslVatLifecycleInstances(canvas, options = {}) {
  let state = { ...tslVatLifecycleDefaults, ...options };
  let count = clampCount(state.count);
  const assetRoot = state.assetRoot.replace(/\/$/, '');

  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, state.pixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  await renderer.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  camera.position.set(0, state.cameraHeight, state.cameraDistance);
  camera.lookAt(0, 1.2, 0);

  const [meta, gltf, posTex, normalVatTex, colorTex, outlineTex, normalMapTex] = await Promise.all([
    loadJson(`${assetRoot}/vat/Rose_meta.json`),
    new GLTFLoader().loadAsync(`${assetRoot}/vat/Rose.glb`),
    new EXRLoader().loadAsync(`${assetRoot}/vat/Rose_pos.exr`),
    new THREE.TextureLoader().loadAsync(`${assetRoot}/vat/Rose_nrm.png`),
    new THREE.TextureLoader().loadAsync(`${assetRoot}/textures/Rose/Rose_Petal_Diff.png`),
    new THREE.TextureLoader().loadAsync(`${assetRoot}/textures/Rose/Rose_Outline.png`),
    new THREE.TextureLoader().loadAsync(`${assetRoot}/textures/Rose/Rose_Petal_Normal.png`),
  ]);

  configureTexture(posTex);
  configureTexture(normalVatTex);
  configureTexture(colorTex, THREE.SRGBColorSpace);
  configureTexture(outlineTex, THREE.SRGBColorSpace);
  configureTexture(normalMapTex);

  const meshSource = firstMesh(gltf.scene);
  const geometry = setupVatGeometry(meshSource?.geometry || new THREE.ConeGeometry(0.14, 1, 7, 4), meta);

  const data = new StructuredArray(
    {
      position: 'vec3',
      isActive: 'float',
      frame: 'float',
      age: 'float',
      seed: 'float',
      progress: 'float',
    },
    count,
    'false-earth-vat-data',
  );

  const radiusU = uniform(state.radius);
  const scaleMinU = uniform(state.scaleMin);
  const scaleMaxU = uniform(state.scaleMax);
  const delayMinU = uniform(state.delayMin);
  const delayMaxU = uniform(state.delayMax);
  const growMinU = uniform(state.growMin);
  const growMaxU = uniform(state.growMax);
  const keepMinU = uniform(state.keepMin);
  const keepMaxU = uniform(state.keepMax);
  const dieMinU = uniform(state.dieMin);
  const dieMaxU = uniform(state.dieMax);
  const ampU = uniform(state.amplitude);
  const freqU = uniform(state.frequency);
  const seedU = uniform(state.seed);
  const greenU = uniform(new THREE.Color(state.green));
  const green2U = uniform(new THREE.Color(state.green2));
  const hueShiftU = uniform(state.petalHueShift);
  const hueRandomU = uniform(state.hueRandomness);
  const emissiveColorU = uniform(new THREE.Color(state.emissiveColor));
  const emissiveIntensityU = uniform(state.emissiveIntensity);
  const fresnelIntensityU = uniform(state.fresnelIntensity);
  const windStrengthU = uniform(state.windStrength);
  const windSpeedU = uniform(state.windSpeed);
  const windDirU = uniform(new THREE.Vector2(state.windDirX, state.windDirZ));
  const deltaU = uniform(1 / 60);
  const previewSeededLifecycleU = uniform(state.previewSeededLifecycle ? 1 : 0);

  const terrainHeight = getTerrainHeight(ampU, freqU, seedU);

  const initKernel = Fn(() => {
    const i = instanceIndex;
    const seedA = hash(uint(i).add(uint(17)));
    const seedB = hash(uint(i).add(uint(53)));
    const seedC = hash(uint(i).add(uint(101)));
    const angle = seedA.mul(6.28318);
    const r = seedB.sqrt().mul(radiusU);
    const x = cos(angle).mul(r);
    const z = sin(angle).mul(r);
    const y = terrainHeight(vec2(x, z));
    const delayDuration = mix(delayMinU, delayMaxU, seedC);
    const growDuration = mix(growMinU, growMaxU, seedC);
    const keepDuration = mix(keepMinU, keepMaxU, seedC);
    const dieDuration = mix(dieMinU, dieMaxU, seedC);
    const lifetime = delayDuration.add(growDuration).add(keepDuration).add(dieDuration);
    const initialAge = mix(seedC.mul(lifetime), seedC.mul(delayMaxU.add(growMaxU)).negate(), float(1).sub(previewSeededLifecycleU));
    data.get(i, 'position').assign(vec3(x, y, z));
    data.get(i, 'isActive').assign(1);
    data.get(i, 'frame').assign(0);
    data.get(i, 'age').assign(initialAge);
    data.get(i, 'seed').assign(fract(seedA.add(seedB).add(seedC)));
    data.get(i, 'progress').assign(0);
  })().compute(count);

  const updateKernel = Fn(() => {
    const i = instanceIndex;
    const active = data.get(i, 'isActive');
    If(active.greaterThan(0), () => {
      const s = data.get(i, 'seed');
      const delayDuration = mix(delayMinU, delayMaxU, s);
      const growDuration = mix(growMinU, growMaxU, s);
      const keepDuration = mix(keepMinU, keepMaxU, s);
      const dieDuration = mix(dieMinU, dieMaxU, s);
      const lifetime = delayDuration.add(growDuration).add(keepDuration).add(dieDuration);
      const p1 = delayDuration.div(lifetime);
      const p2 = delayDuration.add(growDuration).div(lifetime);
      const p3 = delayDuration.add(growDuration).add(keepDuration).div(lifetime);
      const age = data.get(i, 'age').add(deltaU);
      data.get(i, 'age').assign(age);
      const progress = age.div(lifetime);
      const currentFrame = float(0).toVar();
      If(progress.lessThan(p1), () => {
        currentFrame.assign(0);
      })
        .ElseIf(progress.lessThan(p2), () => {
          currentFrame.assign(progress.sub(p1).div(p2.sub(p1)));
        })
        .ElseIf(progress.lessThan(p3), () => {
          currentFrame.assign(1);
        })
        .Else(() => {
          currentFrame.assign(float(1).sub(progress.sub(p3).div(float(1).sub(p3))));
        });
      data.get(i, 'progress').assign(clamp(progress, 0, 1));
      data.get(i, 'frame').assign(clamp(currentFrame, 0, 1));
      If(progress.greaterThan(1), () => {
        data.get(i, 'age').assign(s.mul(delayMaxU.add(growMaxU)).negate());
        data.get(i, 'frame').assign(0);
        data.get(i, 'progress').assign(0);
      });
    });
  })().compute(count);

  const material = new THREE.MeshStandardNodeMaterial({
    side: THREE.DoubleSide,
    roughness: 0.72,
    metalness: 0,
    transparent: true,
  });

  const instance = data.element(instanceIndex);
  const instanceSeed = instance.get('seed');
  const progress = instance.get('progress');
  const frame = instance.get('frame');
  const instancePos = instance.get('position');
  const frameCount = uniform(meta.frameCount || 1);
  const textureWidth = Number(meta.textureWidth || 1);
  const frameIndex = frameCount.sub(1).mul(frame);
  const sampleUV = vec2(uv(1).x.add(frameIndex.mul(1 / textureWidth)), uv(1).y);

  const rotateBySeed = (nodeVec) => {
    const randomAngle = instanceSeed.mul(6.28318);
    const sx = sin(randomAngle);
    const cx = cos(randomAngle);
    return vec3(nodeVec.x.mul(cx).sub(nodeVec.z.mul(sx)), nodeVec.y, nodeVec.x.mul(sx).add(nodeVec.z.mul(cx)));
  };

  if (state.vatMaterialMode !== 'basic') material.positionNode = Fn(() => {
    const vatPos = texture(posTex, sampleUV).rgb;
    const scale = mix(scaleMinU, scaleMaxU, instanceSeed);
    const localVat = rotateBySeed(vatPos.mul(scale).mul(smoothstep(0, 0.12, frame)));
    const windDir = normalize(vec2(windDirU.x, windDirU.y).add(vec2(0.0001)));
    const windWave = sin(dot(instancePos.xz, windDir).mul(0.18).add(time.mul(windSpeedU)).add(instanceSeed.mul(6.28318)));
    const heightFactor = smoothstep(0, 0.08, abs(vatPos.y));
    const sway = vec3(windDir.x, 0, windDir.y).mul(windWave).mul(windStrengthU).mul(heightFactor);
    return positionLocal.add(localVat).add(instancePos).add(sway);
  })();

  material.colorNode = Fn(() => {
    const sourceColor = texture(colorTex, uv()).rgb;
    const outline = texture(outlineTex, uv()).rgb;
    const petalMask = smoothstep(0.08, 0.4, uv().y);
    const stemNoise = fract(sin(uv().y.mul(87.31).add(instanceSeed.mul(13.7))).mul(43758.5453));
    const stemColor = mix(greenU, green2U, stemNoise);
    const petalHue = instanceSeed.mul(hueRandomU).add(hueShiftU);
    const petalColor = shiftHSV(sourceColor, vec3(petalHue, 0, instanceSeed.mul(0.35))).mul(outline);
    const color = mix(stemColor, petalColor, petalMask);
    return vec4(color.mul(smoothstep(0.96, 0.75, progress)).add(emissiveColorU.mul(frame).mul(0.05)), 1);
  })();

  material.opacityNode = Fn(() => smoothstep(0, 0.08, frame))();

  if (state.vatMaterialMode === 'source') material.normalNode = Fn(() => {
    const rawNormal = texture(normalVatTex, sampleUV).rgb.mul(2).sub(1);
    const tangent = normalize(rotateBySeed(vec3(1, 0, 0)));
    const normal = normalize(rotateBySeed(rawNormal));
    const bitangent = normalize(cross(tangent, normal));
    const mapN = texture(normalMapTex, uv()).rgb.mul(2).sub(1);
    return transformNormalToView(normalize(tangent.mul(mapN.x).add(bitangent.mul(mapN.y)).add(normal.mul(mapN.z))));
  })();

  material.emissiveNode = Fn(() => {
    const viewDir = normalize(cameraPosition.sub(positionWorld));
    const fresnel = float(1).sub(abs(dot(normalize(vec3(0, 1, 0)), viewDir))).pow(4.2).mul(fresnelIntensityU);
    const wave = smoothstep(0.32, 0, abs(uv().y.sub(fract(time.mul(-0.25).add(instanceSeed)))));
    return emissiveColorU.mul(wave.mul(emissiveIntensityU).add(fresnel));
  })();

  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;
  const identity = new THREE.Matrix4();
  for (let i = 0; i < count; i += 1) mesh.setMatrixAt(i, identity);
  mesh.instanceMatrix.needsUpdate = true;
  if (state.renderVatMesh) scene.add(mesh);

  const proxyGeometry = new THREE.ConeGeometry(0.055, 0.8, 5, 2);
  proxyGeometry.translate(0, 0.4, 0);
  const proxyMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d75f86'),
    emissive: new THREE.Color('#32151d'),
    emissiveIntensity: 0.7,
    roughness: 0.68,
    metalness: 0,
  });
  const proxyMesh = new THREE.InstancedMesh(proxyGeometry, proxyMaterial, count);
  proxyMesh.frustumCulled = false;
  scene.add(proxyMesh);

  const proxyInstances = Array.from({ length: count }, (_, i) => {
    const a = (i * 12.9898) % 6.28318;
    const seedA = (Math.sin(i * 78.233 + 17.17) * 43758.5453) % 1;
    const seedB = (Math.sin(i * 19.871 + 53.53) * 24634.6345) % 1;
    const seedC = Math.abs((Math.sin(i * 5.177 + 101.1) * 98217.123) % 1);
    const angle = a + seedA * 6.28318;
    const r = Math.sqrt(Math.abs(seedB)) * state.radius;
    return {
      x: Math.cos(angle) * r,
      z: Math.sin(angle) * r,
      seed: seedC,
      age: seedC * (state.growMax + state.keepMax + state.dieMax),
      yaw: seedA * Math.PI * 2,
    };
  });
  const proxyDummy = new THREE.Object3D();

  function updateProxy(dt) {
    const terrainFn = (x, z) => Math.sin((x + state.seed) * state.frequency * 2.7) * Math.cos((z - state.seed) * state.frequency * 2.1) * state.amplitude;
    for (let i = 0; i < proxyInstances.length; i += 1) {
      const item = proxyInstances[i];
      const delayDuration = THREE.MathUtils.lerp(state.delayMin, state.delayMax, item.seed);
      const growDuration = THREE.MathUtils.lerp(state.growMin, state.growMax, item.seed);
      const keepDuration = THREE.MathUtils.lerp(state.keepMin, state.keepMax, item.seed);
      const dieDuration = THREE.MathUtils.lerp(state.dieMin, state.dieMax, item.seed);
      const lifetime = delayDuration + growDuration + keepDuration + dieDuration;
      item.age += dt;
      if (item.age > lifetime) item.age = item.seed * -delayDuration;
      const progress01 = THREE.MathUtils.clamp(item.age / lifetime, 0, 1);
      const p1 = delayDuration / lifetime;
      const p2 = (delayDuration + growDuration) / lifetime;
      const p3 = (delayDuration + growDuration + keepDuration) / lifetime;
      let frame01 = 0;
      if (progress01 < p1) frame01 = 0;
      else if (progress01 < p2) frame01 = (progress01 - p1) / Math.max(0.0001, p2 - p1);
      else if (progress01 < p3) frame01 = 1;
      else frame01 = 1 - (progress01 - p3) / Math.max(0.0001, 1 - p3);
      frame01 = THREE.MathUtils.clamp(frame01, 0, 1);
      const wind = Math.sin((item.x * state.windDirX + item.z * state.windDirZ) * 0.18 + performance.now() * 0.001 * state.windSpeed + item.seed * 6.28318);
      const height = THREE.MathUtils.lerp(state.scaleMin, state.scaleMax, item.seed) * 0.08 * frame01;
      const width = Math.max(0.015, height * 0.18);
      proxyDummy.position.set(item.x + wind * state.windStrength * 0.08 * frame01, terrainFn(item.x, item.z), item.z);
      proxyDummy.rotation.set(0.25 + wind * 0.18, item.yaw, 0);
      proxyDummy.scale.set(width, height, width);
      proxyDummy.updateMatrix();
      proxyMesh.setMatrixAt(i, proxyDummy.matrix);
    }
    proxyMesh.instanceMatrix.needsUpdate = true;
  }

  scene.add(new THREE.HemisphereLight(0xbfffee, 0x101010, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-4, 9, 5);
  scene.add(key);

  let disposed = false;
  let frames = 0;
  let last = performance.now();

  function resize(width = canvas.clientWidth || 1, height = canvas.clientHeight || 1) {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  renderer.computeAsync(initKernel).then(() => {
    if (disposed) return;
    renderer.setAnimationLoop(async () => {
      const now = performance.now();
      deltaU.value = Math.min((now - last) / 1000, 0.08);
      last = now;
      await renderer.computeAsync(updateKernel);
      updateProxy(deltaU.value);
      renderer.render(scene, camera);
      frames += 1;
    });
  });

  function update(next = {}) {
    const previousCount = state.count;
    state = { ...state, ...next };
    if (next.radius !== undefined) radiusU.value = Number(state.radius);
    if (next.scaleMin !== undefined) scaleMinU.value = Number(state.scaleMin);
    if (next.scaleMax !== undefined) scaleMaxU.value = Number(state.scaleMax);
    if (next.delayMin !== undefined) delayMinU.value = Number(state.delayMin);
    if (next.delayMax !== undefined) delayMaxU.value = Number(state.delayMax);
    if (next.growMin !== undefined) growMinU.value = Number(state.growMin);
    if (next.growMax !== undefined) growMaxU.value = Number(state.growMax);
    if (next.keepMin !== undefined) keepMinU.value = Number(state.keepMin);
    if (next.keepMax !== undefined) keepMaxU.value = Number(state.keepMax);
    if (next.dieMin !== undefined) dieMinU.value = Number(state.dieMin);
    if (next.dieMax !== undefined) dieMaxU.value = Number(state.dieMax);
    if (next.amplitude !== undefined) ampU.value = Number(state.amplitude);
    if (next.frequency !== undefined) freqU.value = Number(state.frequency);
    if (next.seed !== undefined) seedU.value = Number(state.seed);
    if (next.green !== undefined) greenU.value.set(String(state.green));
    if (next.green2 !== undefined) green2U.value.set(String(state.green2));
    if (next.petalHueShift !== undefined) hueShiftU.value = Number(state.petalHueShift);
    if (next.hueRandomness !== undefined) hueRandomU.value = Number(state.hueRandomness);
    if (next.emissiveColor !== undefined) emissiveColorU.value.set(String(state.emissiveColor));
    if (next.emissiveIntensity !== undefined) emissiveIntensityU.value = Number(state.emissiveIntensity);
    if (next.fresnelIntensity !== undefined) fresnelIntensityU.value = Number(state.fresnelIntensity);
    if (next.windStrength !== undefined) windStrengthU.value = Number(state.windStrength);
    if (next.windSpeed !== undefined) windSpeedU.value = Number(state.windSpeed);
    if (next.windDirX !== undefined || next.windDirZ !== undefined) windDirU.value.set(Number(state.windDirX), Number(state.windDirZ));
    if (next.pixelRatio !== undefined) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Number(state.pixelRatio)));
    if (next.previewSeededLifecycle !== undefined) previewSeededLifecycleU.value = state.previewSeededLifecycle ? 1 : 0;
    if (next.renderVatMesh !== undefined) {
      if (state.renderVatMesh && !mesh.parent) scene.add(mesh);
      if (!state.renderVatMesh && mesh.parent) scene.remove(mesh);
    }
    if (next.cameraHeight !== undefined || next.cameraDistance !== undefined) {
      camera.position.set(0, Number(state.cameraHeight), Number(state.cameraDistance));
      camera.lookAt(0, 1.2, 0);
    }
    if (next.count !== undefined && next.count !== previousCount) {
      console.warn('TslVatLifecycleInstances count changes require remount; update ignored for current engine.');
    }
  }

  resize();
  update(options);

  return {
    renderer,
    scene,
    camera,
    mesh,
    material,
    update,
    resize,
    getStats() {
      return { frames, count, width: canvas.clientWidth || 0, height: canvas.clientHeight || 0 };
    },
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      scene.remove(mesh);
      scene.remove(proxyMesh);
      data.buffer?.dispose?.();
      geometry.dispose();
      proxyGeometry.dispose();
      proxyMaterial.dispose();
      material.dispose();
      [posTex, normalVatTex, colorTex, outlineTex, normalMapTex].forEach((tex) => tex.dispose?.());
      renderer.dispose();
    },
  };
}
