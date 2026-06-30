import type { ArtinosModule } from '../../../registry/types';
import TslPixelationShowcase from './TslPixelation.showcase';

const tslPixelationMeta: ArtinosModule = {
  id: 'tsl-pixelation',
  name: 'TSL Pixelation Pass',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL pixelation pass built on the node-based PixelationPassNode. Renders the scene into chunky low-res pixels with optional normal/depth edge outlining for a crisp retro / pixel-art look. This pass owns its own scene render. pixelSize and edge strengths are live uniforms.',
  tags: ['webgpu', 'tsl', 'postfx', 'pixelation', 'pixel-art', 'retro', 'three', 'node'],
  schema: {
    id: 'tsl-pixelation',
    name: 'TSL Pixelation Pass',
    category: 'rendering/postfx',
    parameters: [
      { key: 'pixelSize', label: 'Pixel Size', type: 'number', default: 6, min: 1, max: 24, step: 1, group: 'Pixelation' },
      { key: 'normalEdge', label: 'Normal Edge', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, group: 'Pixelation' },
      { key: 'depthEdge', label: 'Depth Edge', type: 'number', default: 0.4, min: 0, max: 1, step: 0.01, group: 'Pixelation' },
    ],
  },
  preview: TslPixelationShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/PixelationPassNode.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage: "import { pixelationPass } from './modules/tsl/display/PixelationPassNode.js';\nimport { uniform } from 'three/tsl';\nconst pixelSize = uniform(6), nEdge = uniform(0.3), dEdge = uniform(0.4);\npostProcessing.outputNode = pixelationPass(scene, camera, pixelSize, nEdge, dEdge);",
  presets: { Chunky: { pixelSize: 12, normalEdge: 0.3, depthEdge: 0.4 }, Fine: { pixelSize: 3, normalEdge: 0.1, depthEdge: 0.2 } },
  related: ['tsl-bloom-node', 'tsl-chromatic-aberration'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-pixelation'. createTslPixelationScene(canvas, params) -> { renderer, scene, camera, mesh, update(p), resize(w,h), renderFrame(), dispose() } (shared _tslPostHarness scene). Drive with renderer.setAnimationLoop(() => renderFrame()). pixelationPass(scene, camera, pixelSize, normalEdgeStrength, depthEdgeStrength) renders the scene itself (replaces the scene pass). pixelSize accepts a number or a uniform() (read each resize); edge strengths are nodes. Vendored verbatim from three.js r185 examples/jsm/tsl/display/PixelationPassNode.js (WebGPU only).",
  reuseNotes: 'Chain in any WebGPU PostProcessing stack; GTAO/DoF need the scene pass depth/normal, pixelation owns its own render.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslPixelationMeta;
