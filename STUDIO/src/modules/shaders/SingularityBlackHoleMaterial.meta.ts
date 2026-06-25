import type { ArtinosModule } from '../../registry/types';
import SingularityBlackHoleMaterialShowcase from './SingularityBlackHoleMaterial.showcase';

const singularityBlackHoleMaterialMeta: ArtinosModule = {
  id: 'singularity-black-hole-material',
  name: 'Singularity Black Hole Material',
  category: 'shaders',
  description:
    'Faithful Singularity black-hole material port: WebGPU/TSL sphere volume with ray steering, deep-noise accretion disk, B-spline orange/gold ramp, event-horizon suppression, nebula environment blend, and emissive Bloom-ready output.',
  tags: ['shader', 'webgpu', 'tsl', 'black-hole', 'singularity', 'volumetric', 'raymarch', 'bloom'],
  schema: {
    id: 'singularity-black-hole-material',
    name: 'Singularity Black Hole Material',
    category: 'shaders',
    parameters: [
      { key: 'iterations', label: 'Iterations', type: 'number', default: 128, min: 16, max: 192, step: 1, group: 'Raymarch' },
      { key: 'stepSize', label: 'Step Size', type: 'number', default: 0.0071, min: 0.001, max: 0.02, step: 0.0001, group: 'Raymarch' },
      { key: 'noiseFactor', label: 'Noise Factor', type: 'number', default: 0.01, min: 0, max: 0.08, step: 0.0005, group: 'Raymarch' },
      { key: 'power', label: 'Power', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, group: 'Gravity' },
      { key: 'originRadius', label: 'Origin Radius', type: 'number', default: 0.13, min: 0.02, max: 0.5, step: 0.005, group: 'Gravity' },
      { key: 'bandWidth', label: 'Band Width', type: 'number', default: 0.03, min: 0.005, max: 0.2, step: 0.001, group: 'Disk' },
      { key: 'rampCol1', label: 'Ramp Color 1', type: 'color', default: '#f2b56f', group: 'Color' },
      { key: 'rampPos1', label: 'Ramp Pos 1', type: 'number', default: 0.05, min: 0, max: 1, step: 0.005, group: 'Color' },
      { key: 'rampCol2', label: 'Ramp Color 2', type: 'color', default: '#240d08', group: 'Color' },
      { key: 'rampPos2', label: 'Ramp Pos 2', type: 'number', default: 0.425, min: 0, max: 1, step: 0.005, group: 'Color' },
      { key: 'rampCol3', label: 'Ramp Color 3', type: 'color', default: '#000000', group: 'Color' },
      { key: 'rampPos3', label: 'Ramp Pos 3', type: 'number', default: 1, min: 0, max: 1, step: 0.005, group: 'Color' },
      { key: 'rampEmission', label: 'Ramp Emission', type: 'number', default: 2, min: 0, max: 6, step: 0.05, group: 'Emission' },
      { key: 'emissionColor', label: 'Emission Color', type: 'color', default: '#242117', group: 'Emission' },
      { key: 'backgroundIntensity', label: 'Background Intensity', type: 'number', default: 2, min: 0, max: 6, step: 0.05, group: 'Environment' },
    ],
  },
  preview: SingularityBlackHoleMaterialShowcase,
  sourcePath: 'STUDIO/src/modules/shaders/SingularityBlackHoleMaterial.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createSingularityBlackHole } from './modules/shaders/SingularityBlackHoleMaterial.module.js';\n\nconst blackHole = createSingularityBlackHole(scene, { noiseUrl, nebulaUrl });\nblackHole.update({ iterations: 128, rampEmission: 2 });\nblackHole.dispose();",
  presets: {
    'Source Original': {
      iterations: 128,
      stepSize: 0.0071,
      noiseFactor: 0.01,
      power: 0.3,
      originRadius: 0.13,
      bandWidth: 0.03,
      rampCol1: '#f2b56f',
      rampPos1: 0.05,
      rampCol2: '#240d08',
      rampPos2: 0.425,
      rampCol3: '#000000',
      rampPos3: 1,
      rampEmission: 2,
      emissionColor: '#242117',
      backgroundIntensity: 2,
    },
    'Cold Singularity': { rampCol1: '#dbeafe', rampCol2: '#172554', rampCol3: '#000000', emissionColor: '#0f172a', rampEmission: 2.4 },
    'Low Iteration': { iterations: 64, stepSize: 0.009, rampEmission: 1.7 },
  },
  related: ['tsl-spline-color-ramp', 'tsl-volumetric-raymarch-shell', 'equirectangular-node-environment', 'webgpu-bloom-composer'],
  agentNotes:
    'Direct port of MisterPrada/singularity commit 51313b398583a84c9347470ce4b575e05739e302, source `src/Experience/Worlds/MainWorld/BlackHole.js`, adapted to ARTINOS lifecycle. createSingularityBlackHole(scene, { noiseUrl, nebulaUrl, ...params }) creates a Group with the source sphere/material, exposes live update(params), and disposes textures/geometry/material. Requires WebGPU/TSL and the source noise + nebula textures. Bridge id is "singularity-black-hole-material".',
  reuseNotes:
    'Use as the faithful source black-hole core. For generic volumes, use `tsl-volumetric-raymarch-shell`; for color helpers, use `tsl-spline-color-ramp`.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default singularityBlackHoleMaterialMeta;
