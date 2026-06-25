import type { ArtinosModule } from '../../registry/types';
import SingularityLab from './SingularityLab';
import { singularityPresets } from './local/presets/SingularityPresets';

const singularityLabMeta: ArtinosModule = {
  id: 'singularity',
  name: 'Singularity',
  category: 'lab',
  description:
    'Faithful ARTINOS Lab replica of MisterPrada/singularity: a WebGPU/TSL black-hole scene with nebula environment, deep-noise accretion disk, orange/gold volumetric glow, Bloom postprocessing, OrbitControls, and the triangular star preloader overlay.',
  tags: ['lab', 'replica', 'composition', 'webgpu', 'tsl', 'black-hole', 'volumetric', 'bloom', 'singularity'],
  schema: {
    id: 'singularity',
    name: 'Singularity',
    category: 'lab',
    parameters: [
      { key: 'preloadOverlay', label: 'Preloader Overlay', type: 'boolean', default: true, group: 'Lab' },
      { key: 'cameraFov', label: 'Camera FOV', type: 'number', default: 50, min: 25, max: 80, step: 1, group: 'Camera' },
      { key: 'toneMappingExposure', label: 'Exposure', type: 'number', default: 1.2, min: 0.1, max: 3, step: 0.01, group: 'Post' },
      { key: 'bloomStrength', label: 'Bloom Strength', type: 'number', default: 0.217, min: 0, max: 3, step: 0.01, group: 'Post' },
      { key: 'bloomRadius', label: 'Bloom Radius', type: 'number', default: 0, min: -1, max: 1, step: 0.01, group: 'Post' },
      { key: 'bloomThreshold', label: 'Bloom Threshold', type: 'number', default: 0, min: 0, max: 1, step: 0.01, group: 'Post' },
      { key: 'pixelRatio', label: 'Pixel Ratio Cap', type: 'number', default: 2, min: 0.75, max: 2, step: 0.25, group: 'Performance' },
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
  preview: SingularityLab,
  sourcePath: 'STUDIO/src/labs/singularity/createSingularityLab.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import SingularityLab from './labs/singularity/SingularityLab';\n\n<SingularityLab />\n// The Lab is bridge-driven under id 'singularity' and uses local snapshot modules.",
  presets: singularityPresets as unknown as Record<string, Record<string, unknown>>,
  related: [
    'singularity-black-hole-material',
    'tsl-volumetric-raymarch-shell',
    'tsl-spline-color-ramp',
    'equirectangular-node-environment',
    'webgpu-bloom-composer',
    'singularity-triangle-preloader',
  ],
  agentNotes:
    'Mode B Lab replica of https://github.com/MisterPrada/singularity at commit 51313b398583a84c9347470ce4b575e05739e302. Uses snapshot modules under labs/singularity/modules plus local assets noise_deep.png and nebula.png. Preserves the black-hole shader, nebula environment, Bloom pipeline, source camera framing, and preloader overlay. Dropped source singleton Experience shell, Tweakpane/stats debug UI, analytics, and unused assets in favor of ARTINOS/PANELFLOW lifecycle and controls. Bridge id is "singularity".',
  reuseNotes:
    'Use this Lab for the full source composition. Reuse canonical modules individually for other black-hole, nebula, Bloom, or loading-overlay scenes.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default singularityLabMeta;
