// TslDepthOfField.module.js — ARTINOS wrapper around
// three.js r185 examples/jsm/tsl/display/DepthOfFieldNode.
// Bokeh depth of field driven by the scene pass viewZ. focusDistance/focalLength/bokehScale are
// live TSL uniforms.
import { uniform } from 'three/tsl';
import { dof } from '../../tsl/display/DepthOfFieldNode.js';
import { createTslPostScene } from './_tslPostHarness.js';

export function createTslDofScene(canvas, params = {}) {
  const focusDistance = uniform(params.focusDistance ?? 4.0);
  const focalLength = uniform(params.focalLength ?? 2.0);
  const bokehScale = uniform(params.bokehScale ?? 3.0);
  const engine = createTslPostScene(
    canvas,
    (scenePass) =>
      dof(scenePass.getTextureNode(), scenePass.getViewZNode(), focusDistance, focalLength, bokehScale),
    (p) => {
      if (p.focusDistance !== undefined) focusDistance.value = p.focusDistance;
      if (p.focalLength !== undefined) focalLength.value = p.focalLength;
      if (p.bokehScale !== undefined) bokehScale.value = p.bokehScale;
    },
  );
  engine.update(params);
  return engine;
}
