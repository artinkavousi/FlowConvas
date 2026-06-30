import type { ArtinosModule } from '../../../registry/types';
import ParticleBoundariesShowcase from './ParticleBoundaries.showcase';

const SHAPE_OPTIONS = [
  { label: 'Box', value: 'BOX' },
  { label: 'Sphere', value: 'SPHERE' },
  { label: 'Cylinder', value: 'CYLINDER' },
];

const particleBoundariesMeta: ArtinosModule = {
  id: 'particle-boundaries',
  name: 'Particle Boundaries',
  category: 'physics/particles',
  description:
    'Particle boundary + collision system for MPM/particle sims: box / sphere / cylinder / dodecahedron containers (and a free-floating mode) with GPU (TSL) collision response, plus an optional glass-container visualization mesh. Exposes generateCollisionTSL(pos, vel, uniforms) for a solver g2p kernel and getBoundaryUniforms() to drive the shape. Reusable in any particle solver needing containment.',
  tags: ['physics', 'particles', 'boundaries', 'collision', 'container', 'mpm', 'tsl', 'webgpu', 'three'],
  schema: {
    id: 'particle-boundaries',
    name: 'Particle Boundaries',
    category: 'physics/particles',
    parameters: [
      { key: 'shape', label: 'Shape', type: 'enum', default: 'BOX', options: SHAPE_OPTIONS, group: 'Boundary' },
      { key: 'gravity', label: 'Gravity', type: 'number', default: 12, min: 0, max: 40, step: 1, group: 'Boundary' },
      { key: 'restitution', label: 'Restitution', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, group: 'Boundary' },
    ],
  },
  preview: ParticleBoundariesShowcase,
  sourcePath: 'STUDIO/src/modules/physics/particles/ParticleBoundaries.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { ParticleBoundaries, BoundaryShape } from './modules/physics/particles/ParticleBoundaries.module';\n\nconst b = new ParticleBoundaries({ gridSize: new THREE.Vector3(64,64,64), visualize: true });\nawait b.init();\nawait b.setShape(BoundaryShape.SPHERE); b.setEnabled(true);\nsolver.setBoundaries(b); // MLS-MPM g2p calls b.generateCollisionTSL(pos, vel, uniforms)\n// scene.add(b.object); // optional glass container",
  presets: {
    'Box bin': { shape: 'BOX', gravity: 14, restitution: 0.2 },
    'Sphere bowl': { shape: 'SPHERE', gravity: 12, restitution: 0.3 },
    Bouncy: { shape: 'BOX', gravity: 18, restitution: 0.8 },
  },
  related: ['mls-mpm-solver', 'particle-force-fields', 'particle-renderer-system'],
  agentNotes:
    "Ported faithfully from ref/AURORA/src/PARTICLESYSTEM/physic/boundaries.ts (transpiled with esbuild; collision math verbatim; method-chained TSL, no operator rewrite). Exports class ParticleBoundaries + enums BoundaryShape {NONE:0,BOX:1,SPHERE:2,CYLINDER:3,DODECAHEDRON:4}, CollisionMode, ParticleDistribution. ctor(config) where config = { gridSize:Vector3, wallThickness, wallStiffness, restitution, friction, visualize, audioReactive, useViewportTracking, ... }. await init(); await setShape(BoundaryShape.X); setEnabled(bool); setVisible(bool); `object` = optional glass-container THREE.Object3D (when visualize:true). KEY GPU method: generateCollisionTSL(particlePosition, particleVelocity, { dt, shapeType:int, shapeMin:Vector3, shapeMax:Vector3, shapeCenter:Vector3, shapeRadius:float, restitution:float, damping:float, enabled?:int }) — call INSIDE a compute Fn; it predicts xN=pos+vel*dt*3 and mutates velocity per shape (box/sphere/cylinder/dodeca/free). getBoundaryUniforms() returns { enabled, shapeInt, wallMin, wallMax, gridCenter, boundaryRadius, wallStiffness, viewportPulse, distributionMode, surfaceDistance, flowSpeed } to feed those uniforms. Works in gridSize (0..64) space. Co-located asset ./assets/boxSlightlySmooth.obj?url (box container mesh). The MLS-MPM solver wires it via setBoundaries(). Bridge id 'particle-boundaries'. Showcase: gravity-fed point cloud settling into the chosen container (no MLS-MPM).",
  reuseNotes:
    'Reuse to contain any GPU particle system. generateCollisionTSL drops into a solver g2p kernel; getBoundaryUniforms() drives the shape. Pairs with mls-mpm-solver (its main consumer) + particle-renderer-system.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default particleBoundariesMeta;
