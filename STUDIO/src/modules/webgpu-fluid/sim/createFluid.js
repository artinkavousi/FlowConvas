/**
 * createFluid.js — full bootstrap for the ported WebGPU fluid simulation.
 *
 * This is the reusable init path extracted directly from the source project's
 * main.js (REF/WebGpu-Fluid-Simulation-master). It wires the renderer, input,
 * emitter system (continuous self-animation), preset manager (config + emitter
 * snapshots), audio reactivity (optional, off by default), and the quality
 * scaler — then runs the render loop and returns a control handle.
 *
 * Stripped vs. the source: the Tweakpane GUI (replaced by the PANELFLOW bridge),
 * the performance HUD, and the video recorder — all app chrome, not part of the
 * visual identity (AGENTS.md §4). The simulation, emitters, presets and audio
 * engine are ported verbatim.
 *
 * Kept as plain JS so the Three.js WebGPU/TSL imports stay out of the typed
 * React wrapper.
 */

import { WebGPURenderer } from 'three/webgpu';
import { config, applyDeviceDefaults, setIntegratedGpuFlag } from './config.js';
import { requireWebGPU } from './compat/webgpu.js';
import { FluidInput } from './input.js';
import { AudioReactivity } from './audio/AudioReactivity.js';
import { setTargetWorld } from './audio/targetRegistry.js';
import { EmitterSystem } from './emitters/EmitterSystem.js';
import { FluidSimulation } from './fluid/FluidSimulation.js';
import { PresetManager } from './presets/PresetManager.js';
import { QualityScaler } from './performance/QualityScaler.js';

export { config };

function readHeapMb() {
  const memory = performance?.memory;
  if (!memory?.usedJSHeapSize) return 0;
  return Math.round(memory.usedJSHeapSize / (1024 * 1024));
}

function readRendererBackend(renderer) {
  if (renderer?.isWebGPURenderer) return 'WebGPU';
  return renderer?.backend || renderer?.constructor?.name || 'Renderer';
}

export async function createFluid(canvas, { preset = config.ACTIVE_PRESET, onStats } = {}) {
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

  // Probe the WebGPU adapter for GPU tier; refine the integrated-GPU heuristic
  // so device defaults (dye resolution, bloom iterations) match the hardware.
  try {
    const adapter = await navigator.gpu?.requestAdapter?.();
    if (adapter) {
      const info = await adapter.requestAdapterInfo?.();
      const vendor = (info?.vendor || '').toLowerCase();
      const description = (info?.description || '').toLowerCase();
      const integrated = /intel|llvmpipe|microsoft basic|swiftshader|apple m\d|adreno|mali|powervr/.test(
        vendor + ' ' + description,
      );
      setIntegratedGpuFlag(integrated);
      applyDeviceDefaults(config);
    }
  } catch (_) {
    /* adapter probe is optional */
  }

  const input = new FluidInput(canvas);
  const audio = new AudioReactivity();
  audio.setMode(config.AUDIO_BINDING_MODE || 'off', config);
  const emitters = new EmitterSystem();
  const presets = new PresetManager(config, emitters);
  const simulation = new FluidSimulation(renderer, canvas);
  const qualityScaler = new QualityScaler({ simulation });
  input.emitters = emitters;
  setTargetWorld({ config, emitters });

  // Apply the initial preset (config + emitter layout) so the sim boots with a
  // rich, self-animating look instead of bare defaults.
  const applyPreset = (id) => {
    presets.apply(id, { resize: (full) => simulation.resize(full) });
  };
  applyPreset(preset);

  simulation.resize();
  const onResize = () => simulation.resize();
  window.addEventListener('resize', onResize);

  let last = performance.now();
  let statsLast = last;
  let statsFrames = 0;
  let statsWorkMs = 0;
  renderer.setAnimationLoop((now) => {
    const frameStart = performance.now();
    const t = typeof now === 'number' && Number.isFinite(now) ? now : performance.now();
    const dt = Math.min(Math.max((t - last) / 1000, 0), 1 / 60);
    last = t;
    input.update(dt);
    input.audio = audio.update(config, dt);
    simulation.update(input, dt, { render: false });
    simulation.render();
    qualityScaler.update(dt);

    const frameEnd = performance.now();
    statsFrames += 1;
    statsWorkMs += frameEnd - frameStart;

    if (typeof onStats === 'function' && frameEnd - statsLast >= 1000) {
      const elapsed = frameEnd - statsLast;
      const renderInfo = renderer.info?.render;
      onStats({
        fps: Math.round((statsFrames * 1000) / elapsed),
        computeTime: Number((statsWorkMs / Math.max(statsFrames, 1)).toFixed(1)),
        memory: readHeapMb(),
        triangles: renderInfo?.triangles || 0,
        calls: renderInfo?.calls || 0,
        renderer: readRendererBackend(renderer),
      });
      statsLast = frameEnd;
      statsFrames = 0;
      statsWorkMs = 0;
    }
  });

  return {
    config,
    presets,
    emitters,
    audio,
    /** Apply a built-in preset by id (mutates config + emitters live). */
    applyPreset,
    /** Enable/disable audio reactivity ('off' | 'balanced' | 'pulse'). */
    setAudioMode: (mode) => audio.setMode(mode, config),
    dispose() {
      window.removeEventListener('resize', onResize);
      try { renderer.setAnimationLoop(null); } catch (_) { /* ignore */ }
      try { audio.stop?.(); } catch (_) { /* ignore */ }
      try { simulation.dispose?.(); } catch (_) { /* ignore */ }
      try { renderer.dispose?.(); } catch (_) { /* ignore */ }
    },
  };
}
