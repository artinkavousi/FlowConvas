/**
 * engine.js — a self-contained Three.js (WebGL) post-processing scene:
 * an emissive icosahedron through an UnrealBloom composer.
 * createBloom(canvas) → { update(params), resize(), dispose() }
 *   params: { color, strength, radius, threshold, speed }
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function createBloom(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 5);

  const state = { color: '#2dd4bf', strength: 1.4, radius: 0.5, threshold: 0.0, speed: 0.5 };

  const geometry = new THREE.IcosahedronGeometry(1.4, 1);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(state.color),
    emissive: new THREE.Color(state.color),
    emissiveIntensity: 1.4,
    metalness: 0.3,
    roughness: 0.4,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  scene.add(new THREE.AmbientLight(0x223044, 0.6));
  const pt = new THREE.PointLight(0xffffff, 30);
  pt.position.set(3, 4, 5);
  scene.add(pt);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), state.strength, state.radius, state.threshold);
  composer.addPass(bloom);

  let raf = 0;
  const clock = new THREE.Clock();

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const tick = () => {
    const dt = clock.getDelta();
    mesh.rotation.x += dt * state.speed * 0.5;
    mesh.rotation.y += dt * state.speed;
    composer.render();
    raf = requestAnimationFrame(tick);
  };

  resize();
  tick();

  return {
    update(params) {
      if (!params) return;
      if (params.color != null) {
        material.color.set(params.color);
        material.emissive.set(params.color);
      }
      if (params.strength != null) bloom.strength = params.strength;
      if (params.radius != null) bloom.radius = params.radius;
      if (params.threshold != null) bloom.threshold = params.threshold;
      if (params.speed != null) state.speed = params.speed;
    },
    resize,
    dispose() {
      cancelAnimationFrame(raf);
      geometry.dispose();
      material.dispose();
      composer.dispose();
      renderer.dispose();
    },
  };
}
