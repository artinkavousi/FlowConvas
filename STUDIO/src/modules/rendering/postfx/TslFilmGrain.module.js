// TslFilmGrain.module.js — ARTINOS wrapper around three.js r185 examples/jsm/tsl/display/FilmNode.
import { uniform } from 'three/tsl';
import { film } from '../../tsl/display/FilmNode.js';
import { createTslPostScene } from './_tslPostHarness.js';

export function createTslFilmScene(canvas, params = {}) {
  const intensity = uniform(params.intensity ?? 0.5);
  const engine = createTslPostScene(
    canvas,
    (scenePass) => film(scenePass, intensity),
    (p) => { if (p.intensity !== undefined) intensity.value = p.intensity; },
  );
  engine.update(params);
  return engine;
}
