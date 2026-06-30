// TslAfterImage.module.js — ARTINOS wrapper around three.js r185 examples/jsm/tsl/display/AfterImageNode.
import { uniform } from 'three/tsl';
import { afterImage } from '../../tsl/display/AfterImageNode.js';
import { createTslPostScene } from './_tslPostHarness.js';

export function createTslAfterImageScene(canvas, params = {}) {
  const damp = uniform(params.damp ?? 0.96);
  const engine = createTslPostScene(
    canvas,
    (scenePass) => afterImage(scenePass, damp),
    (p) => { if (p.damp !== undefined) damp.value = p.damp; },
  );
  engine.update(params);
  return engine;
}
