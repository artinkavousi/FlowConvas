import type { ArtinosModule } from '../../registry/types';
import TslComputeField2DShowcase from './TslComputeField2D.showcase';

const tslComputeField2DMeta: ArtinosModule = {
  id: 'tsl-compute-field-2d',
  name: 'TSL Compute Field 2D',
  category: 'webgpu',
  description:
    'Universal WebGPU/TSL GPGPU substrate: a 2D grid of named float storage fields (each an instancedArray with PBO) plus a compute-dispatch helper. The reusable base for any grid simulation — reaction-diffusion, smoke, heat, cellular automata, erosion. Extracted from the TSL_Fluid CodePen field machinery.',
  tags: ['webgpu', 'tsl', 'gpgpu', 'compute', 'simulation', 'field', 'three'],
  schema: {
    id: 'tsl-compute-field-2d',
    name: 'TSL Compute Field 2D',
    category: 'webgpu',
    parameters: [
      { key: 'frequency', label: 'Ripple Frequency', type: 'number', default: 40, min: 4, max: 120, step: 1, group: 'Demo' },
      { key: 'speed', label: 'Ripple Speed', type: 'number', default: 2, min: 0, max: 8, step: 0.1, group: 'Demo' },
    ],
  },
  preview: TslComputeField2DShowcase,
  sourcePath: 'STUDIO/src/modules/webgpu/TslComputeField2D.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createTslComputeField2D } from './modules/webgpu/TslComputeField2D.module.js';\n\nconst field = createTslComputeField2D({ width: 512, height: 512 });\nconst val = field.make('val');           // instancedArray float field (PBO on)\nawait field.dispatch(renderer, kernel);  // kernel = Fn(...)().compute(field.count)\nfield.dispose();",
  presets: {
    Calm: { frequency: 20, speed: 1 },
    Energetic: { frequency: 80, speed: 5 },
  },
  related: ['tsl-grid-sampling', 'tsl-stable-fluids-2d', 'tsl-field-color-display'],
  agentNotes:
    'Universal GPGPU field substrate. createTslComputeField2D({width,height}) -> { count, fields, make(name), makeMany(names), get(name), dispatch(renderer, computeNode), dispose() }. Each make() returns a three/tsl instancedArray(Float32Array(count),"float") with setPBO(true). Build compute kernels with Fn(()=>{...})().compute(count) and run via dispatch (renderer.computeAsync). Scene-agnostic — pair with tsl-grid-sampling for addressing and tsl-field-color-display to view. Ported from CodePen pashafd/OPVGJav (REF/tsl-fluid). Bridge id "tsl-compute-field-2d"; showcase runs a non-fluid ripple kernel to prove standalone reuse. Requires WebGPU.',
  reuseNotes: 'Base layer for any 2D grid sim; the fluid solver (tsl-stable-fluids-2d) is one consumer.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default tslComputeField2DMeta;
