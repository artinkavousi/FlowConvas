import type { ArtinosModule } from '../../../registry/types';
import TslFxaaShowcase from './TslFxaa.showcase';

const tslFxaaMeta: ArtinosModule = {
  id: 'tsl-fxaa',
  name: 'TSL FXAA',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL FXAA fast approximate anti-aliasing built on the node-based FXAANode. A cheap single-pass edge smoothing for the scene colour. No tunables.',
  tags: ['webgpu', 'tsl', 'postfx', 'fxaa', 'antialiasing', 'three', 'node'],
  schema: {
    id: 'tsl-fxaa',
    name: 'TSL FXAA',
    category: 'rendering/postfx',
    parameters: [
      { key: 'spin', label: 'Spin', type: 'number', default: 1, min: 0, max: 3, step: 0.1, group: 'Demo' },
    ],
  },
  preview: TslFxaaShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/FXAANode.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage: "import { fxaa } from './modules/tsl/display/FXAANode.js';\nimport { pass } from 'three/tsl';\npostProcessing.outputNode = fxaa(pass(scene, camera));",
  presets: { On: { spin: 1 } },
  related: ['tsl-bloom-node', 'tsl-chromatic-aberration'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-fxaa'. createTslFxaaScene(canvas, params) -> { renderer, scene, camera, mesh, update(p), resize(w,h), renderFrame(), dispose() } (shared _tslPostHarness scene). Drive with renderer.setAnimationLoop(() => renderFrame()). fxaa(node): single colour input, no params. Vendored verbatim from three.js r185 examples/jsm/tsl/display/FXAANode.js (WebGPU only).",
  reuseNotes: 'Chain after the scene pass in any WebGPU PostProcessing stack by combining output nodes.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslFxaaMeta;
