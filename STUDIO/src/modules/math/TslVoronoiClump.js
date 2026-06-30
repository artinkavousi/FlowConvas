// TslVoronoiClump.module.js
// Universal TSL Voronoi (cellular F1/F2) clumping core. Over a 3x3 neighborhood of jittered cell
// points it returns the nearest and second-nearest cell ids, a smooth center factor (how "central"
// the sample is within its cell), and the vector toward the nearest cell center. Use it to group
// instances into organic clumps (grass tufts, scatter clusters, mosaic/cellular patterns) and to
// blend per-cell attributes by proximity.
//
// Ported from REF/false-earth/src/components/grass/core/grassCompute.ts (getClumpInfo, lines 189–225),
// generalized from the inline grass version into a reusable factory. Cell jitter comes from the
// injected hash2to2 (see tsl-pcg-hash). Already method-chained TSL — no operator rewrite needed.

import { Fn, vec2, float, int, fract, floor, dot, sqrt, smoothstep, If } from 'three/tsl';

/**
 * Build a Voronoi clump sampler.
 * @param hash2to2   injected stable 2-int -> vec2 hash (e.g. from tsl-pcg-hash) for cell jitter
 * @param cellSize   grid units per cell (float node/uniform). Larger = bigger clumps.
 * @param smoothness blend width for the center factor (float node/uniform, e.g. 0.2)
 * @param toCenterScale scales the returned toCenter vector (float node/uniform, e.g. clump size)
 * @returns clump(gx, gz) -> { bestID:vec2, secondBestID:vec2, centerFactor:float, toCenter:vec2 }
 */
export function createVoronoiClump(hash2to2, cellSize, smoothness, toCenterScale) {
  return (gx, gz) => {
    const cx = floor(float(gx).div(cellSize));
    const cz = floor(float(gz).div(cellSize));

    const minD2 = float(1e9).toVar();
    const secondMinD2 = float(1e9).toVar();
    const bestID = vec2(0.0).toVar();
    const secondBestID = vec2(0.0).toVar();
    const bestDiff = vec2(0.0).toVar();

    const fx = fract(float(gx).div(cellSize));
    const fz = fract(float(gz).div(cellSize));
    const currentPos = vec2(fx, fz);

    const offsets = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0], [0, 0], [1, 0],
      [-1, 1], [0, 1], [1, 1],
    ];

    offsets.forEach(([ox, oy]) => {
      const neighborX = cx.add(float(ox));
      const neighborZ = cz.add(float(oy));
      const rand = hash2to2(int(neighborX), int(neighborZ));
      const point = vec2(float(ox), float(oy)).add(rand);
      const diff = point.sub(currentPos);
      const d2 = dot(diff, diff);
      If(d2.lessThan(minD2), () => {
        secondMinD2.assign(minD2);
        secondBestID.assign(bestID);
        bestDiff.assign(diff);
        minD2.assign(d2);
        bestID.assign(vec2(neighborX, neighborZ));
      }).ElseIf(d2.lessThan(secondMinD2), () => {
        secondMinD2.assign(d2);
        secondBestID.assign(vec2(neighborX, neighborZ));
      });
    });

    const d1 = sqrt(minD2);
    const d2 = sqrt(secondMinD2);
    const centerFactor = smoothstep(float(0.0), smoothness, d2.sub(d1));
    const toCenter = bestDiff.mul(toCenterScale);

    return { bestID, secondBestID, centerFactor, toCenter };
  };
}
