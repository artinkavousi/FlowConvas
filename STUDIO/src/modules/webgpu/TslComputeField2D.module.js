// TslComputeField2D.module.js
// Universal WebGPU/TSL GPGPU substrate: a 2D grid of named float storage fields
// (each a `instancedArray` with PBO enabled) plus a tiny compute-dispatch helper.
// Extracted from the "TSL_Fluid" CodePen (pashafd/OPVGJav): the field-allocation +
// setPBO + renderer.computeAsync machinery, generalized away from fluids so any grid
// simulation (reaction-diffusion, smoke, heat, cellular automata, erosion) can reuse it.
//
// Ported faithfully from REF/tsl-fluid/script.js (initFluidSimulation field setup).

import { instancedArray } from 'three/tsl';

export const tslComputeField2DDefaults = {
  width: 512,
  height: 512,
};

/**
 * Create a 2D GPGPU field set.
 * @param {{ width?: number, height?: number }} [options]
 */
export function createTslComputeField2D(options = {}) {
  const width = Math.max(1, Math.floor(options.width ?? tslComputeField2DDefaults.width));
  const height = Math.max(1, Math.floor(options.height ?? tslComputeField2DDefaults.height));
  const count = width * height;

  /** @type {Record<string, ReturnType<typeof instancedArray>>} */
  const fields = {};

  /** Allocate a named float field (returns the existing one if already created). */
  function make(name) {
    if (fields[name]) return fields[name];
    const field = instancedArray(new Float32Array(count), 'float');
    // PBO upload path — matches the source; required for stable per-frame compute.
    field.setPBO(true);
    fields[name] = field;
    return field;
  }

  /** Allocate several named fields at once. */
  function makeMany(names) {
    return names.map((name) => make(name));
  }

  function get(name) {
    return fields[name];
  }

  /** Dispatch a prebuilt TSL compute node (created via `Fn(...)().compute(count)`). */
  async function dispatch(renderer, computeNode) {
    await renderer.computeAsync(computeNode);
  }

  function dispose() {
    for (const key of Object.keys(fields)) {
      fields[key]?.dispose?.();
      delete fields[key];
    }
  }

  return { width, height, count, fields, make, makeMany, get, dispatch, dispose };
}
