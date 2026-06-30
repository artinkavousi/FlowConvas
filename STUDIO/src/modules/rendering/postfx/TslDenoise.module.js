// TslDenoise.module.js — ARTINOS wrapper around three.js r185 examples/jsm/tsl/display/DenoiseNode.
// Edge-aware (bilateral) denoiser guided by scene depth + normals (via an MRT scene pass). Best on
// noisy inputs (AO, GI, path tracing); radius/lumaPhi/normalPhi are live uniforms.
import { mrt, output, normalView } from 'three/tsl';
import { denoise } from '../../tsl/display/DenoiseNode.js';
import { createTslPostScene } from './_tslPostHarness.js';

export function createTslDenoiseScene(canvas, params = {}) {
  let fx;
  const engine = createTslPostScene(
    canvas,
    (scenePass, ctx) => {
      scenePass.setMRT(mrt({ output, normal: normalView }));
      const color = scenePass.getTextureNode('output');
      const normal = scenePass.getTextureNode('normal');
      const depth = scenePass.getTextureNode('depth');
      fx = denoise(color, depth, normal, ctx.camera);
      return fx;
    },
    (p) => {
      if (!fx) return;
      if (p.radius !== undefined) fx.radius.value = p.radius;
      if (p.lumaPhi !== undefined) fx.lumaPhi.value = p.lumaPhi;
      if (p.normalPhi !== undefined) fx.normalPhi.value = p.normalPhi;
    },
  );
  engine.update(params);
  return engine;
}
