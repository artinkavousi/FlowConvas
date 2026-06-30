// TslHashBlur.module.js — ARTINOS wrapper around three.js r185 examples/jsm/tsl/display/hashBlur.
import { uniform } from 'three/tsl';
import { hashBlur } from '../../tsl/display/hashBlur.js';
import { createTslPostScene } from './_tslPostHarness.js';

export function createTslHashBlurScene(canvas, params = {}) {
  const amount = uniform(params.amount ?? 0.1);
  const engine = createTslPostScene(
    canvas,
    (scenePass) => hashBlur(scenePass, amount),
    (p) => { if (p.amount !== undefined) amount.value = p.amount; },
  );
  engine.update(params);
  return engine;
}
