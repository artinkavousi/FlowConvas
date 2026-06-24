import type { ArtinosModule } from '../../registry/types';
import type { ParameterDef } from '@artinos/panelflow';
import { lazy } from 'react';

const FluidSimLab = lazy(() => import('./FluidSimLab'));

// Comprehensive control surface (the full original experience). `preset` resets
// config + emitters; the rest map to engine config.* via
// createFluidStudio.PARAM_TO_CONFIG. audioBindingMode/audioGain drive the
// AudioReactivity engine (enable the mic via the preview's Audio button).
const FLUID_STUDIO_PARAMS: ParameterDef[] = [
  {
    key: 'preset',
    label: 'Preset',
    type: 'enum',
    default: 'aurora',
    options: [
      { label: 'Aurora', value: 'aurora' },
      { label: 'Ember', value: 'ember' },
      { label: 'Ink', value: 'ink' },
      { label: 'Bass Drop', value: 'bassDrop' },
      { label: 'Zen Garden', value: 'zenGarden' },
      { label: 'Solar Flare', value: 'solarFlare' },
      { label: 'Deep Space', value: 'deepSpace' },
      { label: 'Northern Lights', value: 'northernLights' },
      { label: 'Jazz Smoke', value: 'jazzSmoke' },
      { label: 'Crystal Prism', value: 'crystalPrism' },
      { label: 'Molten Metal', value: 'moltenMetal' },
      { label: 'Frozen Lake', value: 'frozenLake' },
      { label: 'Ocean Storm', value: 'oceanStorm' },
      { label: 'Lava Flow', value: 'lava-flow' },
      { label: 'Underwater Currents', value: 'underwater-currents' },
      { label: 'Smoke Plume', value: 'smoke-plume' },
      { label: 'Liquid Metal Mirror', value: 'liquid-metal-mirror' },
      { label: 'Sunset Over Water', value: 'sunset-over-water' },
      { label: 'Plasma Field', value: 'plasma-field' },
      { label: 'Vaporwave', value: 'vaporwave' },
    ],
    group: 'Preset',
  },
  {
    key: 'renderMode',
    label: 'Render Mode',
    type: 'enum',
    default: 'fluid',
    options: [
      { label: 'Fluid', value: 'fluid' },
      { label: 'Ocean', value: 'ocean' },
      { label: 'Velocity', value: 'velocity' },
      { label: 'Curl', value: 'curl' },
      { label: 'Pressure', value: 'pressure' },
    ],
    group: 'Render',
  },
  { key: 'paused', label: 'Paused', type: 'boolean', default: false, group: 'Render' },
  { key: 'curl', label: 'Vorticity (Curl)', type: 'number', default: 30, min: 0, max: 50, step: 1, group: 'Dynamics' },
  { key: 'velocityDissipation', label: 'Velocity Dissipation', type: 'number', default: 0.2, min: 0, max: 4, step: 0.01, group: 'Dynamics' },
  { key: 'densityDissipation', label: 'Density Dissipation', type: 'number', default: 1, min: 0, max: 4, step: 0.01, group: 'Dynamics' },
  { key: 'pressure', label: 'Pressure', type: 'number', default: 0.8, min: 0, max: 1, step: 0.01, group: 'Dynamics' },
  { key: 'pressureIterations', label: 'Pressure Iterations', type: 'number', default: 20, min: 1, max: 50, step: 1, group: 'Dynamics' },
  { key: 'splatRadius', label: 'Splat Radius', type: 'number', default: 0.25, min: 0.01, max: 1, step: 0.01, group: 'Interaction' },
  { key: 'splatForce', label: 'Splat Force', type: 'number', default: 6000, min: 500, max: 12000, step: 100, group: 'Interaction' },
  { key: 'colorful', label: 'Colorful', type: 'boolean', default: true, group: 'Appearance' },
  { key: 'shading', label: 'Shading', type: 'boolean', default: true, group: 'Appearance' },
  { key: 'colorUpdateSpeed', label: 'Color Speed', type: 'number', default: 10, min: 0, max: 40, step: 1, group: 'Appearance' },
  { key: 'bloom', label: 'Bloom', type: 'boolean', default: true, group: 'Post FX' },
  { key: 'bloomIntensity', label: 'Bloom Intensity', type: 'number', default: 0.58, min: 0, max: 2, step: 0.01, group: 'Post FX' },
  { key: 'sunrays', label: 'Sunrays', type: 'boolean', default: true, group: 'Post FX' },
  { key: 'sunraysWeight', label: 'Sunrays Weight', type: 'number', default: 0.68, min: 0, max: 2, step: 0.01, group: 'Post FX' },
  { key: 'emittersEnabled', label: 'Emitters', type: 'boolean', default: true, group: 'Emitters' },
  { key: 'emitterIntensity', label: 'Emitter Intensity', type: 'number', default: 1, min: 0, max: 3, step: 0.01, group: 'Emitters' },
  {
    key: 'audioBindingMode',
    label: 'Audio Binding',
    type: 'enum',
    default: 'off',
    options: [
      { label: 'Off', value: 'off' },
      { label: 'Pulse', value: 'pulse' },
      { label: 'Spectrum', value: 'spectrum' },
      { label: 'Flow', value: 'flow' },
    ],
    group: 'Audio',
  },
  { key: 'audioGain', label: 'Audio Gain', type: 'number', default: 1, min: 0, max: 3, step: 0.01, group: 'Audio' },
];

