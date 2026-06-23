import type { ArtinosModule } from '../../registry/types';
import CrystalKnotPreview from './CrystalKnotPreview';

const crystalKnotModule: ArtinosModule = {
  id: 'crystal-knot',
  name: 'Crystal Knot',
  category: '3d',
  description:
    'A rotating PBR torus-knot lit with key + rim lights — a self-contained Three.js (WebGL) scene capsule. Use as a hero centerpiece, loader, or material showcase.',
  tags: ['3d', 'three', 'webgl', 'pbr', 'torus-knot', 'material', 'scene'],
  schema: {
    id: 'crystal-knot',
    name: 'Crystal Knot',
    category: '3d',
    parameters: [
      { key: 'color', label: 'Color', type: 'color', default: '#2dd4bf', group: 'Material' },
      { key: 'metalness', label: 'Metalness', type: 'number', default: 0.9, min: 0, max: 1, step: 0.05, group: 'Material' },
      { key: 'roughness', label: 'Roughness', type: 'number', default: 0.18, min: 0, max: 1, step: 0.02, group: 'Material' },
      { key: 'wireframe', label: 'Wireframe', type: 'boolean', default: false, group: 'Material' },
      { key: 'speed', label: 'Spin Speed', type: 'number', default: 0.6, min: 0, max: 3, step: 0.1, group: 'Motion' },
      { key: 'knotP', label: 'Knot P', type: 'number', default: 2, min: 1, max: 8, step: 1, group: 'Geometry' },
      { key: 'knotQ', label: 'Knot Q', type: 'number', default: 3, min: 1, max: 9, step: 1, group: 'Geometry' },
    ],
  },
  preview: CrystalKnotPreview,
  sourcePath: 'STUDIO/src/modules/crystal-knot/engine.js',
  dependencies: ['three', 'react'],
  usage:
    "import { createKnot } from './engine.js';\n\nconst knot = createKnot(canvasEl);\nknot.update({ color: '#2dd4bf', metalness: 0.9, speed: 0.6, knotP: 2, knotQ: 3 });\n// on unmount: knot.dispose();",
  presets: {
    Chrome: { color: '#dfe7ee', metalness: 1, roughness: 0.08, wireframe: false, speed: 0.5, knotP: 2, knotQ: 3 },
    Neon: { color: '#e879f9', metalness: 0.6, roughness: 0.3, wireframe: false, speed: 1.4, knotP: 3, knotQ: 5 },
    Wire: { color: '#2dd4bf', metalness: 0.4, roughness: 0.5, wireframe: true, speed: 0.8, knotP: 2, knotQ: 7 },
  },
  related: ['gpu-particles', 'aurora-shader'],
  agentNotes:
    'Imperative Three.js WebGL engine in engine.js: createKnot(canvas) returns { update(params), resize(), dispose() }. The .tsx wrapper owns a canvas ref + ResizeObserver and forwards bridge values to update(). Changing knotP/knotQ rebuilds geometry (disposes the old). WebGL (no WebGPU needed). Bridge id is "crystal-knot".',
  reuseNotes: 'Drop-in hero 3D, loading scenes, or a PBR material sandbox. Swap TorusKnotGeometry for any geometry.',
  version: '0.1.0',
  updatedAt: '2026-06-23',
};

export default crystalKnotModule;
