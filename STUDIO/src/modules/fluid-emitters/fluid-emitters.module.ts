import type { ArtinosModule } from '../../registry/types';
import type { ParameterDef } from '@artinos/panelflow';
import { lazy } from 'react';

const FluidEmittersPreview = lazy(() => import('./FluidEmittersPreview'));

// Curated controls. `emitterType` rebuilds the EmitterSystem with that type;
// the rest map to the field renderer / EMITTER_INTENSITY.
const EMITTER_PARAMS: ParameterDef[] = [
  {
    key: 'emitterType',
    label: 'Emitter Type',
    type: 'enum',
    default: 'radial',
    options: [
      { label: 'Radial', value: 'radial' },
      { label: 'Point', value: 'point' },
      { label: 'Line', value: 'line' },
      { label: 'Area', value: 'area' },
      { label: 'Brush', value: 'brush' },
      { label: 'Vector', value: 'vector' },
      { label: 'Spline', value: 'spline' },
      { label: 'Heat', value: 'heat' },
    ],
    group: 'Emitter',
  },
  { key: 'intensity', label: 'Intensity', type: 'number', default: 1, min: 0, max: 3, step: 0.01, group: 'Emitter' },
  { key: 'blob', label: 'Splat Size', type: 'number', default: 1, min: 0.25, max: 3, step: 0.05, group: 'Field' },
  { key: 'fade', label: 'Trail Fade', type: 'number', default: 0.06, min: 0.01, max: 0.4, step: 0.01, group: 'Field' },
  { key: 'background', label: 'Background', type: 'color', default: '#05060c', group: 'Field' },
];

const fluidEmittersModule: ArtinosModule = {
  id: 'fluid-emitters',
  name: 'Fluid Emitters',
  category: 'particles',
  description:
    'The emitter system extracted from the WebGPU fluid project: a bank of source types (radial, point, line, area, wind, attractor, vector, spline — plus text/SVG/image samplers) that emit coloured dye/velocity splats every frame. Shown here painting a lightweight 2D dye field so each emitter type is visible standalone; the real value is the per-frame splat stream `{x,y,dx,dy,radius,color}` you feed into a fluid/particle field. Use as a procedural source/injection layer for the webgpu-fluid-sim or any field.',
  tags: ['emitters', 'particles', 'splats', 'procedural', 'source', 'dye', 'fluid', 'injection', 'generative'],
  schema: {
    id: 'fluid-emitters',
    name: 'Fluid Emitters',
    category: 'particles',
    parameters: EMITTER_PARAMS,
  },
  preview: FluidEmittersPreview,
  sourcePath: 'STUDIO/src/modules/fluid-emitters/engine/EmitterSystem.js',
  dependencies: ['three', '@artinos/panelflow'],
  usage:
    "import { EmitterSystem } from './modules/fluid-emitters/engine/EmitterSystem.js';\n\nconst emitters = new EmitterSystem();\nemitters.addEmitter('radial');\n// each frame:\nconst splats = emitters.resolveFrame({ dt, config: { EMITTERS_ENABLED: true, EMITTER_INTENSITY: 1 }, audio: { energy: 0, beat: false } });\n// splats: { x, y, dx, dy, radius, color }[]  — feed into your fluid/particle field",
  presets: {
    'Radial Bloom': { emitterType: 'radial', intensity: 1.2, fade: 0.05, blob: 1.2 },
    'Wind Field': { emitterType: 'wind', intensity: 1, fade: 0.08, blob: 0.8 },
    Attractor: { emitterType: 'attractor', intensity: 1.4, fade: 0.04, blob: 1 },
    'Point Fountain': { emitterType: 'point', intensity: 1, fade: 0.1, blob: 1 },
  },
  related: ['webgpu-fluid-sim', 'audio-reactive'],
  agentNotes:
    'Emitter system extracted (Mode B) full-fidelity from REF/WebGpu-Fluid-Simulation-master/src/emitters — copied verbatim under engine/ (EmitterSystem + EmitterTypes/* (13 types) + sampling/* (image/svg/text) + samplerHelpers). EmitterSystem.resolveFrame({dt,config,audio}) returns splats {x,y(0..1),dx,dy,radius,color:THREE.Color}; it reads only config.EMITTERS_ENABLED / EMITTER_INTENSITY / AUDIO_ENABLED / AUDIO_GAIN (no other coupling) and the only external dep is three Vector2 (math) — NOT a WebGPU module, renders on any browser via 2D canvas. createEmitterField.js owns an EmitterSystem (one emitter; switching emitterType rebuilds it) and paints splats additively into a fading 2D dye field — the field render is presentation; the emitter geometry is the real ported code. A gentle synthetic audio.energy pulse keeps audio-coupled emitters breathing (audio off). Bridge id "fluid-emitters". To use as an injection source elsewhere, instantiate EmitterSystem and pipe resolveFrame() splats into your field/solver (this is exactly how the fluid-studio replica wires it into webgpu-fluid-sim). The enum exposes only DYE-emitting types (radial/point/line/area/brush/vector/spline/heat — all verified to paint the 2D field). Force-only emitters (wind, attractor) push velocity not dye, so they render blank in this standalone dye field and are exposed only in fluid-studio (which has a velocity field); text/svg/image need sampled content and are present in the engine but omitted from the enum. Dropped: the Tweakpane emitter editor UI.',
  reuseNotes:
    'Procedural injection layer for fluids/particles, or a standalone generative dye visual. Pairs with webgpu-fluid-sim (feed splats into its splat() path) and audio-reactive (drive EMITTER_INTENSITY from the AudioFrame). Package-promotion candidate once reused outside ARTINOS (master guideline §14).',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default fluidEmittersModule;
