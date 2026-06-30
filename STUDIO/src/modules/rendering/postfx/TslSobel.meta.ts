import type { ArtinosModule } from '../../../registry/types';
import TslSobelShowcase from './TslSobel.showcase';

const tslSobelMeta: ArtinosModule = {
  id: 'tsl-sobel',
  name: 'TSL Sobel Edge',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL Sobel edge-detection post-process built on the node-based SobelOperatorNode. Extracts luminance edges for outline / blueprint / toon looks. No tunables.',
  tags: ['webgpu', 'tsl', 'postfx', 'sobel', 'edge-detection', 'outline', 'three', 'node'],
  schema: {
    id: 'tsl-sobel',
    name: 'TSL Sobel Edge',
    category: 'rendering/postfx',
    parameters: [
      { key: 'spin', label: 'Spin', type: 'number', default: 1, min: 0, max: 3, step: 0.1, group: 'Demo' },
    ],
  },
  preview: TslSobelShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/SobelOperatorNode.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage: "import { sobel } from './modules/tsl/display/SobelOperatorNode.js';\nimport { pass } from 'three/tsl';\npostProcessing.outputNode = sobel(pass(scene, camera));",
  presets: { On: { spin: 1 } },
  related: ['tsl-bloom-node', 'tsl-chromatic-aberration'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-sobel'. createTslSobelScene(canvas, params) -> { renderer, scene, camera, mesh, update(p), resize(w,h), renderFrame(), dispose() } (shared _tslPostHarness scene). Drive with renderer.setAnimationLoop(() => renderFrame()). sobel(node): single colour input, no params. Vendored verbatim from three.js r185 examples/jsm/tsl/display/SobelOperatorNode.js (WebGPU only).",
  reuseNotes: 'Chain after the scene pass in any WebGPU PostProcessing stack by combining output nodes.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslSobelMeta;
