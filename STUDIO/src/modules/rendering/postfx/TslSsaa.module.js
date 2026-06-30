// TslSsaa.module.js — ARTINOS wrapper around three.js r185 examples/jsm/tsl/display/SSAAPassNode.
// Supersampled anti-aliasing: jitters the camera and accumulates 2^sampleLevel samples. This pass
// renders the scene itself, so it replaces the default scene pass. sampleLevel is a live JS prop.
import { ssaaPass } from '../../tsl/display/SSAAPassNode.js';
import { createTslPostScene } from './_tslPostHarness.js';

export function createTslSsaaScene(canvas, params = {}) {
  let fx;
  const engine = createTslPostScene(
    canvas,
    (_scenePass, ctx) => {
      fx = ssaaPass(ctx.scene, ctx.camera);
      if (params.sampleLevel !== undefined) fx.sampleLevel = params.sampleLevel;
      return fx;
    },
    (p) => { if (fx && p.sampleLevel !== undefined) fx.sampleLevel = p.sampleLevel; },
  );
  engine.update(params);
  return engine;
}
