import type { ArtinosModule } from '../../../registry/types';
import WebgpuSsgiRoomRendererShowcase from './WebgpuSsgiRoomRenderer.showcase';

const webgpuSsgiRoomRendererMeta: ArtinosModule = {
  id: 'webgpu-ssgi-room-renderer',
  name: 'WebGPU SSGI Room Renderer',
  category: 'rendering/postfx',
  description:
    'Reusable Three.js WebGPU/TSL room-scene render pipeline extracted from mrdoob Ball Pool #2: MRT scene pass, SSGI, TRAA, Bloom, ACES tone mapping, shadows, and resize lifecycle for high-end enclosed scenes.',
  tags: ['webgpu', 'tsl', 'rendering', 'postfx', 'ssgi', 'traa', 'bloom', 'three', 'room'],
  schema: {
    id: 'webgpu-ssgi-room-renderer',
    name: 'WebGPU SSGI Room Renderer',
    category: 'rendering/postfx',
    parameters: [
      { key: 'toneMappingExposure', label: 'Exposure', type: 'number', default: 0.35, min: 0.05, max: 2, step: 0.01, group: 'Tone' },
      { key: 'giIntensity', label: 'GI Intensity', type: 'number', default: 18, min: 0, max: 40, step: 0.5, group: 'SSGI' },
      { key: 'aoIntensity', label: 'AO Intensity', type: 'number', default: 0.55, min: 0, max: 2, step: 0.01, group: 'SSGI' },
      { key: 'ssgiSliceCount', label: 'SSGI Slices', type: 'number', default: 2, min: 1, max: 6, step: 1, group: 'SSGI' },
      { key: 'ssgiStepCount', label: 'SSGI Steps', type: 'number', default: 8, min: 1, max: 24, step: 1, group: 'SSGI' },
      { key: 'bloomThreshold', label: 'Bloom Threshold', type: 'number', default: 0.1, min: 0, max: 1, step: 0.01, group: 'Bloom' },
      { key: 'bloomStrength', label: 'Bloom Strength', type: 'number', default: 0.25, min: 0, max: 2, step: 0.01, group: 'Bloom' },
      { key: 'bloomRadius', label: 'Bloom Radius', type: 'number', default: 0, min: 0, max: 1, step: 0.01, group: 'Bloom' },
      { key: 'pixelRatio', label: 'Pixel Ratio Cap', type: 'number', default: 1.5, min: 0.75, max: 2, step: 0.25, group: 'Performance' },
    ],
  },
  preview: WebgpuSsgiRoomRendererShowcase,
  sourcePath: 'STUDIO/src/modules/rendering/postfx/WebgpuSsgiRoomRenderer.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createWebgpuSsgiRoomRenderer } from './modules/rendering/postfx/WebgpuSsgiRoomRenderer.module.js';\n\nconst render = createWebgpuSsgiRoomRenderer(canvas, { giIntensity: 18 });\nrender.resize();\nrender.render(scene, camera);\n// on unmount: render.dispose();",
  presets: {
    'CodePen Original': { toneMappingExposure: 0.35, giIntensity: 18, aoIntensity: 0.55, ssgiSliceCount: 2, ssgiStepCount: 8, bloomThreshold: 0.1, bloomStrength: 0.25, bloomRadius: 0 },
    'Low GI': { toneMappingExposure: 0.4, giIntensity: 8, aoIntensity: 0.35, ssgiSliceCount: 1, ssgiStepCount: 4, bloomThreshold: 0.12, bloomStrength: 0.15, bloomRadius: 0 },
    'Bright Studio': { toneMappingExposure: 0.7, giIntensity: 14, aoIntensity: 0.4, ssgiSliceCount: 2, ssgiStepCount: 8, bloomThreshold: 0.06, bloomStrength: 0.4, bloomRadius: 0.08 },
  },
  related: ['adaptive-open-front-box-room', 'universal-physics-particles'],
  agentNotes:
    'WebGPU-only render/post stack extracted from https://codepen.io/mrdoob/pen/dPpJMXB. createWebgpuSsgiRoomRenderer(canvas, options) owns WebGPURenderer, TSL RenderPipeline, MRT scene pass, SSGI, TRAA, Bloom, ACES tone mapping, resize, update, render(scene,camera), and dispose. It is scene-agnostic and should be composed with room/object modules. Bridge id is "webgpu-ssgi-room-renderer"; defaults mirror the CodePen.',
  reuseNotes:
    'Use for enclosed/object scenes needing high-end GI/Bloom without copying a whole Lab. Keep source-specific scene construction outside this module.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default webgpuSsgiRoomRendererMeta;
