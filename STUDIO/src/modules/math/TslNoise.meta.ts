import type { ArtinosModule } from '../../registry/types';
import TslNoiseShowcase from './TslNoise.showcase';

const tslNoiseMeta: ArtinosModule = {
  id: 'tsl-noise',
  name: 'TSL Noise',
  category: 'math',
  description:
    'Universal TSL noise primitives: triangle-wave + fractal 3D vector/scalar noise (triNoise3Dvec / triNoise3D) for GPU shaders and compute kernels, animated by a time input. Drop into any colorNode/positionNode or compute Fn that needs organic motion (advection, displacement, flow fields).',
  tags: ['math', 'tsl', 'noise', 'fractal', 'webgpu', 'three', 'flow'],
  schema: {
    id: 'tsl-noise',
    name: 'TSL Noise',
    category: 'math',
    parameters: [
      { key: 'scale', label: 'Scale', type: 'number', default: 3, min: 0.5, max: 12, step: 0.1, group: 'Noise' },
      { key: 'speed', label: 'Speed', type: 'number', default: 1, min: 0, max: 4, step: 0.05, group: 'Noise' },
      { key: 'gain', label: 'Gain', type: 'number', default: 1.5, min: 0.2, max: 4, step: 0.1, group: 'Noise' },
    ],
  },
  preview: TslNoiseShowcase,
  sourcePath: 'STUDIO/src/modules/math/TslNoise.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { triNoise3Dvec, triNoise3D } from './modules/math/TslNoise.module';\nimport { vec3, time, float } from 'three/tsl';\n\n// vec3 flow: advect a position\nconst flow = triNoise3Dvec(positionLocal, float(1.0), time);\n// scalar displacement\nconst d = triNoise3D(positionLocal, time);",
  presets: {
    'Fine': { scale: 6, speed: 1, gain: 1.2 },
    'Coarse drift': { scale: 1.5, speed: 0.4, gain: 2 },
  },
  related: ['tsl-hsv', 'mls-mpm-solver'],
  agentNotes:
    "Ported verbatim from ref/AURORA/src/PARTICLESYSTEM/physic/noise.ts (already method-chained TSL, no operator rewrite). Exports two TSL Fns with setLayout: triNoise3Dvec(position:vec3, speed:float, time:float)->vec3 (4-octave fractal of a triangle-wave noise) and triNoise3D(position:vec3, time:float)->float (the .x of the vec version at speed 1). Use the `time` node from three/tsl to animate. Internal tri/trivec/tri3 helpers are private. Bridge id 'tsl-noise'. WebGPU/TSL only.",
  reuseNotes:
    'The exact noise driving MLS-MPM particle motion in AURORA. Reusable for any TSL displacement/flow/turbulence. Pairs with tsl-hsv / tsl-colormap-palette for colored fields.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default tslNoiseMeta;
