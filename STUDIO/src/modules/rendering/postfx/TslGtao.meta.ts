import type { ArtinosModule } from '../../../registry/types';
import TslGtaoShowcase from './TslGtao.showcase';

const tslGtaoMeta: ArtinosModule = {
  id: 'tsl-gtao',
  name: 'TSL GTAO (Ambient Occlusion)',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL Ground-Truth Ambient Occlusion built on the node-based GTAONode. Darkens contact creases and cavities using scene depth + normals (via an MRT scene pass) for grounded, physically-plausible shading. radius/scale/thickness are live uniforms.',
  tags: ['webgpu', 'tsl', 'postfx', 'gtao', 'ambient-occlusion', 'ao', 'three', 'node'],
  schema: {
    id: 'tsl-gtao',
    name: 'TSL GTAO (Ambient Occlusion)',
    category: 'rendering/postfx',
    parameters: [
      { key: 'radius', label: 'Radius', type: 'number', default: 0.25, min: 0.01, max: 2, step: 0.01, group: 'GTAO' },
      { key: 'scale', label: 'Scale', type: 'number', default: 1, min: 0, max: 4, step: 0.05, group: 'GTAO' },
      { key: 'thickness', label: 'Thickness', type: 'number', default: 1, min: 0.1, max: 4, step: 0.05, group: 'GTAO' },
      { key: 'distanceExponent', label: 'Distance Exp', type: 'number', default: 1, min: 0.1, max: 4, step: 0.05, group: 'GTAO' },
    ],
  },
  preview: TslGtaoShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/GTAONode.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage: "import { ao } from './modules/tsl/display/GTAONode.js';\nimport { pass, mrt, output, normalView, vec3, vec4 } from 'three/tsl';\nconst scenePass = pass(scene, camera);\nscenePass.setMRT(mrt({ output, normal: normalView }));\nconst aoPass = ao(scenePass.getTextureNode('depth'), scenePass.getTextureNode('normal'), camera);\npostProcessing.outputNode = scenePass.getTextureNode('output').mul(vec4(vec3(aoPass.getTextureNode().r), 1));",
  presets: { Tight: { radius: 0.12, scale: 1.5 }, Wide: { radius: 0.6, scale: 1 } },
  related: ['tsl-bloom-node', 'tsl-chromatic-aberration'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-gtao'. createTslGtaoScene(canvas, params) -> { renderer, scene, camera, mesh, update(p), resize(w,h), renderFrame(), dispose() } (shared _tslPostHarness scene). Drive with renderer.setAnimationLoop(() => renderFrame()). ao(depthNode, normalNode, camera) requires an MRT scene pass exposing output+normal (+ auto depth). The returned node exposes .radius/.scale/.thickness/.distanceExponent/.distanceFallOff/.samples TSL uniforms. Vendored verbatim from three.js r185 examples/jsm/tsl/display/GTAONode.js (WebGPU only).",
  reuseNotes: 'Chain in any WebGPU PostProcessing stack; GTAO/DoF need the scene pass depth/normal, pixelation owns its own render.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslGtaoMeta;
