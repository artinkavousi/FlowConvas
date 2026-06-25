import type { ArtinosModule } from '../../registry/types';
import PointerRaycastForceShowcase from './PointerRaycastForce.showcase';

const pointerRaycastForceMeta: ArtinosModule = {
  id: 'pointer-raycast-force',
  name: 'Pointer Raycast Force',
  category: 'input',
  description:
    'Universal pointer→ray→plane-intersection interaction model: turns pointer moves into a world-space ray (origin + direction), its intersection with an injectable interaction plane, and a per-move force vector. Exactly the contract a 3D particle sim needs for mouse forces (MLS-MPM setMouseRay).',
  tags: ['input', 'pointer', 'raycaster', 'interaction', 'three', 'force', 'mouse'],
  schema: {
    id: 'pointer-raycast-force',
    name: 'Pointer Raycast Force',
    category: 'input',
    parameters: [
      { key: 'planeDepth', label: 'Plane Depth', type: 'number', default: 0.2, min: -2, max: 2, step: 0.05, group: 'Interaction' },
      { key: 'forceScale', label: 'Force Scale', type: 'number', default: 30, min: 1, max: 100, step: 1, group: 'Interaction' },
    ],
  },
  preview: PointerRaycastForceShowcase,
  sourcePath: 'STUDIO/src/modules/input/PointerRaycastForce.module.js',
  dependencies: ['three', 'react'],
  usage:
    "import { createPointerRaycastForce } from './modules/input/PointerRaycastForce.module';\n\nconst pointer = createPointerRaycastForce(canvas, camera, { planeNormal: [0,0,-1], planeConstant: 0.2 });\n// per frame:\nconst { origin, direction, point, force, active } = pointer.read();\nif (active) sim.setMouseRay(origin, direction, point); // MLS-MPM contract\npointer.tick();\n// pointer.dispose();",
  presets: {
    'Center plane': { planeDepth: 0.2, forceScale: 30 },
    'Strong push': { planeDepth: 0.2, forceScale: 80 },
    'Far plane': { planeDepth: 1.0, forceScale: 30 },
  },
  related: ['mls-mpm-solver', 'particle-force-fields'],
  agentNotes:
    'Extracted from ref/AURORA/src/APP.ts (onMouseMove + raycaster + THREE.Plane + the mlsMpmSim.setMouseRay(origin, direction, point) call). createPointerRaycastForce(domElement, camera, options) attaches pointermove/pointerleave listeners. read() returns live THREE.Vector3 refs { origin, direction, point, force, active } — do not mutate them; force is the intersection delta since the last move × forceScale. Call tick() each frame after consuming force so a stale delta is not re-applied. setCamera/setPlane/setForceScale for late binding (AURORA creates the camera after input wiring). Plane convention: normal·x + constant = 0 (AURORA used normal (0,0,-1), constant 0.2). Bridge id "pointer-raycast-force".',
  reuseNotes:
    'Drop-in mouse interaction for any THREE scene that needs a world-space pointer ray + interaction-plane hit + drag force. Pairs with mls-mpm-solver and particle-force-fields.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default pointerRaycastForceMeta;
