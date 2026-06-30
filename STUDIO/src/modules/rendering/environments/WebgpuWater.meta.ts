import type { ArtinosModule } from '../../../registry/types';
import WebgpuWaterShowcase from './WebgpuWater.showcase';

const webgpuWaterMeta: ArtinosModule = {
  id: 'webgpu-water-mesh',
  name: 'WebGPU Water (Reflective)',
  category: 'rendering/environments',
  description:
    'Reflective animated water surface for WebGPU, built on the node-material WaterMesh with a screen-space reflector. Ships a procedurally-generated tiling normal map so it needs no external texture asset. distortionScale/size/alpha are live uniforms.',
  tags: ['webgpu', 'tsl', 'water', 'reflection', 'environment', 'three', 'node'],
  schema: {
    id: 'webgpu-water-mesh',
    name: 'WebGPU Water (Reflective)',
    category: 'rendering/environments',
    parameters: [
      { key: 'distortionScale', label: 'Distortion', type: 'number', default: 8, min: 0, max: 40, step: 0.5, group: 'Water' },
      { key: 'size', label: 'Ripple Size', type: 'number', default: 4, min: 0.5, max: 20, step: 0.5, group: 'Water' },
      { key: 'alpha', label: 'Alpha', type: 'number', default: 1, min: 0, max: 1, step: 0.01, group: 'Water' },
    ],
  },
  preview: WebgpuWaterShowcase,
  sourcePath: 'STUDIO/src/modules/objects/WaterMesh.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { WaterMesh } from './modules/objects/WaterMesh.js';\nimport * as THREE from 'three/webgpu';\nconst water = new WaterMesh(new THREE.PlaneGeometry(400, 400), {\n  waterNormals, // a RepeatWrapping normal texture\n  sunDirection: new THREE.Vector3(0.7, 0.7, 0),\n  waterColor: 0x001e2f, distortionScale: 8, size: 4,\n});\nwater.rotation.x = -Math.PI / 2;\nscene.add(water);",
  presets: {
    Calm: { distortionScale: 3, size: 6, alpha: 1 },
    Choppy: { distortionScale: 20, size: 2, alpha: 1 },
  },
  related: ['webgpu-sky-mesh'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'webgpu-water-mesh'. createWebgpuWaterScene(canvas, params) -> { renderer, scene, camera, water, update(p), resize(w,h), renderFrame(), dispose() }. WaterMesh(geometry, options) needs options.waterNormals (a RepeatWrapping normal texture) — the module generates a procedural one via makeWaterNormals() so no asset is needed; swap in a real normal map for production. Live uniforms (.value): distortionScale, size, alpha; sunDirection/sunColor/waterColor set at construction. Uses the TSL reflector() internally; WebGPU only. Vendored verbatim from three.js r185 examples/jsm/objects/WaterMesh.js.",
  reuseNotes: 'Pair with webgpu-sky-mesh for a full sky+water scene; feed a real tiling normal map for higher fidelity.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default webgpuWaterMeta;
