import type { ArtinosModule } from '../../../registry/types';
import TslStableFluids2DShowcase from './TslStableFluids2D.showcase';

const tslStableFluids2DMeta: ArtinosModule = {
  id: 'tsl-stable-fluids-2d',
  name: 'TSL Stable Fluids 2D',
  category: 'physics/fluid',
  description:
    'A 2D Eulerian (grid) Navier–Stokes "stable fluids" solver with RGB dye, written as native WebGPU/TSL compute kernels and built on the tsl-compute-field-2d + tsl-grid-sampling cores. Ports every kernel and the exact per-frame order from the TSL_Fluid CodePen: force/dye injection, semi-Lagrangian advection, Jacobi viscosity diffusion, vorticity confinement, divergence, Jacobi pressure solve, projection, slip boundaries, dye dissipation. The native compute-shader counterpart to the fragment-pass webgpu-fluid-sim.',
  tags: ['physics', 'fluid', 'navier-stokes', 'tsl', 'webgpu', 'compute', 'simulation', 'three'],
  schema: {
    id: 'tsl-stable-fluids-2d',
    name: 'TSL Stable Fluids 2D',
    category: 'physics/fluid',
    parameters: [
      { key: 'paused', label: 'Paused', type: 'boolean', default: false, group: 'Simulation' },
      { key: 'jacobiIterations', label: 'Quality (Iterations)', type: 'number', default: 20, min: 5, max: 50, step: 1, group: 'Simulation' },
      { key: 'viscosity', label: 'Viscosity', type: 'number', default: 0.0001, min: 0, max: 0.001, step: 0.00001, group: 'Dynamics' },
      { key: 'vorticity', label: 'Vorticity', type: 'number', default: 0.8, min: 0, max: 5, step: 0.1, group: 'Dynamics' },
      { key: 'dissipation', label: 'Dissipation', type: 'number', default: 0.995, min: 0.9, max: 1, step: 0.001, group: 'Dynamics' },
      { key: 'forceStrength', label: 'Force Strength', type: 'number', default: 2.0, min: 0, max: 20, step: 0.1, group: 'Interaction' },
      { key: 'colorStrength', label: 'Color Strength', type: 'number', default: 0.5, min: 0, max: 2, step: 0.05, group: 'Interaction' },
      { key: 'colorCycleSpeed', label: 'Color Speed', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, group: 'Appearance' },
      { key: 'bloomStrength', label: 'Bloom Strength', type: 'number', default: 0.5, min: 0, max: 2, step: 0.01, group: 'Post FX' },
    ],
  },
  preview: TslStableFluids2DShowcase,
  sourcePath: 'STUDIO/src/modules/physics/fluid/TslStableFluids2D.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createTslStableFluids2D } from './modules/physics/fluid/TslStableFluids2D.module.js';\n\nconst solver = createTslStableFluids2D({ gridSize: 512 });\nsolver.setPointer(x, y, vx, vy);     // normalized pointer, drives force + dye\nawait solver.step(renderer);          // one full Navier–Stokes step\n// display solver.fields.densityR/G/B via tsl-field-color-display; solver.dispose();",
  presets: {
    'CodePen Original': { viscosity: 0.0001, vorticity: 0.8, dissipation: 0.995, forceStrength: 2.0, colorStrength: 0.5 },
    'High Vorticity': { vorticity: 3.0 },
    'Thick Ink': { colorStrength: 1.0, dissipation: 0.999 },
  },
  related: ['tsl-compute-field-2d', 'tsl-grid-sampling', 'tsl-field-color-display', 'pointer-velocity-splat', 'tsl-fluid', 'webgpu-fluid-sim'],
  agentNotes:
    'Grid Navier–Stokes solver in TSL compute. createTslStableFluids2D(options) -> { settings, gridSize (uniform), gridSizeValue, fields:{densityR,densityG,densityB}, uniforms, step(renderer), setPointer(x,y,vx,vy), setParams(params), dispose() }. Built on tsl-compute-field-2d (storage) + tsl-grid-sampling (addressing). step() runs the verbatim source order: forces -> boundary -> advect velocity -> (viscosity Jacobi xN) -> vorticity field+confinement -> divergence -> clear+pressure Jacobi xN -> project -> dye advect. Pair with tsl-field-color-display to render fields and pointer-velocity-splat for input. Ported from CodePen pashafd/OPVGJav (REF/tsl-fluid). Deviation: forceRadius/forceStrength/colorStrength are uniforms (source baked them, sliders were inert) — same math, now live. Source pins three@0.176.0; STUDIO is three@0.184.0 (TSL compatible). Bridge id "tsl-stable-fluids-2d"; requires WebGPU; heavy at 512² (showcase uses 256²).',
  reuseNotes: 'The fluid-domain core. The faithful full experience is the tsl-fluid Lab; complements the fragment-pass webgpu-fluid-sim.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default tslStableFluids2DMeta;
