import type { ArtinosModule } from '../../../registry/types';
import TslRetroShowcase from './TslRetro.showcase';

const tslRetroMeta: ArtinosModule = {
  id: 'tsl-retro',
  name: 'TSL Retro Pass',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL retro / low-fi pass built on the node-based RetroPassNode. Renders the scene with a reduced palette and dithering for an old-hardware aesthetic. This pass renders the scene itself.',
  tags: ['webgpu', 'tsl', 'postfx', 'retro', 'dither', 'palette', 'three', 'node'],
  schema: {
    id: 'tsl-retro',
    name: 'TSL Retro Pass',
    category: 'rendering/postfx',
    parameters: [
      { key: 'spin', label: 'Spin', type: 'number', default: 1, min: 0, max: 3, step: 0.1, group: 'Demo' },
    ],
  },
  preview: TslRetroShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/RetroPassNode.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage: "import { retroPass } from './modules/tsl/display/RetroPassNode.js';\npostProcessing.outputNode = retroPass(scene, camera);",
  presets: { On: { spin: 1 } },
  related: ['tsl-bloom-node', 'tsl-gtao'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-retro'. createTslRetroScene(canvas, params) -> { renderer, scene, camera, mesh, update(p), resize(w,h), renderFrame(), dispose() } (shared _tslPostHarness scene). Drive with renderer.setAnimationLoop(() => renderFrame()). retroPass(scene, camera, options) renders the scene itself (replaces the scene pass); options.affineDistortion accepts a node. Vendored verbatim from three.js r185 examples/jsm/tsl/display/RetroPassNode.js (WebGPU only).",
  reuseNotes: 'Chain in any WebGPU PostProcessing stack; SSAA/retro own their scene render, denoise needs the scene-pass depth/normal MRT.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslRetroMeta;
