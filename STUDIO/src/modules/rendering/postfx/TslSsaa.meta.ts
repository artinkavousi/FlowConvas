import type { ArtinosModule } from '../../../registry/types';
import TslSsaaShowcase from './TslSsaa.showcase';

const tslSsaaMeta: ArtinosModule = {
  id: 'tsl-ssaa',
  name: 'TSL SSAA (Supersampling)',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL supersampled anti-aliasing built on the node-based SSAAPassNode. Jitters the camera and accumulates 2^sampleLevel samples for reference-quality edges. This pass renders the scene itself.',
  tags: ['webgpu', 'tsl', 'postfx', 'ssaa', 'antialiasing', 'supersampling', 'three', 'node'],
  schema: {
    id: 'tsl-ssaa',
    name: 'TSL SSAA (Supersampling)',
    category: 'rendering/postfx',
    parameters: [
      { key: 'sampleLevel', label: 'Sample Level', type: 'number', default: 4, min: 0, max: 5, step: 1, group: 'SSAA' },
    ],
  },
  preview: TslSsaaShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/SSAAPassNode.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage: "import { ssaaPass } from './modules/tsl/display/SSAAPassNode.js';\nconst aa = ssaaPass(scene, camera);\naa.sampleLevel = 4;\npostProcessing.outputNode = aa;",
  presets: { Fast: { sampleLevel: 2 }, Quality: { sampleLevel: 5 } },
  related: ['tsl-bloom-node', 'tsl-gtao'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-ssaa'. createTslSsaaScene(canvas, params) -> { renderer, scene, camera, mesh, update(p), resize(w,h), renderFrame(), dispose() } (shared _tslPostHarness scene). Drive with renderer.setAnimationLoop(() => renderFrame()). ssaaPass(scene, camera) renders the scene itself (replaces the scene pass). sampleLevel is a plain JS prop (2^level samples, 0..5) read each frame. Vendored verbatim from three.js r185 examples/jsm/tsl/display/SSAAPassNode.js (WebGPU only).",
  reuseNotes: 'Chain in any WebGPU PostProcessing stack; SSAA/retro own their scene render, denoise needs the scene-pass depth/normal MRT.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslSsaaMeta;
