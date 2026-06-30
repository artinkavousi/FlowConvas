// TslRetro.module.js — ARTINOS wrapper around three.js r185 examples/jsm/tsl/display/RetroPassNode.
// Retro / dithered low-fi look (palette + dithering). This pass renders the scene itself, so it
// replaces the default scene pass.
import { retroPass } from '../../tsl/display/RetroPassNode.js';
import { createTslPostScene } from './_tslPostHarness.js';

export function createTslRetroScene(canvas, params = {}) {
  const engine = createTslPostScene(canvas, (_scenePass, ctx) => retroPass(ctx.scene, ctx.camera));
  engine.update(params);
  return engine;
}
