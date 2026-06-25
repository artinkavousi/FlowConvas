import { createTslWebgpuSwarmParticles, tslWebgpuSwarmDefaults } from './modules/physics/particles/TslWebgpuSwarmParticles.module.js';
import { resolveThreejsToysSwarmPreset } from './local/presets/ThreejsToysSwarmPresets';

function randomHex() {
  return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
}

export function createThreejsToysSwarmLab(canvas, options = {}) {
  let config = {
    ...tslWebgpuSwarmDefaults,
    ...resolveThreejsToysSwarmPreset(options.preset ?? 'codepen-original'),
    ...options,
  };
  const engine = createTslWebgpuSwarmParticles(canvas, config);

  function update(params = {}) {
    const presetValues = params.preset ? resolveThreejsToysSwarmPreset(String(params.preset)) : {};
    config = { ...config, ...presetValues, ...params };
    engine.update(config);
  }

  function randomizeColors() {
    const next = {
      colorA: randomHex(),
      colorB: randomHex(),
      colorC: randomHex(),
    };
    config = { ...config, ...next };
    engine.setColors([next.colorA, next.colorB, next.colorC]);
    return next;
  }

  return {
    update,
    resize: engine.resize,
    randomizeColors,
    dispose: engine.dispose,
    getStats: engine.getStats,
  };
}
