import type { ArtinosModule } from '../../../registry/types';
import WebgpuSkyShowcase from './WebgpuSky.showcase';

const webgpuSkyMeta: ArtinosModule = {
  id: 'webgpu-sky-mesh',
  name: 'WebGPU Sky (Preetham)',
  category: 'rendering/environments',
  description:
    'Analytic Preetham daylight skydome for WebGPU, built on the node-material SkyMesh. Exposes turbidity, rayleigh, mie coefficient/directionality, and sun elevation/azimuth. Use as a physically-plausible sky background and as the source for generated environment maps.',
  tags: ['webgpu', 'tsl', 'sky', 'atmosphere', 'environment', 'preetham', 'three', 'node'],
  schema: {
    id: 'webgpu-sky-mesh',
    name: 'WebGPU Sky (Preetham)',
    category: 'rendering/environments',
    parameters: [
      { key: 'elevation', label: 'Sun Elevation', type: 'number', default: 12, min: -5, max: 90, step: 0.5, group: 'Sun' },
      { key: 'azimuth', label: 'Sun Azimuth', type: 'number', default: 180, min: 0, max: 360, step: 1, group: 'Sun' },
      { key: 'turbidity', label: 'Turbidity', type: 'number', default: 10, min: 0, max: 20, step: 0.1, group: 'Atmosphere' },
      { key: 'rayleigh', label: 'Rayleigh', type: 'number', default: 3, min: 0, max: 4, step: 0.01, group: 'Atmosphere' },
      { key: 'mieCoefficient', label: 'Mie Coefficient', type: 'number', default: 0.005, min: 0, max: 0.1, step: 0.001, group: 'Atmosphere' },
      { key: 'mieDirectionalG', label: 'Mie Directional G', type: 'number', default: 0.7, min: 0, max: 1, step: 0.01, group: 'Atmosphere' },
    ],
  },
  preview: WebgpuSkyShowcase,
  sourcePath: 'STUDIO/src/modules/objects/SkyMesh.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createWebgpuSkyScene } from './modules/rendering/environments/WebgpuSky.module.js';\n// or use the mesh directly:\nimport { SkyMesh } from './modules/objects/SkyMesh.js';\nconst sky = new SkyMesh();\nsky.scale.setScalar(450000);\nscene.add(sky);\nsky.turbidity.value = 10;\nsky.sunPosition.value.setFromSphericalCoords(1, phi, theta);",
  presets: {
    Noon: { elevation: 60, azimuth: 180, turbidity: 6, rayleigh: 1.2 },
    Sunset: { elevation: 2, azimuth: 200, turbidity: 12, rayleigh: 3 },
  },
  related: ['equirectangular-node-environment', 'adaptive-open-front-box-room'],
  agentNotes:
    "Self-contained showcase; controlled via bridge id 'webgpu-sky-mesh'. createWebgpuSkyScene(canvas, params) -> { renderer, scene, camera, sky, update(p), resize(w,h), renderFrame(), dispose() }. SkyMesh() takes no args (BackSide BoxGeometry, NodeMaterial); scale it large (~450000) and add to scene. Uniforms (.value): turbidity, rayleigh, mieCoefficient, mieDirectionalG, sunPosition (Vector3 — set via setFromSphericalCoords(1, degToRad(90-elevation), degToRad(azimuth))). Set sky.showSunDisc.value=false before baking an env map. WebGPU only; use objects/Sky.js for WebGLRenderer. Vendored verbatim from three.js r185 examples/jsm/objects/SkyMesh.js.",
  reuseNotes: 'Feed into PMREM/env generation for image-based lighting, or use directly as a background dome.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default webgpuSkyMeta;
