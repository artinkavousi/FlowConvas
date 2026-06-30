/**
 * frame-normalizer — pure transforms from three's internal frame/stats objects
 * to the engine's normalized `PassNode` / `MemoryStats` shapes.
 *
 * The math here (averaged CPU/GPU per pass) mirrors `Inspector.js`'s data layer
 * from the three r185 addon — but with no DOM, no `setText`, no Profiler.
 */

import type { MemoryStats, MemoryRow, PassNode } from '../types';

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Build a `PassNode` tree from a resolved `stats` node. Reads averaged values
 * from `inspector.getStatsData(cid)` — which `ArtinosInspector.resolveStats()`
 * has already populated for this frame.
 */
export function buildPassTree(inspector: { getStatsData: (cid: string) => any }, stats: any): PassNode {
  const data = inspector.getStatsData(stats.cid);
  return {
    cid: stats.cid,
    name: stats.name || `Unnamed ${stats.cid}`,
    kind: stats.isComputeStats === true ? 'compute' : 'render',
    cpu: data?.cpu ?? 0,
    gpu: data?.gpu ?? 0,
    total: data?.total ?? 0,
    gpuAvailable: stats.gpuNotAvailable !== true,
    children: Array.isArray(stats.children) ? stats.children.map((c: any) => buildPassTree(inspector, c)) : [],
  };
}

/** Snapshot `renderer.info.memory` into labeled rows (ported from Memory.js). */
export function buildMemoryStats(memory: any): MemoryStats {
  const m = memory ?? {};
  const rows: MemoryRow[] = [
    { key: 'geometries', label: 'Geometries', count: m.geometries ?? 0, size: null },
    { key: 'textures', label: 'Textures', count: m.textures ?? 0, size: m.texturesSize ?? 0 },
    { key: 'renderTargets', label: 'Render Targets', count: m.renderTargets ?? 0, size: null },
    { key: 'programs', label: 'Programs', count: m.programs ?? 0, size: m.programsSize ?? 0 },
    { key: 'attributes', label: 'Attributes', count: m.attributes ?? 0, size: m.attributesSize ?? 0 },
    { key: 'indexAttributes', label: 'Index Attributes', count: m.indexAttributes ?? 0, size: m.indexAttributesSize ?? 0 },
    { key: 'storageAttributes', label: 'Storage Attributes', count: m.storageAttributes ?? 0, size: m.storageAttributesSize ?? 0 },
    {
      key: 'indirectStorageAttributes',
      label: 'Indirect Storage',
      count: m.indirectStorageAttributes ?? 0,
      size: m.indirectStorageAttributesSize ?? 0,
    },
    { key: 'uniformBuffers', label: 'Uniform Buffers', count: m.uniformBuffers ?? 0, size: m.uniformBuffersSize ?? 0 },
    { key: 'readbackBuffers', label: 'Readback Buffers', count: m.readbackBuffers ?? 0, size: m.readbackBuffersSize ?? 0 },
  ];
  return { total: m.total ?? 0, rows };
}
