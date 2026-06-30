import type { ArtinosModule } from '../../registry/types';
import TslHeightFieldShowcase from './TslHeightField.showcase';

const tslHeightFieldMeta: ArtinosModule = {
  id: 'tsl-height-field',
  name: 'TSL Height Field',
  category: 'math',
  description:
    'Universal TSL procedural height field: FBM height (getTerrainHeight) + finite-difference surface normal (getTerrainNormal), plus an axis-angle vector rotation helper (rotateAxis). Sample it in a compute kernel or a positionNode to displace and shade any plane/instanced surface (terrain, scatter ground, displacement fields).',
  tags: ['math', 'tsl', 'terrain', 'fbm', 'heightfield', 'normal', 'webgpu', 'three'],
  schema: {
    id: 'tsl-height-field',
    name: 'TSL Height Field',
    category: 'math',
    parameters: [
      { key: 'amp', label: 'Amplitude', type: 'number', default: 1.5, min: 0, max: 8, step: 0.1, group: 'Terrain' },
      { key: 'freq', label: 'Frequency', type: 'number', default: 0.05, min: 0.005, max: 0.5, step: 0.005, group: 'Terrain' },
      { key: 'seed', label: 'Seed', type: 'number', default: 0, min: 0, max: 100, step: 1, group: 'Terrain' },
      { key: 'scale', label: 'View Scale', type: 'number', default: 40, min: 5, max: 160, step: 1, group: 'Preview' },
    ],
  },
  preview: TslHeightFieldShowcase,
  sourcePath: 'STUDIO/src/modules/math/TslHeightField.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { getTerrainHeight, getTerrainNormal, rotateAxis } from './modules/math/TslHeightField';\n\n// height & normal MUST share one height Fn instance\nconst hFn = getTerrainHeight(uAmp, uFreq, uSeed);\nconst nFn = getTerrainNormal(hFn);\nconst h = hFn(worldXZ);   // float\nconst n = nFn(worldXZ);   // vec3 unit normal (Y-up)",
  presets: {
    'Rolling hills': { amp: 1.5, freq: 0.05, seed: 0, scale: 40 },
    'Sharp ridges': { amp: 4, freq: 0.18, seed: 7, scale: 30 },
    'Gentle plains': { amp: 0.6, freq: 0.03, seed: 3, scale: 80 },
  },
  related: ['tsl-noise', 'tsl-pcg-hash', 'tsl-gpu-grass'],
  agentNotes:
    "Ported verbatim from REF/false-earth core/shaders/terrainHelpers.ts. Three exports: getTerrainHeight(amp,freq,seed)->Fn([xz:vec2])->float (FBM via mx_fractal_noise_float), getTerrainNormal(heightFn)->Fn([xz:vec2])->vec3 (finite-difference normal, distance-scaled epsilon, flat fallback (0,1,0)), and rotateAxis(v,axis,angle)->vec3 (Rodrigues). CRITICAL: height and normal must share ONE getTerrainHeight instance (pass the same hFn into getTerrainNormal). amp/freq/seed are float nodes/uniforms. Bridge id 'tsl-height-field'. WebGPU/TSL only.",
  reuseNotes:
    'The ground field sampled by the false-earth grass and rose systems (blades/flowers sit on this height and align to this normal). Reuse for any displaced/aligned surface or scatter system.',
  validation: { build: true, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslHeightFieldMeta;
