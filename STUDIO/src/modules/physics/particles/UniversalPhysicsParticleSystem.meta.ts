import type { ArtinosModule } from '../../../registry/types';
import UniversalPhysicsParticleSystemShowcase from './UniversalPhysicsParticleSystem.showcase';

const universalPhysicsParticleSystemMeta: ArtinosModule = {
  id: 'universal-physics-particles',
  name: 'Universal Physics Particles',
  category: 'physics/particles',
  description:
    'General physics-driven particle/instance system extracted from mrdoob Ball Pool #2: particle allocation, spawn bounds, color palettes, instanced sphere rendering, respawn/reset, transform sync, and an adapter contract for physics backends.',
  tags: ['particles', 'physics', 'webgpu', 'three', 'instancing', 'adapter', 'rigid-body', 'reusable'],
  schema: {
    id: 'universal-physics-particles',
    name: 'Universal Physics Particles',
    category: 'physics/particles',
    parameters: [
      { key: 'particleCount', label: 'Particle Count', type: 'number', default: 0, min: 0, max: 500, step: 1, group: 'Particles' },
      { key: 'particleRadius', label: 'Particle Radius', type: 'number', default: 0.4, min: 0.05, max: 1, step: 0.01, group: 'Particles' },
      { key: 'fillRatio', label: 'Fill Ratio', type: 'number', default: 0.4, min: 0.02, max: 1, step: 0.01, group: 'Particles' },
      { key: 'packing', label: 'Packing', type: 'number', default: 0.6, min: 0.1, max: 1, step: 0.01, group: 'Particles' },
      { key: 'materialRoughness', label: 'Roughness', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, group: 'Material' },
      { key: 'materialMetalness', label: 'Metalness', type: 'number', default: 0.1, min: 0, max: 1, step: 0.01, group: 'Material' },
      { key: 'respawnCount', label: 'Respawn Count', type: 'number', default: 5, min: 1, max: 50, step: 1, group: 'Lifecycle' },
    ],
  },
  preview: UniversalPhysicsParticleSystemShowcase,
  sourcePath: 'STUDIO/src/modules/physics/particles/UniversalPhysicsParticleSystem.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createUniversalPhysicsParticles } from './modules/physics/particles/UniversalPhysicsParticleSystem.module.js';\n\nconst particles = createUniversalPhysicsParticles(scene, physicsAdapter, { particleRadius: 0.4 });\nparticles.rebuild(bounds);\nparticles.sync();\nparticles.respawn(5);\n// on unmount: particles.dispose();",
  presets: {
    'CodePen Density': { particleCount: 0, particleRadius: 0.4, fillRatio: 0.4, packing: 0.6, materialRoughness: 0.3, materialMetalness: 0.1, respawnCount: 5 },
    Sparse: { particleCount: 80, particleRadius: 0.38, fillRatio: 0.18, packing: 0.55, materialRoughness: 0.35, materialMetalness: 0.05, respawnCount: 3 },
    Dense: { particleCount: 0, particleRadius: 0.32, fillRatio: 0.55, packing: 0.68, materialRoughness: 0.24, materialMetalness: 0.15, respawnCount: 8 },
  },
  related: ['bounce-rigid-sphere-adapter', 'adaptive-open-front-box-room'],
  agentNotes:
    'Universal particle system extracted from the balls in https://codepen.io/mrdoob/pen/dPpJMXB, generalized behind a physics adapter. createUniversalPhysicsParticles(scene, adapter, options) owns InstancedMesh rendering, particle allocation, density count, color assignment, rebuild(bounds), sync(), respawn(), update(), and dispose(). It expects adapter methods createSphereParticle/readTransform/resetBody/applyImpulse/applyForce/step. Bridge id is "universal-physics-particles".',
  reuseNotes:
    'Use with Bounce, Rapier, Cannon, custom WebGPU compute, or non-rigid adapters by implementing the adapter contract. This is the reusable particle foundation; source-specific ball-pool composition lives in the Lab.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default universalPhysicsParticleSystemMeta;
