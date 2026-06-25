// PointerRaycastForce.module.js
// Universal pointer→ray→plane-intersection interaction model. Converts pointer moves into a
// world-space ray (origin + direction) and its intersection with an interaction plane, plus a
// frame-to-frame force vector (how far/fast the intersection moved). Any 3D sim can consume this
// to inject mouse forces — the exact contract MLS-MPM's setMouseRay(origin, direction, point) wants.
//
// Extracted faithfully from ref/AURORA/src/APP.ts (onMouseMove + raycaster + plane + setMouseRay).
// Generalized: the plane and camera are injectable so it works with any scene, not just FlowApp.

import * as THREE from 'three';

export const pointerRaycastForceDefaults = {
  // Interaction plane: normal + constant (plane: normal·x + constant = 0). AURORA used
  // normal (0,0,-1), constant 0.2.
  planeNormal: [0, 0, -1],
  planeConstant: 0.2,
  // Multiplies the per-move delta to produce the force magnitude.
  forceScale: 1.0,
};

/**
 * @param {HTMLElement} domElement - element to listen on (usually the canvas).
 * @param {THREE.Camera} camera - camera used to unproject the pointer.
 * @param {object} [options]
 */
export function createPointerRaycastForce(domElement, camera, options = {}) {
  const planeNormal = new THREE.Vector3().fromArray(options.planeNormal ?? pointerRaycastForceDefaults.planeNormal);
  let forceScale = options.forceScale ?? pointerRaycastForceDefaults.forceScale;

  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(planeNormal, options.planeConstant ?? pointerRaycastForceDefaults.planeConstant);
  const pointerNdc = new THREE.Vector2();

  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const point = new THREE.Vector3();
  const prevPoint = new THREE.Vector3();
  const force = new THREE.Vector3();

  let activeCamera = camera;
  let active = false;
  let hasPrev = false;

  function onPointerMove(event) {
    const rect = domElement.getBoundingClientRect();
    const w = rect.width || domElement.clientWidth || window.innerWidth;
    const h = rect.height || domElement.clientHeight || window.innerHeight;
    pointerNdc.x = ((event.clientX - rect.left) / w) * 2 - 1;
    pointerNdc.y = -((event.clientY - rect.top) / h) * 2 + 1;

    if (!activeCamera) return;
    raycaster.setFromCamera(pointerNdc, activeCamera);

    const hit = raycaster.ray.intersectPlane(plane, point);
    if (hit) {
      origin.copy(raycaster.ray.origin);
      direction.copy(raycaster.ray.direction);
      if (hasPrev) {
        force.copy(point).sub(prevPoint).multiplyScalar(forceScale);
      } else {
        force.set(0, 0, 0);
      }
      prevPoint.copy(point);
      hasPrev = true;
      active = true;
    }
  }

  function onPointerLeave() {
    active = false;
    hasPrev = false;
    force.set(0, 0, 0);
  }

  domElement.addEventListener('pointermove', onPointerMove);
  domElement.addEventListener('pointerleave', onPointerLeave);

  return {
    /** Latest ray + intersection + per-move force. Vectors are live THREE.Vector3 (don't mutate). */
    read() {
      return { origin, direction, point, force, active };
    },
    setCamera(cam) {
      activeCamera = cam;
    },
    setForceScale(scale) {
      forceScale = scale;
    },
    /** Set the interaction plane (normal array + constant). */
    setPlane(normalArray, constant) {
      plane.normal.fromArray(normalArray).normalize();
      plane.constant = constant;
    },
    /** Call once per frame after consuming the force to avoid re-applying a stale delta. */
    tick() {
      force.set(0, 0, 0);
    },
    dispose() {
      domElement.removeEventListener('pointermove', onPointerMove);
      domElement.removeEventListener('pointerleave', onPointerLeave);
    },
  };
}
