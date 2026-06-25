import type { ArtinosModule } from '../../../registry/types';
import WebgpuBloomComposerShowcase from './WebgpuBloomComposer.showcase';

const webgpuBloomComposerMeta: ArtinosModule = {
  id: 'webgpu-bloom-composer',
  name: 'WebGPU Bloom Composer',
  category: 'rendering/postfx',
  description:
    'Lightweight Three.js WebGPU/TSL render pipeline extracted from Singularity: WebGPURenderer, scene pass MRT output/emissive, BloomNode composition, ACES tone mapping, resize lifecycle, and live bloom controls.',
  tags: ['webgpu', 'tsl', 'postfx', 'bloom', 'three', 'renderer', 'emissive'],
  schema: {
    id: 'webgpu-bloom-composer',
    name: 'WebGPU Bloom Composer',
    category: 'rendering/postfx',
    parameters: [
      { key: 'toneMappingExposure', label: 'Exposure', type: 'number', default: 1.2, min: 0.1, max: 3, step: 0.01, group: 'Tone' },
      { key: 'bloomStrength', label: 'Bloom Strength', type: 'number', default: 0.217, min: 0, max: 3, step: 0.01, group: 'Bloom' },
      { key: 'bloomRadius', label: 'Bloom Radius', type: 'number', default: 0, min: -1, max: 1, step: 0.01, group: 'Bloom' },
      { key: 'bloomThreshold', label: 'Bloom Threshold', type: 'number', default: 0, min: 0, max: 1, step: 0.01, group: 'Bloom' },
      { key: 'pixelRatio', label: 'Pixel Ratio Cap', type: 'number', default: 2, min: 0.75, max: 2, step: 0.25, group: 'Performance' },
    ],
  },
  preview: WebgpuBloomComposerShowcase,
  sourcePath: 'STUDIO/src/modules/rendering/postfx/WebgpuBloomComposer.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createWebgpuBloomRenderer } from './modules/rendering/postfx/WebgpuBloomComposer.module.js';\n\nconst fx = createWebgpuBloomRenderer(canvas, { bloomStrength: 0.217 });\nfx.render(scene, camera);\nfx.update({ bloomStrength: 0.5 });\nfx.dispose();",
  presets: {
    Source: { toneMappingExposure: 1.2, bloomStrength: 0.217, bloomRadius: 0, bloomThreshold: 0, pixelRatio: 2 },
    Glow: { toneMappingExposure: 1.1, bloomStrength: 0.65, bloomRadius: 0.1, bloomThreshold: 0, pixelRatio: 1.5 },
    Performance: { toneMappingExposure: 1.0, bloomStrength: 0.12, bloomRadius: 0, bloomThreshold: 0.05, pixelRatio: 1 },
  },
  related: ['singularity-black-hole-material', 'equirectangular-node-environment', 'webgpu-ssgi-room-renderer'],
  agentNotes:
    'Ported from MisterPrada/singularity `Renderer.js` + `Utils/PostProcess.js`. createWebgpuBloomRenderer(canvas, options) owns WebGPURenderer and a BloomNode PostProcessing composer, but not the scene. Call render(scene,camera) each frame, resize on container changes, update for exposure/bloom/pixelRatio, dispose on unmount. Bridge id is "webgpu-bloom-composer".',
  reuseNotes:
    'Use for emissive WebGPU shader scenes that need Bloom without the heavier SSGI room renderer.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default webgpuBloomComposerMeta;
