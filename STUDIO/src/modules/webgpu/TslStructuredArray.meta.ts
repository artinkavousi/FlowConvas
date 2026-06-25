import type { ArtinosModule } from '../../registry/types';
import TslStructuredArrayShowcase from './TslStructuredArray.showcase';

const tslStructuredArrayMeta: ArtinosModule = {
  id: 'tsl-structured-array',
  name: 'TSL Structured Array',
  category: 'webgpu',
  description:
    'Universal WebGPU/TSL GPGPU substrate: an alignment-aware, CPU-mirrored structured GPU buffer (struct-of-arrays) with atomic-member support and TSL element/get accessors. Any compute sim needing per-element structured data (particles, grid cells, agents) writes through this instead of hand-managing offsets/alignment.',
  tags: ['webgpu', 'tsl', 'gpgpu', 'compute', 'buffer', 'struct', 'three', 'particles'],
  schema: {
    id: 'tsl-structured-array',
    name: 'TSL Structured Array',
    category: 'webgpu',
    parameters: [
      { key: 'amplitude', label: 'Wave Amplitude', type: 'number', default: 0.25, min: 0, max: 1, step: 0.01, group: 'Demo' },
      { key: 'speed', label: 'Wave Speed', type: 'number', default: 1, min: 0, max: 5, step: 0.1, group: 'Demo' },
      { key: 'pointSize', label: 'Point Size (px)', type: 'number', default: 5, min: 1, max: 20, step: 0.5, group: 'Demo' },
    ],
  },
  preview: TslStructuredArrayShowcase,
  sourcePath: 'STUDIO/src/modules/webgpu/TslStructuredArray.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { StructuredArray } from './modules/webgpu/TslStructuredArray.module';\nimport { Fn, instanceIndex, vec3 } from 'three/tsl';\n\nconst particles = new StructuredArray({ position: 'vec3', velocity: 'vec3', mass: 'float' }, count, 'particles');\nparticles.setAtomic('mass', true); // optional\nconst kernel = Fn(() => {\n  particles.get(instanceIndex, 'position').assign(vec3(0));\n})().compute(count);\nawait renderer.computeAsync(kernel);",
  presets: {
    'Calm grid': { amplitude: 0.12, speed: 0.6, pointSize: 5 },
    'Big waves': { amplitude: 0.5, speed: 2, pointSize: 7 },
  },
  related: ['mls-mpm-solver', 'particle-renderer-system'],
  agentNotes:
    "Ported verbatim from ref/AURORA/src/PARTICLESYSTEM/physic/structuredarray.ts (logic identical; only TypeScript types removed so it lives as an untyped .module.js). new StructuredArray(layout, length, label) where layout maps name -> typeName ('float'|'vec2'|'vec3'|'vec4'|'int'|'uint'|'ivec*'|'uvec*'|'mat2'|'mat3'|'mat4') or { type, atomic }. It computes std140-style alignment and a vec4-aligned structSize. CPU side: set(index, name, value) (number | array | {x,y,z,w}). GPU side (TSL): element(index) -> struct node; get(index, name) -> member node you can .assign() in a compute Fn. setAtomic(name, true) flips a member to atomic (used by MLS-MPM grid scatter). .buffer is the underlying instancedArray (has .dispose()). Bridge id 'tsl-structured-array'. WebGPU-only.",
  reuseNotes:
    'The buffer that backs MLS-MPM particles + grid in AURORA. Reuse for any structured GPGPU sim (boids, cellular automata, springs). Pair with particle-renderer-system to draw it.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default tslStructuredArrayMeta;
