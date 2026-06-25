// ThirdPersonCharacterNavigation.module.js
// False Earth-derived standalone character navigation and animation blend module.

import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export const thirdPersonCharacterDefaults = {
  assetRoot: '/labs/false-earth',
  walkSpeed: 1,
  runSpeed: 3.5,
  backSpeed: 0.6,
  rotateSpeed: 2.5,
  speedLerpFactor: 0.1,
  rotationLerpFactor: 0.15,
  animBlendLerpFactor: 0.15,
  autoMove: true,
  run: true,
  cameraMode: 'follow',
  orbitRadius: 8,
  cameraHeight: 4.5,
  cameraDistance: 9,
  modelScale: 1,
  pixelRatio: 1.5,
  dracoPath: '/labs/false-earth/draco/',
};

export const falseEarthCharacterProvenance = {
  source: 'https://github.com/momentchan/false-earth',
  sourceCommit: '74cc91cb2764fbb75aee201d92752e4da37ad311',
  files: [
    'src/components/character/Character.tsx',
    'src/components/character/config.ts',
    'src/components/character/hooks/useCharacterPhysics.ts',
    'src/components/character/hooks/useCharacterAssets.ts',
    'src/components/character/utils/solveTank.ts',
    'src/components/character/utils/solveCam.ts',
    'src/components/character/utils/calculateBlendWeights.ts',
    'public/models/Astronaut.glb',
    'public/models/Idle.glb',
    'public/models/Walking.glb',
    'public/models/Running.glb',
    'public/models/WalkingBack.glb',
  ],
  license: 'MIT',
};

function calculateBlendWeights(speed, isRotating, walkSpeed, runSpeed, backSpeed) {
  const absSpeed = Math.abs(speed);
  if (speed < -0.05) return { idle: 0, walk: 0, run: 0, back: Math.min(absSpeed / backSpeed, 1) };
  if (absSpeed < 0.05 && !isRotating) return { idle: 1, walk: 0, run: 0, back: 0 };
  if (absSpeed < walkSpeed * 1.25 || isRotating) return { idle: 0, walk: 1, run: 0, back: 0 };
  const runT = THREE.MathUtils.clamp((absSpeed - walkSpeed) / Math.max(0.001, runSpeed - walkSpeed), 0, 1);
  return { idle: 0, walk: 1 - runT, run: runT, back: 0 };
}

async function loadClip(loader, url, fallbackName) {
  const gltf = await loader.loadAsync(url);
  const clip = gltf.animations?.[0];
  if (clip) clip.name = fallbackName;
  return clip;
}

