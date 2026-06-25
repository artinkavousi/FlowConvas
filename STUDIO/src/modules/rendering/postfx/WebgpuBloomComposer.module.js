import * as THREE from 'three/webgpu';
import { emissive, mrt, output, pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

export const webgpuBloomComposerDefaults = {
  toneMappingExposure: 1.2,
  bloomStrength: 0.217,
  bloomRadius: 0,
  bloomThreshold: 0,
  pixelRatio: 2,
};

export function createWebgpuBloomRenderer(canvas, options = {}) {
  const state = { ...webgpuBloomComposerDefaults, ...options };
  const renderer = new THREE.WebGPURenderer({
    canvas,
    antialias: true,
    alpha: false,
    stencil: false,
    depth: true,
    forceWebGL: false,
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = state.toneMappingExposure;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, state.pixelRatio));

  let composer = null;
  let composerScene = null;
  let composerCamera = null;

  function build(scene, camera) {
    composer = new THREE.RenderPipeline(renderer);
    const scenePass = pass(scene, camera, {});
    scenePass.setMRT(mrt({ output, emissive }));
    const sceneColor = scenePass.getTextureNode('output');
    const bloomPass = bloom(sceneColor, state.bloomStrength, state.bloomRadius, state.bloomThreshold);
    composer.outputNode = sceneColor.add(bloomPass);
    composerScene = scene;
    composerCamera = camera;
  }

  function update(next = {}) {
    Object.assign(state, next);
    renderer.toneMappingExposure = Number(state.toneMappingExposure ?? 1.2);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Number(state.pixelRatio ?? 2)));
    if (composer && (next.bloomStrength !== undefined || next.bloomRadius !== undefined || next.bloomThreshold !== undefined)) {
      composer = null;
    }
  }

  function resize(width = canvas.clientWidth || 1, height = canvas.clientHeight || 1) {
    renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    if (composer) composer.needsUpdate = true;
  }

  function render(scene, camera) {
    if (!composer || composerScene !== scene || composerCamera !== camera) {
      build(scene, camera);
    }
    return composer.render();
  }

  resize();
  update(state);

  return {
    renderer,
    state,
    update,
    resize,
    render,
    dispose() {
      renderer.setAnimationLoop(null);
      renderer.dispose();
      composer = null;
    },
  };
}
