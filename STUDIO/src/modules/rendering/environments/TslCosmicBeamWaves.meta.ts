import type { ArtinosModule } from '../../../registry/types';
import TslCosmicBeamWavesShowcase from './TslCosmicBeamWaves.showcase';

const tslCosmicBeamWavesMeta: ArtinosModule = {
  id: 'tsl-cosmic-beam-waves',
  name: 'TSL Cosmic Beam Waves',
  category: 'rendering/environments',
  description:
    'False Earth-derived cosmic beam and shockwave system: additive instanced dropping beams, donut-radius placement, source wave lifetimes/radii, and expanding ground rings for grass/rose interaction events.',
  tags: ['false-earth', 'webgpu', 'tsl', 'cosmic', 'beam', 'shockwave', 'instancing', 'environment'],
  schema: {
    id: 'tsl-cosmic-beam-waves',
    name: 'TSL Cosmic Beam Waves',
    category: 'rendering/environments',
    parameters: [
      { key: 'autoSpawn', label: 'Auto Spawn', type: 'boolean', default: true, group: 'Spawn' },
      { key: 'radiusMin', label: 'Wave Radius Min', type: 'number', default: 5, min: 1, max: 50, step: 0.5, group: 'Waves' },
      { key: 'radiusMax', label: 'Wave Radius Max', type: 'number', default: 10, min: 1, max: 50, step: 0.5, group: 'Waves' },
      { key: 'lifetimeMin', label: 'Lifetime Min', type: 'number', default: 3, min: 0.5, max: 20, step: 0.1, group: 'Waves' },
      { key: 'lifetimeMax', label: 'Lifetime Max', type: 'number', default: 5, min: 0.5, max: 20, step: 0.1, group: 'Waves' },
      { key: 'donutMinRadius', label: 'Donut Min', type: 'number', default: 5, min: 1, max: 30, step: 0.5, group: 'Spawn' },
      { key: 'donutMaxRadius', label: 'Donut Max', type: 'number', default: 15, min: 1, max: 50, step: 0.5, group: 'Spawn' },
      { key: 'minSpawnInterval', label: 'Spawn Min', type: 'number', default: 2, min: 0.1, max: 10, step: 0.1, group: 'Spawn' },
      { key: 'maxSpawnInterval', label: 'Spawn Max', type: 'number', default: 5, min: 0.1, max: 10, step: 0.1, group: 'Spawn' },
      { key: 'beamCoreColor', label: 'Core Color', type: 'color', default: '#ffffff', group: 'Color' },
      { key: 'beamGlowColor', label: 'Glow Color', type: 'color', default: '#00ffff', group: 'Color' },
      { key: 'waveColor', label: 'Wave Color', type: 'color', default: '#20e0c5', group: 'Color' },
      { key: 'hueShift', label: 'Hue Shift', type: 'number', default: 0, min: -0.5, max: 0.5, step: 0.01, group: 'Color' },
      { key: 'cameraHeight', label: 'Camera Height', type: 'number', default: 24, min: 4, max: 48, step: 0.25, group: 'Camera' },
      { key: 'cameraDistance', label: 'Camera Distance', type: 'number', default: 42, min: 8, max: 80, step: 0.5, group: 'Camera' },
      { key: 'pixelRatio', label: 'Pixel Ratio', type: 'number', default: 1.5, min: 0.75, max: 2, step: 0.05, group: 'Render' },
    ],
  },
  preview: TslCosmicBeamWavesShowcase,
  sourcePath: 'STUDIO/src/modules/rendering/environments/TslCosmicBeamWaves.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createTslCosmicBeamWaves } from './modules/rendering/environments/TslCosmicBeamWaves.module.js';\n\nconst cosmic = createTslCosmicBeamWaves(canvas, { autoSpawn: true });\ncosmic.triggerBeam();\ncosmic.update({ hueShift: 0.12 });\ncosmic.dispose();",
  presets: {
    'False Earth beams': { radiusMin: 5, radiusMax: 10, lifetimeMin: 3, lifetimeMax: 5, donutMinRadius: 5, donutMaxRadius: 15, autoSpawn: true },
    'Wide slow waves': { radiusMin: 12, radiusMax: 24, lifetimeMin: 6, lifetimeMax: 10, donutMinRadius: 8, donutMaxRadius: 22, autoSpawn: true },
  },
  related: ['tsl-vat-lifecycle-instances', 'tsl-gpu-grass-field', 'tsl-vegetation-math'],
  agentNotes:
    'Mode B canonical module from False Earth commit 74cc91c. Source-derived from CosmicSystem.tsx, CosmicBeams.tsx, useCosmicWaves.ts, useCosmicBeamSpawner.ts, and cosmic/config.ts. Preserves maxBeams=20, beamHeight=20, dropHeight=50, donut spawn radii, auto spawn intervals, wave radius/lifetime ranges, additive white/cyan beam material, and expanding shockwave rings. In the final Lab, triggerBeam() should emit rose/grass interaction events; standalone showcase auto-spawns beams. Bridge id is "tsl-cosmic-beam-waves".',
  reuseNotes:
    'Use as a reusable environmental event layer: beams provide visible impacts, rings can drive grass bend, rose spawning, particle splats, or audio hits.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default tslCosmicBeamWavesMeta;
