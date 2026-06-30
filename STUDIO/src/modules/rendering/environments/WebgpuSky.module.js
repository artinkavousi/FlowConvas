// WebgpuSky.module.js — ARTINOS wrapper around three.js r185 examples/jsm/objects/SkyMesh.
// Preetham analytic daylight skydome for WebGPU (node material). Exposes turbidity, rayleigh,
// mie, and sun elevation/azimuth, converting elevation/azimuth to the sunPosition uniform.
import * as THREE from 'three/webgpu';
import { SkyMesh } from '../../objects/SkyMesh.js';

export function createWebgpuSkyScene(canvas, params = {}) {
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2_000_000);
  camera.position.set(0, 80, 240);

  const sky = new SkyMesh();
  sky.scale.setScalar(450000);
  scene.add(sky);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20000, 20000),
    new THREE.MeshStandardMaterial({ color: 0x223322, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const sun = new THREE.Vector3();
  let azimuth = params.azimuth ?? 180;
  let elevation = params.elevation ?? 12;

  function applySun() {
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);
    sun.setFromSphericalCoords(1, phi, theta);
    sky.sunPosition.value.copy(sun);
  }

  function update(p = {}) {
    if (p.turbidity !== undefined) sky.turbidity.value = p.turbidity;
    if (p.rayleigh !== undefined) sky.rayleigh.value = p.rayleigh;
    if (p.mieCoefficient !== undefined) sky.mieCoefficient.value = p.mieCoefficient;
    if (p.mieDirectionalG !== undefined) sky.mieDirectionalG.value = p.mieDirectionalG;
    if (p.elevation !== undefined) elevation = p.elevation;
    if (p.azimuth !== undefined) azimuth = p.azimuth;
    applySun();
  }

  function resize(w, h) {
    renderer.setSize(Math.max(1, w), Math.max(1, h), false);
    camera.aspect = Math.max(1, w) / Math.max(1, h);
    camera.updateProjectionMatrix();
  }

  let t = 0;
  function renderFrame() {
    t += 0.0015;
    camera.position.x = Math.sin(t) * 240;
    camera.position.z = Math.cos(t) * 240;
    camera.lookAt(0, 60, 0);
    renderer.renderAsync(scene, camera);
  }

  function dispose() {
    renderer.setAnimationLoop(null);
    ground.geometry.dispose();
    ground.material.dispose();
    sky.geometry.dispose();
    sky.material.dispose();
    renderer.dispose();
  }

  update({ turbidity: 10, rayleigh: 3, mieCoefficient: 0.005, mieDirectionalG: 0.7, ...params });
  return { renderer, scene, camera, sky, update, resize, renderFrame, dispose };
}
