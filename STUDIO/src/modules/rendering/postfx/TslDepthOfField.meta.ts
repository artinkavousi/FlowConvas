import type { ArtinosModule } from '../../../registry/types';
import TslDepthOfFieldShowcase from './TslDepthOfField.showcase';

const tslDepthOfFieldMeta: ArtinosModule = {
  id: 'tsl-depth-of-field',
  name: 'TSL Depth of Field (Bokeh)',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL bokeh depth of field built on the node-based DepthOfFieldNode. Blurs the scene by view-space depth around a focus plane for a photographic shallow-focus look. focusDistance/focalLength/bokehScale are live uniforms.',
  tags: ['webgpu', 'tsl', 'postfx', 'depth-of-field', 'bokeh', 'dof', 'three', 'node'],
  schema: {
    id: 'tsl-depth-of-field',
    name: 'TSL Depth of Field (Bokeh)',
    category: 'rendering/postfx',
    parameters: [
      { key: 'focusDistance', label: 'Focus Distance', type: 'number', default: 4, min: 0.5, max: 12, step: 0.1, group: 'DoF' },
      { key: 'focalLength', label: 'Focal Length', type: 'number', default: 2, min: 0.1, max: 8, step: 0.1, group: 'DoF' },
      { key: 'bokehScale', label: 'Bokeh Scale', type: 'number', default: 3, min: 0, max: 10, step: 0.1, group: 'DoF' },
    ],
  },
  preview: TslDepthOfFieldShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/DepthOfFieldNode.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage: "import { dof } from './modules/tsl/display/DepthOfFieldNode.js';\nimport { pass, uniform } from 'three/tsl';\nconst scenePass = pass(scene, camera);\nconst focus = uniform(4), focal = uniform(2), bokeh = uniform(3);\npostProcessing.outputNode = dof(scenePass.getTextureNode(), scenePass.getViewZNode(), focus, focal, bokeh);",
  presets: { Portrait: { focusDistance: 4, focalLength: 3, bokehScale: 5 }, Miniature: { focusDistance: 5, focalLength: 1, bokehScale: 8 } },
  related: ['tsl-bloom-node', 'tsl-chromatic-aberration'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-depth-of-field'. createTslDofScene(canvas, params) -> { renderer, scene, camera, mesh, update(p), resize(w,h), renderFrame(), dispose() } (shared _tslPostHarness scene). Drive with renderer.setAnimationLoop(() => renderFrame()). dof(colorNode, viewZNode, focusDistance, focalLength, bokehScale): get viewZ from scenePass.getViewZNode(); pass TSL uniform() nodes for the three params to tune at runtime. Vendored verbatim from three.js r185 examples/jsm/tsl/display/DepthOfFieldNode.js (WebGPU only).",
  reuseNotes: 'Chain in any WebGPU PostProcessing stack; GTAO/DoF need the scene pass depth/normal, pixelation owns its own render.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslDepthOfFieldMeta;
