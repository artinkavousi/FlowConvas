import type { ArtinosModule } from '../../../registry/types';
import TslFilmGrainShowcase from './TslFilmGrain.showcase';

const tslFilmGrainMeta: ArtinosModule = {
  id: 'tsl-film-grain',
  name: 'TSL Film Grain (Node)',
  category: 'rendering/postfx',
  description:
    'WebGPU/TSL animated film grain / noise overlay built on the node-based FilmNode. Adds subtle moving grain over the scene pass for a cinematic or retro look.',
  tags: ['webgpu', 'tsl', 'postfx', 'film', 'grain', 'noise', 'three', 'node'],
  schema: {
    id: 'tsl-film-grain',
    name: 'TSL Film Grain (Node)',
    category: 'rendering/postfx',
    parameters: [
      { key: 'intensity', label: 'Grain Intensity', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, group: 'Film' },
      { key: 'spin', label: 'Spin', type: 'number', default: 1, min: 0, max: 3, step: 0.1, group: 'Demo' },
    ],
  },
  preview: TslFilmGrainShowcase,
  sourcePath: 'STUDIO/src/modules/tsl/display/FilmNode.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage: "import { film } from './modules/tsl/display/FilmNode.js';\nimport { pass, uniform } from 'three/tsl';\nconst i = uniform(0.5);\npostProcessing.outputNode = film(pass(scene, camera), i);",
  presets: { Subtle: { intensity: 0.2 }, Heavy: { intensity: 0.9 } },
  related: ['tsl-bloom-node', 'tsl-chromatic-aberration'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'tsl-film-grain'. createTslFilmScene(canvas, params) -> { renderer, scene, camera, mesh, update(p), resize(w,h), renderFrame(), dispose() } (shared _tslPostHarness scene). Drive with renderer.setAnimationLoop(() => renderFrame()). film(node, intensityNode): pass a TSL uniform() as intensity to animate it. Vendored verbatim from three.js r185 examples/jsm/tsl/display/FilmNode.js (WebGPU only).",
  reuseNotes: 'Chain after the scene pass in any WebGPU PostProcessing stack by combining output nodes.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default tslFilmGrainMeta;
