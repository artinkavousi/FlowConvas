import type { ArtinosModule } from '../../registry/types';
import TslPcgHashShowcase from './TslPcgHash.showcase';

const tslPcgHashMeta: ArtinosModule = {
  id: 'tsl-pcg-hash',
  name: 'TSL PCG Hash',
  category: 'math',
  description:
    'Universal TSL PCG integer hash — stable, tile-free pseudo-random with NO sin / NO mod. Maps integer lattice coords to deterministic [0,1) values (pcgHash / hash2to1 / hash2to2), so per-cell jitter and seeds stay stable as a world scrolls. Drop into any compute kernel or instanced material that needs stable per-cell randomness.',
  tags: ['math', 'tsl', 'hash', 'pcg', 'random', 'noise', 'webgpu', 'three'],
  schema: {
    id: 'tsl-pcg-hash',
    name: 'TSL PCG Hash',
    category: 'math',
    parameters: [
      { key: 'cells', label: 'Grid Cells', type: 'number', default: 48, min: 4, max: 256, step: 1, group: 'Hash' },
      { key: 'mono', label: 'Monochrome', type: 'boolean', default: false, group: 'Hash' },
    ],
  },
  preview: TslPcgHashShowcase,
  sourcePath: 'STUDIO/src/modules/math/TslPcgHash.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { hash2to1, hash2to2 } from './modules/math/TslPcgHash';\nimport { int } from 'three/tsl';\n\n// stable per-cell jitter (no sin/mod, no banding as the world scrolls)\nconst jitter = hash2to2(int(globalGridX), int(globalGridZ)); // vec2 in [0,1)\nconst seed = hash2to1(int(cellX), int(cellY));               // float in [0,1)",
  presets: {
    'Fine grid': { cells: 96, mono: false },
    'Coarse mono': { cells: 16, mono: true },
  },
  related: ['tsl-noise', 'tsl-voronoi-clump', 'tsl-grid-sampling'],
  agentNotes:
    "Ported verbatim from REF/false-earth grass/core/shaderHelpers.ts (PCG hash, lines 34–57); already method-chained TSL uint bit-ops, no operator rewrite. Exports three TSL Fns: pcgHash(u:int|uint)->float[0,1), hash2to1(x,y)->float, hash2to2(x,y)->vec2. Inputs are INTEGER lattice coords (wrap floats with int()/uint()). No uniforms, no sin/mod — stable and non-repeating, which is why it survives world scrolling where sin/fract hashes band. Bridge id 'tsl-pcg-hash'. WebGPU/TSL only. Pairs with tsl-voronoi-clump (clump cell ids) and grass/scatter jitter.",
  reuseNotes:
    'The stable-jitter primitive under the false-earth grass field. Reuse for any compute/instanced system needing per-cell randomness without sin/mod banding (scatter, Voronoi seeds, spawn offsets).',
  validation: { build: true, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslPcgHashMeta;
