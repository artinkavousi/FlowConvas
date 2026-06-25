import type { ArtinosModule } from '../../registry/types';
import type { ParameterDef } from '@artinos/panelflow';
import { lazy } from 'react';

const TslFluidLab = lazy(() => import('./TslFluidLab'));

const TSL_FLUID_PARAMS: ParameterDef[] = [
  {
    key: 'preset',
    label: 'Preset',
    type: 'enum',
    default: 'codepen-original',
    options: [
      { label: 'CodePen Original', value: 'codepen-original' },
      { label: 'Thick Ink', value: 'thick-ink' },
      { label: 'Wispy Smoke', value: 'wispy-smoke' },
      { label: 'High Vorticity', value: 'high-vorticity' },
      { label: 'Performance', value: 'performance' },
    ],
    group: 'Preset',
  },
  {
    key: 'gridSize',
    label: 'Grid Size',
    type: 'enum',
    default: 512,
    options: [
      { label: '64', value: 64 },
      { label: '128', value: 128 },
      { label: '256', value: 256 },
      { label: '512', value: 512 },
    ],
    group: 'Simulation',
  },
  { key: 'paused', label: 'Paused', type: 'boolean', default: false, group: 'Simulation' },
  { key: 'jacobiIterations', label: 'Quality (Iterations)', type: 'number', default: 20, min: 5, max: 50, step: 1, group: 'Simulation' },
  { key: 'viscosity', label: 'Viscosity', type: 'number', default: 0.0001, min: 0, max: 0.001, step: 0.00001, group: 'Dynamics' },
  { key: 'vorticity', label: 'Vorticity', type: 'number', default: 0.8, min: 0, max: 5, step: 0.1, group: 'Dynamics' },
  { key: 'dissipation', label: 'Dissipation', type: 'number', default: 0.995, min: 0.9, max: 1, step: 0.001, group: 'Dynamics' },
  { key: 'forceRadius', label: 'Force Radius', type: 'number', default: 0.02, min: 0.001, max: 0.1, step: 0.001, group: 'Interaction' },
  { key: 'forceStrength', label: 'Force Strength', type: 'number', default: 2.0, min: 0, max: 20, step: 0.1, group: 'Interaction' },
  { key: 'colorStrength', label: 'Color Strength', type: 'number', default: 0.5, min: 0, max: 2, step: 0.05, group: 'Interaction' },
  { key: 'colorCycleSpeed', label: 'Color Speed', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, group: 'Appearance' },
  { key: 'bloomStrength', label: 'Bloom Strength', type: 'number', default: 0.5, min: 0, max: 2, step: 0.01, group: 'Post FX' },
  { key: 'bloomRadius', label: 'Bloom Radius', type: 'number', default: 0.1, min: 0, max: 1, step: 0.01, group: 'Post FX' },
  { key: 'bloomThreshold', label: 'Bloom Threshold', type: 'number', default: 0.1, min: 0, max: 1, step: 0.01, group: 'Post FX' },
];

const tslFluidLabModule: ArtinosModule = {
  id: 'tsl-fluid',
  name: 'TSL Fluid Lab',
  category: 'lab',
  description:
    'LAB — faithful replica of the "TSL_Fluid" CodePen (pashafd/OPVGJav): a fullscreen WebGPU grid Navier–Stokes fluid with RGB dye, vorticity confinement, a Jacobi pressure solve, pointer force + colored-dye splats, color cycling, and bloom — running as native TSL compute kernels. Rebuilt from reusable ARTINOS cores: the GPGPU compute-field substrate, grid-sampling math, the stable-fluids solver, the field-color display, and the pointer-velocity splat. Drag to inject dye; pick a preset; tune the panel live. Use as an interactive hero/background.',
  tags: ['lab', 'replica', 'composition', 'webgpu', 'tsl', 'fluid', 'navier-stokes', 'compute', 'bloom'],
  schema: {
    id: 'tsl-fluid',
    name: 'TSL Fluid Lab',
    category: 'lab',
    parameters: TSL_FLUID_PARAMS,
  },
  preview: TslFluidLab,
  sourcePath: 'STUDIO/src/labs/tsl-fluid/createTslFluidLab.js',
  dependencies: ['three', 'webgpu', '@artinos/panelflow'],
  usage:
    "import { createTslFluidLab } from './labs/tsl-fluid/createTslFluidLab.js';\n\nconst lab = createTslFluidLab(canvas);     // WebGPURenderer + solver + display + pointer + bloom\nlab.update({ preset: 'high-vorticity', bloomStrength: 0.7 });\n// drag to inject dye; lab.resize(); lab.dispose();",
  presets: {
    'CodePen Original': { preset: 'codepen-original' },
    'Thick Ink': { preset: 'thick-ink' },
    'Wispy Smoke': { preset: 'wispy-smoke' },
    'High Vorticity': { preset: 'high-vorticity' },
    Performance: { preset: 'performance' },
  },
  related: [
    'tsl-stable-fluids-2d',
    'tsl-compute-field-2d',
    'tsl-grid-sampling',
    'tsl-field-color-display',
    'pointer-velocity-splat',
    'webgpu-fluid-sim',
  ],
  agentNotes:
    'FAITHFUL FULL REPLICA (Mode B) of CodePen pashafd/OPVGJav "TSL_Fluid" (verbatim source in REF/tsl-fluid/). Lives at STUDIO/src/labs/tsl-fluid/. createTslFluidLab(canvas) reproduces source init()+render(): WebGPURenderer -> ortho fullscreen scene -> TslStableFluids2D (built on TslComputeField2D + TslGridSampling) -> TslFieldColorDisplay mesh -> PointerVelocitySplat -> RenderPipeline(pass texture + bloom) -> setAnimationLoop. Per frame: read pointer -> solver.setPointer -> solver.step(renderer) (forces -> advect -> viscosity Jacobi -> vorticity -> divergence -> pressure Jacobi -> project -> dye advect) -> render pipeline -> pointer.tick (velocity decay 0.95). The Lab carries self-contained snapshots under modules/ (provenance in local/tuning/provenance.ts). Controls map 1:1 to solver.setParams + bloomNode uniforms; `preset` resolves via local/presets; `gridSize` is structural and rebuilds the sim. Source pins three@0.176.0; STUDIO runs three@0.184.0, so the only postprocessing deviation is the required PostProcessing/renderAsync compatibility bridge to RenderPipeline/render. Dropped vs source: lil-gui (-> PANELFLOW), window-sized canvas (-> container/canvas), global listeners (-> canvas-scoped). Deviation: forceRadius/forceStrength/colorStrength are uniforms (source baked them as constants, so its sliders were inert). Requires WebGPU; heavy at 512² — mount one instance. Bridge id "tsl-fluid".',
  reuseNotes:
    'Flagship compute-fluid background/hero. Built from the extracted cores (each registered standalone); the Lab keeps its own modules/ snapshot so it stays copy-pasteable (Lab Capsule Standard). Complements the fragment-pass webgpu-fluid-sim — this is the native TSL compute-shader approach.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default tslFluidLabModule;
