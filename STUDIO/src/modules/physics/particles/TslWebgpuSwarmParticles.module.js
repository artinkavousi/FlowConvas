// TslWebgpuSwarmParticles.module.js
// WebGPU/TSL translation of Kevin Levron's threejs-toys Swarm CodePen.
// The original source is WebGL + GPUComputationRenderer + GLSL psrdnoise. This module preserves the
// source behavior in TSL form: GPU-resident position/velocity fields, noise-driven drift, attraction
// toward origin, velocity clamping, color ramp randomization, bloom, and camera-depth composition.

import * as THREE from 'three/webgpu';
import {
  Fn,
  instanceIndex,
  instancedArray,
  positionLocal,
  uniform,
  float,
  vec3,
  vec4,
  sin,
  cos,
  fract,
  length,
  normalize,
  clamp,
  smoothstep,
  mix,
  time,
  pass,
} from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

export const tslWebgpuSwarmDefaults = {
  gpgpuSize: 256,
  cameraZ: 200,
  geometryScale: 1,
  noiseCoordScale: 0.01,
  noiseIntensity: 0.0025,
  noiseTimeCoef: 0.0004,
  attractionRadius1: 150,
  attractionRadius2: 250,
  maxVelocity: 0.25,
  bloomStrength: 1.5,
  bloomRadius: 0.5,
  bloomThreshold: 0.25,
  colorA: '#2dd4bf',
  colorB: '#8b5cf6',
  colorC: '#f97316',
  background: '#000000',
  pixelRatio: 1.5,
  paused: false,
};

function clampSize(value) {
  return Math.max(32, Math.min(256, Math.floor(value || tslWebgpuSwarmDefaults.gpgpuSize)));
}

function hexToRgb01(value) {
  const c = new THREE.Color(value);
  return [c.r, c.g, c.b];
}

function hash1(value) {
  return fract(sin(value.mul(12.9898)).mul(43758.5453));
}

function hashSigned(value) {
  return hash1(value).mul(2).sub(1);
}

function makeSwarmGeometry() {
  const geometry = new THREE.InstancedBufferGeometry();
  const positions = new Float32Array([
    0.0, 0.0, 1.0,
    0.5, 0.0, -1.0,
    -0.5, 0.0, -1.0,
    0.0, -0.5, -1.0,
    0.0, 0.5, -1.0,
    0.0, 0.0, 1.0,
  ]);
  const normals = new Float32Array([
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
  ]);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setIndex([0, 1, 2, 3, 4, 5]);
  return geometry;
}

