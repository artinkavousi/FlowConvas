// TslPixelation.module.js — ARTINOS wrapper around
// three.js r185 examples/jsm/tsl/display/PixelationPassNode.
// Renders the scene into chunky pixels with optional normal/depth edge highlighting. This pass owns
// its own scene render, so it replaces the default scene pass. pixelSize/edge strengths are live uniforms.
import { uniform } from 'three/tsl';
import { pixelationPass } from '../../tsl/display/PixelationPassNode.js';
import { createTslPostScene } from './_tslPostHarness.js';

export function createTslPixelationScene(canvas, params = {}) {
  const pixelSize = uniform(params.pixelSize ?? 6);
  const normalEdge = uniform(params.normalEdge ?? 0.3);
  const depthEdge = uniform(params.depthEdge ?? 0.4);
  const engine = createTslPostScene(
    canvas,
    (_scenePass, ctx) => pixelationPass(ctx.scene, ctx.camera, pixelSize, normalEdge, depthEdge),
    (p) => {
      if (p.pixelSize !== undefined) pixelSize.value = p.pixelSize;
      if (p.normalEdge !== undefined) normalEdge.value = p.normalEdge;
      if (p.depthEdge !== undefined) depthEdge.value = p.depthEdge;
    },
  );
  engine.update(params);
  return engine;
}
