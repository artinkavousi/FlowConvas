import type { ArtinosModule } from '../../../registry/types';
import TslBleachBypassShowcase from './TslBleachBypass.showcase';

const tslBleachBypassMeta: ArtinosModule = {
  id: 'tsl-bleach-bypass',
  name: 'TSL Bleach Bypass',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL bleach-bypass colour grade built on the node-based BleachBypass TSL function. Raises contrast and desaturates for a gritty, high-key film look. Opacity blends with the original.',
  tags: ['webgpu', 'tsl', 'postfx', 'bleach-bypass', 'color-grade', 'film', 'three', 'node'],
  schema: {
    id: 'tsl-bleach-bypass',
    name: 'TSL Bleach Bypass',
    category: 'rendering/postfx',
    parameters: [
      { key: 'opacity', label: 'Opacity', type: 'number', default: 1.0, min: 0, max: 1, step: 0.01, group: 'Bleach' },
    ],
  },
  preview: TslBleachBypassShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/BleachBypass.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage: "import { bleach } from './modules/tsl/display/BleachBypass.js';\nimport { pass, uniform } from 'three/tsl';\nconst o = uniform(1.0);\npostProcessing.outputNode = bleach(pass(scene, camera), o);",
  presets: { Subtle: { opacity: 0.4 }, Full: { opacity: 1.0 } },
  related: ['tsl-bloom-node', 'tsl-chromatic-aberration'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-bleach-bypass'. createTslBleachScene(canvas, params) -> { renderer, scene, camera, mesh, update(p), resize(w,h), renderFrame(), dispose() } (shared _tslPostHarness scene). Drive with renderer.setAnimationLoop(() => renderFrame()). bleach(color, opacity): pass a TSL uniform() as opacity to blend at runtime. Vendored verbatim from three.js r185 examples/jsm/tsl/display/BleachBypass.js (WebGPU only).",
  reuseNotes: 'Chain after the scene pass in any WebGPU PostProcessing stack by combining output nodes.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslBleachBypassMeta;
