// FalseEarthStarfield.js
// Compact local port of False Earth's Stars layer for the Lab capsule.

import * as THREE from 'three/webgpu';

export const falseEarthStarfieldDefaults = {
  enabled: true,
  count: 720,
  radius: 78,
  rim: 0.72,
  size: 2.2,
  opacity: 1,
  color: '#bbd0f5',
};

export function createFalseEarthStarfield(scene, options = {}) {
  const state = { ...falseEarthStarfieldDefaults, ...options };
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 2048;
  textureCanvas.height = 1024;
  const ctx = textureCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
    for (let i = 0; i < state.count * 3; i += 1) {
      const x = Math.random() * textureCanvas.width;
      const y = Math.random() * textureCanvas.height * 0.72;
      const r = Math.random() < 0.05 ? 0.55 : 0.16 + Math.random() * 0.24;
      const alpha = 0.35 + Math.random() * 0.65;
      ctx.fillStyle = `rgba(187, 208, 245, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const skyGeometry = new THREE.SphereGeometry(state.radius * 1.8, 48, 24);
  const skyMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    transparent: true,
    opacity: state.enabled ? state.opacity : 0,
    depthWrite: false,
    depthTest: false,
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.position.y = 22;
  sky.frustumCulled = false;
  scene.add(sky);

  const positions = [];
  const rimMin = state.radius * state.rim;
  const rimThickness = state.radius - rimMin;

  for (let i = 0; i < state.count; i += 1) {
    let x = 0;
    let y = 0;
    let z = 0;
    let len = 0;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
      len = Math.sqrt(x * x + y * y + z * z);
    } while (len > 1 || len === 0);
    const r = rimMin + Math.random() * rimThickness;
    positions.push((x / len) * r, Math.abs(y / len) * r + 18, (z / len) * r);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: state.color,
    size: state.size,
    sizeAttenuation: false,
    transparent: true,
    opacity: state.enabled ? state.opacity : 0,
    depthWrite: false,
    depthTest: false,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  // The generated sky sphere carries the visible stars; keep this point shell available for
  // future source-parity work but do not render it in the layered Lab because WebGPU points
  // appear as oversized square sprites in this container.

  function update(next = {}) {
    Object.assign(state, next);
    sky.visible = state.enabled;
    skyMaterial.opacity = state.enabled ? Number(state.opacity) : 0;
    points.visible = false;
    material.opacity = state.enabled ? Number(state.opacity) : 0;
    material.size = Number(state.size);
    material.color.set(String(state.color));
  }

  update(options);

  return {
    points,
    sky,
    update,
    dispose() {
      scene.remove(sky);
      scene.remove(points);
      skyGeometry.dispose();
      skyMaterial.dispose();
      texture.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}
