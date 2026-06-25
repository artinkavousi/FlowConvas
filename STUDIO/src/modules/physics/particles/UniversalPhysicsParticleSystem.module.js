import * as THREE from 'three/webgpu';

export const universalPhysicsParticlesDefaults = {
  particleCount: 0,
  particleRadius: 0.4,
  fillRatio: 0.4,
  packing: 0.6,
  colorPalette: [
    '#ff4444',
    '#44ff44',
    '#4488ff',
    '#ffaa00',
    '#ff44ff',
    '#44ffff',
    '#ffff44',
    '#ff8844',
    '#8844ff',
    '#44ff88',
  ],
  materialRoughness: 0.3,
  materialMetalness: 0.1,
  respawnCount: 5,
};

export function getParticleCount(bounds, radius, fillRatio, packing) {
  const volume = bounds.w * bounds.h * bounds.d;
  const particleVolume = (4 / 3) * Math.PI * Math.pow(radius, 3);
  return Math.max(1, Math.floor((volume * fillRatio * packing) / particleVolume));
}

function randomPositionInBounds(bounds, radius) {
  const hw = bounds.w / 2 - radius - 0.1;
  const hd = bounds.d / 2 - radius - 0.1;
  return {
    x: (Math.random() - 0.5) * 2 * hw,
    y: radius + Math.random() * Math.max(radius, bounds.h - radius * 2),
    z: (Math.random() - 0.5) * 2 * hd,
  };
}

export function createUniversalPhysicsParticles(scene, adapter, options = {}) {
  const state = { ...universalPhysicsParticlesDefaults, ...options };
  const particles = [];
  const dummy = new THREE.Object3D();
  let mesh = null;
  let geometry = null;
  let material = null;
  let bounds = { w: 8, h: 6, d: 8 };

  function clear() {
    particles.length = 0;
    if (mesh) {
      scene.remove(mesh);
      geometry?.dispose();
      material?.dispose();
    }
    mesh = null;
    geometry = null;
    material = null;
  }

  function rebuild(nextBounds = bounds) {
    bounds = nextBounds;
    clear();
    const count =
      state.particleCount > 0
        ? state.particleCount
        : getParticleCount(bounds, state.particleRadius, state.fillRatio, state.packing);

    geometry = new THREE.SphereGeometry(state.particleRadius, 32, 16);
    material = new THREE.MeshPhysicalMaterial({
      roughness: state.materialRoughness,
      metalness: state.materialMetalness,
    });
    mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    scene.add(mesh);

    const color = new THREE.Color();
    for (let i = 0; i < count; i += 1) {
      const start = randomPositionInBounds(bounds, state.particleRadius);
      const body = adapter.createSphereParticle({
        radius: state.particleRadius,
        position: [start.x, start.y, start.z],
        mass: 1,
        restitution: state.restitution ?? 0.5,
        friction: state.friction ?? 0.4,
      });
      const colorValue = state.colorPalette[i % state.colorPalette.length];
      color.set(colorValue);
      mesh.setColorAt(i, color);
      particles.push({ body, color: colorValue });
    }
    sync();
    return particles;
  }

  function sync() {
    if (!mesh) return;
    for (let i = 0; i < particles.length; i += 1) {
      const transform = adapter.readTransform(particles[i].body);
      dummy.position.set(transform.position.x, transform.position.y, transform.position.z);
      dummy.quaternion.set(
        transform.orientation.x,
        transform.orientation.y,
        transform.orientation.z,
        transform.orientation.w,
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  function respawn(count = state.respawnCount) {
    if (particles.length === 0) return;
    for (let i = 0; i < count; i += 1) {
      const particle = particles[Math.floor(Math.random() * particles.length)];
      const p = randomPositionInBounds(bounds, state.particleRadius);
      adapter.resetBody(particle.body, {
        position: [p.x, bounds.h - state.particleRadius - Math.random(), p.z],
        linearVelocity: [0, 0, 0],
        angularVelocity: [0, 0, 0],
      });
    }
  }

  function update(options = {}) {
    Object.assign(state, options);
    if (material) {
      material.roughness = state.materialRoughness;
      material.metalness = state.materialMetalness;
    }
  }

  rebuild(bounds);

  return {
    get mesh() {
      return mesh;
    },
    particles,
    state,
    rebuild,
    sync,
    respawn,
    update,
    dispose: clear,
  };
}
