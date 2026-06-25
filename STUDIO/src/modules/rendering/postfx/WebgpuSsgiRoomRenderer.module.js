import * as THREE from 'three/webgpu';
import {
  add,
  colorToDirection,
  diffuseColor,
  directionToColor,
  mrt,
  normalView,
  output,
  pass,
  sample,
  vec4,
  velocity,
} from 'three/tsl';
import { ssgi } from 'three/addons/tsl/display/SSGINode.js';
import { traa } from 'three/addons/tsl/display/TRAANode.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

export const webgpuSsgiRoomRendererDefaults = {
  toneMappingExposure: 0.35,
  giIntensity: 18,
  aoIntensity: 0.55,
  ssgiSliceCount: 2,
  ssgiStepCount: 8,
  bloomThreshold: 0.1,
  bloomStrength: 0.25,
  bloomRadius: 0,
  shadowMapSize: 1024,
  pixelRatio: 1.5,
};

export function createWebgpuSsgiRoomRenderer(canvas, options = {}) {
  const state = { ...webgpuSsgiRoomRendererDefaults, ...options };
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, state.pixelRatio));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = state.toneMappingExposure;
  renderer.shadowMap.enabled = true;

  let pipeline = null;
  let pipelineScene = null;
  let pipelineCamera = null;
  let giPass = null;

  function buildPipeline(scene, camera) {
    pipeline = new THREE.RenderPipeline(renderer);
    const scenePass = pass(scene, camera);
    scenePass.setMRT(
      mrt({
        output,
        diffuseColor,
        normal: directionToColor(normalView),
        velocity,
      }),
    );

    const scenePassColor = scenePass.getTextureNode('output');
    const scenePassDiffuse = scenePass.getTextureNode('diffuseColor');
    const scenePassDepth = scenePass.getTextureNode('depth');
    const scenePassNormal = scenePass.getTextureNode('normal');
    const scenePassVelocity = scenePass.getTextureNode('velocity');

    const diffuseTexture = scenePass.getTexture('diffuseColor');
    diffuseTexture.type = THREE.UnsignedByteType;
    const normalTexture = scenePass.getTexture('normal');
    normalTexture.type = THREE.UnsignedByteType;

    const sceneNormal = sample((uv) => colorToDirection(scenePassNormal.sample(uv)));
    giPass = ssgi(scenePassColor, scenePassDepth, sceneNormal, camera);
    giPass.sliceCount.value = state.ssgiSliceCount;
    giPass.stepCount.value = state.ssgiStepCount;
    giPass.giIntensity.value = state.giIntensity;
    giPass.aoIntensity.value = state.aoIntensity;

    const gi = giPass.rgb;
    const ao = giPass.a;
    const compositePass = vec4(
      add(scenePassColor.rgb.mul(ao), scenePassDiffuse.rgb.mul(gi)),
      scenePassColor.a,
    );
    const traaPass = traa(compositePass, scenePassDepth, scenePassVelocity, camera);
    const bloomPass = bloom(traaPass, state.bloomThreshold, state.bloomStrength, state.bloomRadius);
    pipeline.outputNode = vec4(add(traaPass.rgb, bloomPass.rgb), traaPass.a);
    pipelineScene = scene;
    pipelineCamera = camera;
  }

  function resize(width = canvas.clientWidth || 1, height = canvas.clientHeight || 1) {
    renderer.setSize(Math.max(1, width), Math.max(1, height), false);
  }

  function update(options = {}) {
    Object.assign(state, options);
    renderer.toneMappingExposure = state.toneMappingExposure;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, state.pixelRatio));
    if (giPass) {
      giPass.sliceCount.value = state.ssgiSliceCount;
      giPass.stepCount.value = state.ssgiStepCount;
      giPass.giIntensity.value = state.giIntensity;
      giPass.aoIntensity.value = state.aoIntensity;
    }
  }

  function render(scene, camera) {
    if (!pipeline || pipelineScene !== scene || pipelineCamera !== camera) {
      buildPipeline(scene, camera);
    }
    pipeline.render();
  }

  resize();
  update(state);

  return {
    renderer,
    get state() {
      return state;
    },
    update,
    resize,
    render,
    dispose() {
      renderer.setAnimationLoop(null);
      renderer.dispose();
      pipeline = null;
      giPass = null;
    },
  };
}
