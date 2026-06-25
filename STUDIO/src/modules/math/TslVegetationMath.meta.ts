import type { ArtinosModule } from '../../registry/types';
import TslVegetationMathShowcase from './TslVegetationMath.showcase';

const tslVegetationMathMeta: ArtinosModule = {
  id: 'tsl-vegetation-math',
  name: 'TSL Vegetation Math',
  category: 'math',
  description:
    'Source-derived WebGPU/TSL math layer from False Earth: PCG hash seeds, FBM terrain height/normal helpers, wind strength/facing, Bezier blade curves, easing, slope alignment, and HSV shift for vegetation and organic GPU scenes.',
  tags: ['math', 'tsl', 'webgpu', 'vegetation', 'terrain', 'wind', 'hash', 'bezier', 'false-earth'],
  schema: {
    id: 'tsl-vegetation-math',
    name: 'TSL Vegetation Math',
    category: 'math',
    parameters: [
      { key: 'amplitude', label: 'Terrain Amplitude', type: 'number', default: 1.5, min: 0.1, max: 4, step: 0.1, group: 'Terrain' },
      { key: 'frequency', label: 'Terrain Frequency', type: 'number', default: 0.05, min: 0.005, max: 0.2, step: 0.005, group: 'Terrain' },
      { key: 'seed', label: 'Seed', type: 'number', default: 0, min: 0, max: 100, step: 0.1, group: 'Terrain' },
      { key: 'windStrength', label: 'Wind Strength', type: 'number', default: 4.5, min: 0, max: 10, step: 0.1, group: 'Wind' },
      { key: 'hueShift', label: 'Hue Shift', type: 'number', default: 0, min: 0, max: 1, step: 0.01, group: 'Color' },
    ],
  },
  preview: TslVegetationMathShowcase,
  sourcePath: 'STUDIO/src/modules/math/TslVegetationMath.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { getTerrainHeight, hash2to1, bezier3, shiftHSV } from './modules/math/TslVegetationMath.module.js';\nimport { uniform, vec2 } from 'three/tsl';\n\nconst heightFn = getTerrainHeight(uniform(1.5), uniform(0.05), uniform(0));\nconst h = heightFn(vec2(worldX, worldZ));",
  presets: {
    'False Earth': { amplitude: 1.5, frequency: 0.05, seed: 0, windStrength: 4.5, hueShift: 0 },
    'Low Hills': { amplitude: 0.8, frequency: 0.035, seed: 11, windStrength: 2.2, hueShift: 0.08 },
    'Alien Field': { amplitude: 2.4, frequency: 0.08, seed: 47, windStrength: 7, hueShift: 0.42 },
  },
  related: ['tsl-noise', 'tsl-hsv', 'tsl-infinite-terrain-field', 'tsl-gpu-grass-field'],
  agentNotes:
    'Canonical math utility extracted from False Earth commit 74cc91cb2764fbb75aee201d92752e4da37ad311 plus packages/three-core commit 61bde95d850c756e2a0d425b29fbd762e38a0c71. Exports source-derived TSL helpers for PCG hash, terrain height/normal, wind facing/strength, Bezier blade curves/tangents, easing, slope alignment, and HSV shift. WebGPU/TSL only; bridge id "tsl-vegetation-math". Use this under terrain/grass/rose/cosmic modules instead of duplicating source helper math.',
  reuseNotes:
    'Foundation for the False Earth Mode B conversion and future vegetation/organic GPU modules. The showcase renders terrain/wind/hash color bands to prove standalone reuse outside the full Lab.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default tslVegetationMathMeta;
