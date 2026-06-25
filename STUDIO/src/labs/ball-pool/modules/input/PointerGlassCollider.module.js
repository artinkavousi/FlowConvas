import * as THREE from 'three/webgpu';

export const pointerGlassColliderDefaults = {
  glassRadius: 0.8,
  glassMass: 5,
  springStiffness: 500,
  springDamping: 40,
  pushRadius: 1.5,
  pushStrength: 5,
  lightIntensity: 80,
  easeSpeed: 8,
  centerPlaneDepthRatio: 0.25,
};

export function createPointerGlassCollider(canvas, camera, physicsAdapter, scene, options = {}) {
  const state = { ...pointerGlassColliderDefaults, ...options };
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const mouseRayOrigin = new THREE.Vector3();
  const mouseRayDir = new THREE.Vector3();
  const mouseRayOriginTarget = new THREE.Vector3();
  const mouseRayDirTarget = new THREE.Vector3();
  const mouseLightTarget = new THREE.Vector3(0, 3, 2);
  const activePointers = new Set();
  let pointerHeld = false;
  let mouseMoving = false;
  let mouseStopTimer = 0;
  let boxSize = { w: 8, h: 6, d: 8 };

  const light = new THREE.PointLight(0xffffff, state.lightIntensity);
  light.position.copy(mouseLightTarget);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.radius = 20;
  light.shadow.bias = 0.01;
  scene.add(light);

  const glassMesh = new THREE.Mesh(
    new THREE.SphereGeometry(state.glassRadius, 64, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.5,
      transmission: 1,
      thickness: state.glassRadius * 2,
      ior: 1.5,
      side: THREE.DoubleSide,
    }),
  );
  scene.add(glassMesh);

  const glassBody = physicsAdapter.createSphereParticle({
    radius: state.glassRadius,
    position: [mouseLightTarget.x, mouseLightTarget.y, mouseLightTarget.z],
    mass: state.glassMass,
    restitution: 0.3,
    friction: 0.2,
  });

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    pointer.y = -(((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
    raycaster.setFromCamera(pointer, camera);
    mouseRayOriginTarget.copy(raycaster.ray.origin);
    mouseRayDirTarget.copy(raycaster.ray.direction);
    mouseMoving = true;
    clearTimeout(mouseStopTimer);
    mouseStopTimer = window.setTimeout(() => {
      mouseMoving = false;
    }, 50);
    const centerPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -boxSize.d * state.centerPlaneDepthRatio);
    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(centerPlane, hit)) {
      mouseLightTarget.copy(hit);
    }
  }

  function onPointerDown(event) {
    activePointers.add(event.pointerId);
    if (event.pointerType === 'touch') pointerHeld = activePointers.size >= 2;
    else pointerHeld = true;
    updatePointer(event);
  }

  function onPointerUp(event) {
    activePointers.delete(event.pointerId);
    if (event.pointerType === 'touch') pointerHeld = activePointers.size >= 2;
    else pointerHeld = false;
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', updatePointer);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  function update(delta, particles = []) {
    const easeFactor = 1 - Math.exp(-state.easeSpeed * delta);
    mouseRayOrigin.lerp(mouseRayOriginTarget, easeFactor);
    mouseRayDir.lerp(mouseRayDirTarget, easeFactor);

    const glassTransform = physicsAdapter.readTransform(glassBody);
    const gp = glassTransform.position;
    const gv = glassBody.linearVelocity ?? { x: 0, y: 0, z: 0 };
    physicsAdapter.applyForce(glassBody, {
      x: (mouseLightTarget.x - gp.x) * state.springStiffness - gv.x * state.springDamping,
      y: (mouseLightTarget.y - gp.y) * state.springStiffness - gv.y * state.springDamping + 9.81 * state.glassMass,
      z: (mouseLightTarget.z - gp.z) * state.springStiffness - gv.z * state.springDamping,
    });

    if (mouseMoving) {
      const ray = new THREE.Ray(mouseRayOrigin, mouseRayDir);
      const closest = new THREE.Vector3();
      const particlePos = new THREE.Vector3();
      const pushDir = new THREE.Vector3();
      for (const particle of particles) {
        const body = particle.body ?? particle;
        const transform = physicsAdapter.readTransform(body);
        particlePos.set(transform.position.x, transform.position.y, transform.position.z);
        ray.closestPointToPoint(particlePos, closest);
        const dist = closest.distanceTo(particlePos);
        if (dist < state.pushRadius) {
          pushDir.subVectors(particlePos, closest);
          if (pushDir.lengthSq() < 0.001) pushDir.set(0, 1, 0);
          pushDir.normalize();
          const strength = state.pushStrength * (1 - dist / state.pushRadius);
          physicsAdapter.applyImpulse(body, {
            x: pushDir.x * strength,
            y: pushDir.y * strength,
            z: pushDir.z * strength,
          });
        }
      }
    }

    const nextGlass = physicsAdapter.readTransform(glassBody);
    glassMesh.position.set(nextGlass.position.x, nextGlass.position.y, nextGlass.position.z);
    light.position.copy(glassMesh.position);
  }

  function resize(nextBoxSize) {
    boxSize = nextBoxSize;
  }

  function setOptions(options = {}) {
    Object.assign(state, options);
    light.intensity = state.lightIntensity;
  }

  function dispose() {
    clearTimeout(mouseStopTimer);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', updatePointer);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    scene.remove(light);
    scene.remove(glassMesh);
    glassMesh.geometry.dispose();
    glassMesh.material.dispose();
  }

  return {
    glassMesh,
    light,
    glassBody,
    state,
    update,
    resize,
    setOptions,
    isPointerHeld: () => pointerHeld,
    dispose,
  };
}
