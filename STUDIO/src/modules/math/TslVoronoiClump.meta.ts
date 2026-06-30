import type { ArtinosModule } from '../../registry/types';
import TslVoronoiClumpShowcase from './TslVoronoiClump.showcase';

const tslVoronoiClumpMeta: ArtinosModule = {
  id: 'tsl-voronoi-clump',
  name: 'TSL Voronoi Clump',
  category: 'math',
  description:
    'Universal TSL Voronoi (cellular F1/F2) clumping core. Over a 3x3 neighborhood of jittered cell points it returns nearest + second-nearest cell ids, a smooth center factor, and the vector toward the nearest cell center. Group instances into organic clumps (grass tufts, scatter clusters, mosaic patterns) and blend per-cell attributes by proximity.',
  tags: ['math', 'tsl', 'voronoi', 'cellular', 'clump', 'noise', 'webgpu', 'three'],
  schema: {
    id: 'tsl-voronoi-clump',
    name: 'TSL Voronoi Clump',
    category: 'math',
    parameters: [
      { key: 'grid', label: 'Grid Resolution', type: 'number', default: 64, min: 8, max: 256, step: 1, group: 'Preview' },
      { key: 'cellSize', label: 'Cell Size', type: 'number', default: 8, min: 2, max: 40, step: 1, group: 'Voronoi' },
      { key: 'smoothness', label: 'Center Smoothness', type: 'number', default: 0.2, min: 0.01, max: 0.6, step: 0.01, group: 'Voronoi' },
    ],
  },
  preview: TslVoronoiClumpShowcase,
  sourcePath: 'STUDIO/src/modules/math/TslVoronoiClump.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createVoronoiClump } from './modules/math/TslVoronoiClump';\nimport { hash2to2 } from './modules/math/TslPcgHash';\n\nconst clump = createVoronoiClump(hash2to2, uCellSize, uSmoothness, uClumpSize);\nconst { bestID, secondBestID, centerFactor, toCenter } = clump(gridX, gridZ);\n// blend a per-cell attribute toward the nearest clump by centerFactor",
  presets: {
    'Tight clumps': { grid: 96, cellSize: 6, smoothness: 0.12 },
    'Loose clumps': { grid: 48, cellSize: 16, smoothness: 0.35 },
  },
  related: ['tsl-pcg-hash', 'tsl-gpu-grass', 'tsl-noise'],
  agentNotes:
    "Ported from REF/false-earth grass/core/grassCompute.ts getClumpInfo (generalized from inline to a factory). createVoronoiClump(hash2to2, cellSize, smoothness, toCenterScale) -> clump(gx:int, gz:int) -> { bestID:vec2, secondBestID:vec2, centerFactor:float[0,1], toCenter:vec2 }. Inject a stable hash (tsl-pcg-hash hash2to2) for cell jitter — do NOT use a sin/fract hash or clumps band. centerFactor = smoothstep(0, smoothness, F2-F1): ~1 at cell centers, ~0 at borders; use it to blend nearest vs second-nearest cell attributes. toCenter points from the sample toward its clump center (scaled by toCenterScale) — false-earth uses it to yaw blades inward. Bridge id 'tsl-voronoi-clump'. WebGPU/TSL only.",
  reuseNotes:
    'The clumping that gives the false-earth grass its tufted, non-uniform look. Reuse for any instanced grouping/mosaic/cellular blend driven by stable cell ids.',
  validation: { build: true, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslVoronoiClumpMeta;
