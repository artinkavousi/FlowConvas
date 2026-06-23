import type { ArtinosModule } from '../../registry/types';
import NeonBloomPreview from './NeonBloomPreview';

const neonBloomModule: ArtinosModule = {
  id: 'neon-bloom',
  name: 'Neon Bloom',
  category: 'postfx',
  description:
    'An emissive low-poly icosahedron rendered through an UnrealBloom post-processing composer — a self-contained Three.js (WebGL) effect. Use to learn/configure bloom or as a glowing hero centerpiece.',
  tags: ['postfx', 'bloom', 'unrealbloom', 'three', 'webgl', 'composer', 'glow'],
  schema: {
    id: 'neon-bloom',
    name: 'Neon Bloom',
    category: 'postfx',
    parameters: [
      { key: 'color', label: 'Color', type: 'color', default: '#2dd4bf', group: 'Material' },
      { key: 'speed', label: 'Spin Speed', type: 'number', default: 0.5, min: 0, max: 3, step: 0.1, group: 'Motion' },
      { key: 'strength', label: 'Bloom Strength', type: 'number', default: 1.4, min: 0, max: 3, step: 0.05, group: 'Bloom' },
      { key: 'radius', label: 'Bloom Radius', type: 'number', default: 0.5, min: 0, max: 1.5, step: 0.05, group: 'Bloom' },
      { key: 'threshold', label: 'Bloom Threshold', type: 'number', default: 0.0, min: 0, max: 1, step: 0.02, group: 'Bloom' },
    ],
  },
  preview: NeonBloomPreview,
  sourcePath: 'STUDIO/src/modules/neon-bloom/engine.js',
  dependencies: ['three', 'react'],
  usage:
    "import { createBloom } from './engine.js';\n\nconst fx = createBloom(canvasEl);\nfx.update({ color: '#2dd4bf', strength: 1.4, radius: 0.5, threshold: 0 });\n// on unmount: fx.dispose();",
  presets: {
    Teal: { color: '#2dd4bf', speed: 0.5, strength: 1.4, radius: 0.5, threshold: 0 },
    Inferno: { color: '#fb7185', speed: 1.2, strength: 2.2, radius: 0.7, threshold: 0.05 },
    Subtle: { color: '#a78bfa', speed: 0.3, strength: 0.7, radius: 0.3, threshold: 0.2 },
  },
  related: ['crystal-knot', 'aurora-shader'],
  agentNotes:
    'Three.js EffectComposer pipeline: RenderPass → UnrealBloomPass (from three/addons/postprocessing). engine.js exposes createBloom(canvas) → { update, resize, dispose }; bloom strength/radius/threshold are live. resize() must update renderer + composer + bloom sizes together. WebGL (no WebGPU). Bridge id is "neon-bloom".',
  reuseNotes: 'Reuse the composer setup to add bloom to any scene; swap the icosahedron for your geometry.',
  version: '0.1.0',
  updatedAt: '2026-06-23',
};

export default neonBloomModule;
