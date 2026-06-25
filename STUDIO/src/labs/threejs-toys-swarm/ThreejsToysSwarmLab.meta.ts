import type { ArtinosModule } from '../../registry/types';
import ThreejsToysSwarmLab from './ThreejsToysSwarmLab';

const threejsToysSwarmLabMeta: ArtinosModule = {
  id: 'threejs-toys-swarm',
  name: 'ThreeJS Toys Swarm Lab',
  category: 'lab',
  description:
    'LAB - WebGPU/TSL Mode B replica of Kevin Levron / soju22 "ThreeJS Toy - Swarm": a fullscreen luminous swarm background with centered SWARM BACKGROUND overlay, CodePen-scale camera depth, bloom, and click-to-randomize colors.',
  tags: ['lab', 'replica', 'composition', 'webgpu', 'tsl', 'swarm', 'particles', 'threejs-toys', 'codepen'],
  schema: {
    id: 'threejs-toys-swarm',
    name: 'ThreeJS Toys Swarm Lab',
    category: 'lab',
    parameters: [
      {
        key: 'preset',
        label: 'Preset',
        type: 'enum',
        default: 'codepen-original',
        options: [
          { label: 'CodePen Original', value: 'codepen-original' },
          { label: 'Aurora', value: 'aurora' },
          { label: 'Performance', value: 'performance' },
        ],
        group: 'Preset',
      },
      {
        key: 'gpgpuSize',
        label: 'GPGPU Size',
        type: 'enum',
        default: 256,
        options: [
          { label: '64', value: 64 },
          { label: '128', value: 128 },
          { label: '256', value: 256 },
        ],
        group: 'Simulation',
      },
      { key: 'paused', label: 'Paused', type: 'boolean', default: false, group: 'Simulation' },
      { key: 'cameraZ', label: 'Camera Z', type: 'number', default: 200, min: 50, max: 300, step: 1, group: 'Camera' },
      { key: 'geometryScale', label: 'Geometry Scale', type: 'number', default: 1, min: 0.1, max: 4, step: 0.05, group: 'Geometry' },
      { key: 'noiseCoordScale', label: 'Noise Scale', type: 'number', default: 0.01, min: 0.001, max: 0.05, step: 0.001, group: 'Motion' },
      { key: 'noiseIntensity', label: 'Noise Intensity', type: 'number', default: 0.0025, min: 0, max: 0.02, step: 0.0005, group: 'Motion' },
      { key: 'noiseTimeCoef', label: 'Noise Time', type: 'number', default: 0.0004, min: 0, max: 0.004, step: 0.0001, group: 'Motion' },
      { key: 'attractionRadius1', label: 'Attract Inner', type: 'number', default: 150, min: 20, max: 300, step: 1, group: 'Motion' },
      { key: 'attractionRadius2', label: 'Attract Outer', type: 'number', default: 250, min: 50, max: 420, step: 1, group: 'Motion' },
      { key: 'maxVelocity', label: 'Max Velocity', type: 'number', default: 0.25, min: 0.01, max: 1, step: 0.01, group: 'Motion' },
      { key: 'colorA', label: 'Color A', type: 'color', default: '#ffffff', group: 'Color' },
      { key: 'colorB', label: 'Color B', type: 'color', default: '#2dd4bf', group: 'Color' },
      { key: 'colorC', label: 'Color C', type: 'color', default: '#8b5cf6', group: 'Color' },
      { key: 'bloomStrength', label: 'Bloom Strength', type: 'number', default: 1.5, min: 0, max: 4, step: 0.05, group: 'Post FX' },
      { key: 'bloomRadius', label: 'Bloom Radius', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, group: 'Post FX' },
      { key: 'bloomThreshold', label: 'Bloom Threshold', type: 'number', default: 0.25, min: 0, max: 1, step: 0.01, group: 'Post FX' },
      { key: 'pixelRatio', label: 'Pixel Ratio Cap', type: 'number', default: 1.5, min: 0.75, max: 2, step: 0.25, group: 'Performance' },
    ],
  },
  preview: ThreejsToysSwarmLab,
  sourcePath: 'STUDIO/src/labs/threejs-toys-swarm/createThreejsToysSwarmLab.js',
  dependencies: ['three', 'webgpu', '@artinos/panelflow'],
  usage:
    "import { createThreejsToysSwarmLab } from './labs/threejs-toys-swarm/createThreejsToysSwarmLab.js';\n\nconst lab = createThreejsToysSwarmLab(canvas, { preset: 'codepen-original' });\nlab.randomizeColors(); // matches the CodePen click interaction\nlab.update({ bloomStrength: 1.2 });\n// lab.resize(); lab.dispose();",
  presets: {
    'CodePen Original': { preset: 'codepen-original' },
    Aurora: { preset: 'aurora' },
    Performance: { preset: 'performance' },
  },
  related: ['tsl-webgpu-swarm-particles', 'tsl-structured-array', 'webgpu-bloom-composer', 'gpu-particles'],
  agentNotes:
    'Mode B Lab capsule for CodePen soju22/GRQMzBa "ThreeJS Toy - Swarm". The original imported threejs-toys@0.0.8 swarmBackground (WebGL GPUComputationRenderer); this Lab uses the requested WebGPU/TSL translated module snapshot under modules/physics/particles and keeps the CodePen-specific overlay/click randomization local. createThreejsToysSwarmLab(canvas, options) returns update, resize, randomizeColors, dispose, getStats. Bridge id is "threejs-toys-swarm". Deviation from source is intentional and documented: TSL analytic flow replaces GLSL psrdnoise/GPUComputationRenderer, while preserving camera z 200, gpgpuSize 256 preset, origin attraction, bloom, triangular swarm instances, and click-to-randomize colors.',
  reuseNotes:
    'Use this Lab as the faithful WebGPU/TSL showcase. Reuse the canonical tsl-webgpu-swarm-particles module for product heroes or ambient backgrounds without the CodePen overlay.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default threejsToysSwarmLabMeta;
