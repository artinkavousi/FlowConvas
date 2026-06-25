// TslCosmicBeamWaves.module.js
// False Earth-derived cosmic beam + shockwave system.

import * as THREE from 'three/webgpu';
import { Fn, abs, float, mix, smoothstep, time, uniform, uv, vec3, vec4 } from 'three/tsl';
import { shiftHSV } from '../../math/TslVegetationMath.module.js';

export const tslCosmicBeamWavesDefaults = {
  maxBeams: 20,
  beamHeight: 20,
  dropHeight: 50,
  radiusMin: 5,
  radiusMax: 10,
  lifetimeMin: 3,
  lifetimeMax: 5,
  donutMinRadius: 5,
  donutMaxRadius: 15,
  minSpawnInterval: 2,
  maxSpawnInterval: 5,
  autoSpawn: true,
  beamCoreColor: '#ffffff',
  beamGlowColor: '#00ffff',
  waveColor: '#20e0c5',
  hueShift: 0,
  onBeamHit: null,
  cameraHeight: 24,
  cameraDistance: 42,
  pixelRatio: 1.5,
};

export const falseEarthCosmicProvenance = {
  source: 'https://github.com/momentchan/false-earth',
  sourceCommit: '74cc91cb2764fbb75aee201d92752e4da37ad311',
  files: [
    'src/components/cosmic/CosmicSystem.tsx',
    'src/components/cosmic/CosmicBeams.tsx',
    'src/components/cosmic/hooks/useCosmicWaves.ts',
    'src/components/cosmic/hooks/useCosmicBeamSpawner.ts',
    'src/components/cosmic/config.ts',
  ],
  license: 'MIT',
};

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function makeBeamMaterial(state) {
  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: true,
    blending: THREE.AdditiveBlending,
  });
  const core = uniform(new THREE.Color(state.beamCoreColor));
  const glow = uniform(new THREE.Color(state.beamGlowColor));
  const hue = uniform(state.hueShift);
  material.colorNode = Fn(() => {
    const vUv = uv();
    const distFromCenter = abs(vUv.x.sub(0.5)).mul(2);
    const coreBeam = smoothstep(float(0.4), float(0), distFromCenter);
    const finalColor = mix(glow, core, coreBeam);
    const hueShifted = shiftHSV(finalColor, vec3(hue, float(0), float(0)));
    return vec4(hueShifted, 1);
  })();
  material.opacityNode = Fn(() => {
    const vUv = uv();
    return smoothstep(float(0), float(0.2), vUv.y).mul(smoothstep(float(1), float(0.8), vUv.y));
  })();
  return { material, uniforms: { core, glow, hue } };
}

function makeWaveMaterial(state) {
  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const color = uniform(new THREE.Color(state.waveColor));
  const hue = uniform(state.hueShift);
  material.colorNode = Fn(() => vec4(shiftHSV(color, vec3(hue, 0, 0)), 1))();
  material.opacityNode = Fn(() => {
    const radial = abs(uv().y.sub(0.5)).mul(2);
    return smoothstep(1, 0, radial).mul(0.55);
  })();
  return { material, uniforms: { color, hue } };
}

