// TslGridSampling.module.js
// Universal TSL grid/index math for 2D GPGPU fields: linear index <-> cell coords,
// clamped neighbour addressing, and bilinear sampling for semi-Lagrangian advection.
// Extracted verbatim from the "TSL_Fluid" CodePen (pashafd/OPVGJav) getIdx/bilinearSample
// closures, generalized to take any `instancedArray` field + a `gridSize` uniform so every
// 2D grid sim (fluids, reaction-diffusion, heat, cellular automata) can reuse it.
//
// Ported faithfully from REF/tsl-fluid/script.js.

import { uint, float, clamp, floor, fract, mix } from 'three/tsl';

export const tslGridSamplingDefaults = { boundary: 'clamp' };

/**
 * Cell coordinates from a linear instance index.
 * @param {*} index  TSL `instanceIndex` (or any uint node)
 * @param {*} gridSize  TSL uniform(float) holding the grid edge size
 * @returns {{ x: *, y: * }} float x/y cell coordinates
 */
export function cellCoord(index, gridSize) {
  const x = float(index.mod(uint(gridSize)));
  const y = float(index.div(uint(gridSize)));
  return { x, y };
}

/**
 * Build sampling helpers bound to a grid-size uniform.
 * @param {*} gridSize  TSL uniform(float) holding the grid edge size
 */
export function createGridSampling(gridSize) {
  // Clamped linear index for cell (x, y) — boundary-safe addressing.
  const getIdx = (x, y) => {
    const xClamped = clamp(x, 0, gridSize.sub(1));
    const yClamped = clamp(y, 0, gridSize.sub(1));
    return uint(yClamped.mul(gridSize).add(xClamped));
  };

  // Bilinear sample of a float field at continuous (x, y) cell coordinates.
  const bilinearSample = (field, x, y) => {
    const x0 = floor(x);
    const y0 = floor(y);
    const x1 = x0.add(1);
    const y1 = y0.add(1);
    const sx = fract(x);
    const sy = fract(y);
    const v00 = field.element(getIdx(x0, y0));
    const v10 = field.element(getIdx(x1, y0));
    const v01 = field.element(getIdx(x0, y1));
    const v11 = field.element(getIdx(x1, y1));
    return mix(mix(v00, v10, sx), mix(v01, v11, sx), sy);
  };

  const coord = (index) => cellCoord(index, gridSize);

  return { getIdx, bilinearSample, coord };
}
