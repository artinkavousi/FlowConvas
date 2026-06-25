import type { ArtinosModule } from '../../registry/types';
import TslHsvShowcase from './TslHsv.showcase';

const tslHsvMeta: ArtinosModule = {
  id: 'tsl-hsv',
  name: 'TSL HSV',
  category: 'math',
  description:
    'Universal TSL HSV→RGB color conversion (hsvtorgb) for GPU shaders/compute. Drive color by hue directly on the GPU — rainbow ramps, velocity/temperature → hue, audio-reactive palettes.',
  tags: ['math', 'tsl', 'color', 'hsv', 'rgb', 'webgpu', 'three'],
  schema: {
    id: 'tsl-hsv',
    name: 'TSL HSV',
    category: 'math',
    parameters: [
      { key: 'saturation', label: 'Saturation', type: 'number', default: 0.9, min: 0, max: 1, step: 0.01, group: 'HSV' },
      { key: 'value', label: 'Value', type: 'number', default: 1, min: 0, max: 1, step: 0.01, group: 'HSV' },
      { key: 'hueSpeed', label: 'Hue Speed', type: 'number', default: 0.1, min: 0, max: 1, step: 0.01, group: 'HSV' },
    ],
  },
  preview: TslHsvShowcase,
  sourcePath: 'STUDIO/src/modules/math/TslHsv.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { hsvtorgb } from './modules/math/TslHsv.module';\nimport { vec3 } from 'three/tsl';\n\nmaterial.colorNode = hsvtorgb(vec3(hue, 1.0, 1.0)); // hue in [0,1]",
  presets: {
    'Vivid': { saturation: 1, value: 1, hueSpeed: 0.15 },
    'Pastel': { saturation: 0.4, value: 1, hueSpeed: 0.05 },
  },
  related: ['tsl-colormap-palette', 'tsl-noise'],
  agentNotes:
    "Ported verbatim from ref/AURORA/src/PARTICLESYSTEM/physic/hsv.ts (already method-chained TSL, no operator rewrite). Single TSL Fn hsvtorgb(hsv:vec3)->vec3, where hsv = (hue[0,1] wrapped, saturation[0,1], value[0,1]). Standard 6-sector HSV using If/ElseIf on the integer hue sector; s<0.0001 returns gray. Bridge id 'tsl-hsv'. WebGPU/TSL only.",
  reuseNotes:
    'Used by AURORA particle color modes (velocity/density → hue). Reuse anywhere you need hue-driven GPU color. Pairs with tsl-noise and tsl-colormap-palette.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default tslHsvMeta;
