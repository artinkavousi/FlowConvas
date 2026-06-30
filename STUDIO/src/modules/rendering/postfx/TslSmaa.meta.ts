import type { ArtinosModule } from '../../../registry/types';
import TslSmaaShowcase from './TslSmaa.showcase';

const tslSmaaMeta: ArtinosModule = {
  id: 'tsl-smaa',
  name: 'TSL SMAA',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL SMAA subpixel morphological anti-aliasing built on the node-based SMAANode. Higher quality edge AA than FXAA. No tunables.',
  tags: ['webgpu', 'tsl', 'postfx', 'smaa', 'antialiasing', 'three', 'node'],
  schema: {
    id: 'tsl-smaa',
    name: 'TSL SMAA',
    category: 'rendering/postfx',
    parameters: [
      { key: 'spin', label: 'Spin', type: 'number', default: 1, min: 0, max: 3, step: 0.1, group: 'Demo' },
    ],
  },
  preview: TslSmaaShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/SMAANode.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage: "import { smaa } from './modules/tsl/display/SMAANode.js';\nimport { pass } from 'three/tsl';\npostProcessing.outputNode = smaa(pass(scene, camera));",
  presets: { On: { spin: 1 } },
  related: ['tsl-bloom-node', 'tsl-chromatic-aberration'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-smaa'. createTslSmaaScene(canvas, params) -> { renderer, scene, camera, mesh, update(p), resize(w,h), renderFrame(), dispose() } (shared _tslPostHarness scene). Drive with renderer.setAnimationLoop(() => renderFrame()). smaa(node): single colour input, no params. Vendored verbatim from three.js r185 examples/jsm/tsl/display/SMAANode.js (WebGPU only).",
  reuseNotes: 'Chain after the scene pass in any WebGPU PostProcessing stack by combining output nodes.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslSmaaMeta;
