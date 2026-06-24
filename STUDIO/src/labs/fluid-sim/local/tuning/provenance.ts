/**
 * provenance.ts — where this Lab's engine snapshot came from (Lab Capsule Standard).
 */

export const labProvenance = {
  lab: 'fluid-sim',
  canonicalSource: 'REF/WebGpu-Fluid-Simulation-master/src',
  componentModules: ['webgpu-fluid-sim', 'fluid-emitters', 'audio-reactive'],
  engine: 'verbatim snapshot under labs/fluid-sim/engine/ (Three.js r184 + TSL + WebGPU)',
  supersedes: 'webgpu-fluid (deleted monolithic module)',
  version: '0.1.0',
  syncStatus: 'snapshot',
} as const;
