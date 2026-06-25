// Provenance for the False Earth Lab capsule and module snapshots.
// Runtime snapshots live under STUDIO/src/labs/false-earth/modules/.

export const falseEarthSourceProvenance = {
  repository: 'https://github.com/momentchan/false-earth',
  sourceCommit: '74cc91cb2764fbb75aee201d92752e4da37ad311',
  threeCoreSubmoduleCommit: '61bde95d850c756e2a0d425b29fbd762e38a0c71',
  liveDemo: 'https://false-earth.mingjyunhung.com/',
  article: 'https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/',
  license: 'MIT',
  localReference: 'REF/false-earth',
} as const;

export const moduleProvenance = [
  {
    canonicalSource: 'STUDIO/src/modules/math/TslVegetationMath.module.js',
    copiedFor: 'STUDIO/src/labs/false-earth/modules/math/TslVegetationMath.module.js',
    version: '0.1.0',
    syncStatus: 'snapshot',
  },
  {
    canonicalSource: 'STUDIO/src/modules/rendering/environments/TslInfiniteTerrainField.module.js',
    copiedFor: 'STUDIO/src/labs/false-earth/modules/rendering/environments/TslInfiniteTerrainField.module.js',
    version: '0.1.0',
    syncStatus: 'snapshot',
  },
  {
    canonicalSource: 'STUDIO/src/modules/webgpu/TslIndirectDrawLodRouter.module.js',
    copiedFor: 'STUDIO/src/labs/false-earth/modules/webgpu/TslIndirectDrawLodRouter.module.js',
    version: '0.1.0',
    syncStatus: 'snapshot',
  },
  {
    canonicalSource: 'STUDIO/src/modules/webgpu/TslStructuredArray.module.js',
    copiedFor: 'STUDIO/src/labs/false-earth/modules/webgpu/TslStructuredArray.module.js',
    version: '0.1.0',
    syncStatus: 'snapshot',
  },
  {
    canonicalSource: 'STUDIO/src/modules/rendering/environments/TslGpuGrassField.module.js',
    copiedFor: 'STUDIO/src/labs/false-earth/modules/rendering/environments/TslGpuGrassField.module.js',
    version: '0.1.0',
    syncStatus: 'snapshot',
  },
  {
    canonicalSource: 'STUDIO/src/modules/rendering/environments/TslVatLifecycleInstances.module.js',
    copiedFor: 'STUDIO/src/labs/false-earth/modules/rendering/environments/TslVatLifecycleInstances.module.js',
    version: '0.1.0',
    syncStatus: 'snapshot',
    deviation: 'The Lab passes renderVatMesh=false and uses the verified lifecycle proxy path because the raw VAT mesh shader path is not yet stable in the layered WebGPU Lab composition.',
  },
  {
    canonicalSource: 'STUDIO/src/modules/rendering/environments/TslCosmicBeamWaves.module.js',
    copiedFor: 'STUDIO/src/labs/false-earth/modules/rendering/environments/TslCosmicBeamWaves.module.js',
    version: '0.1.0',
    syncStatus: 'snapshot',
  },
  {
    canonicalSource: 'STUDIO/src/modules/input/ThirdPersonCharacterNavigation.module.js',
    copiedFor: 'STUDIO/src/labs/false-earth/modules/input/ThirdPersonCharacterNavigation.module.js',
    version: '0.1.0',
    syncStatus: 'snapshot',
  },
  {
    canonicalSource: 'STUDIO/src/modules/rendering/postfx/FalseEarthPostStack.module.js',
    copiedFor: 'STUDIO/src/labs/false-earth/modules/rendering/postfx/FalseEarthPostStack.module.js',
    version: '0.1.0',
    syncStatus: 'snapshot',
  },
] as const;

export const assetProvenance = {
  copiedFor: 'STUDIO/public/labs/false-earth',
  requiredForCoreFidelity: [
    'models/Astronaut.glb',
    'models/Idle.glb',
    'models/Running.glb',
    'models/Walking.glb',
    'models/WalkingBack.glb',
    'vat/Rose.glb',
    'vat/Rose_pos.exr',
    'vat/Rose_nrm.png',
    'vat/Rose_meta.json',
    'textures/Rose/*',
  ],
  optionalPolish: [
    'audio/wave01.mp3',
    'audio/grass_field.mp3',
    'audio/noise.m4a',
    'textures/starmap_2020_4k.ktx2',
    'textures/potsdamer_platz_1k_nb.hdr',
  ],
  audio: [
    'audio/grass_field.mp3',
    'audio/noise.m4a',
    'audio/wave01.mp3',
    'audio/fs_grass1.mp3',
    'audio/fs_grass2.mp3',
    'audio/fs_grass3.mp3',
    'audio/fs_grass4.mp3',
    'audio/fs_grass5.mp3',
  ],
} as const;
