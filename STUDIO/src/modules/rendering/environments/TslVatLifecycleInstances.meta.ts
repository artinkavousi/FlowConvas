import type { ArtinosModule } from '../../../registry/types';
import TslVatLifecycleInstancesShowcase from './TslVatLifecycleInstances.showcase';

const tslVatLifecycleInstancesMeta: ArtinosModule = {
  id: 'tsl-vat-lifecycle-instances',
  name: 'TSL VAT Lifecycle Instances',
  category: 'rendering/environments',
  description:
    'False Earth-derived WebGPU/TSL VAT instancing system for rose lifecycle animation: loads the real Rose GLB/VAT assets, maintains per-instance position/age/seed/frame/progress data, and reproduces source delay/grow/keep/die phase timing.',
  tags: ['false-earth', 'webgpu', 'tsl', 'vat', 'rose', 'instancing', 'lifecycle', 'vegetation'],
  schema: {
    id: 'tsl-vat-lifecycle-instances',
    name: 'TSL VAT Lifecycle Instances',
    category: 'rendering/environments',
    parameters: [
      { key: 'count', label: 'Count', type: 'number', default: 900, min: 100, max: 1800, step: 50, group: 'Instances' },
      { key: 'radius', label: 'Radius', type: 'number', default: 12, min: 2, max: 24, step: 0.25, group: 'Instances' },
      { key: 'scaleMin', label: 'Scale Min', type: 'number', default: 8, min: 0, max: 20, step: 0.25, group: 'Render' },
      { key: 'scaleMax', label: 'Scale Max', type: 'number', default: 20, min: 0, max: 24, step: 0.25, group: 'Render' },
      { key: 'growMin', label: 'Grow Min', type: 'number', default: 2, min: 0.1, max: 10, step: 0.1, group: 'Lifecycle' },
      { key: 'growMax', label: 'Grow Max', type: 'number', default: 5, min: 0.1, max: 10, step: 0.1, group: 'Lifecycle' },
      { key: 'keepMin', label: 'Keep Min', type: 'number', default: 2, min: 0.1, max: 10, step: 0.1, group: 'Lifecycle' },
      { key: 'keepMax', label: 'Keep Max', type: 'number', default: 5, min: 0.1, max: 10, step: 0.1, group: 'Lifecycle' },
      { key: 'dieMin', label: 'Die Min', type: 'number', default: 2, min: 0.1, max: 10, step: 0.1, group: 'Lifecycle' },
      { key: 'dieMax', label: 'Die Max', type: 'number', default: 5, min: 0.1, max: 10, step: 0.1, group: 'Lifecycle' },
      { key: 'amplitude', label: 'Terrain Amp', type: 'number', default: 1.35, min: 0, max: 4, step: 0.05, group: 'Terrain' },
      { key: 'frequency', label: 'Terrain Freq', type: 'number', default: 0.075, min: 0.01, max: 0.2, step: 0.005, group: 'Terrain' },
      { key: 'windStrength', label: 'Wind Strength', type: 'number', default: 0.45, min: 0, max: 2, step: 0.05, group: 'Wind' },
      { key: 'windSpeed', label: 'Wind Speed', type: 'number', default: 0.8, min: 0, max: 4, step: 0.05, group: 'Wind' },
      { key: 'petalHueShift', label: 'Petal Hue', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, group: 'Color' },
      { key: 'hueRandomness', label: 'Hue Random', type: 'number', default: 0.12, min: 0, max: 0.5, step: 0.01, group: 'Color' },
      { key: 'emissiveIntensity', label: 'Emissive', type: 'number', default: 0.4, min: 0, max: 2, step: 0.01, group: 'Color' },
      { key: 'fresnelIntensity', label: 'Fresnel', type: 'number', default: 0.22, min: 0, max: 1, step: 0.01, group: 'Color' },
      { key: 'cameraHeight', label: 'Camera Height', type: 'number', default: 18, min: 2, max: 36, step: 0.25, group: 'Camera' },
      { key: 'cameraDistance', label: 'Camera Distance', type: 'number', default: 34, min: 6, max: 72, step: 0.5, group: 'Camera' },
      { key: 'pixelRatio', label: 'Pixel Ratio', type: 'number', default: 1.5, min: 0.75, max: 2, step: 0.05, group: 'Render' },
    ],
  },
  preview: TslVatLifecycleInstancesShowcase,
  sourcePath: 'STUDIO/src/modules/rendering/environments/TslVatLifecycleInstances.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createTslVatLifecycleInstances } from './modules/rendering/environments/TslVatLifecycleInstances.module.js';\n\nconst roses = await createTslVatLifecycleInstances(canvas, { count: 900 });\nroses.update({ windStrength: 0.7, growMax: 4 });\nroses.resize();\nroses.dispose();",
  presets: {
    'False Earth roses': { count: 900, radius: 12, scaleMin: 8, scaleMax: 20, growMin: 2, growMax: 5, keepMin: 2, keepMax: 5, dieMin: 2, dieMax: 5 },
    'Slow bloom field': { count: 600, radius: 10, scaleMin: 6, scaleMax: 14, growMin: 4, growMax: 8, keepMin: 5, keepMax: 8, dieMin: 3, dieMax: 6 },
  },
  related: ['tsl-structured-array', 'tsl-indirect-draw-lod-router', 'tsl-vegetation-math', 'tsl-gpu-grass-field'],
  agentNotes:
    'Mode B canonical module from False Earth commit 74cc91c. It loads copied source assets from /labs/false-earth/vat and /labs/false-earth/textures/Rose, including Rose.glb, Rose_pos.exr, Rose_nrm.png, Rose_Petal_Diff.png, Rose_Outline.png, and Rose_Petal_Normal.png. Preserved source concepts: VAT metadata frameCount/textureWidth sampling, per-instance position/isActive/frame/age/seed/progress data, delay/grow/keep/die lifecycle phases from vatCompute.ts, seeded rotation, terrain height coupling, wind sway, petal hue/randomization, outline darkening, emissive wave, and fresnel glow. Current standalone preview also draws a lifecycle proxy field from the same phase timings because the raw VAT mesh path is not yet visually parity-verified in STUDIO. Bridge id is "tsl-vat-lifecycle-instances".',
  reuseNotes:
    'Use this for any animated instanced vegetation or lifecycle-driven VAT prop. False Earth Lab should pair it with cosmic beam hits for burst spawning; this standalone showcase loops the lifecycle continuously.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default tslVatLifecycleInstancesMeta;
