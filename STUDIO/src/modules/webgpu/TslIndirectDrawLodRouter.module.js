// TslIndirectDrawLodRouter.module.js
// False Earth-derived WebGPU/TSL indirect draw routing substrate.
// Preserves the source drawIndirectStructure + atomic visible-index routing model, but keeps it
// reusable for any instanced system that needs GPU-side culling and distance LOD assignment.

import * as THREE from 'three/webgpu';
import {
  Fn,
  If,
  abs,
  atomicAdd,
  atomicStore,
  float,
  fract,
  instancedArray,
  instanceIndex,
  int,
  length,
  round,
  select,
  storage,
  struct,
  uint,
  vec2,
  vec3,
} from 'three/tsl';
import { hash2to1 } from '../math/TslVegetationMath.module';

export const falseEarthLodRouterProvenance = {
  repo: 'https://github.com/momentchan/false-earth',
  commit: '74cc91cb2764fbb75aee201d92752e4da37ad311',
  sourceFiles: [
    'src/components/grass/core/config.ts',
    'src/components/grass/core/grassCompute.ts',
    'src/components/grass/hooks/useGrassCompute.ts',
    'src/components/Rose/core/vatCompute.ts',
    'src/components/Rose/hooks/useRoseLODLoader.ts',
  ],
};

export const DEFAULT_FALSE_EARTH_LODS = [
  { segments: 15, minDistance: 0, maxDistance: 5, debugColor: [1, 0.08, 0.02] },
  { segments: 5, minDistance: 5, maxDistance: 20, debugColor: [0.1, 0.95, 0.25] },
  { segments: 2, minDistance: 20, maxDistance: Infinity, debugColor: [0.1, 0.35, 1] },
];

// WebGPU indirect draw format used by False Earth grass and rose VAT.
// [vertexCount/indexCount, instanceCount, firstVertex/firstIndex, firstInstance, offset/baseVertex]
export const drawIndirectStructure = struct({
  vertexCount: 'uint',
  instanceCount: { type: 'uint', atomic: true },
  firstVertex: 'uint',
  firstInstance: 'uint',
  offset: 'uint',
});

export function createVisibleIndicesBuffer(instanceCount) {
  const visibleIndicesArray = new Uint32Array(instanceCount);
  visibleIndicesArray.fill(0);
  return instancedArray(visibleIndicesArray, 'uint');
}

export function createLodDrawConfig({
  instanceCount,
  vertexCount = 1,
  segments = 1,
  minDistance = 0,
  maxDistance = Infinity,
  debugColor = [1, 1, 1],
}) {
  const drawBuffer = new THREE.IndirectStorageBufferAttribute(new Uint32Array(5), 5);
  const drawStorage = storage(drawBuffer, drawIndirectStructure, 1);

  return {
    segments,
    minDistance,
    maxDistance,
    debugColor,
    indices: createVisibleIndicesBuffer(instanceCount),
    drawBuffer,
    drawStorage,
    vertexCount,
  };
}

export function createFalseEarthLodConfigs(instanceCount, lods = DEFAULT_FALSE_EARTH_LODS, vertexCountFactory) {
  return lods.map((lod) =>
    createLodDrawConfig({
      ...lod,
      instanceCount,
      vertexCount: vertexCountFactory ? vertexCountFactory(lod) : lod.segments * 2 + 2,
    }),
  );
}

export function createResetDrawBufferCompute(lodConfigs) {
  const resetFn = Fn(() => {
    lodConfigs.forEach((lodConfig) => {
      const drawBuffer = lodConfig.drawStorage;
      drawBuffer.get('vertexCount').assign(uint(lodConfig.vertexCount));
      atomicStore(drawBuffer.get('instanceCount'), uint(0));
      drawBuffer.get('firstVertex').assign(uint(0));
      drawBuffer.get('firstInstance').assign(uint(0));
      drawBuffer.get('offset').assign(uint(0));
    });
  });

  return resetFn().compute(1);
}

