import type { ArtinosModule } from '../../../registry/types';
import TslSharpenShowcase from './TslSharpen.showcase';

const tslSharpenMeta: ArtinosModule = {
  id: 'tsl-sharpen',
  name: 'TSL Sharpen (CAS)',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL contrast-adaptive sharpening built on the node-based SharpenNode. Recovers perceived detail; sharpness 0 = maximum, 2 = none. Live uniform.',
  tags: ['webgpu', 'tsl', 'postfx', 'sharpen', 'cas', 'detail', 'three', 'node'],
  schema: {
    id: 'tsl-sharpen',
    name: 'TSL Sharpen (CAS)',
    category: 'rendering/postfx',
    parameters: [
      { key: 'sharpness', label: 'Sharpness', type: 'number', default: 0.2, min: 0, max: 2, step: 0.01, group: 'Sharpen' },
    ],
  },
  preview: TslSharpenShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/SharpenNode.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage: "import { sharpen } from './modules/tsl/display/SharpenNode.js';\nimport { pass, uniform } from 'three/tsl';\nconst s = uniform(0.2);\npostProcessing.outputNode = sharpen(pass(scene, camera), s, false);",
  presets: { Crisp: { sharpness: 0.1 }, Off: { sharpness: 2.0 } },
  related: ['tsl-bloom-node', 'tsl-chromatic-aberration'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-sharpen'. createTslSharpenScene(canvas, params) -> { renderer, scene, camera, mesh, update(p), resize(w,h), renderFrame(), dispose() } (shared _tslPostHarness scene). Drive with renderer.setAnimationLoop(() => renderFrame()). sharpen(node, sharpness, denoise): pass a TSL uniform() as sharpness (0 = max sharpening, 2 = none). Vendored verbatim from three.js r185 examples/jsm/tsl/display/SharpenNode.js (WebGPU only).",
  reuseNotes: 'Chain after the scene pass in any WebGPU PostProcessing stack by combining output nodes.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslSharpenMeta;
