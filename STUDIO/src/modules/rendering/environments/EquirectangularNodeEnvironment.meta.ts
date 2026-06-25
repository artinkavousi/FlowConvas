import type { ArtinosModule } from '../../../registry/types';
import EquirectangularNodeEnvironmentShowcase from './EquirectangularNodeEnvironment.showcase';

const equirectangularNodeEnvironmentMeta: ArtinosModule = {
  id: 'equirectangular-node-environment',
  name: 'Equirectangular Node Environment',
  category: 'rendering/environments',
  description:
    'Scene-agnostic Three.js WebGPU/TSL equirectangular background node extracted from Singularity. Loads a nebula/starmap texture, applies SRGB/equirectangular mapping, and exposes live background intensity.',
  tags: ['three', 'webgpu', 'tsl', 'environment', 'equirectangular', 'background', 'nebula'],
  schema: {
    id: 'equirectangular-node-environment',
    name: 'Equirectangular Node Environment',
    category: 'rendering/environments',
    parameters: [
      { key: 'backgroundIntensity', label: 'Background Intensity', type: 'number', default: 2, min: 0, max: 6, step: 0.05, group: 'Environment' },
    ],
  },
  preview: EquirectangularNodeEnvironmentShowcase,
  sourcePath: 'STUDIO/src/modules/rendering/environments/EquirectangularNodeEnvironment.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createEquirectangularNodeEnvironment } from './modules/rendering/environments/EquirectangularNodeEnvironment.module.js';\n\nconst env = createEquirectangularNodeEnvironment(scene, nebulaUrl, { backgroundIntensity: 2 });\nenv.update({ backgroundIntensity: 1.4 });\nenv.dispose();",
  presets: {
    Source: { backgroundIntensity: 2 },
    Dim: { backgroundIntensity: 0.75 },
    Radiant: { backgroundIntensity: 4 },
  },
  related: ['singularity-black-hole-material', 'webgpu-bloom-composer'],
  agentNotes:
    'Ported from MisterPrada/singularity `Environment.js`. createEquirectangularNodeEnvironment(scene, textureUrl, options) sets scene.backgroundNode = texture(equirectUV).mul(backgroundIntensity) and returns update/dispose. It is WebGPU/TSL-oriented and does not own a renderer. Bridge id is "equirectangular-node-environment".',
  reuseNotes:
    'Use for any WebGPU scene needing a node-based equirectangular background with live intensity control.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default equirectangularNodeEnvironmentMeta;
