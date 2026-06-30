import type { ArtinosModule } from '../../../registry/types';
import TslSepiaShowcase from './TslSepia.showcase';

const tslSepiaMeta: ArtinosModule = {
  id: 'tsl-sepia',
  name: 'TSL Sepia',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL sepia tone colour grade built on the node-based Sepia TSL function. Warm monochrome vintage look applied to the scene colour.',
  tags: ['webgpu', 'tsl', 'postfx', 'sepia', 'color-grade', 'vintage', 'three', 'node'],
  schema: {
    id: 'tsl-sepia',
    name: 'TSL Sepia',
    category: 'rendering/postfx',
    parameters: [
      { key: 'spin', label: 'Spin', type: 'number', default: 1, min: 0, max: 3, step: 0.1, group: 'Demo' },
    ],
  },
  preview: TslSepiaShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/Sepia.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage: "import { sepia } from './modules/tsl/display/Sepia.js';\nimport { pass } from 'three/tsl';\npostProcessing.outputNode = sepia(pass(scene, camera));",
  presets: { On: { spin: 1 } },
  related: ['tsl-bloom-node', 'tsl-chromatic-aberration'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-sepia'. createTslSepiaScene(canvas, params) -> { renderer, scene, camera, mesh, update(p), resize(w,h), renderFrame(), dispose() } (shared _tslPostHarness scene). Drive with renderer.setAnimationLoop(() => renderFrame()). sepia(color): TSL Fn taking a colour node. Vendored verbatim from three.js r185 examples/jsm/tsl/display/Sepia.js (WebGPU only).",
  reuseNotes: 'Chain after the scene pass in any WebGPU PostProcessing stack by combining output nodes.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslSepiaMeta;
