import type { ArtinosModule } from '../../registry/types';
import AuroraShaderPreview from './AuroraShaderPreview';

const auroraShaderModule: ArtinosModule = {
  id: 'aurora-shader',
  name: 'Aurora Shader',
  category: 'shader',
  description:
    'A fullscreen animated aurora built in TSL (Three.js Shading Language) on WebGPU — flowing sine bands blended between two colors. Use as a hero/background or a TSL learning reference.',
  tags: ['shader', 'tsl', 'webgpu', 'aurora', 'gradient', 'fullscreen', 'background'],
  schema: {
    id: 'aurora-shader',
    name: 'Aurora Shader',
    category: 'shader',
    parameters: [
      { key: 'colorA', label: 'Color A', type: 'color', default: '#0ea5e9', group: 'Color' },
      { key: 'colorB', label: 'Color B', type: 'color', default: '#a855f7', group: 'Color' },
      { key: 'speed', label: 'Flow Speed', type: 'number', default: 0.4, min: 0, max: 2, step: 0.05, group: 'Motion' },
      { key: 'scale', label: 'Wave Scale', type: 'number', default: 3.0, min: 1, max: 8, step: 0.25, group: 'Pattern' },
      { key: 'intensity', label: 'Intensity', type: 'number', default: 1.1, min: 0.2, max: 2.5, step: 0.1, group: 'Pattern' },
    ],
  },
  preview: AuroraShaderPreview,
  sourcePath: 'STUDIO/src/modules/aurora-shader/engine.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createAurora } from './engine.js';\n\nconst aurora = createAurora(canvasEl); // requires WebGPU\naurora.update({ colorA: '#0ea5e9', colorB: '#a855f7', speed: 0.4, intensity: 1.1 });\n// on unmount: aurora.dispose();",
  presets: {
    Aurora: { colorA: '#0ea5e9', colorB: '#a855f7', speed: 0.4, scale: 3, intensity: 1.1 },
    Sunset: { colorA: '#fb7185', colorB: '#fbbf24', speed: 0.25, scale: 2.5, intensity: 1.4 },
    Toxic: { colorA: '#22d3ee', colorB: '#84cc16', speed: 0.8, scale: 5, intensity: 1.0 },
  },
  related: ['neon-bloom', 'crystal-knot'],
  agentNotes:
    'TSL/WebGPU: imports WebGPURenderer + MeshBasicNodeMaterial from three/webgpu and node fns (uv, time, sin, mix, uniform) from three/tsl. The colorNode is the aurora graph; bridge values drive TSL `uniform()`s live. Requires WebGPU — declare dependency "webgpu" so PreviewStage shows a capability notice on unsupported browsers. createAurora(canvas) → { update, resize, dispose }. Bridge id is "aurora-shader".',
  reuseNotes: 'Reuse the uniform-driven colorNode pattern for any TSL background; swap the band math for noise/fbm.',
  version: '0.1.0',
  updatedAt: '2026-06-23',
};

export default auroraShaderModule;
