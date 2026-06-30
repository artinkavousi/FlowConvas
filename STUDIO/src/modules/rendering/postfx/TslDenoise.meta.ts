import type { ArtinosModule } from '../../../registry/types';
import TslDenoiseShowcase from './TslDenoise.showcase';

const tslDenoiseMeta: ArtinosModule = {
  id: 'tsl-denoise',
  name: 'TSL Denoise (Bilateral)',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL edge-aware bilateral denoiser built on the node-based DenoiseNode. Guided by scene depth + normals (via an MRT scene pass), it smooths noise while preserving edges — best on AO/GI/path-traced inputs. radius/lumaPhi/normalPhi are live uniforms.',
  tags: ['webgpu', 'tsl', 'postfx', 'denoise', 'bilateral', 'three', 'node'],
  schema: {
    id: 'tsl-denoise',
    name: 'TSL Denoise (Bilateral)',
    category: 'rendering/postfx',
    parameters: [
      { key: 'radius', label: 'Radius', type: 'number', default: 5, min: 1, max: 16, step: 1, group: 'Denoise' },
      { key: 'lumaPhi', label: 'Luma Phi', type: 'number', default: 5, min: 0.5, max: 20, step: 0.5, group: 'Denoise' },
      { key: 'normalPhi', label: 'Normal Phi', type: 'number', default: 5, min: 0.5, max: 20, step: 0.5, group: 'Denoise' },
    ],
  },
  preview: TslDenoiseShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/DenoiseNode.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage: "import { denoise } from './modules/tsl/display/DenoiseNode.js';\nimport { pass, mrt, output, normalView } from 'three/tsl';\nconst sp = pass(scene, camera);\nsp.setMRT(mrt({ output, normal: normalView }));\npostProcessing.outputNode = denoise(sp.getTextureNode('output'), sp.getTextureNode('depth'), sp.getTextureNode('normal'), camera);",
  presets: { Light: { radius: 3, lumaPhi: 8 }, Strong: { radius: 10, lumaPhi: 3 } },
  related: ['tsl-bloom-node', 'tsl-gtao'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-denoise'. createTslDenoiseScene(canvas, params) -> { renderer, scene, camera, mesh, update(p), resize(w,h), renderFrame(), dispose() } (shared _tslPostHarness scene). Drive with renderer.setAnimationLoop(() => renderFrame()). denoise(node, depthNode, normalNode, camera) requires an MRT scene pass exposing output+normal (+ auto depth). The returned node exposes .radius/.lumaPhi/.depthPhi/.normalPhi TSL uniforms. Vendored verbatim from three.js r185 examples/jsm/tsl/display/DenoiseNode.js (WebGPU only).",
  reuseNotes: 'Chain in any WebGPU PostProcessing stack; SSAA/retro own their scene render, denoise needs the scene-pass depth/normal MRT.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslDenoiseMeta;
