// TslFxaa.module.js — ARTINOS wrapper around three.js r185 examples/jsm/tsl/display/FXAANode.
import { uniform } from 'three/tsl';
import { fxaa } from '../../tsl/display/FXAANode.js';
import { createTslPostScene } from './_tslPostHarness.js';

export function createTslFxaaScene(canvas, params = {}) {
  const engine = createTslPostScene(canvas, (scenePass) => fxaa(scenePass));
  engine.update(params);
  return engine;
}
