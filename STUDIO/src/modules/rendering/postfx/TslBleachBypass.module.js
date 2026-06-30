// TslBleachBypass.module.js — ARTINOS wrapper around three.js r185 examples/jsm/tsl/display/BleachBypass.
import { uniform } from 'three/tsl';
import { bleach } from '../../tsl/display/BleachBypass.js';
import { createTslPostScene } from './_tslPostHarness.js';

export function createTslBleachScene(canvas, params = {}) {
  const opacity = uniform(params.opacity ?? 1.0);
  const engine = createTslPostScene(
    canvas,
    (scenePass) => bleach(scenePass, opacity),
    (p) => { if (p.opacity !== undefined) opacity.value = p.opacity; },
  );
  engine.update(params);
  return engine;
}
