import * as THREE from 'three/webgpu';
import { createAdaptiveOpenFrontBoxRoom } from './modules/rendering/environments/AdaptiveOpenFrontBoxRoom.module.js';
import { createWebgpuSsgiRoomRenderer } from './modules/rendering/postfx/WebgpuSsgiRoomRenderer.module.js';
import { createPointerLight } from './local/PointerLight.js';
import { createFacecapModel } from './local/FacecapModel.js';

export async function createFacecapEngine(canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 50);

  // Initialize the SSGI Render Pipeline
  const renderer = createWebgpuSsgiRoomRenderer(canvas, {
    toneMappingExposure: 0.35,
    giIntensity: 18,
    aoIntensity: 0.55,
    ssgiSliceCount: 2,
    ssgiStepCount: 8,
    bloomThreshold: 0.1,
    bloomStrength: 0.25,
    bloomRadius: 0,
    pixelRatio: 1.5,
  });

  // Create the adaptive room environment (Cornell box)
  const room = createAdaptiveOpenFrontBoxRoom(scene, {
    boxHeight: 6,
    boxDepth: 8,
    wallThickness: 0.5,
    cameraFov: 45,
    showCeiling: true,
    showBackWall: true,
  });

  // Base lighting
  const ambient = new THREE.HemisphereLight(0xffffff, 0x000000, 0.2);
  scene.add(ambient);

  // Load the facecap model
  const faceModel = await createFacecapModel(scene, renderer.renderer);

  // Interactive light
  const pointerLight = createPointerLight(scene, camera, 1); // Depth 1 from CodePen (LIGHT_DEPTH = 1)

  function resize(width, height) {
    renderer.resize(width, height);
    room.rebuild(width, height);
    room.fitCamera(camera, width, height);
  }

  function pointerMove(x, y, width, height) {
    pointerLight.onPointerMove(x, y, width, height);
  }

  // To be called from React when new mediapipe tracking data arrives
  function applyFaceTracking(result) {
    if (!result || !faceModel) return;
    faceModel.update(result.blendshapes, result.transformMatrix);
  }

  function render() {
    pointerLight.update();
    renderer.render(scene, camera);
  }

  function start() {
    renderer.renderer.setAnimationLoop(render);
  }

  function stop() {
    renderer.renderer.setAnimationLoop(null);
  }

  function dispose() {
    stop();
    renderer.dispose();
    room.dispose();
    pointerLight.dispose();
    faceModel.dispose();
    ambient.dispose();
  }

  return {
    resize,
    pointerMove,
    applyFaceTracking,
    start,
    stop,
    dispose,
  };
}
