import type { ArtinosModule } from '../../../registry/types';
import TslFieldColorDisplayShowcase from './TslFieldColorDisplay.showcase';

const tslFieldColorDisplayMeta: ArtinosModule = {
  id: 'tsl-field-color-display',
  name: 'TSL Field Color Display',
  category: 'rendering/screenspace',
  description:
    'Universal fullscreen display of a GPU storage field as screen color: maps up to three float fields (R/G/B), sampled at the current uv->cell, onto a fullscreen quad colorNode. Visualizes ANY field — dye, velocity magnitude, pressure, heat — not just fluid dye. Extracted from the TSL_Fluid CodePen display shader.',
  tags: ['rendering', 'screenspace', 'tsl', 'webgpu', 'display', 'visualization', 'three'],
  schema: {
    id: 'tsl-field-color-display',
    name: 'TSL Field Color Display',
    category: 'rendering/screenspace',
    parameters: [
      { key: 'exposure', label: 'Exposure', type: 'number', default: 1, min: 0, max: 3, step: 0.05, group: 'Display' },
    ],
  },
  preview: TslFieldColorDisplayShowcase,
  sourcePath: 'STUDIO/src/modules/rendering/screenspace/TslFieldColorDisplay.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createTslFieldColorDisplay } from './modules/rendering/screenspace/TslFieldColorDisplay.module.js';\n\nconst display = createTslFieldColorDisplay({ gridSize, fieldR, fieldG, fieldB });\ndisplay.addTo(scene);   // fullscreen quad; color comes straight from the live fields\ndisplay.dispose();",
  presets: {
    Normal: { exposure: 1 },
    Bright: { exposure: 1.8 },
  },
  related: ['tsl-stable-fluids-2d', 'tsl-compute-field-2d'],
  agentNotes:
    'Universal field visualizer. createTslFieldColorDisplay({ gridSize (uniform), fieldR, fieldG?, fieldB? }) -> { material, mesh, geometry, colorNode(), addTo(scene), update(), dispose() }. fieldG/fieldB default to fieldR (grayscale). Builds a MeshBasicNodeMaterial on a PlaneGeometry(2,2) for an orthographic fullscreen camera. To post-process the color (e.g. exposure) reassign material.colorNode = display.colorNode().mul(x). Ported from CodePen pashafd/OPVGJav (REF/tsl-fluid setupDisplay). Bridge id "tsl-field-color-display"; showcase displays an arbitrary RGB gradient field to prove non-fluid reuse. Requires WebGPU.',
  reuseNotes: 'Drop-in viewer for any tsl-compute-field-2d field; used by the fluid solver and lab.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default tslFieldColorDisplayMeta;
