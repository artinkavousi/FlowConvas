// TslSharpen.module.js — ARTINOS wrapper around three.js r185 examples/jsm/tsl/display/SharpenNode.
import { uniform } from 'three/tsl';
import { sharpen } from '../../tsl/display/SharpenNode.js';
import { createTslPostScene } from './_tslPostHarness.js';

export function createTslSharpenScene(canvas, params = {}) {
  const sharpness = uniform(params.sharpness ?? 0.2);
  const engine = createTslPostScene(
    canvas,
    (scenePass) => sharpen(scenePass, sharpness, false),
    (p) => { if (p.sharpness !== undefined) sharpness.value = p.sharpness; },
  );
  engine.update(params);
  return engine;
}
