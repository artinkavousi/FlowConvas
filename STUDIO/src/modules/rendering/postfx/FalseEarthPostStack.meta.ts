import type { ArtinosModule } from '../../../registry/types';
import FalseEarthPostStackShowcase from './FalseEarthPostStack.showcase';

const falseEarthPostStackMeta: ArtinosModule = {
  id: 'false-earth-post-stack',
  name: 'False Earth Post Stack',
  category: 'rendering/postfx',
  description:
    'False Earth WebGPU/TSL effects composer: source scene pass, beam-scene depth composition, helmet distortion/vignette, DoF, bloom, SMAA toggle, and Reinhard tone mapping exposure.',
  tags: ['false-earth', 'webgpu', 'tsl', 'postfx', 'bloom', 'dof', 'smaa', 'helmet', 'beam'],
  schema: {
    id: 'false-earth-post-stack',
    name: 'False Earth Post Stack',
    category: 'rendering/postfx',
    parameters: [
      { key: 'highQuality', label: 'High Quality', type: 'boolean', default: true, group: 'Quality' },
      { key: 'bloomEnabled', label: 'Bloom', type: 'boolean', default: true, group: 'Bloom' },
      { key: 'bloomThreshold', label: 'Threshold', type: 'number', default: 0.35, min: 0, max: 1, step: 0.01, group: 'Bloom' },
      { key: 'bloomStrength', label: 'Strength', type: 'number', default: 0.3, min: 0, max: 3, step: 0.01, group: 'Bloom' },
      { key: 'bloomRadius', label: 'Radius', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, group: 'Bloom' },
      { key: 'dofEnabled', label: 'Depth of Field', type: 'boolean', default: true, group: 'Depth of Field' },
      { key: 'focusDistance', label: 'Focus Distance', type: 'number', default: 1.3, min: 0, max: 100, step: 0.1, group: 'Depth of Field' },
      { key: 'focalLength', label: 'Focal Length', type: 'number', default: 25, min: 0.01, max: 100, step: 0.1, group: 'Depth of Field' },
      { key: 'bokehScale', label: 'Bokeh Scale', type: 'number', default: 5, min: 0, max: 10, step: 0.1, group: 'Depth of Field' },
      { key: 'helmetStrength', label: 'Helmet', type: 'number', default: 0, min: 0, max: 1, step: 0.01, group: 'Camera Mode' },
      { key: 'toneMappingEnabled', label: 'Tone Mapping', type: 'boolean', default: true, group: 'Tone' },
      { key: 'exposure', label: 'Exposure', type: 'number', default: 1.1, min: 0.1, max: 2, step: 0.01, group: 'Tone' },
      { key: 'smaaEnabled', label: 'SMAA', type: 'boolean', default: false, group: 'Quality' },
      { key: 'pixelRatio', label: 'Pixel Ratio', type: 'number', default: 1.5, min: 0.75, max: 2, step: 0.05, group: 'Quality' },
    ],
  },
  preview: FalseEarthPostStackShowcase,
  sourcePath: 'STUDIO/src/modules/rendering/postfx/FalseEarthPostStack.module.js',
  dependencies: ['three', 'webgpu', 'tsl', 'react'],
  usage:
    "import { createFalseEarthPostStack } from './modules/rendering/postfx/FalseEarthPostStack.module.js';\n\nconst fx = await createFalseEarthPostStack(canvas, { scene, beamScene, camera });\nrenderer.setAnimationLoop(() => fx.render({ focusTarget: character }));\nfx.update({ helmetStrength: 1, bloomStrength: 0.4 });\nfx.dispose();",
  presets: {
    TPS: { helmetStrength: 0, dofEnabled: true, bloomEnabled: true, exposure: 1.1 },
    FPV: { helmetStrength: 1, dofEnabled: false, bloomEnabled: true, exposure: 1.05 },
    Performance: { highQuality: false, dofEnabled: false, bloomEnabled: false, smaaEnabled: false, pixelRatio: 1 },
  },
  related: ['tsl-cosmic-beam-waves', 'tsl-gpu-grass-field', 'third-person-character-navigation', 'webgpu-bloom-composer'],
  agentNotes:
    'Mode B canonical module from False Earth commit 74cc91c Effects.tsx/useEffectsControls.ts. Preserves source defaults: bloom threshold 0.35, strength 0.3, radius 0.5; TPS DoF focal length 25/bokeh 5/autofocus; Reinhard tone mapping with exposure^4; beam scene composited by depth difference; optional FPV helmet distortion/vignette and SMAA. Bridge id is "false-earth-post-stack".',
  reuseNotes:
    'Use when a WebGPU scene has a separate emissive beam/FX scene that should composite over terrain by depth while keeping False Earth camera-mode effects.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default falseEarthPostStackMeta;
