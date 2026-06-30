// TslRgbShift.module.js — ARTINOS wrapper around three.js r185 examples/jsm/tsl/display/RGBShiftNode.
import { uniform } from 'three/tsl';
import { rgbShift } from '../../tsl/display/RGBShiftNode.js';
import { createTslPostScene } from './_tslPostHarness.js';

export function createTslRgbShiftScene(canvas, params = {}) {
  let fx;
  const engine = createTslPostScene(
    canvas,
    (scenePass) => { fx = rgbShift(scenePass, params.amount ?? 0.005, params.angle ?? 0.0); return fx; },
    (p) => { if (p.amount !== undefined) fx.amount.value = p.amount; if (p.angle !== undefined) fx.angle.value = p.angle; },
  );
  engine.update(params);
  return engine;
}
