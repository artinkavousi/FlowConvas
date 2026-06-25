import type { ArtinosModule } from '../../../registry/types';
import TslWebgpuSwarmParticlesShowcase from './TslWebgpuSwarmParticles.showcase';

const tslWebgpuSwarmParticlesMeta: ArtinosModule = {
  id: 'tsl-webgpu-swarm-particles',
  name: 'TSL WebGPU Swarm Particles',
  category: 'physics/particles',
  description:
    'WebGPU/TSL translation of Kevin Levron threejs-toys Swarm: GPU-resident position/velocity fields, noise-driven attraction to origin, velocity clamping, instanced triangular swarm geometry, color-ramp randomization, and WebGPU bloom.',
  tags: ['webgpu', 'tsl', 'particles', 'swarm', 'gpgpu', 'instancing', 'three', 'bloom', 'codepen'],
  schema: {
    id: 'tsl-webgpu-swarm-particles',
    name: 'TSL WebGPU Swarm Particles',
    category: 'physics/particles',
    parameters: [
      {
        key: 'gpgpuSize',
        label: 'GPGPU Size',
        type: 'enum',
        default: 128,
        options: [
          { label: '64', value: 64 },
          { label: '128', value: 128 },
          { label: '256', value: 256 },
        ],
        group: 'Simulation',
      },
      { key: 'paused', label: 'Paused', type: 'boolean', default: false, group: 'Simulation' },
      { key: 'cameraZ', label: 'Camera Z', type: 'number', default: 160, min: 50, max: 300, step: 1, group: 'Camera' },
      { key: 'geometryScale', label: 'Geometry Scale', type: 'number', default: 1, min: 0.1, max: 4, step: 0.05, group: 'Geometry' },
      { key: 'noiseCoordScale', label: 'Noise Scale', type: 'number', default: 0.01, min: 0.001, max: 0.05, step: 0.001, group: 'Motion' },
      { key: 'noiseIntensity', label: 'Noise Intensity', type: 'number', default: 0.0025, min: 0, max: 0.02, step: 0.0005, group: 'Motion' },
      { key: 'noiseTimeCoef', label: 'Noise Time', type: 'number', default: 0.0004, min: 0, max: 0.004, step: 0.0001, group: 'Motion' },
      { key: 'attractionRadius1', label: 'Attract Inner', type: 'number', default: 150, min: 20, max: 300, step: 1, group: 'Motion' },
      { key: 'attractionRadius2', label: 'Attract Outer', type: 'number', default: 250, min: 50, max: 420, step: 1, group: 'Motion' },
      { key: 'maxVelocity', label: 'Max Velocity', type: 'number', default: 0.25, min: 0.01, max: 1, step: 0.01, group: 'Motion' },
      { key: 'colorA', label: 'Color A', type: 'color', default: '#2dd4bf', group: 'Color' },
      { key: 'colorB', label: 'Color B', type: 'color', default: '#8b5cf6', group: 'Color' },
      { key: 'colorC', label: 'Color C', type: 'color', default: '#f97316', group: 'Color' },
      { key: 'bloomStrength', label: 'Bloom Strength', type: 'number', default: 1.5, min: 0, max: 4, step: 0.05, group: 'Post FX' },
      { key: 'bloomRadius', label: 'Bloom Radius', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, group: 'Post FX' },
      { key: 'bloomThreshold', label: 'Bloom Threshold', type: 'number', default: 0.25, min: 0, max: 1, step: 0.01, group: 'Post FX' },
      { key: 'pixelRatio', label: 'Pixel Ratio Cap', type: 'number', default: 1.5, min: 0.75, max: 2, step: 0.25, group: 'Performance' },
    ],
  },
  preview: TslWebgpuSwarmParticlesShowcase,
  sourcePath: 'STUDIO/src/modules/physics/particles/TslWebgpuSwarmParticles.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createTslWebgpuSwarmParticles } from './modules/physics/particles/TslWebgpuSwarmParticles.module.js';\n\nconst swarm = createTslWebgpuSwarmParticles(canvas, { gpgpuSize: 128 });\nswarm.update({ noiseIntensity: 0.004, colorA: '#2dd4bf' });\nswarm.setColors(['#2dd4bf', '#8b5cf6', '#f97316']);\n// on unmount: swarm.dispose();",
  presets: {
    'CodePen Scale': { gpgpuSize: 256, cameraZ: 200, geometryScale: 1, noiseCoordScale: 0.01, noiseIntensity: 0.0025, noiseTimeCoef: 0.0004, attractionRadius1: 150, attractionRadius2: 250, maxVelocity: 0.25, bloomStrength: 1.5, bloomRadius: 0.5, bloomThreshold: 0.25 },
    Balanced: { gpgpuSize: 128, cameraZ: 160, geometryScale: 1.25, noiseCoordScale: 0.012, noiseIntensity: 0.0035, attractionRadius1: 120, attractionRadius2: 230, maxVelocity: 0.32, bloomStrength: 1.3 },
    Performance: { gpgpuSize: 64, cameraZ: 120, geometryScale: 1.8, noiseIntensity: 0.004, attractionRadius1: 80, attractionRadius2: 160, maxVelocity: 0.45, bloomStrength: 0.8 },
  },
  related: ['tsl-structured-array', 'tsl-noise', 'webgpu-bloom-composer', 'gpu-particles'],
  agentNotes:
    'Mode B canonical module for the WebGPU/TSL Swarm translation. createTslWebgpuSwarmParticles(canvas, options) owns WebGPURenderer, TSL compute fields for position/oldPosition/velocity, instanced triangular mesh rendering, RenderPipeline bloom, resize/update/dispose, setColors(), and randomizeColors(). Bridge id is "tsl-webgpu-swarm-particles". Provenance: translated from CodePen soju22/GRQMzBa and npm package threejs-toys@0.0.8 src/backgrounds/swarm/index.js. Deviation: source was WebGL GPUComputationRenderer + GLSL psrdnoise; this keeps the same swarm forces, origin attraction, camera depth, bloom, and color randomization in TSL/WebGPU with analytic sine/cosine flow instead of the exact GLSL psrdnoise gradient.',
  reuseNotes:
    'Use for WebGPU hero backgrounds needing a controllable luminous swarm. For exact historical WebGL fidelity, port WebglGpgpuSwarmParticles separately; this module is the requested TSL/WebGPU replica path.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default tslWebgpuSwarmParticlesMeta;
