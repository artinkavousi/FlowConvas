// TslSmaa.module.js — ARTINOS wrapper around three.js r185 examples/jsm/tsl/display/SMAANode.
import { uniform } from 'three/tsl';
import { smaa } from '../../tsl/display/SMAANode.js';
import { createTslPostScene } from './_tslPostHarness.js';

export function createTslSmaaScene(canvas, params = {}) {
  const engine = createTslPostScene(canvas, (scenePass) => smaa(scenePass));
  engine.update(params);
  return engine;
}
