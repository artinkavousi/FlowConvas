import type { ArtinosModule } from '../../registry/types';
import TslIndirectDrawLodRouterShowcase from './TslIndirectDrawLodRouter.showcase';

const tslIndirectDrawLodRouterMeta: ArtinosModule = {
  id: 'tsl-indirect-draw-lod-router',
  name: 'TSL Indirect Draw LOD Router',
  category: 'webgpu',
  description:
    'False Earth-derived WebGPU/TSL substrate for GPU-side culling, atomic visible-index routing, and indirect draw counters across distance LOD bands. Built for grass, VAT foliage, crowds, particles, and other dense instanced systems.',
  tags: ['false-earth', 'webgpu', 'tsl', 'lod', 'indirect-draw', 'compute', 'instancing', 'grass', 'vat'],
  schema: {
    id: 'tsl-indirect-draw-lod-router',
    name: 'TSL Indirect Draw LOD Router',
    category: 'webgpu',
    parameters: [
      { key: 'focusX', label: 'Focus X', type: 'number', default: 1.5, min: -8, max: 8, step: 0.05, group: 'Focus' },
      { key: 'focusZ', label: 'Focus Z', type: 'number', default: -1.25, min: -8, max: 8, step: 0.05, group: 'Focus' },
      { key: 'groupX', label: 'Group X', type: 'number', default: 0, min: -4, max: 4, step: 0.05, group: 'Grid' },
      { key: 'groupZ', label: 'Group Z', type: 'number', default: 0, min: -4, max: 4, step: 0.05, group: 'Grid' },
      { key: 'areaRadius', label: 'Area Radius', type: 'number', default: 11.5, min: 4, max: 14, step: 0.25, group: 'Grid' },
      { key: 'jitter', label: 'Jitter', type: 'number', default: 0.85, min: 0, max: 1.5, step: 0.05, group: 'Routing' },
      { key: 'lodNoiseScale', label: 'LOD Noise', type: 'number', default: 0.55, min: 0, max: 2, step: 0.05, group: 'Routing' },
      { key: 'pointSize', label: 'Point Size', type: 'number', default: 3.2, min: 1, max: 8, step: 0.1, group: 'Render' },
    ],
  },
  preview: TslIndirectDrawLodRouterShowcase,
  sourcePath: 'STUDIO/src/modules/webgpu/TslIndirectDrawLodRouter.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createFalseEarthLodConfigs, createResetDrawBufferCompute, createDistanceLodRouter } from './modules/webgpu/TslIndirectDrawLodRouter.module';\n\nconst lodConfigs = createFalseEarthLodConfigs(instanceCount);\nconst reset = createResetDrawBufferCompute(lodConfigs);\nconst route = createDistanceLodRouter({ instanceCount, gridSize, spacing, areaRadius, lodConfigs, uniforms, outputPosition, outputColor, outputLod });\nawait renderer.computeAsync(reset);\nawait renderer.computeAsync(route);",
  presets: {
    'False Earth grass bands': { focusX: 1.5, focusZ: -1.25, groupX: 0, groupZ: 0, areaRadius: 11.5, jitter: 0.85, lodNoiseScale: 0.55, pointSize: 3.2 },
    'Hard transitions': { focusX: 0, focusZ: 0, groupX: 0, groupZ: 0, areaRadius: 10, jitter: 0.15, lodNoiseScale: 0, pointSize: 3.8 },
  },
  related: ['tsl-vegetation-math', 'tsl-infinite-terrain-field', 'tsl-structured-array'],
  agentNotes:
    'Mode B port from False Earth commit 74cc91c. Source-derived from grass/core/config.ts, grass/core/grassCompute.ts, grass/hooks/useGrassCompute.ts, and Rose VAT LOD compute. Preserves the source drawIndirectStructure format, atomic instanceCount reset, visible indices buffers, noisy distance routing chain, and default 15/5/2 segment LOD bands. The showcase renders routed instances as colored point bands while maintaining the same GPU-side routing buffers used by full indirect mesh draws.',
  reuseNotes:
    'Use this as the LOD/culling layer below dense WebGPU modules. Grass and VAT modules should consume lodConfigs.indices and lodConfigs.drawBuffer, then call geometry.setIndirect(lodConfig.drawBuffer) for each LOD mesh.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default tslIndirectDrawLodRouterMeta;