export function createTslWebgpuSwarmParticles(canvas, options = {}) {
  let state = { ...tslWebgpuSwarmDefaults, ...options };
  const size = clampSize(state.gpgpuSize);
  const count = size * size;

  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, state.pixelRatio));
  const rendererReady = renderer.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(state.background);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
  camera.position.set(0, 0, state.cameraZ);

  const position = instancedArray(count, 'vec3');
  const oldPosition = instancedArray(count, 'vec3');
  const velocity = instancedArray(count, 'vec3');
  const renderPosition = instancedArray(count, 'vec3');
  const renderVelocity = instancedArray(count, 'vec3');
  const renderColor = instancedArray(count, 'vec3');
  const renderScale = instancedArray(count, 'float');

  const noiseCoordScale = uniform(float(state.noiseCoordScale));
  const noiseIntensity = uniform(float(state.noiseIntensity));
  const noiseTimeCoef = uniform(float(state.noiseTimeCoef));
  const attractionRadius1 = uniform(float(state.attractionRadius1));
  const attractionRadius2 = uniform(float(state.attractionRadius2));
  const maxVelocity = uniform(float(state.maxVelocity));
  const geometryScale = uniform(float(state.geometryScale));
  const colorA = uniform(new THREE.Color(state.colorA));
  const colorB = uniform(new THREE.Color(state.colorB));
  const colorC = uniform(new THREE.Color(state.colorC));

  const initKernel = Fn(() => {
    const i = instanceIndex;
    const fi = float(i);
    const rx = hashSigned(fi.add(13.1));
    const ry = hashSigned(fi.mul(1.37).add(47.2));
    const rz = hashSigned(fi.mul(2.11).add(91.7));
    const direction = normalize(vec3(rx, ry, rz));
    const radius = hashSigned(fi.mul(3.17).add(7.0)).mul(attractionRadius1.mul(2));
    const p = clamp(direction.mul(radius), vec3(-240, -170, -120), vec3(240, 170, 110));
    const weight = hash1(fi.mul(5.71).add(0.37)).mul(0.9).add(0.1);
    const ramp = fract(fi.div(count).mul(1.618));
    const ab = mix(colorA, colorB, clamp(ramp.mul(2), 0, 1));
    const bc = mix(colorB, colorC, clamp(ramp.sub(0.5).mul(2), 0, 1));
    const col = mix(ab, bc, smoothstep(0.35, 0.9, ramp));
    position.element(i).assign(p);
    oldPosition.element(i).assign(p);
    velocity.element(i).assign(vec3(0));
    renderPosition.element(i).assign(p);
    renderVelocity.element(i).assign(vec3(0, 0, 1));
    renderColor.element(i).assign(col);
    renderScale.element(i).assign(weight);
  })().compute(count);

  const updateKernel = Fn(() => {
    const i = instanceIndex;
    const p = position.element(i).toVar();
    const v = velocity.element(i).toVar();
    oldPosition.element(i).assign(p);

    const t = time.mul(noiseTimeCoef);
    const n = vec3(
      sin(p.y.mul(noiseCoordScale).add(t).add(float(i).mul(0.00013))),
      cos(p.z.mul(noiseCoordScale).add(t.mul(1.31)).add(float(i).mul(0.00017))),
      sin(p.x.mul(noiseCoordScale).sub(t.mul(0.73)).add(float(i).mul(0.00019))),
    );
    const noiseForce = n.mul(renderScale.element(i)).mul(0.75).mul(noiseIntensity).mul(100);
    const centerDelta = p.negate();
    const attract = smoothstep(attractionRadius1, attractionRadius2, length(centerDelta));
    const centerForce = normalize(centerDelta).mul(attract).mul(renderScale.element(i)).mul(0.02);
    const nextVelocity = clamp(v.add(noiseForce).add(centerForce), maxVelocity.negate(), maxVelocity);
    const rawPosition = p.add(nextVelocity);
    const nextPosition = clamp(rawPosition, vec3(-260, -180, -140), vec3(260, 180, 120));

    velocity.element(i).assign(nextVelocity);
    position.element(i).assign(nextPosition);
    renderPosition.element(i).assign(nextPosition);
    renderVelocity.element(i).assign(nextPosition.sub(p));
  })().compute(count);

  const recolorKernel = Fn(() => {
    const i = instanceIndex;
    const fi = float(i);
    const ramp = fract(fi.div(count).mul(1.618));
    const jitter = hash1(fi.mul(2.91).add(time.mul(0.001)));
    const ab = mix(colorA, colorB, clamp(ramp.mul(2), 0, 1));
    const bc = mix(colorB, colorC, clamp(ramp.sub(0.5).mul(2), 0, 1));
    renderColor.element(i).assign(mix(ab, bc, smoothstep(0.25, 0.9, jitter)));
  })().compute(count);

  const geometry = makeSwarmGeometry();
  geometry.instanceCount = count;
  const material = new THREE.MeshStandardNodeMaterial({
    roughness: 0.25,
    metalness: 0.75,
    side: THREE.DoubleSide,
  });
  material.positionNode = Fn(() => {
    const p = renderPosition.element(instanceIndex);
    const v = normalize(renderVelocity.element(instanceIndex).add(vec3(0.0001, 0.0002, 0.0003)));
    const side = normalize(vec3(v.z, 0, v.x.negate()).add(vec3(0.0001, 0.0001, 0.0001)));
    const up = normalize(vec3(0, 1, 0).add(v.mul(0.15)));
    const local = positionLocal;
    const scale = renderScale.element(instanceIndex).add(0.5).mul(geometryScale);
    return p
      .add(v.mul(local.z).mul(scale))
      .add(side.mul(local.x).mul(scale))
      .add(up.mul(local.y).mul(scale));
  })();
  material.colorNode = Fn(() => vec4(renderColor.element(instanceIndex), 1))();
  material.emissiveNode = Fn(() => renderColor.element(instanceIndex).mul(0.35))();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const pointA = new THREE.PointLight(0xffffff, 1);
  pointA.position.set(0, 0, 0);
  scene.add(pointA);
  const pointB = new THREE.PointLight(0xff9060, 0.75);
  pointB.position.set(0, -100, -100);
  scene.add(pointB);
  const pointC = new THREE.PointLight(0x6090ff, 0.75);
  pointC.position.set(0, 100, 100);
  scene.add(pointC);

  const postprocessing = new THREE.RenderPipeline(renderer);
  const scenePass = pass(scene, camera);
  const sceneColor = scenePass.getTextureNode('output');
  const bloomNode = bloom(sceneColor, state.bloomStrength, state.bloomRadius, state.bloomThreshold);
  postprocessing.outputNode = sceneColor.add(bloomNode);

  let disposed = false;
  let initialized = false;
  let frames = 0;

  function resize(width = canvas.clientWidth || 1, height = canvas.clientHeight || 1) {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  async function initialize() {
    await rendererReady;
    if (disposed || initialized) return;
    await renderer.computeAsync(initKernel);
    initialized = true;
  }

  renderer.setAnimationLoop(async () => {
    await initialize();
    if (disposed) return;
    if (!state.paused) await renderer.computeAsync(updateKernel);
    postprocessing.render();
    frames += 1;
  });

  resize();

  function update(next = {}) {
    state = { ...state, ...next };
    if (next.noiseCoordScale !== undefined) noiseCoordScale.value = Number(state.noiseCoordScale);
    if (next.noiseIntensity !== undefined) noiseIntensity.value = Number(state.noiseIntensity);
    if (next.noiseTimeCoef !== undefined) noiseTimeCoef.value = Number(state.noiseTimeCoef);
    if (next.attractionRadius1 !== undefined) attractionRadius1.value = Number(state.attractionRadius1);
    if (next.attractionRadius2 !== undefined) attractionRadius2.value = Number(state.attractionRadius2);
    if (next.maxVelocity !== undefined) maxVelocity.value = Number(state.maxVelocity);
    if (next.geometryScale !== undefined) geometryScale.value = Number(state.geometryScale);
    if (next.cameraZ !== undefined) {
      camera.position.z = Number(state.cameraZ);
      camera.updateProjectionMatrix();
    }
    if (next.background !== undefined) scene.background = new THREE.Color(String(state.background));
    if (next.pixelRatio !== undefined) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Number(state.pixelRatio)));
    if (next.bloomStrength !== undefined) bloomNode.strength.value = Number(state.bloomStrength);
    if (next.bloomRadius !== undefined) bloomNode.radius.value = Number(state.bloomRadius);
    if (next.bloomThreshold !== undefined) bloomNode.threshold.value = Number(state.bloomThreshold);
    if (next.colorA !== undefined || next.colorB !== undefined || next.colorC !== undefined) {
      colorA.value.set(String(state.colorA));
      colorB.value.set(String(state.colorB));
      colorC.value.set(String(state.colorC));
      if (initialized) renderer.computeAsync(recolorKernel);
    }
  }

  function setColors(colors = []) {
    const [a, b, c] = colors;
    update({
      colorA: a ?? state.colorA,
      colorB: b ?? state.colorB,
      colorC: c ?? state.colorC,
    });
  }

  update(options);

  return {
    renderer,
    scene,
    camera,
    state,
    count,
    update,
    resize,
    setColors,
    randomizeColors() {
      const random = () => `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
      setColors([random(), random(), random()]);
    },
    getStats() {
      return { frames, count, gpgpuSize: size, width: canvas.clientWidth || 0, height: canvas.clientHeight || 0 };
    },
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      position.dispose?.();
      oldPosition.dispose?.();
      velocity.dispose?.();
      renderPosition.dispose?.();
      renderVelocity.dispose?.();
      renderColor.dispose?.();
      renderScale.dispose?.();
      renderer.dispose();
    },
  };
}

export { hexToRgb01 };
