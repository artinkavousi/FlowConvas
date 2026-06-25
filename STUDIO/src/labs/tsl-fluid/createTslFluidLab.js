// createTslFluidLab.js
// Faithful composition of the "TSL_Fluid" CodePen (pashafd/OPVGJav) from ARTINOS modules:
// WebGPURenderer + orthographic fullscreen scene -> TslStableFluids2D (built on the GPGPU
// compute-field + grid-sampling cores) -> TslFieldColorDisplay -> PointerVelocitySplat ->
// RenderPipeline(pass + bloom) -> setAnimationLoop. Reproduces source init() + render()
// with the minimal Three r184 postprocessing compatibility bridge.
//
// Imports the Lab's local module snapshots so the capsule runs independently.

import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { createTslStableFluids2D } from './modules/physics/fluid/TslStableFluids2D.module.js';
import { createTslFieldColorDisplay } from './modules/rendering/screenspace/TslFieldColorDisplay.module.js';
import { createPointerVelocitySplat } from './modules/input/PointerVelocitySplat.module.js';
import { TSL_FLUID_DEFAULTS } from './local/tuning/sourceTuning';
import { resolveTslFluidPreset } from './local/presets/TslFluidPresets';

const SOLVER_KEYS = [
  'gridSize',
  'dt',
  'viscosity',
  'vorticity',
  'dissipation',
  'velocityDissipationOffset',
  'forceRadius',
  'forceStrength',
  'colorStrength',
  'jacobiIterations',
  'colorCycleSpeed',
];

function pick(source, keys) {
  const out = {};
  for (const key of keys) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

export function createTslFluidLab(canvas, options = {}) {
  let config = { ...TSL_FLUID_DEFAULTS, ...options };

  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const rendererReady = renderer.init();

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  camera.position.z = 1;

  let solver = null;
  let display = null;
  let postprocessing = null;
  let bloomNode = null;
  let disposed = false;
  let frames = 0;

  function buildSim() {
    solver = createTslStableFluids2D(pick(config, SOLVER_KEYS));
    display = createTslFieldColorDisplay({
      gridSize: solver.gridSize,
      fieldR: solver.fields.densityR,
      fieldG: solver.fields.densityG,
      fieldB: solver.fields.densityB,
    });
    display.addTo(scene);

    postprocessing = new THREE.RenderPipeline(renderer);
    const scenePass = pass(scene, camera);
    const sceneColor = scenePass.getTextureNode('output');
    bloomNode = bloom(sceneColor, config.bloomStrength, config.bloomRadius, config.bloomThreshold);
    postprocessing.outputNode = sceneColor.add(bloomNode);
  }

  function teardownSim() {
    if (display) {
      scene.remove(display.mesh);
      display.dispose();
      display = null;
    }
    solver?.dispose();
    solver = null;
    postprocessing = null;
    bloomNode = null;
  }

  buildSim();

  const pointer = createPointerVelocitySplat(canvas, { velocityScale: 1 });

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
  }
  resize();

  async function frame() {
    if (disposed || !solver || !postprocessing) return;
    await rendererReady;
    const p = pointer.read();
    solver.setPointer(p.x, p.y, p.vx, p.vy);
    if (!config.paused) await solver.step(renderer);
    postprocessing.render();
    pointer.tick();
    frames += 1;
  }
  renderer.setAnimationLoop(frame);

  function update(params = {}) {
    const next = params.preset ? { ...resolveTslFluidPreset(String(params.preset)), ...params } : params;
    const previousGrid = config.gridSize;
    config = { ...config, ...next };

    // gridSize is structural — rebuild the sim (source has no live grid resize).
    if (config.gridSize !== previousGrid) {
      teardownSim();
      buildSim();
    }

    solver?.setParams(pick(config, SOLVER_KEYS));
    if (bloomNode) {
      if (next.bloomStrength !== undefined) bloomNode.strength.value = config.bloomStrength;
      if (next.bloomRadius !== undefined) bloomNode.radius.value = config.bloomRadius;
      if (next.bloomThreshold !== undefined) bloomNode.threshold.value = config.bloomThreshold;
    }
  }
  update(options);

  return {
    update,
    resize,
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      pointer.dispose();
      teardownSim();
      renderer.dispose();
    },
    getStats() {
      return {
        frames,
        grid: solver?.gridSizeValue ?? 0,
        width: canvas.clientWidth || 0,
        height: canvas.clientHeight || 0,
      };
    },
  };
}
