import { World } from '@perplexdotgg/bounce';

export const bounceRigidSphereAdapterDefaults = {
  gravity: -9.81,
  solveVelocityIterations: 6,
  solvePositionIterations: 2,
  linearDamping: 0.1,
  angularDamping: 0.1,
  restitution: 0.4,
  friction: 0.5,
};

export function createBounceRigidSphereAdapter(options = {}) {
  const state = { ...bounceRigidSphereAdapterDefaults, ...options };
  let world = null;
  const dynamicBodies = new Set();
  const staticBodies = new Set();

  function createWorld() {
    world = new World({
      gravity: [0, state.gravity, 0],
      solveVelocityIterations: state.solveVelocityIterations,
      solvePositionIterations: state.solvePositionIterations,
      linearDamping: state.linearDamping,
      angularDamping: state.angularDamping,
      restitution: state.restitution,
      friction: state.friction,
    });
  }

  function resetWorld(options = {}) {
    Object.assign(state, options);
    dynamicBodies.clear();
    staticBodies.clear();
    createWorld();
  }

  createWorld();

  function createSphereParticle({ radius, position, mass = 1, restitution = 0.5, friction = 0.4 }) {
    const shape = world.createSphere({ radius });
    const body = world.createDynamicBody({
      shape,
      position,
      mass,
      restitution,
      friction,
    });
    dynamicBodies.add(body);
    return body;
  }

  function createBoxCollider(wall) {
    const shape = world.createBox({ width: wall.size[0], height: wall.size[1], depth: wall.size[2] });
    const body = world.createStaticBody({ shape, position: wall.pos });
    staticBodies.add(body);
    return body;
  }

  function clearStaticColliders() {
    resetWorld();
  }

  function readTransform(body) {
    const p = body.position;
    const q = body.orientation;
    return {
      position: { x: p.x, y: p.y, z: p.z },
      orientation: { x: q.x, y: q.y, z: q.z, w: q.w },
    };
  }

  function resetBody(body, reset) {
    body.position.set(reset.position);
    body.linearVelocity.set(reset.linearVelocity ?? [0, 0, 0]);
    body.angularVelocity.set(reset.angularVelocity ?? [0, 0, 0]);
    body.commitChanges();
  }

  function applyImpulse(body, impulse) {
    body.applyLinearImpulse({ x: impulse.x, y: impulse.y, z: impulse.z });
  }

  function applyForce(body, force) {
    body.applyLinearForce({ x: force.x, y: force.y, z: force.z });
  }

  function step(fixedDelta = 1 / 60, delta = fixedDelta) {
    world.advanceTime(fixedDelta, delta);
  }

  function dispose() {
    dynamicBodies.clear();
    staticBodies.clear();
    world = null;
  }

  return {
    get world() {
      return world;
    },
    state,
    resetWorld,
    createSphereParticle,
    createBoxCollider,
    clearStaticColliders,
    readTransform,
    resetBody,
    applyImpulse,
    applyForce,
    step,
    dispose,
  };
}
