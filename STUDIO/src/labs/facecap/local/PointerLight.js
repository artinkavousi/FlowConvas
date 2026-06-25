import * as THREE from 'three/webgpu';

export function createPointerLight(scene, camera, depth = 1) {
  const light = new THREE.PointLight(0xffffff, 2, 20);
  light.castShadow = true;
  light.shadow.bias = -0.001;
  scene.add(light);

  const target = new THREE.Vector3();
  const pointer = new THREE.Vector2();

  function onPointerMove(x, y, width, height) {
    pointer.x = (x / width) * 2 - 1;
    pointer.y = -(y / height) * 2 + 1;

    target.set(pointer.x, pointer.y, 0);
    target.unproject(camera);

    const direction = target.sub(camera.position).normalize();
    const distance = (depth - camera.position.z) / direction.z;

    target.copy(camera.position).add(direction.multiplyScalar(distance));
  }

  function update() {
    light.position.lerp(target, 0.1);
  }

  function dispose() {
    scene.remove(light);
    light.dispose();
  }

  return {
    light,
    target,
    onPointerMove,
    update,
    dispose,
  };
}