export async function createThirdPersonCharacterNavigation(canvas, options = {}) {
  let state = { ...thirdPersonCharacterDefaults, ...options };
  const root = state.assetRoot.replace(/\/$/, '');

  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, state.pixelRatio));
  await renderer.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
  const group = new THREE.Group();
  scene.add(group);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(state.dracoPath);
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  const [model, idleClip, walkClip, runClip, backClip] = await Promise.all([
    loader.loadAsync(`${root}/models/Astronaut.glb`),
    loadClip(loader, `${root}/models/Idle.glb`, 'Idle'),
    loadClip(loader, `${root}/models/Walking.glb`, 'Walk'),
    loadClip(loader, `${root}/models/Running.glb`, 'Run'),
    loadClip(loader, `${root}/models/WalkingBack.glb`, 'Back'),
  ]);

  const character = model.scene;
  character.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
      if (node.material) {
        node.material.roughness = 0.62;
        node.material.metalness = 0.18;
      }
    }
  });
  group.add(character);

  const mixer = new THREE.AnimationMixer(character);
  const actions = {};
  [idleClip, walkClip, runClip, backClip].filter(Boolean).forEach((clip) => {
    const action = mixer.clipAction(clip);
    action.reset().play();
    action.setEffectiveWeight(clip.name === 'Idle' ? 1 : 0);
    actions[clip.name] = action;
  });

  scene.add(new THREE.HemisphereLight(0xd6fff6, 0x101820, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-4, 8, 5);
  scene.add(key);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(14, 96),
    new THREE.MeshBasicMaterial({ color: 0x041512, transparent: true, opacity: 0.68 }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const nav = {
    speed: 0,
    rotationVelocity: 0,
    idleWeight: 1,
    walkWeight: 0,
    runWeight: 0,
    backWeight: 0,
    phase: 0,
  };

  let disposed = false;
  let frames = 0;
  let last = performance.now();

  function applyCamera() {
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(group.quaternion);
    character.visible = state.cameraMode !== 'fpv';
    if (state.cameraMode === 'fpv') {
      const eye = group.position.clone().add(new THREE.Vector3(0, 1.55, 0)).add(forward.clone().multiplyScalar(0.24));
      const look = eye.clone().add(forward.clone().multiplyScalar(6));
      camera.position.lerp(eye, 0.32);
      camera.lookAt(look.x, look.y - 0.08, look.z);
      return;
    }
    if (state.cameraMode === 'detached') {
      const t = performance.now() * 0.00018;
      const radius = state.cameraDistance * 1.5;
      const detached = new THREE.Vector3(Math.sin(t) * radius, state.cameraHeight * 1.35, Math.cos(t) * radius);
      camera.position.lerp(detached, 0.04);
      camera.lookAt(group.position.x, group.position.y + 1.15, group.position.z);
      return;
    }
    const camPos = group.position.clone().add(forward.clone().multiplyScalar(-state.cameraDistance));
    camPos.y += state.cameraHeight;
    camera.position.lerp(camPos, 0.14);
    camera.lookAt(group.position.x, group.position.y + 1.4, group.position.z);
  }

  function updateNavigation(dt) {
    const desiredSpeed = state.autoMove ? (state.run ? state.runSpeed : state.walkSpeed) : 0;
    const desiredTurn = state.autoMove ? state.rotateSpeed * 0.32 : 0;
    nav.speed = THREE.MathUtils.lerp(nav.speed, desiredSpeed, state.speedLerpFactor);
    nav.rotationVelocity = THREE.MathUtils.lerp(nav.rotationVelocity, desiredTurn, state.rotationLerpFactor);
    group.rotation.y += nav.rotationVelocity * dt;
    if (Math.abs(nav.speed) > 0.01) group.translateZ(nav.speed * dt);
    if (state.autoMove && group.position.length() > state.orbitRadius * 1.8) {
      group.rotation.y += Math.PI * 0.6 * dt;
    }

    const target = calculateBlendWeights(nav.speed, Math.abs(nav.rotationVelocity) > 0.05, state.walkSpeed, state.runSpeed, state.backSpeed);
    nav.idleWeight = THREE.MathUtils.lerp(nav.idleWeight, target.idle, state.animBlendLerpFactor);
    nav.walkWeight = THREE.MathUtils.lerp(nav.walkWeight, target.walk, state.animBlendLerpFactor);
    nav.runWeight = THREE.MathUtils.lerp(nav.runWeight, target.run, state.animBlendLerpFactor);
    nav.backWeight = THREE.MathUtils.lerp(nav.backWeight, target.back, state.animBlendLerpFactor);
    actions.Idle?.setEffectiveWeight(nav.idleWeight);
    actions.Walk?.setEffectiveWeight(nav.walkWeight);
    actions.Run?.setEffectiveWeight(nav.runWeight);
    actions.Back?.setEffectiveWeight(nav.backWeight);
  }

  function resize(width = canvas.clientWidth || 1, height = canvas.clientHeight || 1) {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.08);
    last = now;
    updateNavigation(dt);
    mixer.update(dt);
    group.scale.setScalar(state.modelScale);
    applyCamera();
    renderer.render(scene, camera);
    frames += 1;
  });

  resize();

  function update(next = {}) {
    state = { ...state, ...next };
    if (next.pixelRatio !== undefined) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Number(state.pixelRatio)));
  }
  update(options);

  return {
    renderer,
    scene,
    camera,
    group,
    update,
    resize,
    getStats() {
      return { frames, speed: nav.speed, runWeight: nav.runWeight, walkWeight: nav.walkWeight, width: canvas.clientWidth || 0, height: canvas.clientHeight || 0 };
    },
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      mixer.stopAllAction();
      scene.remove(group, floor);
      floor.geometry.dispose();
      floor.material.dispose();
      character.traverse((node) => {
        node.geometry?.dispose?.();
        if (Array.isArray(node.material)) node.material.forEach((m) => m.dispose?.());
        else node.material?.dispose?.();
      });
      renderer.dispose();
      dracoLoader.dispose();
    },
  };
}
