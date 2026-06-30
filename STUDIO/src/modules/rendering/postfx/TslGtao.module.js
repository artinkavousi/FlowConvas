// TslGtao.module.js — ARTINOS wrapper around three.js r185 examples/jsm/tsl/display/GTAONode.
// Ground-Truth Ambient Occlusion. Needs scene normals + depth, so the scene pass is given an MRT
// (output + normalView); the AO result modulates the colour. radius/scale/thickness are live uniforms.
import { mrt, output, normalView, vec3, vec4 } from 'three/tsl';
import { ao } from '../../tsl/display/GTAONode.js';
import { createTslPostScene } from './_tslPostHarness.js';

export function createTslGtaoScene(canvas, params = {}) {
  let aoPass;
  const engine = createTslPostScene(
    canvas,
    (scenePass, ctx) => {
      scenePass.setMRT(mrt({ output, normal: normalView }));
      const color = scenePass.getTextureNode('output');
      const normal = scenePass.getTextureNode('normal');
      const depth = scenePass.getTextureNode('depth');
      aoPass = ao(depth, normal, ctx.camera);
      const aoOut = aoPass.getTextureNode();
      return color.mul(vec4(vec3(aoOut.r), 1));
    },
    (p) => {
      if (!aoPass) return;
      if (p.radius !== undefined) aoPass.radius.value = p.radius;
      if (p.scale !== undefined) aoPass.scale.value = p.scale;
      if (p.thickness !== undefined) aoPass.thickness.value = p.thickness;
      if (p.distanceExponent !== undefined) aoPass.distanceExponent.value = p.distanceExponent;
    },
  );
  engine.update(params);
  return engine;
}
