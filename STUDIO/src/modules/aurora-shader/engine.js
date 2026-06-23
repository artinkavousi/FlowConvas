/**
 * engine.js — a self-contained TSL/WebGPU fullscreen aurora shader.
 * Untyped (three ships no types). createAurora(canvas) → { update(params), resize(), dispose() }
 *   params: { colorA, colorB, speed, intensity, scale }
 *
 * Requires WebGPU. The .tsx wrapper / PreviewStage guards with a capability notice.
 */

import { WebGPURenderer, MeshBasicNodeMaterial } from 'three/webgpu';
import { uv, time, vec3, vec4, sin, mix, uniform, float } from 'three/tsl';
import { Scene, OrthographicCamera, PlaneGeometry, Mesh, Color } from 'three/webgpu';

export function createAurora(canvas) {
  const renderer = new WebGPURenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // Uniforms we drive from the bridge.
  const uColorA = uniform(new Color('#0ea5e9'));
  const uColorB = uniform(new Color('#a855f7'));
  const uSpeed = uniform(0.4);
  const uIntensity = uniform(1.1);
  const uScale = uniform(3.0);

  const state = { colorA: '#0ea5e9', colorB: '#a855f7', speed: 0.4, intensity: 1.1, scale: 3.0 };

  // TSL graph: layered sine "aurora" bands flowing upward.
  const p = uv();
  const t = time.mul(uSpeed);
  const wave = sin(p.x.mul(uScale).add(t))
    .add(sin(p.x.mul(uScale.mul(1.7)).sub(t.mul(1.3))).mul(0.5))
    .mul(0.12);
  const band = sin(p.y.mul(6.0).add(wave.mul(8.0)).add(t)).mul(0.5).add(0.5);
  const glow = band.pow(float(2.2)).mul(uIntensity);
  const col = mix(uColorA, uColorB, p.y.add(wave)).mul(glow).add(vec3(0.01, 0.015, 0.03));

  const material = new MeshBasicNodeMaterial();
  material.colorNode = vec4(col, 1.0);

  const quad = new Mesh(new PlaneGeometry(2, 2), material);
  scene.add(quad);

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
  };

  resize();
  renderer.setAnimationLoop(() => renderer.render(scene, camera));

  return {
    update(params) {
      if (!params) return;
      if (params.colorA != null) uColorA.value.set(params.colorA);
      if (params.colorB != null) uColorB.value.set(params.colorB);
      if (params.speed != null) uSpeed.value = params.speed;
      if (params.intensity != null) uIntensity.value = params.intensity;
      if (params.scale != null) uScale.value = params.scale;
      Object.assign(state, params);
    },
    resize,
    dispose() {
      renderer.setAnimationLoop(null);
      quad.geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
