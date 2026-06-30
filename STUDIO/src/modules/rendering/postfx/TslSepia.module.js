// TslSepia.module.js — ARTINOS wrapper around three.js r185 examples/jsm/tsl/display/Sepia.
import { uniform } from 'three/tsl';
import { sepia } from '../../tsl/display/Sepia.js';
import { createTslPostScene } from './_tslPostHarness.js';

export function createTslSepiaScene(canvas, params = {}) {
  const engine = createTslPostScene(canvas, (scenePass) => sepia(scenePass));
  engine.update(params);
  return engine;
}
