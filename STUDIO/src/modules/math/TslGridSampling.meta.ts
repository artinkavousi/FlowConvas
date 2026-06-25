import type { ArtinosModule } from '../../registry/types';
import TslGridSamplingShowcase from './TslGridSampling.showcase';

const tslGridSamplingMeta: ArtinosModule = {
  id: 'tsl-grid-sampling',
  name: 'TSL Grid Sampling',
  category: 'math',
  description:
    'Universal TSL grid/index math for 2D GPGPU fields: linear index <-> cell coords, clamped neighbour addressing, and bilinear sampling for semi-Lagrangian advection. The shared addressing layer every grid sim needs (fluids, reaction-diffusion, heat, cellular automata). Extracted from the TSL_Fluid CodePen.',
  tags: ['math', 'tsl', 'webgpu', 'grid', 'sampling', 'bilinear', 'three'],
  schema: {
    id: 'tsl-grid-sampling',
    name: 'TSL Grid Sampling',
    category: 'math',
    parameters: [
      { key: 'scale', label: 'Sample Scale', type: 'number', default: 1, min: 0.25, max: 4, step: 0.05, group: 'Demo' },
    ],
  },
  preview: TslGridSamplingShowcase,
  sourcePath: 'STUDIO/src/modules/math/TslGridSampling.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createGridSampling, cellCoord } from './modules/math/TslGridSampling.module.js';\n\nconst { getIdx, bilinearSample, coord } = createGridSampling(gridSizeUniform);\n// in a TSL Fn: const { x, y } = cellCoord(instanceIndex, gridSizeUniform);\n// const v = bilinearSample(field, px, py);",
  presets: {
    Native: { scale: 1 },
    Zoomed: { scale: 0.4 },
  },
  related: ['tsl-compute-field-2d', 'tsl-stable-fluids-2d'],
  agentNotes:
    'Pure TSL helpers. cellCoord(index, gridSize) -> {x,y} float cell coords. createGridSampling(gridSize) -> { getIdx(x,y) (clamped uint index), bilinearSample(field,x,y), coord(index) }. gridSize is a uniform(float). Used inside Fn compute kernels. Ported verbatim from CodePen pashafd/OPVGJav (REF/tsl-fluid getIdx/bilinearSample). Bridge id "tsl-grid-sampling"; showcase upscales a random low-res field via bilinearSample to prove standalone reuse. NOTE: if this stays thin in practice, fold into tsl-compute-field-2d (see plan Risk 5).',
  reuseNotes: 'Addressing/sampling layer shared across grid sims; consumed by tsl-stable-fluids-2d.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default tslGridSamplingMeta;
