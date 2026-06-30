import type { ArtinosModule } from '../../../registry/types';
import TslRgbShiftShowcase from './TslRgbShift.showcase';

const tslRgbShiftMeta: ArtinosModule = {
  id: 'tsl-rgb-shift',
  name: 'TSL RGB Shift (Node)',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL RGB shift / colour-separation post-process built on the node-based RGBShiftNode. Offsets the red and blue channels along an angle for a glitch / VHS feel. Amount and angle are live uniforms.',
  tags: ['webgpu', 'tsl', 'postfx', 'rgb-shift', 'glitch', 'vhs', 'three', 'node'],
  schema: {
    id: 'tsl-rgb-shift',
    name: 'TSL RGB Shift (Node)',
    category: 'rendering/postfx',
    parameters: [
      { key: 'amount', label: 'Amount', type: 'number', default: 0.005, min: 0, max: 0.05, step: 0.001, group: 'RGB Shift' },
      { key: 'angle', label: 'Angle', type: 'number', default: 0.0, min: 0, max: 6.28, step: 0.01, group: 'RGB Shift' },
    ],
  },
  preview: TslRgbShiftShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/RGBShiftNode.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage: "import { rgbShift } from './modules/tsl/display/RGBShiftNode.js';\nimport { pass } from 'three/tsl';\npostProcessing.outputNode = rgbShift(pass(scene, camera), 0.005, 0.0);",
  presets: { Hint: { amount: 0.002 }, Broken: { amount: 0.03, angle: 1.0 } },
  related: ['tsl-bloom-node', 'tsl-chromatic-aberration'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-rgb-shift'. createTslRgbShiftScene(canvas, params) -> { renderer, scene, camera, mesh, update(p), resize(w,h), renderFrame(), dispose() } (shared _tslPostHarness scene). Drive with renderer.setAnimationLoop(() => renderFrame()). rgbShift(node, amount, angle): the returned node exposes .amount/.angle TSL uniforms (set .value at runtime). Vendored verbatim from three.js r185 examples/jsm/tsl/display/RGBShiftNode.js (WebGPU only).",
  reuseNotes: 'Chain after the scene pass in any WebGPU PostProcessing stack by combining output nodes.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslRgbShiftMeta;