const fluidSimLabModule: ArtinosModule = {
  id: 'fluid-sim',
  name: 'Fluid Sim Lab',
  category: '3d',
  description:
    'LAB — the complete WebGPU fluid experience rebuilt from reusable ARTINOS components: the faithful replica of REF/WebGpu-Fluid-Simulation-master. Wires the fluid solver + internal particles + the full emitter system + audio reactivity + 20 curated presets + adaptive quality + pointer interaction into one interactive piece, with the original Tweakpane GUI replaced by the PANELFLOW control surface. Drag to inject; pick a preset; enable mic for audio-reactive dye. Use as a flagship interactive background, hero, or audio visualizer.',
  tags: ['lab', 'webgpu', 'tsl', 'three', 'fluid', 'simulation', 'emitters', 'audio-reactive', 'presets', 'bloom', 'ocean', 'replica', 'composition'],
  schema: {
    id: 'fluid-sim',
    name: 'Fluid Sim Lab',
    category: '3d',
    parameters: FLUID_STUDIO_PARAMS,
  },
  preview: FluidSimLab,
  sourcePath: 'STUDIO/src/labs/fluid-sim/createFluidSimLab.js',
  dependencies: ['three', 'webgpu', '@artinos/panelflow'],
  usage:
    "import { createFluidSimLab } from './labs/fluid-sim/createFluidSimLab.js';\n\nconst lab = createFluidSimLab(canvas);        // creates renderer + wires all systems\nlab.update({ preset: 'deepSpace', bloom: true, emitterIntensity: 1.2 });\nawait lab.startAudio('mic');                  // optional audio reactivity (user gesture)\n// drag to inject; lab.resize(); lab.dispose();",
  presets: {
    Aurora: { preset: 'aurora' },
    'Deep Space': { preset: 'deepSpace' },
    'Bass Drop (audio)': { preset: 'bassDrop', audioBindingMode: 'pulse' },
    'Ocean Storm': { preset: 'oceanStorm', renderMode: 'ocean' },
    'Liquid Metal': { preset: 'liquid-metal-mirror' },
  },
  related: ['webgpu-fluid-sim', 'fluid-emitters', 'audio-reactive'],
  agentNotes:
    'LAB — FAITHFUL FULL REPLICA (Mode B §15) of REF/WebGpu-Fluid-Simulation-master, the composition that supersedes the old monolithic webgpu-fluid module. Lives at STUDIO/src/labs/fluid-sim/ (the Lab capsule). The entire engine is ported verbatim and self-contained under engine/ (fluid/* solver + internal particles, emitters/* (13 types), audio/* reactivity, presets/* (PresetManager + ~67-preset library), performance/QualityScaler, compat, config.js, input.js, assets). createFluidSimLab(canvas) reproduces REF main.js init + render loop with every system wired: WebGPURenderer -> FluidInput -> AudioReactivity (setMode) -> EmitterSystem -> PresetManager(config, emitters) -> FluidSimulation -> QualityScaler; setTargetWorld({config, emitters}) so audio modulation can target emitters; render loop = input.update; input.audio = audio.update(config, dt); simulation.update(input, dt); simulation.render; qualityScaler.update. Controls (FLUID_STUDIO_PARAMS) map to config.* via PARAM_TO_CONFIG; the `preset` enum (20 curated of ~67) calls presets.apply(id) which resets config + emitters (a preset change wins that update, then manual tweaks override). Audio needs a user gesture: the preview overlays a mic toggle calling handle.startAudio("mic"); audioBindingMode/audioGain drive the matrix. Dropped vs source: Tweakpane GUI (-> PANELFLOW), PerformanceHud (-> usePerformanceTelemetry can be added), RecordingManager, URL preset-sharing, keyboard debug targets. Bridge id "fluid-sim". Requires WebGPU; heavy — mount one instance. The reusable building blocks also ship standalone under modules/: webgpu-fluid-sim (solver), fluid-emitters (emitters), audio-reactive (audio).',
  reuseNotes:
    'Flagship interactive fluid background / hero / audio visualizer — the Lab replica. Built from the extracted components (webgpu-fluid-sim + fluid-emitters + audio-reactive share the same source); the Lab carries its own self-contained engine/ snapshot so it stays copy-pasteable/portable (Lab Capsule Standard). To extend, edit engine/ (verbatim source) and expose more of the ~100-key config via FLUID_STUDIO_PARAMS + PARAM_TO_CONFIG. Replaces the deleted webgpu-fluid module.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default fluidSimLabModule;
