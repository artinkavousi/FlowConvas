import { useCallback, useEffect } from 'react';
import { useGraphStore, type StatsState } from '@/graph/graph-store';

export type PerformanceStatsPatch = Partial<StatsState>;

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function publishPerformanceStats(stats: PerformanceStatsPatch): void {
  useGraphStore.getState().setStats({
    ...stats,
    updatedAt: nowMs(),
  });
}

export function resetPerformanceStats(source?: string): void {
  const current = useGraphStore.getState().stats;
  if (source && current.source && current.source !== source) return;
  useGraphStore.getState().setStats({
    fps: 0,
    computeTime: 0,
    memory: 0,
    triangles: 0,
    calls: 0,
    renderer: '',
    source: '',
    updatedAt: 0,
  });
}

export function usePerformanceTelemetry(source: string) {
  useEffect(() => () => resetPerformanceStats(source), [source]);

  return useCallback(
    (stats: PerformanceStatsPatch) => {
      publishPerformanceStats({ ...stats, source });
    },
    [source],
  );
}
