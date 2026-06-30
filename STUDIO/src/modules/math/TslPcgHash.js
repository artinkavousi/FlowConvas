// TslPcgHash.module.js
// Universal TSL PCG integer hash — stable, tile-free pseudo-random with NO sin / NO mod.
// Maps integer lattice coordinates to deterministic [0,1) values, so per-cell jitter and seeds stay
// stable as a world scrolls (unlike sin/fract hashes, which band and repeat). Drop into any compute
// kernel or instanced material that needs stable per-cell randomness (grass jitter, scatter seeds,
// Voronoi cell ids, spawn offsets).
//
// Ported verbatim from REF/false-earth/src/components/grass/core/shaderHelpers.ts (lines 34–57).
// Already method-chained TSL (uint bit-ops) — no operator rewrite needed.

import { Fn, float, uint, vec2 } from 'three/tsl';

// PCG hash constants (no sin, no mod — stable and non-repeating)
const PCG_MUL = 747796405;
const PCG_ADD = 2891336453;
const PCG_OUT = 277803737;
const PCG_MAX = 4294967295.0;

/** PCG hash: integer in -> deterministic random float in [0,1). */
export const pcgHash = /*@__PURE__*/ Fn(([u]) => {
  const state = uint(u).mul(uint(PCG_MUL)).add(uint(PCG_ADD));
  let word = state.shiftRight(state.shiftRight(uint(28)).add(uint(4))).bitXor(state);
  word = word.mul(uint(PCG_OUT));
  word = word.shiftRight(uint(22)).bitXor(word);
  return float(word).div(float(PCG_MAX));
});

/** Hash two integer coords to one float in [0,1). */
export const hash2to1 = /*@__PURE__*/ Fn(([x, y]) => {
  const seed = uint(x).mul(uint(1597334677)).add(uint(y).mul(uint(3812015801)));
  return pcgHash(seed);
});

/** Hash two integer coords to a vec2 of two independent floats in [0,1). */
export const hash2to2 = /*@__PURE__*/ Fn(([x, y]) => {
  const seed1 = uint(x).mul(uint(1597334677)).add(uint(y).mul(uint(3812015801)));
  const seed2 = uint(x).mul(uint(3812015801)).add(uint(y).mul(uint(1597334677)));
  return vec2(pcgHash(seed1), pcgHash(seed2));
});
