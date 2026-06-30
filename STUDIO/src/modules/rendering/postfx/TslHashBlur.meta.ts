import type { ArtinosModule } from '../../../registry/types';
import TslHashBlurShowcase from './TslHashBlur.showcase';

const tslHashBlurMeta: ArtinosModule = {
  id: 'tsl-hash-blur',
  name: 'TSL Hash Blur',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL hash-based stochastic blur built on the hashBlur TSL function. Cheap dithered blur driven by a single amount uniform; good for dreamy / frosted looks.',
  tags: ['webgpu', 'tsl', 'postfx', 'blur', 'hash-blur', 'three', 'node'],
  schema: {
    id: 'tsl-hash-blur',
    name: 'TSL Hash Blur',
    category: 'rendering/postfx',
    parameters: [
      { key: 'amount', label: 'Blur Amount', type: 'number', default: 0.1, min: 0, max: 0.5, step: 0.005, group: 'Hash Blur' },
    ],
  },
  preview: TslHashBlurShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/hashBlur.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage: "import { hashBlur } from './modules/tsl/display/hashBlur.js';\nimport { pass, uniform } from 'three/tsl';\nconst a = uniform(0.1);\npostProcessing.outputNode = hashBlur(pass(scene, camera), a);",
  presets: { Soft: { amount: 0.05 }, Heavy: { amount: 0.3 } },
  related: ['tsl-bloom-node', 'tsl-chromatic-aberration'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-hash-blur'. createTslHashBlurScene(canvas, params) -> { renderer, scene, camera, mesh, update(p), resize(w,h), renderFrame(), dispose() } (shared _tslPostHarness scene). Drive with renderer.setAnimationLoop(() => renderFrame()). hashBlur(textureNode, bluramount, options): pass a TSL uniform() as bluramount to tune at runtime. Vendored verbatim from three.js r185 examples/jsm/tsl/display/hashBlur.js (WebGPU only).",
  reuseNotes: 'Chain after the scene pass in any WebGPU PostProcessing stack by combining output nodes.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslHashBlurMeta;
