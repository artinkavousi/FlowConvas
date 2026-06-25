import type { ArtinosModule } from '../../../registry/types';
import BounceRigidSphereAdapterShowcase from './BounceRigidSphereAdapter.showcase';

const bounceRigidSphereAdapterMeta: ArtinosModule = {
  id: 'bounce-rigid-sphere-adapter',
  name: 'Bounce Rigid Sphere Adapter',
  category: 'physics/particles',
  description:
    'Reusable @perplexdotgg/bounce adapter extracted from mrdoob Ball Pool #2: world setup, rigid sphere body creation, static box colliders, force/impulse application, body reset, transform reads, and fixed-step advancement.',
  tags: ['physics', 'particles', 'bounce', 'rigid-body', 'adapter', 'sphere', 'collision'],
  schema: {
    id: 'bounce-rigid-sphere-adapter',
    name: 'Bounce Rigid Sphere Adapter',
    category: 'physics/particles',
    parameters: [
      { key: 'gravity', label: 'Gravity', type: 'number', default: -9.81, min: -30, max: 5, step: 0.1, group: 'World' },
      { key: 'solveVelocityIterations', label: 'Velocity Iterations', type: 'number', default: 6, min: 1, max: 16, step: 1, group: 'Solver' },
      { key: 'solvePositionIterations', label: 'Position Iterations', type: 'number', default: 2, min: 1, max: 12, step: 1, group: 'Solver' },
      { key: 'linearDamping', label: 'Linear Damping', type: 'number', default: 0.1, min: 0, max: 2, step: 0.01, group: 'Material' },
      { key: 'angularDamping', label: 'Angular Damping', type: 'number', default: 0.1, min: 0, max: 2, step: 0.01, group: 'Material' },
      { key: 'restitution', label: 'Restitution', type: 'number', default: 0.4, min: 0, max: 1, step: 0.01, group: 'Material' },
      { key: 'friction', label: 'Friction', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, group: 'Material' },
    ],
  },
  preview: BounceRigidSphereAdapterShowcase,
  sourcePath: 'STUDIO/src/modules/physics/particles/BounceRigidSphereAdapter.module.js',
  dependencies: ['@perplexdotgg/bounce', 'react'],
  usage:
    "import { createBounceRigidSphereAdapter } from './modules/physics/particles/BounceRigidSphereAdapter.module.js';\n\nconst adapter = createBounceRigidSphereAdapter({ gravity: -9.81 });\nadapter.createBoxCollider(wallDescriptor);\nconst body = adapter.createSphereParticle({ radius: 0.4, position: [0, 3, 0] });\nadapter.step(1 / 60, dt);",
  presets: {
    'CodePen Original': { gravity: -9.81, solveVelocityIterations: 6, solvePositionIterations: 2, linearDamping: 0.1, angularDamping: 0.1, restitution: 0.4, friction: 0.5 },
    Bouncy: { gravity: -8, solveVelocityIterations: 8, solvePositionIterations: 3, linearDamping: 0.03, angularDamping: 0.04, restitution: 0.7, friction: 0.25 },
  },
  related: ['universal-physics-particles', 'pointer-glass-collider'],
  agentNotes:
    'Bounce physics adapter extracted from https://codepen.io/mrdoob/pen/dPpJMXB. createBounceRigidSphereAdapter(options) returns a backend contract for universal-physics-particles: createSphereParticle, createBoxCollider, readTransform, resetBody, applyImpulse, applyForce, step, resetWorld, and dispose. It isolates @perplexdotgg/bounce so particle/render modules do not hard-depend on Bounce. Bridge id is "bounce-rigid-sphere-adapter".',
  reuseNotes:
    'Use this adapter when a module wants real rigid-body sphere collisions but should keep rendering/particle logic backend-agnostic.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default bounceRigidSphereAdapterMeta;
