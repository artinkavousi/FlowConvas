import type { ArtinosModule } from '../../registry/types';
import TslVolumetricRaymarchShellShowcase from './TslVolumetricRaymarchShell.showcase';

const tslVolumetricRaymarchShellMeta: ArtinosModule = {
  id: 'tsl-volumetric-raymarch-shell',
  name: 'TSL Volumetric Raymarch Shell',
  category: 'shaders',
  description:
    'Reusable WebGPU/TSL volume-shell material pattern extracted from Singularity: backface-aware ray setup, jittered ray start, bounded raymarch loop, alpha accumulation, and live density/step controls for smoky spheres, portals, nebulae, and black-hole-like effects.',
  tags: ['shader', 'tsl', 'webgpu', 'volumetric', 'raymarch', 'three'],
  schema: {
    id: 'tsl-volumetric-raymarch-shell',
    name: 'TSL Volumetric Raymarch Shell',
    category: 'shaders',
    parameters: [
      { key: 'iterations', label: 'Iterations', type: 'number', default: 72, min: 8, max: 160, step: 1, group: 'Raymarch' },
      { key: 'stepSize', label: 'Step Size', type: 'number', default: 0.018, min: 0.001, max: 0.05, step: 0.001, group: 'Raymarch' },
      { key: 'density', label: 'Density', type: 'number', default: 0.55, min: 0, max: 2, step: 0.01, group: 'Volume' },
      { key: 'noiseFactor', label: 'Noise Factor', type: 'number', default: 0.015, min: 0, max: 0.08, step: 0.001, group: 'Volume' },
      { key: 'colorA', label: 'Color A', type: 'color', default: '#f7b26c', group: 'Color' },
      { key: 'colorB', label: 'Color B', type: 'color', default: '#131019', group: 'Color' },
    ],
  },
  preview: TslVolumetricRaymarchShellShowcase,
  sourcePath: 'STUDIO/src/modules/shaders/TslVolumetricRaymarchShell.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createTslVolumetricRaymarchShellMaterial } from './modules/shaders/TslVolumetricRaymarchShell.module.js';\n\nconst shell = createTslVolumetricRaymarchShellMaterial({ density: 0.8 });\nscene.add(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), shell.material));\nshell.update({ iterations: 96 });",
  presets: {
    Smoke: { iterations: 72, stepSize: 0.018, density: 0.55, noiseFactor: 0.015, colorA: '#f7b26c', colorB: '#131019' },
    Dense: { iterations: 110, stepSize: 0.012, density: 1.1, noiseFactor: 0.02, colorA: '#fbbf24', colorB: '#030305' },
  },
  related: ['tsl-spline-color-ramp', 'singularity-black-hole-material'],
  agentNotes:
    'Generalized from MisterPrada/singularity `BlackHole.js`. This module is intentionally not the faithful black-hole material; it proves the reusable volume-shell pattern outside the source domain. createTslVolumetricRaymarchShellMaterial(options) returns { material, uniforms, update, dispose }. Bridge id is "tsl-volumetric-raymarch-shell".',
  reuseNotes:
    'Use as a starting point for TSL clouds/portals/nebula shells; use singularity-black-hole-material when you need the exact source black-hole disk.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default tslVolumetricRaymarchShellMeta;
