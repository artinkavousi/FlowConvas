import type { ArtinosModule } from '../../registry/types';
import PointerVelocitySplatShowcase from './PointerVelocitySplat.showcase';

const pointerVelocitySplatMeta: ArtinosModule = {
  id: 'pointer-velocity-splat',
  name: 'Pointer Velocity Splat',
  category: 'input',
  description:
    'Universal 2D pointer interaction: tracks normalized pointer position + per-frame velocity (y-up) and emits splat events { x, y, vx, vy } with velocity decay. Mouse + touch, canvas-scoped. Drives fluids, paint systems, ripple/heat fields, and 2D particle fields. Extracted from the TSL_Fluid CodePen pointer handling.',
  tags: ['input', 'pointer', 'touch', 'splat', 'velocity', 'interaction'],
  schema: {
    id: 'pointer-velocity-splat',
    name: 'Pointer Velocity Splat',
    category: 'input',
    parameters: [
      { key: 'dotScale', label: 'Dot Scale', type: 'number', default: 600, min: 50, max: 2000, step: 10, group: 'Demo' },
      { key: 'trailFade', label: 'Trail Fade', type: 'number', default: 0.08, min: 0.01, max: 0.5, step: 0.01, group: 'Demo' },
    ],
  },
  preview: PointerVelocitySplatShowcase,
  sourcePath: 'STUDIO/src/modules/input/PointerVelocitySplat.module.js',
  dependencies: ['react'],
  usage:
    "import { createPointerVelocitySplat } from './modules/input/PointerVelocitySplat.module.js';\n\nconst pointer = createPointerVelocitySplat(canvas, { velocityScale: 1 });\nconst { x, y, vx, vy } = pointer.read();   // normalized, y-up\npointer.tick();                            // decay velocity once per frame\npointer.dispose();",
  presets: {
    Default: { dotScale: 600, trailFade: 0.08 },
    'Long Trails': { dotScale: 800, trailFade: 0.03 },
  },
  related: ['tsl-stable-fluids-2d'],
  agentNotes:
    'Universal 2D splat input. createPointerVelocitySplat(canvas, { velocityScale, splatRadius, decay, enabled }) -> { onSplat(cb)->unsub, read(), tick(), setOptions(), reset(), dispose() }. Position normalized to the canvas bounding rect, origin bottom-left (y up). Per-frame order matches the source: consume read() -> use -> tick() (decay 0.95). No Three dependency. Ported from CodePen pashafd/OPVGJav (REF/tsl-fluid setupControls/render). Deviation: normalizes by canvas rect (not window) for reuse. Distinct from the 3D ray-based pointer-glass-collider. Bridge id "pointer-velocity-splat"; showcase is a pure 2D-canvas trail demo (no WebGPU).',
  reuseNotes: 'Interaction layer for fluids/paint/ripples; consumed by the fluid lab + solver showcase.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default pointerVelocitySplatMeta;
