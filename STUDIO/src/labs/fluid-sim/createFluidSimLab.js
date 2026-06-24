// createFluidSimLab — full faithful replica of REF/src/main.js.
//
// Wires ALL the reusable systems (ported verbatim under engine/) into the
// complete original experience: WebGPURenderer + FluidSimulation (+ internal
// ParticleSystem) + EmitterSystem + AudioReactivity + PresetManager +
// QualityScaler + FluidInput. Replaces the original's Tweakpane GUI with the
// PANELFLOW bridge and the PerformanceHud/RecordingManager are dropped. This is
// the "replica" deliverable (Mode B §15); it supersedes the old monolithic
// webgpu-fluid module.
//
// Untyped (engine.js convention). WebGPU init is async; bridge params are
// stashed and applied once the world exists. Audio sources need a user gesture
// (autoplay policy) — exposed via startAudio()/stopAudio() for the preview.

import { WebGPURenderer } from 'three/webgpu';
import { config, applyDeviceDefaults, setIntegratedGpuFlag } from './engine/config.js';
import { requireWebGPU } from './engine/compat/webgpu.js';
import { FluidInput } from './engine/input.js';
import { AudioReactivity } from './engine/audio/AudioReactivity.js';
import { EmitterSystem } from './engine/emitters/EmitterSystem.js';
import { FluidSimulation } from './engine/fluid/FluidSimulation.js';
import { QualityScaler } from './engine/performance/QualityScaler.js';
import { PresetManager } from './engine/presets/PresetManager.js';
import { setTargetWorld } from './engine/audio/targetRegistry.js';

const INITIAL_PRESET = 'aurora';

// Bridge scalar/enum/boolean keys -> engine config keys.
const PARAM_TO_CONFIG = {
  renderMode: 'RENDER_MODE',
  paused: 'PAUSED',
  curl: 'CURL',
  velocityDissipation: 'VELOCITY_DISSIPATION',
  densityDissipation: 'DENSITY_DISSIPATION',
  pressure: 'PRESSURE',
  pressureIterations: 'PRESSURE_ITERATIONS',
  splatRadius: 'SPLAT_RADIUS',
  splatForce: 'SPLAT_FORCE',
  colorful: 'COLORFUL',
  shading: 'SHADING',
  colorUpdateSpeed: 'COLOR_UPDATE_SPEED',
  bloom: 'BLOOM',
  bloomIntensity: 'BLOOM_INTENSITY',
  sunrays: 'SUNRAYS',
  sunraysWeight: 'SUNRAYS_WEIGHT',
  emittersEnabled: 'EMITTERS_ENABLED',
  emitterIntensity: 'EMITTER_INTENSITY',
};

export function createFluidSimLab(canvas) {
  let renderer = null;
  let simulation = null;
  let input = null;
  let audio = null;
  let emitters = null;
  let presets = null;
  let qualityScaler = null;
  let disposed = false;
  let lastTime = performance.now();
  let pendingParams = null;
  let lastPreset = INITIAL_PRESET;

  const resizeHook = (force) => simulation?.resize(force);

  function applyParams(params) {
    if (!params || !simulation) return;
    // A preset change resets config + emitters; let it win this update.
    if (params.preset && params.preset !== lastPreset) {
      lastPreset = params.preset;
      presets.apply(params.preset, { resize: resizeHook });
      return;
    }
    for (const [pKey, cKey] of Object.entries(PARAM_TO_CONFIG)) {
      const v = params[pKey];
      if (v !== undefined && v !== null) config[cKey] = v;
    }
    if (params.audioBindingMode !== undefined) {
      config.AUDIO_BINDING_MODE = params.audioBindingMode;
      audio?.setMode(params.audioBindingMode || 'off', config);
    }
    if (typeof params.audioGain === 'number') {
      config.AUDIO_GAIN = params.audioGain;
      audio?.setGain(params.audioGain);
    }
  }

  function render(now = performance.now()) {
    if (disposed || !simulation || !input) return;
    const dt = Math.min(Math.max((now - lastTime) / 1000, 0), 1 / 60);
    lastTime = now;
    input.update(dt);
    input.audio = audio ? audio.update(config, dt) : null;
    simulation.update(input, dt, { render: false });
    simulation.render();
    qualityScaler?.update(dt);
  }

  (async () => {
    applyDeviceDefaults(config);
    try {
      await requireWebGPU();
    } catch (error) {
      console.warn('[fluid-sim] requireWebGPU failed:', error?.message ?? error);
    }
    renderer = new WebGPURenderer({ canvas, alpha: true, antialias: false, depth: false, stencil: false });
    await renderer.init();
    if (disposed) {
      renderer.dispose();
      return;
    }
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
    audio = new AudioReactivity();
    audio.setMode(config.AUDIO_BINDING_MODE || 'off', config);
    emitters = new EmitterSystem();
    presets = new PresetManager(config, emitters);
    simulation = new FluidSimulation(renderer, canvas);
    qualityScaler = new QualityScaler({ simulation });
    input.emitters = emitters;
    presets.apply(INITIAL_PRESET, { resize: resizeHook });
    setTargetWorld({ config, emitters });
    applyParams(pendingParams);
    simulation.resize();
    renderer.setAnimationLoop(render);
  })().catch((err) => console.error('[fluid-sim] init failed', err));

  return {
    update(params) {
      pendingParams = params;
      applyParams(params);
    },
    async startAudio(kind = 'mic') {
      if (!audio) return;
      if (kind === 'mic') await audio.startMic();
      else await audio.startTone();
    },
    async stopAudio() {
      await audio?.stop();
    },
    resize() {
      simulation?.resize(true);
    },
    dispose() {
      disposed = true;
      renderer?.setAnimationLoop(null);
      simulation?.dispose();
      void audio?.stop();
      renderer?.dispose();
      renderer = simulation = input = audio = emitters = presets = qualityScaler = null;
    },
  };
}
