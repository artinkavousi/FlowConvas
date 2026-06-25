import type { ArtinosModule } from '../../../registry/types';
import AdaptiveOpenFrontBoxRoomShowcase from './AdaptiveOpenFrontBoxRoom.showcase';

const adaptiveOpenFrontBoxRoomMeta: ArtinosModule = {
  id: 'adaptive-open-front-box-room',
  name: 'Adaptive Open-Front Box Room',
  category: 'rendering/environments',
  description:
    'Reusable adaptive open-front box room extracted from mrdoob Ball Pool #2: responsive width from camera FOV/aspect, white floor/ceiling/back, red/green side walls, hidden optional collision front, wall descriptors, and camera fit logic.',
  tags: ['three', 'environment', 'room', 'cornell-box', 'adaptive', 'camera', 'webgpu', 'scene'],
  schema: {
    id: 'adaptive-open-front-box-room',
    name: 'Adaptive Open-Front Box Room',
    category: 'rendering/environments',
    parameters: [
      { key: 'boxHeight', label: 'Box Height', type: 'number', default: 6, min: 2, max: 12, step: 0.1, group: 'Dimensions' },
      { key: 'boxDepth', label: 'Box Depth', type: 'number', default: 8, min: 2, max: 16, step: 0.1, group: 'Dimensions' },
      { key: 'wallThickness', label: 'Wall Thickness', type: 'number', default: 0.5, min: 0.05, max: 1.5, step: 0.05, group: 'Dimensions' },
      { key: 'cameraFov', label: 'Camera FOV', type: 'number', default: 45, min: 20, max: 80, step: 1, group: 'Camera' },
      { key: 'leftColor', label: 'Left Wall', type: 'color', default: '#ff2222', group: 'Materials' },
      { key: 'rightColor', label: 'Right Wall', type: 'color', default: '#22ff22', group: 'Materials' },
      { key: 'floorColor', label: 'Floor', type: 'color', default: '#eeeeee', group: 'Materials' },
      { key: 'showCeiling', label: 'Ceiling', type: 'boolean', default: true, group: 'Walls' },
      { key: 'showBackWall', label: 'Back Wall', type: 'boolean', default: true, group: 'Walls' },
      { key: 'collisionFront', label: 'Collision Front', type: 'boolean', default: true, group: 'Walls' },
    ],
  },
  preview: AdaptiveOpenFrontBoxRoomShowcase,
  sourcePath: 'STUDIO/src/modules/rendering/environments/AdaptiveOpenFrontBoxRoom.module.js',
  dependencies: ['three', 'react'],
  usage:
    "import { createAdaptiveOpenFrontBoxRoom } from './modules/rendering/environments/AdaptiveOpenFrontBoxRoom.module.js';\n\nconst room = createAdaptiveOpenFrontBoxRoom(scene, { boxHeight: 6, boxDepth: 8 });\nroom.rebuild(width, height, { createCollisionWall });\nroom.fitCamera(camera, width, height);\n// on unmount: room.dispose();",
  presets: {
    'CodePen Original': { boxHeight: 6, boxDepth: 8, wallThickness: 0.5, cameraFov: 45, leftColor: '#ff2222', rightColor: '#22ff22', floorColor: '#eeeeee', showCeiling: true, showBackWall: true, collisionFront: true },
    Gallery: { boxHeight: 5, boxDepth: 7, wallThickness: 0.35, cameraFov: 42, leftColor: '#d946ef', rightColor: '#14b8a6', floorColor: '#f3f4f6', showCeiling: true, showBackWall: true, collisionFront: true },
  },
  related: ['webgpu-ssgi-room-renderer', 'universal-physics-particles'],
  agentNotes:
    'Environment module extracted from https://codepen.io/mrdoob/pen/dPpJMXB. createAdaptiveOpenFrontBoxRoom(scene, options) returns wall descriptors, visual wall meshes, boxSize, rebuild(width,height,hooks), fitCamera(camera,width,height), update, and dispose. It does not depend on Bounce; pass hooks.createCollisionWall(descriptor) to create physics colliders. Bridge id is "adaptive-open-front-box-room".',
  reuseNotes:
    'Use as a reusable Cornell-box style stage for physics, product, particle, or object scenes. Pair with any renderer and any physics adapter.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default adaptiveOpenFrontBoxRoomMeta;
