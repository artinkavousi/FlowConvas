import type { ArtinosModule } from '../../registry/types';
import TslWindFieldShowcase from './TslWindField.showcase';

const tslWindFieldMeta: ArtinosModule = {
  id: 'tsl-wind-field',
  name: 'TSL Wind Field',
  category: 'shaders',
  description:
    'Domain-reusable TSL wind field for foliage: a fractal-noise wind strength field over world XZ (animated by time), wind-facing yaw, and helpers that push/sway bezier-blade control points and tip vertices. Drop into any grass/foliage material for coherent, directional, gusting wind motion.',
  tags: ['shaders', 'tsl', 'wind', 'foliage', 'grass', 'noise', 'webgpu', 'three'],
  schema: {
    id: 'tsl-wind-field',
    name: 'TSL Wind Field',
    category: 'shaders',
    parameters: [
      { key: 'dirX', label: 'Wind Dir X', type: 'number', default: 1, min: -1, max: 1, step: 0.05, group: 'Wind' },
      { key: 'dirY', label: 'Wind Dir Z', type: 'number', default: -0.8, min: -1, max: 1, step: 0.05, group: 'Wind' },
      { key: 'scale', label: 'Field Scale', type: 'number', default: 0.1, min: 0.01, max: 0.6, step: 0.01, group: 'Wind' },
      { key: 'speed', label: 'Flow Speed', type: 'number', default: 0.35, min: 0, max: 2, step: 0.01, group: 'Wind' },
      { key: 'strength', label: 'Strength', type: 'number', default: 4.5, min: 0, max: 10, step: 0.1, group: 'Wind' },
      { key: 'view', label: 'View Scale', type: 'number', default: 60, min: 10, max: 200, step: 1, group: 'Preview' },
    ],
  },
  preview: TslWindFieldShowcase,
  sourcePath: 'STUDIO/src/modules/shaders/TslWindField.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { calculateWindStrength, applyWindFacingAndNormalize, getWindDirection, applyWindPush, applyWindSway, applyVertexSway } from './modules/shaders/TslWindField';\nimport { time } from 'three/tsl';\n\nconst w01 = calculateWindStrength(worldXZ, uWindDir, uWindScale, time, uWindSpeed, uWindStrength);\nconst getDir = getWindDirection(uWindDir);\nconst pushed = applyWindPush(getDir)(p1, p2, p3, w01, height); // bend bezier control points",
  presets: {
    'Calm breeze': { dirX: 1, dirY: -0.3, scale: 0.08, speed: 0.2, strength: 2 },
    'Storm gusts': { dirX: 0.8, dirY: -0.8, scale: 0.18, speed: 0.9, strength: 8 },
  },
  related: ['tsl-gpu-grass', 'tsl-vat-field', 'tsl-noise', 'tsl-height-field'],
  agentNotes:
    "Ported from REF/false-earth core/shaders/windHelpers.ts + grass/core/shaderHelpers.ts. Exports: calculateWindStrength(worldXZ, windDir:vec2, windScale, time, windSpeed, windStrength)->float (fractal field, remapped to [0,strength]); applyWindFacingAndNormalize(baseAngle, w01, windDir, windFacing)->float[0,1] (yaw toward wind); getWindDirection(uWindDir)->()->vec3; applyWindPush(getDir)->(p1,p2,p3,w,height)->{p1,p2,p3} (bend bezier control points, tip strongest); applyWindSway(getDir,uTime,freqMin,freqMax,strength)->(...) gusting low/high-freq sway; applyVertexSway(...)->tip-vertex offset; plus safeNormalize/normalizeAngle. DEVIATION: getWindDirection uses the local safeNormalize instead of the source's external safeNormalize2D (same 2D result) so the module is self-contained. windDir is a vec2 node/uniform; use the `time` node to animate. Bridge id 'tsl-wind-field'. WebGPU/TSL only.",
  reuseNotes:
    'The wind driving the false-earth grass and roses. Reuse the field + facing for any directional gusting motion; the push/sway helpers assume a bezier-blade control-point setup (p0..p3).',
  validation: { build: true, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslWindFieldMeta;
