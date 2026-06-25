import * as THREE from 'three/webgpu';
import { equirectUV, texture, uniform } from 'three/tsl';

export const equirectangularNodeEnvironmentDefaults = {
  backgroundIntensity: 2,
  colorSpace: 'srgb',
};

function makeFallbackTexture() {
  const data = new Uint8Array([3, 5, 12, 255]);
  const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createEquirectangularNodeEnvironment(scene, textureUrl, options = {}) {
  const state = { ...equirectangularNodeEnvironmentDefaults, ...options };
  const intensity = uniform(state.backgroundIntensity);
  const sourceTexture = makeFallbackTexture();
  sourceTexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.backgroundNode = texture(sourceTexture, equirectUV()).mul(intensity);

  let disposed = false;
  let loadedTexture = null;
  const loader = new THREE.TextureLoader();

  if (textureUrl) {
    loader.load(textureUrl, (tex) => {
      if (disposed) {
        tex.dispose();
        return;
      }
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      loadedTexture = tex;
      scene.backgroundNode = texture(tex, equirectUV()).mul(intensity);
    });
  }

  function update(next = {}) {
    Object.assign(state, next);
    intensity.value = Number(state.backgroundIntensity ?? 2);
  }

  function dispose() {
    disposed = true;
    if (scene.backgroundNode) scene.backgroundNode = null;
    sourceTexture.dispose();
    loadedTexture?.dispose();
  }

  return {
    state,
    intensity,
    update,
    dispose,
  };
}
