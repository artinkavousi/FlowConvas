import type { ArtinosModule } from '../../../registry/types';
import TslFsr1Showcase from './TslFsr1.showcase';

const tslFsr1Meta: ArtinosModule = {
  id: 'tsl-fsr1',
  name: 'TSL FSR1 (RCAS)',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL FidelityFX Super Resolution 1 (RCAS sharpening stage) built on the node-based FSR1Node. Edge-adaptive robust sharpening; 0 = maximum, 2 = none. Live uniform.',
  tags: ['webgpu', 'tsl', 'postfx', 'fsr1', 'fidelityfx', 'sharpen', 'three', 'node'],
  schema: {
    id: 'tsl-fsr1',
    name: 'TSL FSR1 (RCAS)',
    category: 'rendering/postfx',
    parameters: [
      { key: 'sharpness', label: 'Sharpness', type: 'number', default: 0.2, min: 0, max: 2, step: 0.01, group: 'FSR1' },
    ],
  },
  preview: TslFsr1Showcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/FSR1Node.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage: "import { fsr1 } from './modules/tsl/display/FSR1Node.js';\nimport { pass, uniform } from 'three/tsl';\nconst s = uniform(0.2);\npostProcessing.outputNode = fsr1(pass(scene, camera), s, false);",
  presets: { Crisp: { sharpness: 0.1 }, Off: { sharpness: 2.0 } },
  related: ['tsl-bloom-node', 'tsl-chromatic-aberration'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-fsr1'. createTslFsr1Scene(canvas, params) -> { renderer, scene, camera, mesh, update(p), resize(w,h), renderFrame(), dispose() } (shared _tslPostHarness scene). Drive with renderer.setAnimationLoop(() => renderFrame()). fsr1(node, sharpness, denoise): pass a TSL uniform() as sharpness (0 = max, 2 = none). Vendored verbatim from three.js r185 examples/jsm/tsl/display/FSR1Node.js (WebGPU only).",
  reuseNotes: 'Chain after the scene pass in any WebGPU PostProcessing stack by combining output nodes.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslFsr1Meta;
