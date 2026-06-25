// TslFieldColorDisplay.module.js
// Universal fullscreen display of a GPU storage field as screen color. Maps up to three
// float fields (R/G/B) sampled at the current uv->cell to a fullscreen quad's colorNode.
// Extracted from the "TSL_Fluid" CodePen (pashafd/OPVGJav) setupDisplay() fluidShader,
// generalized so it can visualize ANY field (dye, velocity magnitude, pressure, heat),
// not just this fluid's dye.
//
// Ported faithfully from REF/tsl-fluid/script.js.

import * as THREE from 'three/webgpu';
import { Fn, uv, floor, uint, vec3, vec4 } from 'three/tsl';

export const tslFieldColorDisplayDefaults = { exposure: 1.0 };

/**
 * @param {{
 *   gridSize: *,            // TSL uniform(float) grid edge size
 *   fieldR: *,              // instancedArray float field (required)
 *   fieldG?: *,             // optional; falls back to fieldR (grayscale)
 *   fieldB?: *,
 * }} options
 */
export function createTslFieldColorDisplay(options) {
  const { gridSize, fieldR } = options;
  const fieldG = options.fieldG ?? fieldR;
  const fieldB = options.fieldB ?? fieldR;

  const buildColorNode = () =>
    Fn(() => {
      const p = uv();
      const x = floor(p.x.mul(gridSize));
      const y = floor(p.y.mul(gridSize));
      const idx = uint(y.mul(gridSize).add(x));
      const r = fieldR.element(idx);
      const g = fieldG.element(idx);
      const b = fieldB.element(idx);
      return vec4(vec3(r, g, b), 1.0);
    })();

  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = buildColorNode();

  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);

  return {
    material,
    mesh,
    geometry,
    /** The TSL color node — pass into another material if you don't want the built-in mesh. */
    colorNode: buildColorNode,
    addTo(scene) {
      scene.add(mesh);
      return mesh;
    },
    update() {
      /* color comes straight from the live fields; nothing to push per-frame */
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
