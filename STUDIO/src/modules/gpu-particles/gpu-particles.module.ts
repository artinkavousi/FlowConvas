import type { ArtinosModule } from '../../registry/types';
import GpuParticlesPreview from './GpuParticlesPreview';

const gpuParticlesModule: ArtinosModule = {
  id: 'gpu-particles',
  name: 'Particle Field',
  category: 'particles',
  description:
    'A swirling additive-blended particle field (up to 60k points) on a fuzzy sphere shell — a self-contained Three.js (WebGL) system. Use for galaxy backgrounds, hero ambience, or data-mood visuals.',
  tags: ['particles', 'points', 'three', 'webgl', 'galaxy', 'additive', 'field'],
  schema: {
    id: 'gpu-particles',
    name: 'Particle Field',
    category: 'particles',
    parameters: [
      { key: 'count', label: 'Count', type: 'number', default: 12000, min: 500, max: 60000, step: 500, group: 'Field' },
      { key: 'spread', label: 'Spread', type: 'number', default: 4, min: 1, max: 8, step: 0.25, group: 'Field' },
      { key: 'size', label: 'Point Size', type: 'number', default: 0.05, min: 0.01, max: 0.2, step: 0.005, group: 'Appearance' },
      { key: 'color', label: 'Color', type: 'color', default: '#2dd4bf', group: 'Appearance' },
      { key: 'speed', label: 'Spin Speed', type: 'number', default: 0.3, min: 0, max: 2, step: 0.05, group: 'Motion' },
      { key: 'swirl', label: 'Swirl', type: 'number', default: 0.6, min: 0, max: 2, step: 0.1, group: 'Motion' },
    ],
  },
  preview: GpuParticlesPreview,
  sourcePath: 'STUDIO/src/modules/gpu-particles/engine.js',
  dependencies: ['three', 'react'],
  usage:
    "import { createParticles } from './engine.js';\n\nconst field = createParticles(canvasEl);\nfield.update({ count: 12000, size: 0.05, color: '#2dd4bf', speed: 0.3, spread: 4 });\n// on unmount: field.dispose();",
  presets: {
    Galaxy: { count: 24000, spread: 5, size: 0.04, color: '#8ab4ff', speed: 0.2, swirl: 0.8 },
    Ember: { count: 8000, spread: 3, size: 0.08, color: '#fb923c', speed: 0.5, swirl: 0.3 },
    Dense: { count: 60000, spread: 4, size: 0.025, color: '#2dd4bf', speed: 0.35, swirl: 1.2 },
  },
  related: ['crystal-knot', 'aurora-shader'],
  agentNotes:
    'Three.js Points with additive blending. engine.js pre-allocates MAX=60000 and uses setDrawRange(0,count) so changing count is allocation-free; changing spread refills positions. createParticles(canvas) → { update, resize, dispose }. WebGL (no WebGPU). Bridge id is "gpu-particles".',
  reuseNotes: 'Full-screen ambient backgrounds, loading states, audio-reactive fields (drive speed/size from amplitude).',
  version: '0.1.0',
  updatedAt: '2026-06-23',
};

export default gpuParticlesModule;
