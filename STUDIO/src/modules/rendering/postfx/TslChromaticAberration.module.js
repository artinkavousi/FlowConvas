// TslChromaticAberration.module.js — ARTINOS wrapper around
// three.js r185 examples/jsm/tsl/display/ChromaticAberrationNode.
// Splits RGB radially from a center point for a lens-fringe / glitch look. Strength and
// scale are held as live TSL uniforms so they can be tweaked per frame.
import * as THREE from 'three/webgpu';
import { pass, uniform } from 'three/tsl';
import { chromaticAberration } from '../../tsl/display/ChromaticAberrationNode.js';

export function createTslChromaticAberrationScene(canvas, params = {}) {
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a12);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5);

  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.4, 4),
    new THREE.MeshStandardMaterial({ color: 0x66aaff, roughness: 0.25, metalness: 0.6, flatShading: true }),
  );
  scene.add(mesh);
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(2, 3, 4);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x335577, 1.2));

  const strengthU = uniform(params.strength ?? 1.0);
  const scaleU = uniform(params.scale ?? 1.1);

  const postProcessing = new THREE.PostProcessing(renderer);
  const scenePass = pass(scene, camera);
  postProcessing.outputNode = chromaticAberration(scenePass, strengthU, null, scaleU);

  function update(p = {}) {
    if (p.strength !== undefined) strengthU.value = p.strength;
    if (p.scale !== undefined) scaleU.value = p.scale;
  }

  function resize(w, h) {
    renderer.setSize(Math.max(1, w), Math.max(1, h), false);
    camera.aspect = Math.max(1, w) / Math.max(1, h);
    camera.updateProjectionMatrix();
  }

  function renderFrame() {
    mesh.rotation.x += 0.003;
    mesh.rotation.y += 0.005;
    postProcessing.renderAsync();
  }

  function dispose() {
    renderer.setAnimationLoop(null);
    mesh.geometry.dispose();
    mesh.material.dispose();
    renderer.dispose();
  }

  update(params);
  return { renderer, scene, camera, update, resize, renderFrame, dispose };
}
