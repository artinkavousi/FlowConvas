import * as THREE from 'three/webgpu';
import { createWebgpuSsgiRoomRenderer } from './modules/rendering/postfx/WebgpuSsgiRoomRenderer.module.js';
import { createAdaptiveOpenFrontBoxRoom } from './modules/rendering/environments/AdaptiveOpenFrontBoxRoom.module.js';
import { createUniversalPhysicsParticles } from './modules/physics/particles/UniversalPhysicsParticleSystem.module.js';
import { createBounceRigidSphereAdapter } from './modules/physics/particles/BounceRigidSphereAdapter.module.js';
import { createPointerGlassCollider } from './modules/input/PointerGlassCollider.module.js';
import { BALL_POOL_DEFAULTS } from './local/tuning/sourceTuning';
import { resolveBallPoolPreset } from './local/presets/BallPoolPresets';

function pick(source, keys) {
  const out = {};
  for (const key of keys) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

const RENDER_KEYS = [
  'toneMappingExposure',
  'giIntensity',
  'aoIntensity',
  'ssgiSliceCount',
  'ssgiStepCount',
  'bloomThreshold',
  'bloomStrength',
  'bloomRadius',
  'pixelRatio',
];

const ROOM_KEYS = ['boxHeight', 'boxDepth', 'wallThickness', 'cameraFov'];
const PARTICLE_KEYS = ['particleCount', 'particleRadius', 'ballRadius', 'fillRatio', 'packing', 'materialRoughness', 'materialMetalness', 'respawnCount'];
const ADAPTER_KEYS = ['gravity', 'restitution', 'friction', 'linearDamping', 'angularDamping', 'solveVelocityIterations', 'solvePositionIterations'];
const POINTER_KEYS = ['glassRadius', 'glassMass', 'springStiffness', 'springDamping', 'pushRadius', 'pushStrength', 'lightIntensity', 'easeSpeed'];

export function createBallPoolLab(canvas, options = {}) {
  let config = { ...BALL_POOL_DEFAULTS, ...options };
  let scene = null;
  let camera = null;
  let render = null;
  let room = null;
  let adapter = null;
  let particles = null;
  let pointer = null;
  let ro = null;
  let last = performance.now();
  let frameCount = 0;
  let disposed = false;

  function createScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(config.cameraFov, 1, 0.1, 100);
    render = createWebgpuSsgiRoomRenderer(canvas, pick(config, RENDER_KEYS));
    adapter = createBounceRigidSphereAdapter(pick(config, ADAPTER_KEYS));
    room = createAdaptiveOpenFrontBoxRoom(scene, pick(config, ROOM_KEYS));
    const bounds = room.rebuild(canvas.clientWidth || 1, canvas.clientHeight || 1, {
      createCollisionWall: (wall) => adapter.createBoxCollider(wall),
    });
    room.fitCamera(camera, canvas.clientWidth || 1, canvas.clientHeight || 1);
    particles = createUniversalPhysicsParticles(scene, adapter, {
      ...pick(config, PARTICLE_KEYS),
      particleRadius: config.ballRadius,
      restitution: 0.5,
      friction: 0.4,
    });
    particles.rebuild(bounds);
    pointer = createPointerGlassCollider(canvas, camera, adapter, scene, pick(config, POINTER_KEYS));
    pointer.resize(bounds);
    render.renderer.setAnimationLoop(animate);
  }

  function disposeScene() {
    render?.renderer?.setAnimationLoop(null);
    pointer?.dispose();
    particles?.dispose();
    room?.dispose();
    adapter?.dispose();
    render?.dispose();
    pointer = null;
    particles = null;
    room = null;
    adapter = null;
    render = null;
    scene = null;
    camera = null;
  }

  function resize() {
    if (!render || !room || !camera || !adapter || !particles || !pointer) return;
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    render.resize(w, h);
    adapter.resetWorld(pick(config, ADAPTER_KEYS));
    const bounds = room.rebuild(w, h, { createCollisionWall: (wall) => adapter.createBoxCollider(wall) });
    room.fitCamera(camera, w, h);
    particles.rebuild(bounds);
    pointer.dispose();
    pointer = createPointerGlassCollider(canvas, camera, adapter, scene, pick(config, POINTER_KEYS));
    pointer.resize(bounds);
  }

  function animate() {
    if (disposed || !adapter || !particles || !pointer || !render || !scene || !camera) return;
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    if (!config.paused) {
      pointer.update(dt, particles.particles);
      if (pointer.isPointerHeld()) particles.respawn(config.respawnCount);
      adapter.step(1 / 60, dt);
      particles.sync();
    }
    render.render(scene, camera);
    frameCount += 1;
  }

  function update(params = {}) {
    const next = params.preset ? { ...resolveBallPoolPreset(String(params.preset)), ...params } : params;
    const previous = config;
    config = { ...config, ...next };
    render?.update(pick(config, RENDER_KEYS));
    room?.update(pick(config, ROOM_KEYS));
    pointer?.setOptions(pick(config, POINTER_KEYS));
    particles?.update({ ...pick(config, PARTICLE_KEYS), particleRadius: config.ballRadius });

    const structuralKeys = [...ROOM_KEYS, ...ADAPTER_KEYS, 'ballRadius', 'fillRatio', 'packing', 'particleCount'];
    const needsRebuild = structuralKeys.some((key) => previous[key] !== config[key]);
    if (needsRebuild) resize();
  }

  createScene();
  ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  update(options);

  return {
    update,
    resize,
    dispose() {
      disposed = true;
      ro?.disconnect();
      disposeScene();
    },
    getStats() {
      return {
        frames: frameCount,
        particles: particles?.particles.length ?? 0,
        width: canvas.clientWidth || 0,
        height: canvas.clientHeight || 0,
      };
    },
  };
}
