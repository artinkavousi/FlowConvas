// FalseEarthPostStack.module.js
// Source-derived WebGPU/TSL post-processing composer for False Earth.

import * as THREE from 'three/webgpu';
import { clamp, float, Fn, If, length, mix, pass, pow, smoothstep, uniform, uv, vec4 } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { dof } from 'three/addons/tsl/display/DepthOfFieldNode.js';
import { smaa } from 'three/addons/tsl/display/SMAANode.js';

export const falseEarthPostStackDefaults = {
  highQuality: true,
  bloomEnabled: true,
  bloomThreshold: 0.35,
  bloomStrength: 0.3,
  bloomRadius: 0.5,
  dofEnabled: true,
  dofAutofocus: true,
  focusDistance: 1.3,
  focalLength: 25,
  bokehScale: 5,
  helmetStrength: 0,
  toneMappingEnabled: true,
  exposure: 1.1,
  smaaEnabled: false,
  pixelRatio: 1.5,
};

export const falseEarthPostStackProvenance = {
  source: 'https://github.com/momentchan/false-earth',
  sourceCommit: '74cc91cb2764fbb75aee201d92752e4da37ad311',
  files: [
    'src/components/Effects/Effects.tsx',
    'src/components/Effects/useEffectsControls.ts',
    'src/app/App.tsx',
  ],
  license: 'MIT',
};

