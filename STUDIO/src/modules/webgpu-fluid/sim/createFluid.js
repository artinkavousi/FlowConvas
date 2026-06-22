/**
 * createFluid.js — minimal bootstrap for the ported WebGPU fluid simulation.
 *
 * This is the reusable init path extracted directly from the source project's
 * main.js (REF/WebGpu-Fluid-Simulation-master), stripped of UI / audio / emitters /
 * presets / recording scaffolding. It mounts the renderer + simulation on a canvas,
 * runs the render loop, and returns a disposer. Kept as plain JS so the Three.js
 * WebGPU/TSL imports stay out of the typed React wrapper.
 */

import { WebGPURenderer } from 'three/webgpu';
import { config, applyDeviceDefaults } from './config.js';
import { requireWebGPU } from './compat/webgpu.js';
import { FluidInput } from './input.js';
import { FluidSimulation } from './fluid/FluidSimulation.js';

export { config };

export async function createFluid(canvas) {
  applyDeviceDefaults(config);
  try {
    await requireWebGPU();
  } catch (error) {
    console.warn('[webgpu-fluid] requireWebGPU failed, attempting WebGL2 fallback:', error.message);
  }

  const renderer = new WebGPURenderer({
    canvas,
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  await renderer.init();

  const input = new FluidInput(canvas);
  const simulation = new FluidSimulation(renderer, canvas);
  simulation.resize();

  const onResize = () => simulation.resize();
  window.addEventListener('resize', onResize);

  let last = performance.now();
  renderer.setAnimationLoop((now) => {
    const t = typeof now === 'number' && Number.isFinite(now) ? now : performance.now();
    const dt = Math.min(Math.max((t - last) / 1000, 0), 1 / 60);
    last = t;
    input.update(dt);
    simulation.update(input, dt, { render: false });
    simulation.render();
  });

  return {
    config,
    dispose() {
      window.removeEventListener('resize', onResize);
      try { renderer.setAnimationLoop(null); } catch (_) { /* ignore */ }
      try { simulation.dispose?.(); } catch (_) { /* ignore */ }
      try { renderer.dispose?.(); } catch (_) { /* ignore */ }
    },
  };
}
