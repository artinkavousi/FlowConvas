import type { ArtinosModule } from '../../registry/types';
import ThirdPersonCharacterNavigationShowcase from './ThirdPersonCharacterNavigation.showcase';

const thirdPersonCharacterNavigationMeta: ArtinosModule = {
  id: 'third-person-character-navigation',
  name: 'Third-Person Character Navigation',
  category: 'input',
  description:
    'False Earth-derived astronaut navigation module: loads the copied character and animation GLBs, applies source tank/third-person movement smoothing, blends Idle/Walk/Run/Back actions, and follows with a third-person camera.',
  tags: ['false-earth', 'character', 'navigation', 'third-person', 'animation', 'input', 'three', 'webgpu'],
  schema: {
    id: 'third-person-character-navigation',
    name: 'Third-Person Character Navigation',
    category: 'input',
    parameters: [
      { key: 'autoMove', label: 'Auto Move', type: 'boolean', default: true, group: 'Playback' },
      { key: 'run', label: 'Run', type: 'boolean', default: true, group: 'Playback' },
      {
        key: 'cameraMode',
        label: 'Camera Mode',
        type: 'enum',
        default: 'follow',
        options: [
          { label: 'Follow', value: 'follow' },
          { label: 'FPV', value: 'fpv' },
          { label: 'Detached', value: 'detached' },
        ],
        group: 'Camera',
      },
      { key: 'walkSpeed', label: 'Walk Speed', type: 'number', default: 1, min: 0, max: 4, step: 0.05, group: 'Movement' },
      { key: 'runSpeed', label: 'Run Speed', type: 'number', default: 3.5, min: 0, max: 8, step: 0.05, group: 'Movement' },
      { key: 'rotateSpeed', label: 'Rotate Speed', type: 'number', default: 2.5, min: 0, max: 8, step: 0.05, group: 'Movement' },
      { key: 'speedLerpFactor', label: 'Speed Lerp', type: 'number', default: 0.1, min: 0.01, max: 1, step: 0.01, group: 'Smoothing' },
      { key: 'rotationLerpFactor', label: 'Rotation Lerp', type: 'number', default: 0.15, min: 0.01, max: 1, step: 0.01, group: 'Smoothing' },
      { key: 'animBlendLerpFactor', label: 'Anim Blend', type: 'number', default: 0.15, min: 0.01, max: 1, step: 0.01, group: 'Smoothing' },
      { key: 'orbitRadius', label: 'Orbit Radius', type: 'number', default: 8, min: 2, max: 20, step: 0.25, group: 'Camera' },
      { key: 'cameraHeight', label: 'Camera Height', type: 'number', default: 4.5, min: 1, max: 12, step: 0.25, group: 'Camera' },
      { key: 'cameraDistance', label: 'Camera Distance', type: 'number', default: 9, min: 3, max: 22, step: 0.25, group: 'Camera' },
      { key: 'modelScale', label: 'Model Scale', type: 'number', default: 1, min: 0.2, max: 3, step: 0.05, group: 'Render' },
      { key: 'pixelRatio', label: 'Pixel Ratio', type: 'number', default: 1.5, min: 0.75, max: 2, step: 0.05, group: 'Render' },
    ],
  },
  preview: ThirdPersonCharacterNavigationShowcase,
  sourcePath: 'STUDIO/src/modules/input/ThirdPersonCharacterNavigation.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createThirdPersonCharacterNavigation } from './modules/input/ThirdPersonCharacterNavigation.module.js';\n\nconst character = await createThirdPersonCharacterNavigation(canvas, { autoMove: true, run: true });\ncharacter.update({ runSpeed: 4.2 });\ncharacter.resize();\ncharacter.dispose();",
  presets: {
    'False Earth run loop': { autoMove: true, run: true, walkSpeed: 1, runSpeed: 3.5, rotateSpeed: 2.5 },
    'Slow walk': { autoMove: true, run: false, walkSpeed: 0.9, runSpeed: 2.4, rotateSpeed: 1.6 },
  },
  related: ['tsl-gpu-grass-field', 'tsl-vat-lifecycle-instances', 'pointer-raycast-force'],
  agentNotes:
    'Mode B canonical module from False Earth commit 74cc91c. Loads copied source assets from /labs/false-earth/models: Astronaut.glb, Idle.glb, Walking.glb, Running.glb, WalkingBack.glb. Preserves source movement config values, tank-style rotation/speed lerp, animation weight blending, and follow/FPV/detached camera modes. Dropped for standalone module: R3F hooks, Drei useAnimations wrapper, KeyboardMapper, footstep audio, and store publishing; those belong in the Lab composition. Bridge id is "third-person-character-navigation".',
  reuseNotes:
    'Use as a reusable local character controller/preview layer. The final False Earth Lab should map PANELFLOW or keyboard input into update() rather than relying on the standalone autoMove demo path.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default thirdPersonCharacterNavigationMeta;
