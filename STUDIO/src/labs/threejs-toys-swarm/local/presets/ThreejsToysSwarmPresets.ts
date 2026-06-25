export const THREEJS_TOYS_SWARM_PRESETS = {
  'codepen-original': {
    gpgpuSize: 256,
    cameraZ: 200,
    geometryScale: 1,
    noiseCoordScale: 0.01,
    noiseIntensity: 0.0025,
    noiseTimeCoef: 0.0004,
    attractionRadius1: 150,
    attractionRadius2: 250,
    maxVelocity: 0.25,
    bloomStrength: 1.5,
    bloomRadius: 0.5,
    bloomThreshold: 0.25,
    colorA: '#ffffff',
    colorB: '#2dd4bf',
    colorC: '#8b5cf6',
  },
  aurora: {
    gpgpuSize: 128,
    cameraZ: 170,
    geometryScale: 1.25,
    noiseCoordScale: 0.012,
    noiseIntensity: 0.0035,
    attractionRadius1: 120,
    attractionRadius2: 230,
    maxVelocity: 0.32,
    bloomStrength: 1.4,
    bloomRadius: 0.45,
    bloomThreshold: 0.18,
    colorA: '#2dd4bf',
    colorB: '#8b5cf6',
    colorC: '#f97316',
  },
  performance: {
    gpgpuSize: 64,
    cameraZ: 130,
    geometryScale: 1.8,
    noiseCoordScale: 0.016,
    noiseIntensity: 0.0045,
    attractionRadius1: 80,
    attractionRadius2: 170,
    maxVelocity: 0.45,
    bloomStrength: 0.85,
    bloomRadius: 0.25,
    bloomThreshold: 0.2,
    colorA: '#67e8f9',
    colorB: '#a78bfa',
    colorC: '#fb7185',
  },
} as const;

export type ThreejsToysSwarmPresetId = keyof typeof THREEJS_TOYS_SWARM_PRESETS;

export function resolveThreejsToysSwarmPreset(id?: string) {
  return THREEJS_TOYS_SWARM_PRESETS[(id as ThreejsToysSwarmPresetId) ?? 'codepen-original'] ?? THREEJS_TOYS_SWARM_PRESETS['codepen-original'];
}
