import type { ArtinosModule } from '../../registry/types';
import type { ParameterDef } from '@artinos/panelflow';
import { lazy } from 'react';
import { FLUID_PARAMS, FLUID_PRESETS, DEFAULT_PRESET } from './sim/params';

const WebGPUFluidPreview = lazy(() => import('./WebGPUFluidPreview'));

// Build the PANELFLOW schema from the shared param map (single source of truth
// with the React wrapper) plus a preset selector at the top.
const presetParam: ParameterDef = {
  key: 'preset',
  label: 'Preset',
  type: 'enum',
  default: DEFAULT_PRESET,
  options: FLUID_PRESETS,
  group: 'Preset',
};

const parameters: ParameterDef[] = [
  presetParam,
  ...FLUID_PARAMS.map(
    (p): ParameterDef => ({
      key: p.key,
      label: p.label,
      type: p.type,
      default: p.default,
      ...(p.min !== undefined ? { min: p.min } : {}),
      ...(p.max !== undefined ? { max: p.max } : {}),
      ...(p.step !== undefined ? { step: p.step } : {}),
      ...(p.options ? { options: p.options } : {}),
      group: p.group,
    }),
  ),
];

const webgpuFluidModule: ArtinosModule = {
  id: 'webgpu-fluid',
  name: 'WebGPU Fluid Simulation',
  category: '3d',
  description:
    'A real-time GPU fluid simulation (Three.js r184 + TSL + WebGPU) ported full-fidelity from the source project. Self-animating emitter system, 18 built-in presets, and the complete control surface — dynamics, colour modes, PBR material/render modes (incl. ocean), bloom/sunrays, particles, and post-FX. Drag to inject dye and velocity. Use as an interactive background, hero visual, or shader/WebGPU showcase piece.',
  tags: ['webgpu', 'tsl', 'three', 'fluid', 'simulation', 'shader', 'background', 'particles', 'bloom', 'emitters', 'presets', 'ocean'],
  schema: {
    id: 'webgpu-fluid',
    name: 'WebGPU Fluid Simulation',
    category: '3d',
    parameters,
  },
  preview: WebGPUFluidPreview,
  sourcePath: 'STUDIO/src/modules/webgpu-fluid/WebGPUFluidModule.tsx',
  dependencies: ['three', 'webgpu', '@artinos/panelflow'],
  usage:
    "import { WebGPUFluidModule } from './modules/webgpu-fluid/WebGPUFluidModule';\n\n<WebGPUFluidModule\n  preset=\"aurora\"\n  values={{ curl: 30, renderMode: 'fluid', bloom: true }}\n  className=\"absolute inset-0\"\n/>",
  presets: {
    Aurora: { preset: 'aurora' },
    'Lava Flow': { preset: 'lava-flow' },
    'Underwater Currents': { preset: 'underwater-currents' },
    'Smoke Plume': { preset: 'smoke-plume' },
    'Liquid Metal Mirror': { preset: 'liquid-metal-mirror' },
    'Ocean Surface': { preset: 'sunset-over-water', renderMode: 'ocean' },
  },
  related: [],
  agentNotes:
    'WebGPU fluid sim ported full-fidelity from REF/WebGpu-Fluid-Simulation-master (Three.js r184 + TSL). The entire reusable engine lives self-contained under sim/: fluid/* solver, particles, emitters/* (13 emitter types — drives continuous self-animation via input.emitters.resolveFrame), presets/* (PresetManager + 24-preset library), audio/* (reactivity, off by default), performance/QualityScaler. Only the Tweakpane GUI, perf HUD and video recorder were dropped — replaced by the PANELFLOW bridge and an optional onStats telemetry callback. The Studio preview publishes those stats through PANELFLOW usePerformanceTelemetry, the shared monitor contract for all current/future modules. The full control surface is defined once in sim/params.ts (shared by the schema + the React wrapper) covering dynamics, colour modes, render/material (incl. ocean), bloom/sunrays, particles, post-FX, forces. The `preset` enum applies a built-in look (config + emitter layout) and re-syncs the panel via onPresetApplied. Colours are hex in the bridge, {r,g,b} in config — converted in params.ts. Bridge id "webgpu-fluid". Requires WebGPU. Heavy — mount a single instance.',
  reuseNotes:
    'Full-screen interactive background, hero visual, ocean surface, or shader/WebGPU showcase. To add more controls, extend FLUID_PARAMS in sim/params.ts (schema + wrapper both update). To enable audio reactivity, call the handle.setAudioMode("balanced") from createFluid.',
  version: '0.2.1',
  updatedAt: '2026-06-23',
};

export default webgpuFluidModule;
