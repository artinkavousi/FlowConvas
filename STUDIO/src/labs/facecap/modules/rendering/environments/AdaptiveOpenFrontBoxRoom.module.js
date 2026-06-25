import * as THREE from 'three/webgpu';

export const adaptiveOpenFrontBoxRoomDefaults = {
  boxHeight: 6,
  boxDepth: 8,
  wallThickness: 0.5,
  cameraFov: 45,
  floorColor: '#eeeeee',
  ceilingColor: '#eeeeee',
  backColor: '#eeeeee',
  leftColor: '#ff2222',
  rightColor: '#22ff22',
  showCeiling: true,
  showBackWall: true,
  collisionFront: true,
};

export function getAdaptiveRoomWidth(width, height, boxHeight, cameraFov) {
  const aspect = Math.max(1, width) / Math.max(1, height);
  const vFov = THREE.MathUtils.degToRad(cameraFov / 2);
  const dist = (boxHeight / 2) / Math.tan(vFov);
  return Math.tan(vFov) * aspect * dist * 2;
}

export function createAdaptiveOpenFrontBoxRoom(scene, options = {}) {
  const state = { ...adaptiveOpenFrontBoxRoomDefaults, ...options };
  const wallMeshes = [];
  let descriptors = [];
  let boxSize = { w: 8, h: state.boxHeight, d: state.boxDepth };

  function material(color) {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color),
      roughness: 0.7,
      metalness: 0,
    });
  }

  function clearVisuals() {
    for (const mesh of wallMeshes) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    wallMeshes.length = 0;
  }

  function computeDescriptors(width = 1, height = 1) {
    boxSize = {
      w: getAdaptiveRoomWidth(width, height, state.boxHeight, state.cameraFov),
      h: state.boxHeight,
      d: state.boxDepth,
    };
    const hw = boxSize.w / 2;
    const hh = boxSize.h / 2;
    const hd = boxSize.d / 2;
    const t = state.wallThickness;
    descriptors = [
      { id: 'floor', size: [boxSize.w, t, boxSize.d], pos: [0, -t / 2, 0], color: state.floorColor, visible: true },
      { id: 'ceiling', size: [boxSize.w, t, boxSize.d], pos: [0, boxSize.h + t / 2, 0], color: state.ceilingColor, visible: state.showCeiling },
      { id: 'back', size: [boxSize.w, boxSize.h, t], pos: [0, hh, -hd - t / 2], color: state.backColor, visible: state.showBackWall },
      { id: 'front', size: [boxSize.w, boxSize.h, t], pos: [0, hh, hd + t / 2], color: state.backColor, visible: false, collisionOnly: state.collisionFront },
      { id: 'left', size: [t, boxSize.h, boxSize.d], pos: [-hw - t / 2, hh, 0], color: state.leftColor, visible: true },
      { id: 'right', size: [t, boxSize.h, boxSize.d], pos: [hw + t / 2, hh, 0], color: state.rightColor, visible: true },
    ];
    return descriptors;
  }

  function rebuild(width = 1, height = 1, hooks = {}) {
    clearVisuals();
    computeDescriptors(width, height);
    for (const wall of descriptors) {
      hooks.createCollisionWall?.(wall);
      if (!wall.visible) continue;
      const geo = new THREE.BoxGeometry(wall.size[0], wall.size[1], wall.size[2]);
      const mesh = hooks.createVisualWall?.(wall) ?? new THREE.Mesh(geo, material(wall.color));
      if (mesh.geometry !== geo) geo.dispose();
      mesh.position.set(wall.pos[0], wall.pos[1], wall.pos[2]);
      mesh.receiveShadow = true;
      scene.add(mesh);
      wallMeshes.push(mesh);
    }
    return boxSize;
  }

  function fitCamera(camera, width = 1, height = 1) {
    const aspect = Math.max(1, width) / Math.max(1, height);
    const vFov = THREE.MathUtils.degToRad(state.cameraFov / 2);
    const dist = (boxSize.h / 2) / Math.tan(vFov);
    camera.fov = state.cameraFov;
    camera.aspect = aspect;
    camera.position.set(0, boxSize.h / 2, dist + boxSize.d / 2);
    camera.lookAt(0, boxSize.h / 2, 0);
    camera.updateProjectionMatrix();
  }

  function update(options = {}) {
    Object.assign(state, options);
  }

  rebuild(1, 1);

  return {
    get boxSize() {
      return boxSize;
    },
    get descriptors() {
      return descriptors;
    },
    wallMeshes,
    state,
    update,
    rebuild,
    fitCamera,
    dispose: clearVisuals,
  };
}
