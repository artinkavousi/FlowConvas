import type { ArtinosModule } from '../../../registry/types';
import TslBloomNodeShowcase from './TslBloomNode.showcase';

const tslBloomNodeMeta: ArtinosModule = {
  id: 'tsl-bloom-node',
  name: 'TSL Bloom (Node)',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL additive bloom post-process built on the node-based BloomNode. Wraps a scene pass with a selective, multi-mip bloom and exposes strength/radius/threshold. Use as the canonical glow pass for emissive WebGPU scenes — lighter and more composable than the legacy EffectComposer bloom.',
  tags: ['webgpu', 'tsl', 'postfx', 'bloom', 'glow', 'three', 'node'],
  schema: {
    id: 'tsl-bloom-node',
    name: 'TSL Bloom (Node)',
    category: 'rendering/postfx',
    parameters: [
      { key: 'strength', label: 'Strength', type: 'number', default: 0.9, min: 0, max: 3, step: 0.05, group: 'Bloom' },
      { key: 'radius', label: 'Radius', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, group: 'Bloom' },
      { key: 'threshold', label: 'Threshold', type: 'number', default: 0.0, min: 0, max: 1, step: 0.01, group: 'Bloom' },
      { key: 'emissive', label: 'Emissive', type: 'number', default: 2.4, min: 0, max: 6, step: 0.1, group: 'Demo' },
    ],
  },
  preview: TslBloomNodeShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/BloomNode.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createTslBloomScene } from './modules/rendering/postfx/TslBloomNode.module.js';\n// or use the raw node directly:\nimport { pass } from 'three/tsl';\nimport { bloom } from './modules/tsl/display/BloomNode.js';\nconst scenePass = pass(scene, camera);\nconst color = scenePass.getTextureNode('output');\npostProcessing.outputNode = color.add(bloom(color, 0.9, 0.5, 0.0));",
  presets: {
    Subtle: { strength: 0.4, radius: 0.3, threshold: 0.2, emissive: 1.6 },
    Dreamy: { strength: 1.4, radius: 0.8, threshold: 0.0, emissive: 3.2 },
  },
  related: ['webgpu-bloom-composer', 'tsl-chromatic-aberration'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-bloom-node'. createTslBloomScene(canvas, params) -> { renderer, scene, camera, bloomPass, update(p), resize(w,h), renderFrame(), dispose() }. Drive the loop with renderer.setAnimationLoop(() => renderFrame()). To reuse the effect alone, call bloom(colorTextureNode, strength, radius, threshold) from modules/tsl/display/BloomNode.js and add it to your pass output node; mutate bloomPass.strength/radius/threshold .value at runtime. Vendored verbatim from three.js r185 examples/jsm/tsl/display/BloomNode.js (WebGPU only).",
  reuseNotes: 'Node bloom is the preferred glow pass for WebGPU; the legacy webgpu-bloom-composer remains for EffectComposer-style stacks.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslBloomNodeMeta;
