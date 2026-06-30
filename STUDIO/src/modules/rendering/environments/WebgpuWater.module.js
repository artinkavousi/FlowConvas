// WebgpuWater.module.js — ARTINOS wrapper around three.js r185 examples/jsm/objects/WaterMesh.
// Reflective animated water (node material + screen-space reflector). Ships a procedurally-generated
// tiling normal map so no external texture asset is required. distortionScale/size/alpha are live uniforms.
import * as THREE from 'three/webgpu';
import { WaterMesh } from '../../objects/WaterMesh.js';

// Build a small tiling normal map from a couple of sine height fields (no asset dependency).
function makeWaterNormals(size = 256) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2;
      const v = (y / size) * Math.PI * 2;
      const dhx = Math.cos(u * 3) * 0.5 + Math.cos(u * 7 + v) * 0.25;
      const dhy = Math.cos(v * 3) * 0.5 + Math.cos(v * 7 + u) * 0.25;
      const nx = -dhx;
      const ny = -dhy;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * size + x) * 4;
      data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function createWebgpuWaterScene(canvas, params = {}) {
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x88bbdd);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 2000);
  camera.position.set(0, 18, 36);

  const waterNormals = makeWaterNormals(256);
  const water = new WaterMesh(new THREE.PlaneGeometry(400, 400), {
    waterNormals,
    sunDirection: new THREE.Vector3(0.7, 0.7, 0.0),
    sunColor: 0xffffff,
    waterColor: params.waterColor ?? 0x001e2f,
    distortionScale: params.distortionScale ?? 8,
    size: params.size ?? 4,
  });
  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(10, 20, 10);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x223344, 1));

  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(4, 1.2, 160, 24),
    new THREE.MeshStandardMaterial({ color: 0xffaa33, roughness: 0.3, metalness: 0.4 }),
  );
  knot.position.y = 6;
  scene.add(knot);

  function update(p = {}) {
    if (p.distortionScale !== undefined) water.distortionScale.value = p.distortionScale;
    if (p.size !== undefined) water.size.value = p.size;
    if (p.alpha !== undefined) water.alpha.value = p.alpha;
  }
  function resize(w, h) {
    renderer.setSize(Math.max(1, w), Math.max(1, h), false);
    camera.aspect = Math.max(1, w) / Math.max(1, h);
    camera.updateProjectionMatrix();
  }
  let t = 0;
  function renderFrame() {
    t += 0.004;
    knot.rotation.y += 0.01;
    camera.position.x = Math.sin(t) * 38;
    camera.position.z = Math.cos(t) * 38;
    camera.lookAt(0, 4, 0);
    renderer.renderAsync(scene, camera);
  }
  function dispose() {
    renderer.setAnimationLoop(null);
    water.geometry.dispose();
    water.material.dispose();
    knot.geometry.dispose();
    knot.material.dispose();
    waterNormals.dispose();
    renderer.dispose();
  }

  update(params);
  return { renderer, scene, camera, water, update, resize, renderFrame, dispose };
}
