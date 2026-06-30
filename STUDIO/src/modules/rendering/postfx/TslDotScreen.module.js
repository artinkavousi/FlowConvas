// TslDotScreen.module.js — ARTINOS wrapper around three.js r185 examples/jsm/tsl/display/DotScreenNode.
import { uniform } from 'three/tsl';
import { dotScreen } from '../../tsl/display/DotScreenNode.js';
import { createTslPostScene } from './_tslPostHarness.js';

export function createTslDotScreenScene(canvas, params = {}) {
  let fx;
  const engine = createTslPostScene(
    canvas,
    (scenePass) => { fx = dotScreen(scenePass, params.angle ?? 1.57, params.scale ?? 0.8); return fx; },
    (p) => { if (p.angle !== undefined) fx.angle.value = p.angle; if (p.scale !== undefined) fx.scale.value = p.scale; },
  );
  engine.update(params);
  return engine;
}
