import type { ArtinosModule } from '../../registry/types';
import PointerGlassColliderShowcase from './PointerGlassCollider.showcase';

const pointerGlassColliderMeta: ArtinosModule = {
  id: 'pointer-glass-collider',
  name: 'Pointer Glass Collider',
  category: 'input',
  description:
    'Reusable 3D pointer interaction module extracted from mrdoob Ball Pool #2: eased pointer ray, center-plane target, physical glass sphere, linked point light, spring force, ray-near-body impulses, hold state, and two-finger touch behavior.',
  tags: ['input', 'pointer', 'interaction', 'physics', 'glass', 'raycaster', 'three', 'touch'],
  schema: {
    id: 'pointer-glass-collider',
    name: 'Pointer Glass Collider',
    category: 'input',
    parameters: [
      { key: 'glassRadius', label: 'Glass Radius', type: 'number', default: 0.8, min: 0.2, max: 2, step: 0.05, group: 'Glass' },
      { key: 'glassMass', label: 'Glass Mass', type: 'number', default: 5, min: 0.5, max: 20, step: 0.1, group: 'Glass' },
      { key: 'springStiffness', label: 'Spring Stiffness', type: 'number', default: 500, min: 50, max: 1200, step: 10, group: 'Spring' },
      { key: 'springDamping', label: 'Spring Damping', type: 'number', default: 40, min: 0, max: 120, step: 1, group: 'Spring' },
      { key: 'pushRadius', label: 'Push Radius', type: 'number', default: 1.5, min: 0.1, max: 4, step: 0.05, group: 'Impulse' },
      { key: 'pushStrength', label: 'Push Strength', type: 'number', default: 5, min: 0, max: 20, step: 0.1, group: 'Impulse' },
      { key: 'lightIntensity', label: 'Light Intensity', type: 'number', default: 80, min: 0, max: 200, step: 1, group: 'Light' },
      { key: 'easeSpeed', label: 'Ease Speed', type: 'number', default: 8, min: 1, max: 30, step: 0.5, group: 'Motion' },
    ],
  },
  preview: PointerGlassColliderShowcase,
  sourcePath: 'STUDIO/src/modules/input/PointerGlassCollider.module.js',
  dependencies: ['three', 'react'],
  usage:
    "import { createPointerGlassCollider } from './modules/input/PointerGlassCollider.module.js';\n\nconst pointer = createPointerGlassCollider(canvas, camera, physicsAdapter, scene);\npointer.resize(boxSize);\npointer.update(dt, particles);\nif (pointer.isPointerHeld()) particles.respawn(5);\n// on unmount: pointer.dispose();",
  presets: {
    'CodePen Original': { glassRadius: 0.8, glassMass: 5, springStiffness: 500, springDamping: 40, pushRadius: 1.5, pushStrength: 5, lightIntensity: 80, easeSpeed: 8 },
    Gentle: { glassRadius: 0.7, glassMass: 8, springStiffness: 260, springDamping: 55, pushRadius: 1.25, pushStrength: 2.5, lightIntensity: 60, easeSpeed: 6 },
    Aggressive: { glassRadius: 0.9, glassMass: 4, springStiffness: 700, springDamping: 32, pushRadius: 2, pushStrength: 9, lightIntensity: 110, easeSpeed: 12 },
  },
  related: ['universal-physics-particles', 'bounce-rigid-sphere-adapter'],
  agentNotes:
    'Pointer/glass interaction extracted from https://codepen.io/mrdoob/pen/dPpJMXB and generalized behind a physics adapter. createPointerGlassCollider(canvas,camera,physicsAdapter,scene,options) owns pointer events, ray easing, center-plane target, glass MeshPhysicalMaterial sphere, point light, spring force, ray-near-particle impulses, hold/two-finger state, resize, setOptions, and dispose. Bridge id is "pointer-glass-collider".',
  reuseNotes:
    'Use in physics scenes where pointer motion should become a visible lit collider instead of a flat cursor. Pair with any compatible physics adapter.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default pointerGlassColliderMeta;
