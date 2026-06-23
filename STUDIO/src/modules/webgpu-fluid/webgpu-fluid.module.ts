import type { ArtinosModule } from '../../registry/types';
import { lazy } from 'react';

const WebGPUFluidPreview = lazy(() => import('./WebGPUFluidPreview'));

const webgpuFluidModule: ArtinosModule = {
  id: 'webgpu-fluid',
  name: 'WebGPU Fluid Simulation',
  category: '3d',
  description:
    'A real-time GPU fluid simulation (Three.js r184 + TSL + WebGPU). Drag to inject dye and velocity; includes bloom and a particle-filament layer. Use as an interactive background, hero visual, or shader/WebGPU showcase piece.',
  tags: ['webgpu', 'tsl', 'three', 'fluid', 'simulation', 'shader', 'background', 'particles', 'bloom'],
  schema: {
    id: 'webgpu-fluid',
    name: 'WebGPU Fluid Simulation',
    category: '3d',
    parameters: [
      { key: 'curl', label: 'Curl', type: 'number', default: 30, min: 0, max: 50, step: 1, group: 'Dynamics' },
      { key: 'splatRadius', label: 'Splat Radius', type: 'number', default: 0.25, min: 0.05, max: 1, step: 0.01, group: 'Dynamics' },
      { key: 'velocityDissipation', label: 'Velocity Fade', type: 'number', default: 0.2, min: 0, max: 4, step: 0.05, group: 'Dynamics' },
      { key: 'densityDissipation', label: 'Dye Fade', type: 'number', default: 1, min: 0, max: 4, step: 0.05, group: 'Dynamics' },
      { key: 'bloom', label: 'Bloom', type: 'boolean', default: true, group: 'Look' },
      { key: 'bloomIntensity', label: 'Bloom Intensity', type: 'number', default: 0.58, min: 0, max: 2, step: 0.01, group: 'Look' },
      { key: 'particles', label: 'Particles', type: 'boolean', default: false, group: 'Look' },
    ],
  },
  preview: WebGPUFluidPreview,
  sourcePath: 'STUDIO/src/modules/webgpu-fluid/WebGPUFluidModule.tsx',
  dependencies: ['three', 'webgpu', '@artinos/panelflow'],
  usage:
    "import { WebGPUFluidModule } from './modules/webgpu-fluid/WebGPUFluidModule';\n\n<WebGPUFluidModule curl={30} bloom className=\"absolute inset-0\" />",
  presets: {
    Default: { curl: 30, splatRadius: 0.25, velocityDissipation: 0.2, densityDissipation: 1, bloom: true, bloomIntensity: 0.58, particles: false },
    'Neon Pulse': { curl: 44, splatRadius: 0.22, velocityDissipation: 0.1, densityDissipation: 0.6, bloom: true, bloomIntensity: 1.1, particles: true },
    'Ocean Storm': { curl: 36, splatRadius: 0.35, velocityDissipation: 0.35, densityDissipation: 1.4, bloom: true, bloomIntensity: 0.7, particles: false },
    'Industrial Smoke': { curl: 12, splatRadius: 0.4, velocityDissipation: 0.5, densityDissipation: 0.2, bloom: false, bloomIntensity: 0.3, particles: false },
  },
  related: [],
  agentNotes:
    'WebGPU fluid sim ported directly from REF/WebGpu-Fluid-Simulation-master (Three.js r184 + TSL). The reusable core lives self-contained under sim/ (config, input, fluid/*, particles, compat); audio/emitters/preset/UI scaffolding from the source was stripped. Requires WebGPU. Live knobs mutate the shared `config` singleton: curl, splatRadius, velocity/density dissipation, bloom (+intensity), particles. Drag the canvas to inject fluid. Bridge id "webgpu-fluid". Heavy — mount a single instance.',
  reuseNotes: 'Full-screen interactive background, hero visual, shader/WebGPU showcase, or audio-reactive base (audio engine not ported).',
  version: '0.1.0',
  updatedAt: '2026-06-22',
};

export default webgpuFluidModule;