export function createDistanceLodRouter({
  instanceCount,
  gridSize,
  spacing,
  areaRadius,
  lodConfigs,
  uniforms,
  outputPosition,
  outputColor,
  outputLod,
}) {
  const gridSizeNode = uint(gridSize);
  const halfGrid = float(gridSize - 1).mul(0.5);
  const spacingNode = float(spacing);
  const areaRadiusNode = float(areaRadius);

  const routeToLod = (distToFocus, idx) => {
    const buildChain = (lodIndex) => {
      if (lodIndex >= lodConfigs.length) return null;

      const config = lodConfigs[lodIndex];
      const isLast = lodIndex === lodConfigs.length - 1;
      const minDist = float(config.minDistance);
      const maxDist = config.maxDistance === Infinity ? float(1e9) : float(config.maxDistance);

      const noiseSeed = hash2to1(int(idx), int(idx).add(19)).mul(2).sub(1);
      const noisyDist = distToFocus.add(noiseSeed.mul(uniforms.uLodNoiseScale));
      const inRange = noisyDist.greaterThanEqual(minDist).and(
        isLast || config.maxDistance === Infinity
          ? noisyDist.lessThanEqual(maxDist)
          : noisyDist.lessThan(maxDist),
      );

      const lodBlock = () => {
        const drawIndex = atomicAdd(config.drawStorage.get('instanceCount'), uint(1));
        config.indices.element(drawIndex).assign(uint(idx));
        outputLod.element(idx).assign(float(lodIndex));
        outputColor.element(idx).assign(vec3(config.debugColor[0], config.debugColor[1], config.debugColor[2]));
      };

      if (isLast) {
        return If(inRange, lodBlock);
      }

      const nextChain = buildChain(lodIndex + 1);
      return If(inRange, lodBlock).Else(() => {
        if (nextChain) nextChain;
      });
    };

    const chain = buildChain(0);
    if (chain) chain;
  };

  const routeFn = Fn(() => {
    const gridX = instanceIndex.mod(gridSizeNode);
    const gridZ = instanceIndex.div(gridSizeNode);
    const snapX = round(uniforms.uGridIndex.x);
    const snapZ = round(uniforms.uGridIndex.y);
    const globalGridX = int(gridX).add(int(snapX));
    const globalGridZ = int(gridZ).add(int(snapZ));

    const jitterX = hash2to1(globalGridX, globalGridZ).sub(0.5).mul(spacingNode).mul(uniforms.uJitter);
    const jitterZ = hash2to1(globalGridX.add(113), globalGridZ.add(71)).sub(0.5).mul(spacingNode).mul(uniforms.uJitter);
    const x = float(gridX).sub(halfGrid).mul(spacingNode).add(jitterX).add(uniforms.uGroupOffset.x);
    const z = float(gridZ).sub(halfGrid).mul(spacingNode).add(jitterZ).add(uniforms.uGroupOffset.z);
    const pos = vec3(x, 0, z);
    const diff = vec2(x, z).sub(uniforms.uFocusXZ);
    const distToFocus = length(diff);
    const inCircle = length(vec2(x, z).sub(vec2(uniforms.uGroupOffset.x, uniforms.uGroupOffset.z))).lessThan(areaRadiusNode);

    outputPosition.element(instanceIndex).assign(pos);
    outputLod.element(instanceIndex).assign(float(-1));
    outputColor.element(instanceIndex).assign(vec3(0.08, 0.09, 0.1));

    If(inCircle, () => {
      routeToLod(distToFocus, instanceIndex);
    });
  });

  return routeFn().compute(instanceCount);
}

export function createLodRouterBuffers(instanceCount) {
  return {
    positions: instancedArray(instanceCount, 'vec3'),
    colors: instancedArray(instanceCount, 'vec3'),
    lods: instancedArray(instanceCount, 'float'),
  };
}

export function estimateLodCounts({
  gridSize,
  spacing,
  focusX,
  focusZ,
  groupX = 0,
  groupZ = 0,
  jitter = 0,
  lodNoiseScale = 0,
  areaRadius,
  lods = DEFAULT_FALSE_EARTH_LODS,
}) {
  const counts = lods.map(() => 0);
  const halfGrid = (gridSize - 1) * 0.5;

  for (let i = 0; i < gridSize * gridSize; i += 1) {
    const gx = i % gridSize;
    const gz = Math.floor(i / gridSize);
    const baseX = (gx - halfGrid) * spacing + groupX;
    const baseZ = (gz - halfGrid) * spacing + groupZ;
    const dxGroup = baseX - groupX;
    const dzGroup = baseZ - groupZ;
    if (Math.hypot(dxGroup, dzGroup) >= areaRadius) continue;

    const dist = Math.hypot(baseX - focusX, baseZ - focusZ);
    const noisyDist = dist + (((i * 0.12345) % 1) * 2 - 1) * lodNoiseScale * Math.max(0, Math.min(1, jitter));
    const lodIndex = lods.findIndex((lod, index) => {
      const max = lod.maxDistance === Infinity ? Number.POSITIVE_INFINITY : lod.maxDistance;
      return noisyDist >= lod.minDistance && (index === lods.length - 1 ? noisyDist <= max : noisyDist < max);
    });
    if (lodIndex >= 0) counts[lodIndex] += 1;
  }

  return counts;
}
