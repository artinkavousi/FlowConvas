import type { ArtinosModule } from '../../../registry/types';
import ParticleForceFieldsShowcase from './ParticleForceFields.showcase';

const FIELD_OPTIONS = [
  'ATTRACTOR', 'REPELLER', 'VORTEX', 'TURBULENCE', 'DIRECTIONAL', 'VORTEX_TUBE', 'SPHERICAL', 'CURL_NOISE',
].map((v) => ({ label: v, value: v }));

const particleForceFieldsMeta: ArtinosModule = {
  id: 'particle-force-fields',
  name: 'Particle Force Fields',
  category: 'physics/particles',
  description:
    'Dynamic force-field system for particle sims: 8 field types (attractor, repeller, vortex, turbulence, directional/wind, vortex-tube/tornado, spherical, curl-noise), 4 falloff modes, 7 named presets, a GPU (TSL) per-field force evaluator, and a CPU manager that packs up to N fields into uniforms. Add steerable forces to any particle solver.',
  tags: ['physics', 'particles', 'force-field', 'vortex', 'turbulence', 'curl-noise', 'tsl', 'webgpu', 'three'],
  schema: {
    id: 'particle-force-fields',
    name: 'Particle Force Fields',
    category: 'physics/particles',
    parameters: [
      { key: 'fieldType', label: 'Field Type', type: 'enum', default: 'VORTEX', options: FIELD_OPTIONS, group: 'Field' },
      { key: 'strength', label: 'Strength', type: 'number', default: 30, min: 1, max: 200, step: 1, group: 'Field' },
      { key: 'radius', label: 'Radius', type: 'number', default: 40, min: 5, max: 100, step: 1, group: 'Field' },
    ],
  },
  preview: ParticleForceFieldsShowcase,
  sourcePath: 'STUDIO/src/modules/physics/particles/ParticleForceFields.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { calculateForceFieldForce, ForceFieldManager, ForceFieldType, ForceFalloff } from './modules/physics/particles/ParticleForceFields.module';\n\n// GPU (in a compute Fn): force on a particle from one field\nconst f = calculateForceFieldForce(pos, type, fieldPos, dir, axis, strength, radius, falloff, turbScale, noiseSpeed);\n// CPU: manage many fields + pack uniforms\nconst mgr = new ForceFieldManager(8);\nmgr.addPreset('TORNADO');\nmgr.updateUniforms();",
  presets: {
    Vortex: { fieldType: 'VORTEX', strength: 30, radius: 40 },
    'Black Hole': { fieldType: 'ATTRACTOR', strength: 200, radius: 50 },
    Tornado: { fieldType: 'VORTEX_TUBE', strength: 60, radius: 30 },
    Turbulence: { fieldType: 'TURBULENCE', strength: 25, radius: 60 },
    'Curl Noise': { fieldType: 'CURL_NOISE', strength: 40, radius: 60 },
  },
  related: ['mls-mpm-solver', 'tsl-noise', 'particle-renderer-system'],
  agentNotes:
    "Ported faithfully from ref/AURORA/src/PARTICLESYSTEM/physic/forcefields.ts (TS enums→frozen objects ForceFieldType/ForceFalloff; interfaces dropped; imports triNoise3Dvec from math/TslNoise.module; method-chained TSL, no operator rewrite). TSL Fns: calculateFalloff(dist,radius,falloffType)->float and calculateForceFieldForce(particlePos:vec3, fieldType:int, fieldPos:vec3, fieldDir:vec3, fieldAxis:vec3, strength:float, radius:float, falloffType:int, turbScale:float, noiseSpeed:float)->vec3 — early-returns vec3(0) outside radius; 8 field types incl. divergence-free curl-noise; uses the `time` node. CPU class ForceFieldManager(maxFields=8): addField/addPreset/updateField/removeField/clearFields + updateUniforms() which packs active fields into fieldCount/Types/Positions/Directions/Axes/Strengths/Radii/Falloffs/TurbScales/NoiseSpeeds uniforms for a solver loop. The MLS-MPM g2p kernel calls calculateForceFieldForce. Bridge id 'particle-force-fields'. Showcase drives ONE field on a plain instancedArray point cloud (no MLS-MPM) to prove reuse.",
  reuseNotes:
    'Reuse on any GPU particle system to add attractors/vortices/wind/turbulence. The manager packs the uniforms the solver loop reads; the TSL evaluator is the per-particle force. Pairs with mls-mpm-solver / tsl-structured-array.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default particleForceFieldsMeta;
