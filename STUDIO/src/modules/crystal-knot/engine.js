/**
 * engine.js — a self-contained Three.js (WebGL) torus-knot scene.
 * Untyped on purpose (three ships no types); the .tsx wrapper stays typed.
 *
 * createKnot(canvas) → { update(params), resize(), dispose() }
 *   params: { color, metalness, roughness, wireframe, speed, knotP, knotQ }
 */

import * as THREE from 'three';

export function createKnot(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  // Lighting — key + rim + ambient for a premium PBR read.
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 5, 6);
  const rim = new THREE.DirectionalLight(0x66e0ff, 1.4);
  rim.position.set(-5, -2, -4);
  scene.add(key, rim, new THREE.AmbientLight(0x404858, 0.8));

  const state = { color: '#2dd4bf', metalness: 0.9, roughness: 0.18, wireframe: false, speed: 0.6, knotP: 2, knotQ: 3 };

  let geometry = new THREE.TorusKnotGeometry(1.3, 0.42, 220, 32, state.knotP, state.knotQ);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(state.color),
    metalness: state.metalness,
    roughness: state.roughness,
    wireframe: state.wireframe,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  let raf = 0;
  const clock = new THREE.Clock();

  const rebuildGeometry = () => {
    const next = new THREE.TorusKnotGeometry(1.3, 0.42, 220, 32, state.knotP, state.knotQ);
    mesh.geometry = next;
    geometry.dispose();
    geometry = next;
  };

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const tick = () => {
    const dt = clock.getDelta();
    mesh.rotation.x += dt * state.speed * 0.4;
    mesh.rotation.y += dt * state.speed;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };

  resize();
  tick();

  return {
    update(params) {
      if (!params) return;
      if (params.color != null) material.color.set(params.color);
      if (params.metalness != null) material.metalness = params.metalness;
      if (params.roughness != null) material.roughness = params.roughness;
      if (params.wireframe != null) material.wireframe = !!params.wireframe;
      if (params.speed != null) state.speed = params.speed;
      const pChanged = params.knotP != null && params.knotP !== state.knotP;
      const qChanged = params.knotQ != null && params.knotQ !== state.knotQ;
      if (params.knotP != null) state.knotP = Math.round(params.knotP);
      if (params.knotQ != null) state.knotQ = Math.round(params.knotQ);
      if (pChanged || qChanged) rebuildGeometry();
    },
    resize,
    dispose() {
      cancelAnimationFrame(raf);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
