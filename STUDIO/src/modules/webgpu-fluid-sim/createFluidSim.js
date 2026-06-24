// createFluidSim — module engine factory for webgpu-fluid-sim.
//
// Reproduces REF/src/main.js's init + render loop for the FLUID SOLVER ONLY
// (the reusable visual): WebGPURenderer + FluidSimulation (+ its internal
// ParticleSystem) + FluidInput pointer interaction + QualityScaler. Emitters,
// audio, presets, GUI, HUD, and recording are intentionally NOT wired here —
// those belong to the `fluid-studio` replica. The solver self-seeds with
// initial splats on the first frame, and FluidInput handles drag-to-inject.
//
// Untyped (engine.js convention); the typed .tsx wrapper owns the canvas
// lifecycle. WebGPU init is async, so update() params are stashed and applied
// once the simulation exists.

import { WebGPURenderer } from 'three/webgpu';
import { config, applyDeviceDefaults, setIntegratedGpuFlag } from './engine/config.js';
import { requireWebGPU } from './engine/compat/webgpu.js';
import { FluidInput } from './engine/input.js';
import { FluidSimulation } from './engine/fluid/FluidSimulation.js';
import { QualityScaler } from './engine/performance/QualityScaler.js';

// Bridge param key -> config key. Scalars/booleans/enums applied verbatim.
const PARAM_TO_CONFIG = {
  renderMode: 'RENDER_MODE',
  curl: 'CURL',
  velocityDissipation: 'VELOCITY_DISSIPATION',
  densityDissipation: 'DENSITY_DISSIPATION',
  pressure: 'PRESSURE',
  pressureIterations: 'PRESSURE_ITERATIONS',
  splatRadius: 'SPLAT_RADIUS',
  splatForce: 'SPLAT_FORCE',
  colorful: 'COLORFUL',
  shading: 'SHADING',
  bloom: 'BLOOM',
  bloomIntensity: 'BLOOM_INTENSITY',
  sunrays: 'SUNRAYS',
  paused: 'PAUSED',
};

export function createFluidSim(canvas) {
  let renderer = null;
  let simulation = null;
  let input = null;
  let qualityScaler = null;
  let disposed = false;
  let lastTime = performance.now();
  let pendingParams = null;

  function applyParams(params) {
    if (!params) return;
    for (const [pKey, cKey] of Object.entries(PARAM_TO_CONFIG)) {
      const v = params[pKey];
      if (v !== undefined && v !== null) config[cKey] = v;
    }
  }

  function render(now = performance.now()) {
    if (disposed || !simulation || !input) return;
    const dt = Math.min(Math.max((now - lastTime) / 1000, 0), 1 / 60);
    lastTime = now;
    input.update(dt);
    simulation.update(input, dt, { render: false });
    simulation.render();
    qualityScaler?.update(dt);
  }

  (async () => {
    applyDeviceDefaults(config);
    try {
      await requireWebGPU();
    } catch (error) {
      console.warn('[webgpu-fluid-sim] requireWebGPU failed:', error?.message ?? error);
    }
    renderer = new WebGPURenderer({ canvas, alpha: true, antialias: false, depth: false, stencil: false });
    await renderer.init();
    if (disposed) {
      renderer.dispose();
      return;
    }
    // Refine integrated-GPU heuristic from the adapter (optional probe).
    try {
      const adapter = await navigator.gpu?.requestAdapter?.();
      const info = await adapter?.requestAdapterInfo?.();
      const sig = `${info?.vendor ?? ''} ${info?.description ?? ''}`.toLowerCase();
      const integrated = /intel|llvmpipe|microsoft basic|swiftshader|apple m\d|adreno|mali|powervr/.test(sig);
      setIntegratedGpuFlag(integrated);
      applyDeviceDefaults(config);
    } catch (_) {
      /* probe optional */
    }
    input = new FluidInput(canvas);
    simulation = new FluidSimulation(renderer, canvas);
    qualityScaler = new QualityScaler({ simulation });
    applyParams(pendingParams);
    simulation.resize();
    renderer.setAnimationLoop(render);
  })().catch((err) => console.error('[webgpu-fluid-sim] init failed', err));

  return {
    update(params) {
      pendingParams = params;
      applyParams(params);
    },
    resize() {
      simulation?.resize(true);
    },
    dispose() {
      disposed = true;
      renderer?.setAnimationLoop(null);
      simulation?.dispose();
      renderer?.dispose();
      renderer = null;
      simulation = null;
      input = null;
      qualityScaler = null;
    },
  };
}
