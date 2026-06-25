// TslInfiniteTerrainField.module.js
// Reusable WebGPU/TSL terrain field extracted from False Earth.

import * as THREE from 'three/webgpu';
import {
  Fn,
  float,
  length,
  modelWorldMatrix,
  positionLocal,
  smoothstep,
  step,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';
import { getTerrainHeight, getTerrainNormal, shiftHSV } from '../../math/TslVegetationMath.module.js';

export const tslInfiniteTerrainDefaults = {
  areaSize: 80,
  segments: 128,
  amplitude: 1.5,
  frequency: 0.05,
  seed: 0,
  color: '#020807',
  rimColor: '#2dd4bf',
  hueShift: 0,
  focusX: 0,
  focusZ: 0,
  snapEnabled: true,
  gridCellSize: 80 / 1024,
  cameraHeight: 28,
  cameraDistance: 42,
  pixelRatio: 1.5,
};

export const falseEarthTerrainProvenance = {
  source: 'https://github.com/momentchan/false-earth',
  sourceCommit: '74cc91cb2764fbb75aee201d92752e4da37ad311',
  files: [
    'src/components/Terrain.tsx',
    'src/core/utils/gridSnapping.ts',
    'src/core/shaders/terrainHelpers.ts',
    'src/core/shaders/uniforms.ts',
  ],
  license: 'MIT',
};

function snapToGrid(value, cellSize) {
  if (!cellSize) return value;
  return Math.floor(value / cellSize) * cellSize;
}

export function createTslInfiniteTerrainField(canvas, options = {}) {
  let state = { ...tslInfiniteTerrainDefaults, ...options };
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, state.pixelRatio));
  const rendererReady = renderer.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 300);
  camera.position.set(0, state.cameraHeight, state.cameraDistance);
  camera.lookAt(0, 0, 0);

  const ampU = uniform(state.amplitude);
  const freqU = uniform(state.frequency);
  const seedU = uniform(state.seed);
  const colorU = uniform(new THREE.Color(state.color));
  const rimU = uniform(new THREE.Color(state.rimColor));
  const hueU = uniform(state.hueShift);
  const areaU = uniform(state.areaSize);

  const terrainHeight = getTerrainHeight(ampU, freqU, seedU);
  const terrainNormal = getTerrainNormal(terrainHeight);

  const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, transparent: true });
  material.alphaTest = 0.02;
  material.positionNode = Fn(() => {
    const localPos = positionLocal;
    const worldPos = modelWorldMatrix.mul(vec4(localPos, float(1.0))).xyz;
    const h = terrainHeight(worldPos.xz);
    return vec4(localPos.x, localPos.y, localPos.z.add(h), float(1.0));
  })();
  material.opacityNode = Fn(() => {
    const dist = length(positionLocal.xy);
    const radius = areaU.mul(0.5);
    const edge = smoothstep(radius.mul(0.72), radius, dist);
    return float(1.0).sub(step(radius, dist)).mul(float(1.0).sub(edge.mul(0.45)));
  })();
  material.colorNode = Fn(() => {
    const localPos = positionLocal;
    const worldPos = modelWorldMatrix.mul(vec4(localPos, float(1.0))).xyz;
    const n = terrainNormal(worldPos.xz);
    const slope = float(1.0).sub(n.y).mul(0.8);
    const dist = length(localPos.xy).div(areaU.mul(0.5));
    const rim = smoothstep(0.35, 1.0, dist);
    const base = colorU.add(rimU.mul(rim.mul(0.18).add(slope)));
    return vec4(shiftHSV(base, vec3(hueU, float(0.0), float(0.0))), float(1.0));
  })();

  let geometry = new THREE.PlaneGeometry(state.areaSize, state.areaSize, state.segments, state.segments);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.frustumCulled = false;
  scene.add(mesh);

  let disposed = false;
  let frames = 0;

  function applySnap() {
    const x = state.snapEnabled ? snapToGrid(state.focusX, state.gridCellSize) : state.focusX;
    const z = state.snapEnabled ? snapToGrid(state.focusZ, state.gridCellSize) : state.focusZ;
    mesh.position.set(x, 0, z);
    mesh.updateMatrixWorld(true);
  }

  function resize(width = canvas.clientWidth || 1, height = canvas.clientHeight || 1) {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function rebuildGeometry() {
    const next = new THREE.PlaneGeometry(state.areaSize, state.areaSize, state.segments, state.segments);
    mesh.geometry.dispose();
    mesh.geometry = next;
    geometry = next;
    areaU.value = state.areaSize;
    applySnap();
  }

  rendererReady.then(() => {
    if (disposed) return;
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
      frames += 1;
    });
  });

  resize();
  applySnap();

  function update(next = {}) {
    const previousArea = state.areaSize;
    const previousSegments = state.segments;
    state = { ...state, ...next };
    if (next.amplitude !== undefined) ampU.value = Number(state.amplitude);
    if (next.frequency !== undefined) freqU.value = Number(state.frequency);
    if (next.seed !== undefined) seedU.value = Number(state.seed);
    if (next.color !== undefined) colorU.value.set(String(state.color));
    if (next.rimColor !== undefined) rimU.value.set(String(state.rimColor));
    if (next.hueShift !== undefined) hueU.value = Number(state.hueShift);
    if (next.pixelRatio !== undefined) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Number(state.pixelRatio)));
    if (next.cameraHeight !== undefined || next.cameraDistance !== undefined) {
      camera.position.set(0, Number(state.cameraHeight), Number(state.cameraDistance));
      camera.lookAt(mesh.position.x, 0, mesh.position.z);
    }
    if (state.areaSize !== previousArea || state.segments !== previousSegments) rebuildGeometry();
    applySnap();
  }

  update(options);

  return {
    renderer,
    scene,
    camera,
    mesh,
    material,
    get state() {
      return state;
    },
    update,
    resize,
    getStats() {
      return { frames, width: canvas.clientWidth || 0, height: canvas.clientHeight || 0 };
    },
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}

export { getTerrainHeight, getTerrainNormal };
