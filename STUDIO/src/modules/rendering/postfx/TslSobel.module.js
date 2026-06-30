// TslSobel.module.js — ARTINOS wrapper around three.js r185 examples/jsm/tsl/display/SobelOperatorNode.
import { uniform } from 'three/tsl';
import { sobel } from '../../tsl/display/SobelOperatorNode.js';
import { createTslPostScene } from './_tslPostHarness.js';

export function createTslSobelScene(canvas, params = {}) {
  const engine = createTslPostScene(canvas, (scenePass) => sobel(scenePass));
  engine.update(params);
  return engine;
}
