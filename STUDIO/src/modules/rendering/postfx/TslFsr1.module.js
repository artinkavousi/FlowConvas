// TslFsr1.module.js — ARTINOS wrapper around three.js r185 examples/jsm/tsl/display/FSR1Node.
import { uniform } from 'three/tsl';
import { fsr1 } from '../../tsl/display/FSR1Node.js';
import { createTslPostScene } from './_tslPostHarness.js';

export function createTslFsr1Scene(canvas, params = {}) {
  const sharpness = uniform(params.sharpness ?? 0.2);
  const engine = createTslPostScene(
    canvas,
    (scenePass) => fsr1(scenePass, sharpness, false),
    (p) => { if (p.sharpness !== undefined) sharpness.value = p.sharpness; },
  );
  engine.update(params);
  return engine;
}
