import { createTslGpuGrassField, tslGpuGrassFieldDefaults } from './modules/rendering/environments/TslGpuGrassField.module.js';
import { createTslVatLifecycleInstances, tslVatLifecycleDefaults } from './modules/rendering/environments/TslVatLifecycleInstances.module.js';
import { createTslCosmicBeamWaves, tslCosmicBeamWavesDefaults } from './modules/rendering/environments/TslCosmicBeamWaves.module.js';
import { createThirdPersonCharacterNavigation, thirdPersonCharacterDefaults } from './modules/input/ThirdPersonCharacterNavigation.module.js';
import { createFalseEarthAudio, falseEarthAudioDefaults } from './local/audio/FalseEarthAudio.js';
import { createFalseEarthStarfield, falseEarthStarfieldDefaults } from './local/background/FalseEarthStarfield.js';

export const falseEarthLabDefaults = {
  preset: 'source-world',
  ...tslGpuGrassFieldDefaults,
  roseCount: 380,
  roseRadius: 12,
  cosmicEnabled: true,
  rosesEnabled: true,
  characterEnabled: true,
  characterRun: true,
  cameraMode: 'follow',
  characterScale: 0.95,
  audioEnabled: false,
  audioVolume: falseEarthAudioDefaults.volume,
  starsEnabled: true,
  starIntensity: 1,
};

export const falseEarthLabPresets = {
  'source-world': {
    bladesPerAxis: 192,
    areaSize: 30,
    amplitude: 1.35,
    frequency: 0.075,
    bladeHeightMin: 0.42,
    bladeHeightMax: 1.45,
    windStrength: 0.55,
    windSpeed: 1.15,
    baseColor: '#071511',
    tipColor: '#4fbf7c',
    rimColor: '#20e0c5',
    roseCount: 380,
    roseRadius: 12,
    cameraHeight: 10.5,
    cameraDistance: 19,
  },
  'cinematic-meadow': {
    bladesPerAxis: 176,
    areaSize: 38,
    amplitude: 0.9,
    frequency: 0.055,
    bladeHeightMin: 0.24,
    bladeHeightMax: 0.92,
    windStrength: 0.28,
    windSpeed: 0.8,
    roseCount: 260,
    roseRadius: 15,
    tipColor: '#77c86d',
    rimColor: '#9affd6',
    cameraHeight: 12,
    cameraDistance: 24,
  },
  'storm-field': {
    bladesPerAxis: 208,
    areaSize: 28,
    amplitude: 1.1,
    frequency: 0.085,
    bendAmount: 0.58,
    windStrength: 1.2,
    windSpeed: 2.2,
    windScale: 0.26,
    windDirX: 1,
    windDirZ: 0.1,
    roseCount: 520,
    roseRadius: 10,
    rimColor: '#43ffe3',
  },
};

export function resolveFalseEarthPreset(preset) {
  return falseEarthLabPresets[preset] || falseEarthLabPresets['source-world'];
}

function resolveCanvases(target) {
  if (target instanceof HTMLCanvasElement) return { grass: target };
  return target;
}

function makeTransparent(engine) {
  if (engine?.scene) engine.scene.background = null;
}

export async function createFalseEarthLab(target, options = {}) {
  const canvases = resolveCanvases(target);
  let config = {
    ...falseEarthLabDefaults,
    ...resolveFalseEarthPreset(options.preset || falseEarthLabDefaults.preset),
    ...options,
  };

  const grass = createTslGpuGrassField(canvases.grass, config);
  const starfield = createFalseEarthStarfield(grass.scene, {
    enabled: config.starsEnabled,
    opacity: config.starIntensity,
  });
  const roses = canvases.roses
    ? await createTslVatLifecycleInstances(canvases.roses, {
        ...tslVatLifecycleDefaults,
        count: config.roseCount,
        radius: config.roseRadius,
        amplitude: config.amplitude,
        frequency: config.frequency,
        windStrength: config.windStrength,
        windSpeed: config.windSpeed,
        cameraHeight: config.cameraHeight + 5,
        cameraDistance: config.cameraDistance + 12,
        pixelRatio: config.pixelRatio,
        renderVatMesh: true,
        vatMaterialMode: 'basic',
      })
    : null;
  let audio = null;
  const beamImpacts = [];
  function handleBeamHit(event) {
    beamImpacts.push(event);
    if (beamImpacts.length > 24) beamImpacts.shift();
    audio?.playBeam(Math.max(0.35, Math.min(0.8, event.radius / 10)));
  }

  const cosmic = canvases.cosmic
    ? createTslCosmicBeamWaves(canvases.cosmic, {
        ...tslCosmicBeamWavesDefaults,
        cameraHeight: Math.max(22, config.cameraHeight + 10),
        cameraDistance: Math.max(36, config.cameraDistance + 18),
        pixelRatio: config.pixelRatio,
        autoSpawn: config.cosmicEnabled,
        onBeamHit: handleBeamHit,
      })
    : null;
  const character = canvases.character
    ? await createThirdPersonCharacterNavigation(canvases.character, {
        ...thirdPersonCharacterDefaults,
        run: config.characterRun,
        cameraMode: config.cameraMode,
        modelScale: config.characterScale,
        cameraHeight: 4.5,
        cameraDistance: 9,
        pixelRatio: config.pixelRatio,
      })
    : null;
  audio = createFalseEarthAudio({
    enabled: config.audioEnabled,
    volume: config.audioVolume,
    characterRun: config.characterRun,
    cosmicEnabled: config.cosmicEnabled,
  });

  makeTransparent(roses);
  makeTransparent(cosmic);
  makeTransparent(character);

  function update(next = {}) {
    const presetPatch = next.preset ? resolveFalseEarthPreset(String(next.preset)) : {};
    config = { ...config, ...presetPatch, ...next };
    grass.update(config);
    starfield.update({
      enabled: config.starsEnabled,
      opacity: config.starIntensity,
    });
    roses?.update({
      count: config.roseCount,
      radius: config.roseRadius,
      amplitude: config.amplitude,
      frequency: config.frequency,
      windStrength: config.windStrength,
      windSpeed: config.windSpeed,
      pixelRatio: config.pixelRatio,
      renderVatMesh: true,
      vatMaterialMode: 'basic',
    });
    cosmic?.update({
      autoSpawn: config.cosmicEnabled,
      cameraHeight: Math.max(22, config.cameraHeight + 10),
      cameraDistance: Math.max(36, config.cameraDistance + 18),
      pixelRatio: config.pixelRatio,
    });
    character?.update({
      run: config.characterRun,
      cameraMode: config.cameraMode,
      modelScale: config.characterScale,
      pixelRatio: config.pixelRatio,
    });
    audio.update({
      enabled: config.audioEnabled,
      volume: config.audioVolume,
      characterRun: config.characterRun,
      cosmicEnabled: config.cosmicEnabled,
    });
  }

  function resize() {
    grass.resize();
    roses?.resize();
    cosmic?.resize();
    character?.resize();
  }

  update(options);

  return {
    update,
    resize,
    dispose() {
      grass.dispose();
      starfield.dispose();
      roses?.dispose();
      cosmic?.dispose();
      character?.dispose();
      audio.dispose();
    },
    getStats() {
      return {
        ...grass.getStats(),
        activeBeams: cosmic?.getStats().activeBeams ?? 0,
        beamImpacts: beamImpacts.length,
        roseCount: config.roseCount,
        canonicalModules: 6,
      };
    },
  };
}
