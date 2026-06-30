import type { ArtinosModule } from '../../../registry/types';
import TslDotScreenShowcase from './TslDotScreen.showcase';

const tslDotScreenMeta: ArtinosModule = {
  id: 'tsl-dot-screen',
  name: 'TSL Dot Screen (Node)',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL halftone dot-screen post-process built on the node-based DotScreenNode. Rasterizes the scene into angled dots of varying size for a print or comic look. Angle and scale are live uniforms.',
  tags: ['webgpu', 'tsl', 'postfx', 'dot-screen', 'halftone', 'three', 'node'],
  schema: {
    id: 'tsl-dot-screen',
    name: 'TSL Dot Screen (Node)',
    category: 'rendering/postfx',
    parameters: [
      { key: 'angle', label: 'Angle', type: 'number', default: 1.57, min: 0, max: 6.28, step: 0.01, group: 'Dot Screen' },
      { key: 'scale', label: 'Scale', type: 'number', default: 0.8, min: 0.2, max: 3, step: 0.05, group: 'Dot Screen' },
    ],
  },
  preview: TslDotScreenShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/DotScreenNode.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage: "import { dotScreen } from './modules/tsl/display/DotScreenNode.js';\nimport { pass } from 'three/tsl';\npostProcessing.outputNode = dotScreen(pass(scene, camera), 1.57, 0.8);",
  presets: { Fine: { angle: 1.57, scale: 0.4 }, Coarse: { angle: 0.7, scale: 2.0 } },
  related: ['tsl-bloom-node', 'tsl-chromatic-aberration'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-dot-screen'. createTslDotScreenScene(canvas, params) -> { renderer, scene, camera, mesh, update(p), resize(w,h), renderFrame(), dispose() } (shared _tslPostHarness scene). Drive with renderer.setAnimationLoop(() => renderFrame()). dotScreen(node, angle, scale): the returned node exposes .angle/.scale TSL uniforms (set .value at runtime). Vendored verbatim from three.js r185 examples/jsm/tsl/display/DotScreenNode.js (WebGPU only).",
  reuseNotes: 'Chain after the scene pass in any WebGPU PostProcessing stack by combining output nodes.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslDotScreenMeta;
