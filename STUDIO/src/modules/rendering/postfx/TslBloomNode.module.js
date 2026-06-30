// TslBloomNode.module.js — ARTINOS wrapper around three.js r185 examples/jsm/tsl/display/BloomNode.
// Builds a WebGPU PostProcessing graph (scene pass + additive bloom) and exposes a small
// update/resize/render/dispose engine so any showcase or app can reuse it without touching TSL.
import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';
import { bloom } from '../../tsl/display/BloomNode.js';

export function createTslBloomScene(canvas, params = {}) {
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5);

  const mesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.8, 0.25, 200, 32),
    new THREE.MeshStandardMaterial({
      color: 0xff7733,
      emissive: 0xff5a1f,
      emissiveIntensity: 2.4,
      roughness: 0.3,
      metalness: 0.1,
    }),
  );
  scene.add(mesh);
  const light = new THREE.PointLight(0xffe6c2, 8);
  light.position.set(3, 3, 4);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x223344, 1));

  const postProcessing = new THREE.PostProcessing(renderer);
  const scenePass = pass(scene, camera);
  const scenePassColor = scenePass.getTextureNode('output');
  const bloomPass = bloom(
    scenePassColor,
    params.strength ?? 0.9,
    params.radius ?? 0.5,
    params.threshold ?? 0.0,
  );
  postProcessing.outputNode = scenePassColor.add(bloomPass);

  function update(p = {}) {
    if (p.strength !== undefined) bloomPass.strength.value = p.strength;
    if (p.radius !== undefined) bloomPass.radius.value = p.radius;
    if (p.threshold !== undefined) bloomPass.threshold.value = p.threshold;
    if (p.emissive !== undefined) mesh.material.emissiveIntensity = p.emissive;
  }

  function resize(w, h) {
    renderer.setSize(Math.max(1, w), Math.max(1, h), false);
    camera.aspect = Math.max(1, w) / Math.max(1, h);
    camera.updateProjectionMatrix();
  }

  function renderFrame() {
    mesh.rotation.x += 0.004;
    mesh.rotation.y += 0.006;
    postProcessing.renderAsync();
  }

  function dispose() {
    renderer.setAnimationLoop(null);
    mesh.geometry.dispose();
    mesh.material.dispose();
    renderer.dispose();
  }

  update(params);
  return { renderer, scene, camera, bloomPass, update, resize, renderFrame, dispose };
}
