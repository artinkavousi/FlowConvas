import type { ArtinosModule } from '../../registry/types';
import BallPoolLab from './BallPoolLab';
import { BALL_POOL_PRESETS } from './local/presets/BallPoolPresets';
import { BALL_POOL_RELATED_MODULES, BALL_POOL_PROVENANCE } from './local/composition/ballPoolComposition';

const ballPoolLabMeta: ArtinosModule = {
  id: 'ball-pool',
  name: 'Ball Pool Lab',
  category: 'lab',
  description:
    'Faithful Mode B Lab replica of mrdoob Ball Pool #2: WebGPU SSGI/TRAA/Bloom room rendering, adaptive open-front box environment, Bounce rigid sphere physics, instanced colored particles, and a pointer-driven glass light collider composed from reusable ARTINOS modules.',
  tags: ['lab', 'replica', 'webgpu', 'tsl', 'three', 'physics', 'particles', 'bounce', 'room', 'ssgi', 'composition'],
  schema: {
    id: 'ball-pool',
    name: 'Ball Pool Lab',
    category: 'lab',
    parameters: [
      {
        key: 'preset',
        label: 'Preset',
        type: 'enum',
        default: 'codepen-original',
        options: [
          { label: 'CodePen Original', value: 'codepen-original' },
          { label: 'Dense Gallery', value: 'dense-gallery' },
          { label: 'Slow Glass', value: 'slow-glass' },
          { label: 'Low GI', value: 'low-gi' },
        ],
        group: 'Preset',
      },
      { key: 'paused', label: 'Paused', type: 'boolean', default: false, group: 'Playback' },
      { key: 'ballRadius', label: 'Ball Radius', type: 'number', default: 0.4, min: 0.1, max: 0.8, step: 0.01, group: 'Particles' },
      { key: 'fillRatio', label: 'Fill Ratio', type: 'number', default: 0.4, min: 0.05, max: 0.8, step: 0.01, group: 'Particles' },
      { key: 'packing', label: 'Packing', type: 'number', default: 0.6, min: 0.1, max: 1, step: 0.01, group: 'Particles' },
      { key: 'respawnCount', label: 'Respawn Count', type: 'number', default: 5, min: 1, max: 30, step: 1, group: 'Particles' },
      { key: 'boxHeight', label: 'Box Height', type: 'number', default: 6, min: 3, max: 10, step: 0.1, group: 'Room' },
      { key: 'boxDepth', label: 'Box Depth', type: 'number', default: 8, min: 4, max: 14, step: 0.1, group: 'Room' },
      { key: 'gravity', label: 'Gravity', type: 'number', default: -9.81, min: -30, max: 3, step: 0.1, group: 'Physics' },
      { key: 'restitution', label: 'World Restitution', type: 'number', default: 0.4, min: 0, max: 1, step: 0.01, group: 'Physics' },
      { key: 'friction', label: 'World Friction', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, group: 'Physics' },
      { key: 'glassRadius', label: 'Glass Radius', type: 'number', default: 0.8, min: 0.2, max: 1.6, step: 0.05, group: 'Pointer Glass' },
      { key: 'glassMass', label: 'Glass Mass', type: 'number', default: 5, min: 1, max: 16, step: 0.25, group: 'Pointer Glass' },
      { key: 'pushRadius', label: 'Push Radius', type: 'number', default: 1.5, min: 0.2, max: 4, step: 0.05, group: 'Pointer Glass' },
      { key: 'pushStrength', label: 'Push Strength', type: 'number', default: 5, min: 0, max: 20, step: 0.1, group: 'Pointer Glass' },
      { key: 'lightIntensity', label: 'Light Intensity', type: 'number', default: 80, min: 0, max: 180, step: 1, group: 'Lighting' },
      { key: 'toneMappingExposure', label: 'Exposure', type: 'number', default: 0.35, min: 0.05, max: 1.5, step: 0.01, group: 'Rendering' },
      { key: 'giIntensity', label: 'GI Intensity', type: 'number', default: 18, min: 0, max: 40, step: 0.5, group: 'Rendering' },
      { key: 'aoIntensity', label: 'AO Intensity', type: 'number', default: 0.55, min: 0, max: 2, step: 0.01, group: 'Rendering' },
      { key: 'bloomStrength', label: 'Bloom Strength', type: 'number', default: 0.25, min: 0, max: 2, step: 0.01, group: 'Rendering' },
      { key: 'pixelRatio', label: 'Pixel Ratio Cap', type: 'number', default: 1.5, min: 0.75, max: 2, step: 0.25, group: 'Performance' },
    ],
  },
  preview: BallPoolLab,
  sourcePath: 'STUDIO/src/labs/ball-pool/createBallPoolLab.js',
  dependencies: ['three', 'webgpu', '@perplexdotgg/bounce', '@artinos/panelflow', 'react'],
  usage:
    "import { createBallPoolLab } from './labs/ball-pool/createBallPoolLab.js';\n\nconst lab = createBallPoolLab(canvas, { preset: 'codepen-original' });\nlab.update({ giIntensity: 18, fillRatio: 0.4 });\n// pointer moves the glass light collider; hold pointer to respawn balls\n// on unmount: lab.dispose();",
  presets: BALL_POOL_PRESETS,
  related: BALL_POOL_RELATED_MODULES,
  agentNotes:
    `LAB - Mode B faithful replica of https://codepen.io/mrdoob/pen/dPpJMXB. ${BALL_POOL_PROVENANCE} createBallPoolLab(canvas, params) wires WebgpuSsgiRoomRenderer -> AdaptiveOpenFrontBoxRoom -> BounceRigidSphereAdapter -> UniversalPhysicsParticleSystem -> PointerGlassCollider. Preserved: WebGPU SSGI/TRAA/Bloom tone, responsive open-front room, red/green side walls, hidden front collision, colored instanced balls, Bounce rigid body feel, glass physical sphere/light, pointer ray pushes, and hold/two-finger respawn. Deviations: CodePen import map becomes npm imports; body-owned canvas becomes React canvas lifecycle; window sizing becomes container sizing; source constants become PANELFLOW controls. Bridge id is "ball-pool". Requires WebGPU and @perplexdotgg/bounce.`,
  reuseNotes:
    'Use this Lab as the source-fidelity composition. Reuse the canonical modules independently for other room-rendered physics scenes; Lab modules/ contains snapshots for portability.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default ballPoolLabMeta;