export async function createFalseEarthPostStack(canvas, options = {}) {
  const state = { ...falseEarthPostStackDefaults, ...options };
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: false, depth: true, stencil: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, state.pixelRatio));
  renderer.toneMapping = state.toneMappingEnabled ? THREE.ReinhardToneMapping : THREE.NoToneMapping;
  renderer.toneMappingExposure = Math.pow(state.exposure, 4);
  await renderer.init();

  const uniforms = {
    focusDist: uniform(state.focusDistance),
    focalLen: uniform(state.focalLength),
    bokeh: uniform(state.bokehScale),
    helmetStr: uniform(state.helmetStrength),
    bloomThresh: uniform(state.bloomThreshold),
    bloomStr: uniform(state.bloomStrength),
    bloomRad: uniform(state.bloomRadius),
  };

  let scene = state.scene ?? null;
  let beamScene = state.beamScene ?? null;
  let camera = state.camera ?? null;
  let postProcessing = null;
  let buildKey = '';
  const vecCache = { cam: new THREE.Vector3(), target: new THREE.Vector3() };

  function makeBuildKey() {
    return [
      state.highQuality,
      state.bloomEnabled,
      state.dofEnabled,
      state.smaaEnabled,
      state.toneMappingEnabled,
      scene?.id ?? 'no-scene',
      beamScene?.id ?? 'no-beam',
      camera?.id ?? 'no-camera',
    ].join(':');
  }

  function rebuild() {
    if (!scene || !camera) return;
    const key = makeBuildKey();
    if (postProcessing && key === buildKey) return;

    postProcessing = new THREE.PostProcessing(renderer);
    const scenePass = pass(scene, camera);
    const sceneTex = scenePass.getTextureNode('output');
    const sceneDepth = scenePass.getViewZNode();
    const uvNode = uv();

    const getBaseColor = Fn(() => {
      const outputColor = vec4(0).toVar();
      If(uniforms.helmetStr.greaterThan(float(0.01)), () => {
        const toCenter = uvNode.sub(0.5);
        const dist = length(toCenter);
        const direction = toCenter.normalize();
        const distortedUV = uvNode.sub(direction.mul(pow(dist, 3)).mul(float(0.2).mul(uniforms.helmetStr)));
        const aberOffset = direction.mul(dist).mul(float(0.01).mul(uniforms.helmetStr));
        const r = sceneTex.sample(distortedUV.sub(aberOffset)).r;
        const g = sceneTex.sample(distortedUV).g;
        const b = sceneTex.sample(distortedUV.add(aberOffset)).b;
        outputColor.assign(vec4(r, g, b, 1));
      }).Else(() => {
        outputColor.assign(sceneTex.sample(uvNode));
      });
      return outputColor;
    });

    let finalNode = getBaseColor();
    const toCenter = uvNode.sub(0.5);
    const dist = length(toCenter);

    if (state.highQuality && state.dofEnabled) {
      finalNode = dof(finalNode, sceneDepth, uniforms.focusDist, uniforms.focalLen, uniforms.bokeh);
    }

    if (beamScene) {
      const beamPass = pass(beamScene, camera);
      const beamColor = beamPass.getTextureNode('output');
      const beamDepth = beamPass.getViewZNode();
      const beamOcclusion = smoothstep(float(0), float(10), beamDepth.sub(sceneDepth));
      finalNode = finalNode.add(beamColor.mul(beamOcclusion));
    }

    const vignette = smoothstep(0.2, 0.8, dist);
    const mask = clamp(float(1).sub(vignette), 0, 1);
    const helmetOverlay = finalNode.mul(vec4(mask, mask, mask, 1)).mul(vec4(0.6, 0.65, 0.7, 1));
    finalNode = mix(finalNode, helmetOverlay, uniforms.helmetStr);

    if (state.highQuality && state.bloomEnabled) {
      const bloomNode = bloom(finalNode);
      bloomNode.threshold = uniforms.bloomThresh;
      bloomNode.strength = uniforms.bloomStr;
      bloomNode.radius = uniforms.bloomRad;
      finalNode = finalNode.add(bloomNode);
    }

    if (state.highQuality && state.smaaEnabled) finalNode = smaa(finalNode);

    postProcessing.outputNode = finalNode;
    buildKey = key;
  }

  function update(next = {}) {
    const rebuildKeys = ['highQuality', 'bloomEnabled', 'dofEnabled', 'smaaEnabled', 'toneMappingEnabled', 'scene', 'beamScene', 'camera'];
    const needsRebuild = rebuildKeys.some((key) => next[key] !== undefined);
    Object.assign(state, next);
    if (next.scene) scene = next.scene;
    if (next.beamScene) beamScene = next.beamScene;
    if (next.camera) camera = next.camera;
    uniforms.focusDist.value = Number(state.focusDistance);
    uniforms.focalLen.value = Number(state.focalLength);
    uniforms.bokeh.value = Number(state.bokehScale);
    uniforms.helmetStr.value = Number(state.helmetStrength);
    uniforms.bloomThresh.value = Number(state.bloomThreshold);
    uniforms.bloomStr.value = Number(state.bloomStrength);
    uniforms.bloomRad.value = Number(state.bloomRadius);
    renderer.toneMapping = state.toneMappingEnabled ? THREE.ReinhardToneMapping : THREE.NoToneMapping;
    renderer.toneMappingExposure = Math.pow(Number(state.exposure), 4);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Number(state.pixelRatio)));
    if (needsRebuild) postProcessing = null;
  }

  function resize(width = canvas.clientWidth || 1, height = canvas.clientHeight || 1) {
    renderer.setSize(Math.max(1, width), Math.max(1, height), false);
  }

  function render(renderOptions = {}) {
    if (!scene || !camera) return;
    if (state.highQuality && state.dofEnabled && state.dofAutofocus && renderOptions.focusTarget) {
      camera.getWorldPosition(vecCache.cam);
      renderOptions.focusTarget.getWorldPosition(vecCache.target);
      uniforms.focusDist.value = vecCache.cam.distanceTo(vecCache.target);
    }
    rebuild();
    if (postProcessing) postProcessing.render();
    else renderer.render(scene, camera);
  }

  resize();
  update(state);

  return {
    renderer,
    state,
    uniforms,
    update,
    resize,
    render,
    dispose() {
      renderer.setAnimationLoop(null);
      postProcessing = null;
      renderer.dispose();
    },
  };
}
