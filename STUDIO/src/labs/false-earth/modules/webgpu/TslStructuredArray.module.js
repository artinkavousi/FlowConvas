// TslStructuredArray.module.js
// Universal WebGPU/TSL GPGPU substrate: a CPU-mirrored, alignment-aware structured GPU buffer
// (struct-of-arrays) with atomic-member support and TSL element accessors. Any compute sim that
// needs per-element structured data (particles, grid cells, agents) writes through this instead of
// hand-managing offsets/alignment. Pairs with three/tsl `Fn(...).compute(count)` dispatch.
//
// Ported faithfully from ref/AURORA/src/PARTICLESYSTEM/physic/structuredarray.ts (the buffer that
// backs the MLS-MPM particle + grid buffers). Change: TypeScript types/interfaces removed so it
// lives as an untyped .module.js (this repo has no Three types and uses allowJs). Logic verbatim.

import { struct, instancedArray } from 'three/tsl';

const TYPES = {
  int: { size: 1, alignment: 1, isFloat: false },
  uint: { size: 1, alignment: 1, isFloat: false },
  float: { size: 1, alignment: 1, isFloat: true },

  vec2: { size: 2, alignment: 2, isFloat: true },
  ivec2: { size: 2, alignment: 2, isFloat: false },
  uvec2: { size: 2, alignment: 2, isFloat: false },

  vec3: { size: 3, alignment: 4, isFloat: true },
  ivec3: { size: 3, alignment: 4, isFloat: false },
  uvec3: { size: 3, alignment: 4, isFloat: false },

  vec4: { size: 4, alignment: 4, isFloat: true },
  ivec4: { size: 4, alignment: 4, isFloat: false },
  uvec4: { size: 4, alignment: 4, isFloat: false },

  mat2: { size: 4, alignment: 2, isFloat: true },
  mat3: { size: 12, alignment: 4, isFloat: true },
  mat4: { size: 16, alignment: 4, isFloat: true },
};

/**
 * StructuredArray - aligned, CPU-mirrored structured GPU buffer for TSL compute.
 * Handles std140-style alignment, atomic flags, and TSL element/get accessors.
 */
export class StructuredArray {
  constructor(layout, length, label) {
    this.length = length;
    this.structSize = 0;
    this.layout = this._parse(layout);

    this.structNode = struct(this.layout);
    this.floatArray = new Float32Array(this.structSize * this.length);
    this.intArray = new Int32Array(this.floatArray.buffer);
    const gpuArray = instancedArray(this.floatArray, this.structNode);
    this.buffer = typeof gpuArray.setName === 'function' ? gpuArray.setName(label) : gpuArray.label(label);
  }

  /** Enable/disable atomic operations for a specific element. */
  setAtomic(element, value) {
    const index = Object.keys(this.layout).findIndex((k) => k === element);
    if (index >= 0) {
      this.buffer.structTypeNode.membersLayout[index].atomic = value;
    }
  }

  /** Set a value in the buffer (CPU-side). */
  set(index, element, value) {
    const member = this.layout[element];
    if (!member) {
      console.error(`Unknown element '${element}'`);
      return;
    }

    const offset = index * this.structSize + member.offset;
    const array = member.isFloat ? this.floatArray : this.intArray;

    if (member.size === 1) {
      if (typeof value !== 'number') {
        console.error(`Expected a Number value for element '${element}'`);
        return;
      }
      array[offset] = value;
    } else if (member.size > 1) {
      let arr;
      if (typeof value === 'object' && !Array.isArray(value)) {
        arr = [value.x, value.y || 0, value.z || 0, value.w || 0];
      } else if (Array.isArray(value)) {
        arr = value;
      } else {
        console.error(`Expected an array or vector for element '${element}'`);
        return;
      }

      if (arr.length < member.size) {
        console.error(`Expected an array of length ${member.size} for element '${element}'`);
        return;
      }

      for (let i = 0; i < member.size; i++) {
        array[offset + i] = arr[i];
      }
    }
  }

  /** Get element reference for TSL (the struct at `index`). */
  element(index) {
    return this.buffer.element(index);
  }

  /** Get element property for TSL (member `element` of struct at `index`). */
  get(index, element) {
    return this.buffer.element(index).get(element);
  }

  /** Parse layout definition into an aligned structure. */
  _parse(layout) {
    let offset = 0;
    const parsedLayout = {};

    const keys = Object.keys(layout);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      let member = layout[key];

      // Convert string to object format
      if (typeof member === 'string') {
        member = { type: member };
      }

      const type = member.type;
      if (!TYPES[type]) {
        console.error(`Unknown type '${type}'`);
        continue;
      }

      const { size, alignment, isFloat } = TYPES[type];

      // Apply alignment padding
      const rest = offset % alignment;
      if (rest !== 0) {
        offset += alignment - rest;
      }

      parsedLayout[key] = {
        type,
        atomic: member.atomic,
        size,
        isFloat,
        alignment,
        offset,
      };

      offset += size;
    }

    // Align struct size to vec4 (16 bytes / 4 floats)
    const rest = offset % 4;
    if (rest !== 0) {
      offset += 4 - rest;
    }

    this.structSize = offset;
    return parsedLayout;
  }
}
