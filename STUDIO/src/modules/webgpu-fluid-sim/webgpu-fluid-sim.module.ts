import type { ArtinosModule } from '../../registry/types';
import type { ParameterDef } from '@artinos/panelflow';
import { lazy } from 'react';

const WebgpuFluidSimPreview = lazy(() => import('./WebgpuFluidSimPreview'));

// Curated CORE control surface for the standalone solver (keys map to engine
// config.* via createFluidSim.PARAM_TO_CONFIG). The full surface, presets, and
// emitters/audio live in the fluid-studio replica.
const FLUID_SIM_PARAMS: ParameterDef[] = [
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
      { label: 'Divergence', value: 'divergence' },
    ],
    group: 'Render',
  },
  { key: 'curl', label: 'Vorticity (Curl)', type: 'number', default: 30, min: 0, max: 50, step: 1, group: 'Dynamics' },
  { key: 'velocityDissipation', label: 'Velocity Dissipation', type: 'number', default: 0.2, min: 0, max: 4, step: 0.01, group: 'Dynamics' },
  { key: 'densityDissipation', label: 'Density Dissipation', type: 'number', default: 1, min: 0, max: 4, step: 0.01, group: 'Dynamics' },
  { key: 'pressure', label: 'Pressure', type: 'number', default: 0.8, min: 0, max: 1, step: 0.01, group: 'Dynamics' },
  { key: 'pressureIterations', label: 'Pressure Iterations', type: 'number', default: 20, min: 1, max: 50, step: 1, group: 'Dynamics' },
  { key: 'splatRadius', label: 'Splat Radius', type: 'number', default: 0.25, min: 0.01, max: 1, step: 0.01, group: 'Interaction' },
  { key: 'splatForce', label: 'Splat Force', type: 'number', default: 6000, min: 500, max: 12000, step: 100, group: 'Interaction' },
  { key: 'colorful', label: 'Colorful', type: 'boolean', default: true, group: 'Appearance' },
  { key: 'shading', label: 'Shading', type: 'boolean', default: true, group: 'Appearance' },
  { key: 'bloom', label: 'Bloom', type: 'boolean', default: true, group: 'Post FX' },
  { key: 'bloomIntensity', label: 'Bloom Intensity', type: 'number', default: 0.58, min: 0, max: 2, step: 0.01, group: 'Post FX' },
  { key: 'sunrays', label: 'Sunrays', type: 'boolean', default: true, group: 'Post FX' },
  { key: 'paused', label: 'Paused', type: 'boolean', default: false, group: 'Render' },
];

const webgpuFluidSimModule: ArtinosModule = {
  id: 'webgpu-fluid-sim',
  name: 'WebGPU Fluid Sim',
  category: '3d',
  description:
    'The real-time GPU fluid solver (Three.js r184 + TSL + WebGPU) ported full-fidelity from the source project — the reusable fluid VISUAL on its own: Navier–Stokes velocity/dye advection, vorticity, pressure projection, an internal particle field, bloom + sunrays post-FX, plus debug render modes (velocity/curl/pressure/divergence) and an ocean surface. Self-seeds with splats; drag to inject dye and velocity. Use as an interactive background, hero visual, or shader/WebGPU showcase. (Emitters, presets, and audio reactivity live in the fluid-studio composition.)',
  tags: ['webgpu', 'tsl', 'three', 'fluid', 'simulation', 'navier-stokes', 'shader', 'background', 'bloom', 'ocean'],
  schema: {
    id: 'webgpu-fluid-sim',
    name: 'WebGPU Fluid Sim',
    category: '3d',
    parameters: FLUID_SIM_PARAMS,
  },
  preview: WebgpuFluidSimPreview,
  sourcePath: 'STUDIO/src/modules/webgpu-fluid-sim/createFluidSim.js',
  dependencies: ['three', 'webgpu', '@artinos/panelflow'],
  usage:
    "import { createFluidSim } from './modules/webgpu-fluid-sim/createFluidSim.js';\n\nconst sim = createFluidSim(canvas);          // creates its own WebGPURenderer + loop\nsim.update({ renderMode: 'fluid', curl: 30, bloom: true });\n// drag on the canvas to inject dye/velocity\n// sim.resize(); sim.dispose();",
  presets: {
    'Classic Fluid': { renderMode: 'fluid', curl: 30, velocityDissipation: 0.2, bloom: true, sunrays: true, colorful: true },
    'Ocean Surface': { renderMode: 'ocean', curl: 12, velocityDissipation: 0.6, bloom: true },
    'High Vorticity': { renderMode: 'fluid', curl: 48, velocityDissipation: 0.1, splatForce: 9000 },
    'Velocity Debug': { renderMode: 'velocity', shading: false, bloom: false },
  },
  related: ['fluid-emitters', 'audio-reactive'],
  agentNotes:
    'Fluid SOLVER extracted (Mode B) full-fidelity from REF/WebGpu-Fluid-Simulation-master/src/{fluid,particles,compat,config.js,input.js,assets} — copied verbatim under engine/. createFluidSim(canvas) reproduces REF main.js init + render loop for the solver only: WebGPURenderer (alpha, no AA/depth/stencil) + FluidSimulation(renderer, canvas) (which owns its internal ParticleSystem, advected by the velocity field) + FluidInput pointer splats + QualityScaler. NOT wired here (they are the fluid-studio replica): EmitterSystem, AudioReactivity, PresetManager, Tweakpane GUI, PerformanceHud, RecordingManager — applyEmitters is null-safe so the solver runs standalone and self-seeds via needsInitialSplats. Controls are a curated CORE surface defined once in params.ts (FLUID_SIM_PARAMS) mapped to engine config.* via createFluidSim.PARAM_TO_CONFIG (renderMode/curl/dissipation/pressure/splat/bloom/sunrays/colorful/shading/paused). The full ~100-key config surface, ocean tuning, reaction-diffusion, and presets are exposed by fluid-studio. Bridge id "webgpu-fluid-sim". Requires WebGPU; heavy — mount one instance. WebGPU init is async; update() params are stashed and applied once the sim exists.',
  reuseNotes:
    'Full-screen interactive background, hero visual, ocean surface, or shader/WebGPU showcase. To expose more controls, extend FLUID_SIM_PARAMS + PARAM_TO_CONFIG (both in this folder). Package-promotion candidate once reused outside ARTINOS (master guideline §14). Dropped from source: Tweakpane GUI, perf HUD, video recorder, and the emitter/audio/preset wiring (rebuilt in fluid-studio).',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default webgpuFluidSimModule;
