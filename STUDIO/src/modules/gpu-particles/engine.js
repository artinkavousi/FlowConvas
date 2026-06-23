/**
 * engine.js — a self-contained Three.js (WebGL) particle field.
 * createParticles(canvas) → { update(params), resize(), dispose() }
 *   params: { count, size, color, speed, spread, swirl }
 */

import * as THREE from 'three';

const MAX = 60000;

export function createParticles(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const state = { count: 12000, size: 0.05, color: '#2dd4bf', speed: 0.3, spread: 4, swirl: 0.6 };

  // Allocate the max buffer once; draw range controls the visible count.
  const positions = new Float32Array(MAX * 3);
  const seeds = new Float32Array(MAX); // per-particle phase
  const geometry = new THREE.BufferGeometry();

  const fill = (spread) => {
    for (let i = 0; i < MAX; i++) {
      // Distribute on a fuzzy sphere shell for a galaxy-like field.
      const r = spread * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      seeds[i] = Math.random() * Math.PI * 2;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  };
  fill(state.spread);
  geometry.setDrawRange(0, state.count);

  const material = new THREE.PointsMaterial({
    color: new THREE.Color(state.color),
    size: state.size,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let raf = 0;
  const clock = new THREE.Clock();

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const tick = () => {
    const t = clock.getElapsedTime();
    points.rotation.y = t * state.speed;
    points.rotation.x = Math.sin(t * state.speed * 0.4) * state.swirl * 0.5;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };

  resize();
  tick();

  return {
    update(params) {
      if (!params) return;
      if (params.color != null) material.color.set(params.color);
      if (params.size != null) material.size = params.size;
      if (params.speed != null) state.speed = params.speed;
      if (params.swirl != null) state.swirl = params.swirl;
      if (params.count != null) {
        state.count = Math.max(100, Math.min(MAX, Math.round(params.count)));
        geometry.setDrawRange(0, state.count);
      }
      if (params.spread != null && params.spread !== state.spread) {
        state.spread = params.spread;
        fill(state.spread);
        geometry.attributes.position.needsUpdate = true;
      }
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
