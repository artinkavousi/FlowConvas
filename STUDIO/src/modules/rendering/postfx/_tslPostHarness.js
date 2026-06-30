// _tslPostHarness.js — shared WebGPU scene + PostProcessing scaffold for the TSL post-FX showcase
// modules in this folder. Not a registry entry (leading underscore, plain .js). Each effect module
// passes a buildOutput(scenePass, ctx) callback that returns the PostProcessing output node, plus an
// optional onUpdate(params) to mutate the effect's uniforms at runtime.
import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';

export function createTslPostScene(canvas, buildOutput, onUpdate) {
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a12);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5);

  const mesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.8, 0.27, 220, 32),
    new THREE.MeshStandardMaterial({ color: 0x88bbff, roughness: 0.3, metalness: 0.5 }),
  );
  scene.add(mesh);
  const light = new THREE.DirectionalLight(0xffffff, 3.2);
  light.position.set(3, 4, 5);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x334466, 1.2));

  const postProcessing = new THREE.PostProcessing(renderer);
  const scenePass = pass(scene, camera);
  postProcessing.outputNode = buildOutput(scenePass, { scene, camera, THREE });

  let spin = 1;
  function update(p = {}) {
    if (p.spin !== undefined) spin = p.spin;
    onUpdate?.(p);
  }
  function resize(w, h) {
    renderer.setSize(Math.max(1, w), Math.max(1, h), false);
    camera.aspect = Math.max(1, w) / Math.max(1, h);
    camera.updateProjectionMatrix();
  }
  function renderFrame() {
    mesh.rotation.x += 0.004 * spin;
    mesh.rotation.y += 0.006 * spin;
    postProcessing.renderAsync();
  }
  function dispose() {
    renderer.setAnimationLoop(null);
    mesh.geometry.dispose();
    mesh.material.dispose();
    renderer.dispose();
  }

  return { renderer, scene, camera, mesh, update, resize, renderFrame, dispose };
}
