import type { ArtinosModule } from '../../../registry/types';
import TslChromaticAberrationShowcase from './TslChromaticAberration.showcase';

const tslChromaticAberrationMeta: ArtinosModule = {
  id: 'tsl-chromatic-aberration',
  name: 'TSL Chromatic Aberration (Node)',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL chromatic aberration post-process: radial RGB split from a center point with stepped scaling, for lens-fringe, glitch, or hyperspace looks. Built on the node-based ChromaticAberrationNode and driven by live strength/scale uniforms.',
  tags: ['webgpu', 'tsl', 'postfx', 'chromatic-aberration', 'glitch', 'lens', 'three', 'node'],
  schema: {
    id: 'tsl-chromatic-aberration',
    name: 'TSL Chromatic Aberration (Node)',
    category: 'rendering/postfx',
    parameters: [
      { key: 'strength', label: 'Strength', type: 'number', default: 1.0, min: 0, max: 6, step: 0.05, group: 'Aberration' },
      { key: 'scale', label: 'Scale', type: 'number', default: 1.1, min: 1, max: 1.5, step: 0.005, group: 'Aberration' },
    ],
  },
  preview: TslChromaticAberrationShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/ChromaticAberrationNode.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createTslChromaticAberrationScene } from './modules/rendering/postfx/TslChromaticAberration.module.js';\n// or use the raw node directly:\nimport { pass, uniform } from 'three/tsl';\nimport { chromaticAberration } from './modules/tsl/display/ChromaticAberrationNode.js';\nconst strength = uniform(1.0), scale = uniform(1.1);\npostProcessing.outputNode = chromaticAberration(pass(scene, camera), strength, null, scale);",
  presets: {
    Lens: { strength: 0.6, scale: 1.05 },
    Hyperspace: { strength: 4.0, scale: 1.35 },
  },
  related: ['tsl-bloom-node'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-chromatic-aberration'. createTslChromaticAberrationScene(canvas, params) -> { renderer, scene, camera, update(p), resize(w,h), renderFrame(), dispose() }. Drive with renderer.setAnimationLoop(() => renderFrame()). chromaticAberration(node, strength, center, scale): pass TSL uniform() nodes for strength/scale to mutate at runtime; center null = screen center. Vendored verbatim from three.js r185 examples/jsm/tsl/display/ChromaticAberrationNode.js (WebGPU only).",
  reuseNotes: 'Pairs after bloom in a postfx stack; combine by chaining output nodes.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslChromaticAberrationMeta;
