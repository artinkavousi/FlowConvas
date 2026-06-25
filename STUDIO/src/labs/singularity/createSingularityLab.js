import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createEquirectangularNodeEnvironment } from './modules/rendering/environments/EquirectangularNodeEnvironment.module.js';
import { createWebgpuBloomRenderer, webgpuBloomComposerDefaults } from './modules/rendering/postfx/WebgpuBloomComposer.module.js';
import { createSingularityBlackHole, singularityBlackHoleDefaults } from './modules/shaders/SingularityBlackHoleMaterial.module.js';
import noiseUrl from './local/assets/noise_deep.png?url';
import nebulaUrl from './local/assets/nebula.png?url';

export const singularityLabDefaults = {
  ...singularityBlackHoleDefaults,
  ...webgpuBloomComposerDefaults,
  cameraFov: 50,
  backgroundIntensity: 2,
  preloadOverlay: true,
};

export function createSingularityLab(canvas, options = {}) {
  const state = { ...singularityLabDefaults, ...options };
  const bloom = createWebgpuBloomRenderer(canvas, state);
  const { renderer } = bloom;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(state.cameraFov, 1, 0.1, 2000);
  camera.position.set(1, 0.5, 3);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.target.set(0, 0, 0);

  const environment = createEquirectangularNodeEnvironment(scene, nebulaUrl, {
    backgroundIntensity: state.backgroundIntensity,
  });
  const blackHole = createSingularityBlackHole(scene, {
    ...state,
    noiseUrl,
    nebulaUrl,
  });

  function update(next = {}) {
    Object.assign(state, next);
    bloom.update(state);
    environment.update({ backgroundIntensity: state.backgroundIntensity });
    blackHole.update(state);
    if (next.cameraFov !== undefined) {
      camera.fov = Number(state.cameraFov ?? 50);
      camera.updateProjectionMatrix();
    }
  }

  function resize(width = canvas.clientWidth || 1, height = canvas.clientHeight || 1) {
    bloom.resize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  renderer.setAnimationLoop(() => {
    controls.update();
    bloom.render(scene, camera);
  });

  resize();
  update(state);

  return {
    renderer,
    scene,
    camera,
    controls,
    state,
    update,
    resize,
    dispose() {
      renderer.setAnimationLoop(null);
      controls.dispose();
      blackHole.dispose();
      environment.dispose();
      bloom.dispose();
    },
  };
}
