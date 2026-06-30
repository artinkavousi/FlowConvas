import type { ArtinosModule } from '../../../registry/types';
import TslAfterImageShowcase from './TslAfterImage.showcase';

const tslAfterImageMeta: ArtinosModule = {
  id: 'tsl-after-image',
  name: 'TSL After Image (Node)',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL after-image / motion-trail post-process built on the node-based AfterImageNode. Blends each frame with a damped history buffer so moving geometry leaves fading trails. Damp is a live uniform.',
  tags: ['webgpu', 'tsl', 'postfx', 'after-image', 'trail', 'feedback', 'three', 'node'],
  schema: {
    id: 'tsl-after-image',
    name: 'TSL After Image (Node)',
    category: 'rendering/postfx',
    parameters: [
      { key: 'damp', label: 'Damp', type: 'number', default: 0.96, min: 0, max: 0.99, step: 0.005, group: 'After Image' },
      { key: 'spin', label: 'Spin', type: 'number', default: 1.6, min: 0, max: 4, step: 0.1, group: 'Demo' },
    ],
  },
  preview: TslAfterImageShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/AfterImageNode.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage: "import { afterImage } from './modules/tsl/display/AfterImageNode.js';\nimport { pass, uniform } from 'three/tsl';\nconst damp = uniform(0.96);\npostProcessing.outputNode = afterImage(pass(scene, camera), damp);",
  presets: { Short: { damp: 0.85, spin: 1.6 }, Long: { damp: 0.98, spin: 2.4 } },
  related: ['tsl-bloom-node', 'tsl-chromatic-aberration'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-after-image'. createTslAfterImageScene(canvas, params) -> { renderer, scene, camera, mesh, update(p), resize(w,h), renderFrame(), dispose() } (shared _tslPostHarness scene). Drive with renderer.setAnimationLoop(() => renderFrame()). afterImage(node, damp): pass a TSL uniform() as damp to tune trail length at runtime (higher = longer trails). Vendored verbatim from three.js r185 examples/jsm/tsl/display/AfterImageNode.js (WebGPU only).",
  reuseNotes: 'Chain after the scene pass in any WebGPU PostProcessing stack by combining output nodes.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslAfterImageMeta;