export function createTslCosmicBeamWaves(canvas, options = {}) {
  let state = { ...tslCosmicBeamWavesDefaults, ...options };
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, state.pixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const rendererReady = renderer.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 220);
  camera.position.set(0, state.cameraHeight, state.cameraDistance);
  camera.lookAt(0, 0, 0);

  const beamMat = makeBeamMaterial(state);
  const waveMat = makeWaveMaterial(state);
  const beamGeometry = new THREE.CylinderGeometry(1, 1, state.beamHeight, 12, 1, true);
  const beamMesh = new THREE.InstancedMesh(beamGeometry, beamMat.material, state.maxBeams);
  beamMesh.frustumCulled = false;
  scene.add(beamMesh);

  const waveGeometry = new THREE.RingGeometry(0.85, 1, 96, 2);
  const waveMesh = new THREE.InstancedMesh(waveGeometry, waveMat.material, state.maxBeams);
  waveMesh.rotation.x = -Math.PI / 2;
  waveMesh.frustumCulled = false;
  scene.add(waveMesh);

  const beams = Array.from({ length: state.maxBeams }, () => ({
    active: false,
    x: 0,
    z: 0,
    start: 0,
    lifetime: 0.5,
    radius: 5,
    hitTime: 0,
    hitNotified: false,
  }));
  const dummy = new THREE.Object3D();
  let disposed = false;
  let frames = 0;
  let lastSpawn = 0;
  let nextSpawn = rand(state.minSpawnInterval, state.maxSpawnInterval);

  function triggerBeam(position = null) {
    const beam = beams.find((item) => !item.active);
    if (!beam) return null;
    const angle = Math.random() * Math.PI * 2;
    const radius = rand(state.donutMinRadius, state.donutMaxRadius);
    beam.x = position?.x ?? Math.cos(angle) * radius;
    beam.z = position?.z ?? Math.sin(angle) * radius;
    beam.start = performance.now() / 1000;
    beam.hitTime = beam.start + 0.2;
    beam.hitNotified = false;
    beam.lifetime = rand(state.lifetimeMin, state.lifetimeMax);
    beam.radius = rand(state.radiusMin, state.radiusMax);
    beam.active = true;
    return new THREE.Vector3(beam.x, 0, beam.z);
  }

  function updateInstances(now) {
    for (let i = 0; i < beams.length; i += 1) {
      const beam = beams[i];
      if (!beam.active) {
        dummy.position.set(0, -5000, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        beamMesh.setMatrixAt(i, dummy.matrix);
        waveMesh.setMatrixAt(i, dummy.matrix);
        continue;
      }
      const age = now - beam.start;
      const beamFall = Math.min(age / 0.2, 1);
      const beamFade = Math.max(0, 1 - Math.max(0, age - 0.2) / 0.3);
      const y = state.dropHeight * (1 - beamFall) + state.beamHeight * 0.5 * beamFall;
      dummy.position.set(beam.x, y, beam.z);
      dummy.scale.set(0.08 + beamFade * 0.42, 1, 0.08 + beamFade * 0.42);
      dummy.updateMatrix();
      beamMesh.setMatrixAt(i, dummy.matrix);

      const waveAge = Math.max(0, now - beam.hitTime);
      if (!beam.hitNotified && now >= beam.hitTime) {
        beam.hitNotified = true;
        state.onBeamHit?.({
          x: beam.x,
          z: beam.z,
          radius: beam.radius,
          lifetime: beam.lifetime,
          time: now,
        });
      }
      const waveProgress = Math.min(waveAge / beam.lifetime, 1);
      const waveRadius = THREE.MathUtils.lerp(0.001, beam.radius, waveProgress);
      const waveFade = Math.sin(Math.PI * waveProgress) * 0.35;
      dummy.position.set(beam.x, 0.035, beam.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(waveRadius, waveRadius, waveFade);
      dummy.updateMatrix();
      waveMesh.setMatrixAt(i, dummy.matrix);

      if (age > beam.lifetime + 0.5) beam.active = false;
    }
    beamMesh.instanceMatrix.needsUpdate = true;
    waveMesh.instanceMatrix.needsUpdate = true;
  }

  function resize(width = canvas.clientWidth || 1, height = canvas.clientHeight || 1) {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  rendererReady.then(() => {
    if (disposed) return;
    triggerBeam(new THREE.Vector3(0, 0, 0));
    renderer.setAnimationLoop(() => {
      const now = performance.now() / 1000;
      if (state.autoSpawn && now - lastSpawn > nextSpawn) {
        triggerBeam();
        lastSpawn = now;
        nextSpawn = rand(state.minSpawnInterval, state.maxSpawnInterval);
      }
      updateInstances(now);
      renderer.render(scene, camera);
      frames += 1;
    });
  });

  resize();

  function update(next = {}) {
    state = { ...state, ...next };
    if (next.beamCoreColor !== undefined) beamMat.uniforms.core.value.set(String(state.beamCoreColor));
    if (next.beamGlowColor !== undefined) beamMat.uniforms.glow.value.set(String(state.beamGlowColor));
    if (next.waveColor !== undefined) waveMat.uniforms.color.value.set(String(state.waveColor));
    if (next.hueShift !== undefined) {
      beamMat.uniforms.hue.value = Number(state.hueShift);
      waveMat.uniforms.hue.value = Number(state.hueShift);
    }
    if (next.pixelRatio !== undefined) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Number(state.pixelRatio)));
    if (next.cameraHeight !== undefined || next.cameraDistance !== undefined) {
      camera.position.set(0, Number(state.cameraHeight), Number(state.cameraDistance));
      camera.lookAt(0, 0, 0);
    }
  }

  update(options);

  return {
    renderer,
    scene,
    camera,
    triggerBeam,
    update,
    resize,
    getStats() {
      return { frames, activeBeams: beams.filter((beam) => beam.active).length, width: canvas.clientWidth || 0, height: canvas.clientHeight || 0 };
    },
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      scene.remove(beamMesh, waveMesh);
      beamGeometry.dispose();
      waveGeometry.dispose();
      beamMat.material.dispose();
      waveMat.material.dispose();
      renderer.dispose();
    },
  };
}
