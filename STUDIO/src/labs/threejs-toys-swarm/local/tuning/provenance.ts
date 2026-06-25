export const threejsToysSwarmProvenance = {
  source: {
    codepen: 'https://codepen.io/soju22/pen/GRQMzBa',
    title: 'ThreeJS Toy - Swarm',
    package: 'threejs-toys@0.0.8',
    repository: 'https://github.com/klevron/threejs-toys',
    files: [
      'src/backgrounds/swarm/index.js',
      'src/three.js',
      'src/tools/color.js',
      'src/glsl/psrdnoise3.glsl',
    ],
  },
  translation: {
    canonicalSource: 'STUDIO/src/modules/physics/particles/TslWebgpuSwarmParticles.module.js',
    copiedFor: 'STUDIO/src/labs/threejs-toys-swarm',
    syncStatus: 'snapshot',
    deviation:
      'Original WebGL GPUComputationRenderer + GLSL psrdnoise simulation is translated to WebGPU/TSL compute fields with analytic sine/cosine flow while preserving the visible swarm motion, origin attraction, bloom, camera depth, and click color randomization.',
  },
} as const;
