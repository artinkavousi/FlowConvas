import type { ArtinosModule } from '../../../registry/types';
import TslGpuGrassFieldShowcase from './TslGpuGrassField.showcase';

const tslGpuGrassFieldMeta: ArtinosModule = {
  id: 'tsl-gpu-grass-field',
  name: 'TSL GPU Grass Field',
  category: 'rendering/environments',
  description:
    'False Earth-derived WebGPU/TSL grass field with procedural blade geometry, PCG placement jitter, terrain-following height, per-blade width/height/bend variation, yaw, wind sway, and blade color ramping.',
  tags: ['false-earth', 'webgpu', 'tsl', 'grass', 'vegetation', 'terrain', 'wind', 'instancing'],
  schema: {
    id: 'tsl-gpu-grass-field',
    name: 'TSL GPU Grass Field',
    category: 'rendering/environments',
    parameters: [
      { key: 'bladesPerAxis', label: 'Blades Axis', type: 'number', default: 192, min: 48, max: 320, step: 8, group: 'Field' },
      { key: 'areaSize', label: 'Area Size', type: 'number', default: 30, min: 10, max: 56, step: 1, group: 'Field' },
      { key: 'segments', label: 'Blade Segments', type: 'number', default: 8, min: 2, max: 15, step: 1, group: 'Field' },
      { key: 'amplitude', label: 'Terrain Amp', type: 'number', default: 1.35, min: 0, max: 4, step: 0.05, group: 'Terrain' },
      { key: 'frequency', label: 'Terrain Freq', type: 'number', default: 0.075, min: 0.01, max: 0.2, step: 0.005, group: 'Terrain' },
      { key: 'seed', label: 'Terrain Seed', type: 'number', default: 0, min: -20, max: 20, step: 0.25, group: 'Terrain' },
      { key: 'bladeHeightMin', label: 'Height Min', type: 'number', default: 0.42, min: 0.05, max: 2, step: 0.01, group: 'Blade' },
      { key: 'bladeHeightMax', label: 'Height Max', type: 'number', default: 1.45, min: 0.2, max: 3.5, step: 0.01, group: 'Blade' },
      { key: 'bladeWidthMin', label: 'Width Min', type: 'number', default: 0.035, min: 0.005, max: 0.2, step: 0.005, group: 'Blade' },
      { key: 'bladeWidthMax', label: 'Width Max', type: 'number', default: 0.105, min: 0.01, max: 0.35, step: 0.005, group: 'Blade' },
      { key: 'bendAmount', label: 'Bend', type: 'number', default: 0.34, min: 0, max: 1.2, step: 0.01, group: 'Blade' },
      { key: 'yawRandomness', label: 'Yaw Random', type: 'number', default: 1, min: 0, max: 2, step: 0.05, group: 'Blade' },
      { key: 'jitter', label: 'Jitter', type: 'number', default: 0.9, min: 0, max: 1.5, step: 0.05, group: 'Blade' },
      { key: 'windStrength', label: 'Wind Strength', type: 'number', default: 0.55, min: 0, max: 2, step: 0.05, group: 'Wind' },
      { key: 'windSpeed', label: 'Wind Speed', type: 'number', default: 1.15, min: 0, max: 4, step: 0.05, group: 'Wind' },
      { key: 'windScale', label: 'Wind Scale', type: 'number', default: 0.18, min: 0.01, max: 0.5, step: 0.01, group: 'Wind' },
      { key: 'windDirX', label: 'Wind X', type: 'number', default: 0.72, min: -1, max: 1, step: 0.05, group: 'Wind' },
      { key: 'windDirZ', label: 'Wind Z', type: 'number', default: 0.42, min: -1, max: 1, step: 0.05, group: 'Wind' },
      { key: 'baseColor', label: 'Base Color', type: 'color', default: '#071511', group: 'Color' },
      { key: 'tipColor', label: 'Tip Color', type: 'color', default: '#4fbf7c', group: 'Color' },
      { key: 'rimColor', label: 'Rim Color', type: 'color', default: '#20e0c5', group: 'Color' },
      { key: 'hueShift', label: 'Hue Shift', type: 'number', default: 0, min: -0.5, max: 0.5, step: 0.01, group: 'Color' },
      { key: 'cameraHeight', label: 'Camera Height', type: 'number', default: 10.5, min: 3, max: 22, step: 0.25, group: 'Camera' },
      { key: 'cameraDistance', label: 'Camera Distance', type: 'number', default: 19, min: 7, max: 42, step: 0.5, group: 'Camera' },
      { key: 'pixelRatio', label: 'Pixel Ratio', type: 'number', default: 1.5, min: 0.75, max: 2, step: 0.05, group: 'Render' },
    ],
  },
  preview: TslGpuGrassFieldShowcase,
  sourcePath: 'STUDIO/src/modules/rendering/environments/TslGpuGrassField.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createTslGpuGrassField } from './modules/rendering/environments/TslGpuGrassField.module';\n\nconst grass = createTslGpuGrassField(canvas, { bladesPerAxis: 192, windStrength: 0.55 });\ngrass.resize();\ngrass.update({ windSpeed: 1.4 });\ngrass.dispose();",
  presets: {
    'False Earth grass': { bladesPerAxis: 192, areaSize: 30, amplitude: 1.35, windStrength: 0.55, windSpeed: 1.15, baseColor: '#071511', tipColor: '#4fbf7c', rimColor: '#20e0c5' },
    'Low rolling meadow': { bladesPerAxis: 144, areaSize: 34, amplitude: 0.85, bladeHeightMax: 0.95, windStrength: 0.25, tipColor: '#6fc46d', rimColor: '#94ffd1' },
  },
  related: ['tsl-vegetation-math', 'tsl-infinite-terrain-field', 'tsl-indirect-draw-lod-router'],
  agentNotes:
    'Mode B canonical module derived from False Earth commit 74cc91c. Source lineage: GrassWebGPU.tsx, GrassLOD.tsx, grass/core/config.ts, grassGeometry.ts, grassCompute.ts, grassMaterial.ts, shaderHelpers.ts. This module keeps the source blade-plane geometry, PCG/hash jitter, terrain height coupling, width/height/bend randomization, yaw, wind wave sway, base/tip/rim color ramp, and WebGPU/TSL renderer lifecycle. It is intentionally compact for STUDIO and composes with the separate LOD router module instead of duplicating the full source R3F hook stack.',
  reuseNotes:
    'Use as the visible vegetation layer in False Earth Lab. The next integration step can swap the fixed mesh.count path to tsl-indirect-draw-lod-router draw buffers per LOD when the final Lab composition needs source-scale density.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default tslGpuGrassFieldMeta;
