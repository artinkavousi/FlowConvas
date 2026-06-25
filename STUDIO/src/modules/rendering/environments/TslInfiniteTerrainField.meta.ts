import type { ArtinosModule } from '../../../registry/types';
import TslInfiniteTerrainFieldShowcase from './TslInfiniteTerrainField.showcase';

const tslInfiniteTerrainFieldMeta: ArtinosModule = {
  id: 'tsl-infinite-terrain-field',
  name: 'TSL Infinite Terrain Field',
  category: 'rendering/environments',
  description:
    'False Earth terrain substrate as a reusable WebGPU/TSL module: grid-snapped procedural FBM terrain plane with source-derived terrain height/normal sampling, edge fade, camera framing, and live color/seed/amplitude controls.',
  tags: ['terrain', 'environment', 'webgpu', 'tsl', 'false-earth', 'grid-snapping', 'procedural', 'three'],
  schema: {
    id: 'tsl-infinite-terrain-field',
    name: 'TSL Infinite Terrain Field',
    category: 'rendering/environments',
    parameters: [
      { key: 'areaSize', label: 'Area Size', type: 'number', default: 80, min: 20, max: 180, step: 1, group: 'Terrain' },
      { key: 'segments', label: 'Segments', type: 'enum', default: 128, options: [{ label: '64', value: 64 }, { label: '128', value: 128 }, { label: '192', value: 192 }], group: 'Terrain' },
      { key: 'amplitude', label: 'Amplitude', type: 'number', default: 1.5, min: 0.1, max: 4, step: 0.1, group: 'Terrain' },
      { key: 'frequency', label: 'Frequency', type: 'number', default: 0.05, min: 0.005, max: 0.2, step: 0.005, group: 'Terrain' },
      { key: 'seed', label: 'Seed', type: 'number', default: 0, min: 0, max: 100, step: 0.1, group: 'Terrain' },
      { key: 'color', label: 'Base Color', type: 'color', default: '#020807', group: 'Color' },
      { key: 'rimColor', label: 'Rim Color', type: 'color', default: '#2dd4bf', group: 'Color' },
      { key: 'hueShift', label: 'Hue Shift', type: 'number', default: 0, min: 0, max: 1, step: 0.01, group: 'Color' },
      { key: 'snapEnabled', label: 'Snap Enabled', type: 'boolean', default: true, group: 'Grid' },
      { key: 'focusX', label: 'Focus X', type: 'number', default: 0, min: -80, max: 80, step: 0.1, group: 'Grid' },
      { key: 'focusZ', label: 'Focus Z', type: 'number', default: 0, min: -80, max: 80, step: 0.1, group: 'Grid' },
      { key: 'cameraHeight', label: 'Camera Height', type: 'number', default: 28, min: 8, max: 80, step: 1, group: 'Camera' },
      { key: 'cameraDistance', label: 'Camera Distance', type: 'number', default: 42, min: 12, max: 100, step: 1, group: 'Camera' },
      { key: 'pixelRatio', label: 'Pixel Ratio Cap', type: 'number', default: 1.5, min: 0.75, max: 2, step: 0.25, group: 'Performance' },
    ],
  },
  preview: TslInfiniteTerrainFieldShowcase,
  sourcePath: 'STUDIO/src/modules/rendering/environments/TslInfiniteTerrainField.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createTslInfiniteTerrainField } from './modules/rendering/environments/TslInfiniteTerrainField.module.js';\n\nconst terrain = createTslInfiniteTerrainField(canvas, { areaSize: 80, amplitude: 1.5 });\nterrain.update({ focusX: camera.position.x, focusZ: camera.position.z });\n// terrain.resize(); terrain.dispose();",
  presets: {
    'False Earth': { areaSize: 80, segments: 128, amplitude: 1.5, frequency: 0.05, seed: 0, color: '#020807', rimColor: '#2dd4bf' },
    'Quiet Surface': { areaSize: 80, segments: 128, amplitude: 0.7, frequency: 0.035, seed: 13, color: '#000000', rimColor: '#1d6b69' },
    'High Relief': { areaSize: 120, segments: 192, amplitude: 2.8, frequency: 0.08, seed: 36, color: '#030405', rimColor: '#8b5cf6' },
  },
  related: ['tsl-vegetation-math', 'adaptive-open-front-box-room', 'equirectangular-node-environment', 'tsl-gpu-grass-field'],
  agentNotes:
    'Canonical terrain module for the False Earth conversion. createTslInfiniteTerrainField(canvas, options) owns WebGPURenderer, scene/camera, a grid-snapped procedural terrain mesh, TSL height/normal nodes from tsl-vegetation-math, resize/update/dispose, and focusX/focusZ snapping. Provenance: False Earth commit 74cc91cb2764fbb75aee201d92752e4da37ad311 files Terrain.tsx, gridSnapping.ts, terrainHelpers.ts, uniforms.ts. Bridge id "tsl-infinite-terrain-field". WebGPU/TSL only.',
  reuseNotes:
    'Use as a procedural ground/environment substrate for vegetation, character, or particle Labs. The False Earth Lab will carry a snapshot and compose it with grass, roses, beams, and character navigation.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default tslInfiniteTerrainFieldMeta;
