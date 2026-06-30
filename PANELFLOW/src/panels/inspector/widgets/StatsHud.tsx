/**
 * StatsHud — compact always-on telemetry pill for the viewport corner.
 *
 * Prefers the inspector store when a renderer is attached; otherwise falls back
 * to the coarse `graph-store.stats` (host-published). Gated by `scene.showStats`.
 */

import { useInspectorStore } from '@/inspector/inspector-store';
import { formatBytes } from '@/inspector/core/frame-normalizer';
import { useGraphStore } from '@/graph/graph-store';

export interface StatsHudProps {
  /** Corner placement. Default 'top-left'. */
  corner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const CORNER: Record<NonNullable<StatsHudProps['corner']>, string> = {
  'top-left': 'top-3 left-3',
  'top-right': 'top-3 right-3',
  'bottom-left': 'bottom-3 left-3',
  'bottom-right': 'bottom-3 right-3',
};

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[7.5px] font-black uppercase tracking-[0.16em] text-white/35">{label}</span>
      <span className="font-mono text-[11px] font-bold leading-tight text-white/85">{value}</span>
    </div>
  );
}

export function StatsHud({ corner = 'top-left' }: StatsHudProps) {
  const show = useGraphStore((s) => s.scene.showStats);
  const stats = useGraphStore((s) => s.stats);
  const attached = useInspectorStore((s) => s.attached);
  const insFps = useInspectorStore((s) => s.fps);
  const frame = useInspectorStore((s) => s.frame);
  const memory = useInspectorStore((s) => s.memory);
  const paused = useInspectorStore((s) => s.paused);

  if (!show) return null;

  const fps = attached && insFps > 0 ? insFps : stats.fps;
  const frameMs = attached && frame.total > 0 ? frame.total : stats.computeTime;
  const tris = attached && frame.triangles > 0 ? frame.triangles : stats.triangles;
  const calls = attached && frame.calls > 0 ? frame.calls : stats.calls;
  const memLabel = attached && memory ? 'GPU Mem' : 'Mem';
  const memValue = attached && memory ? formatBytes(memory.total) : stats.memory > 0 ? `${stats.memory}MB` : '--';

  return (
    <div
      className={`pointer-events-none absolute ${CORNER[corner]} z-30 flex items-center gap-3 rounded-lg border border-white/10 bg-black/55 px-3 py-1.5 backdrop-blur-md`}
    >
      <Cell label="FPS" value={fps > 0 ? fps.toFixed(0) : '--'} />
      <Cell label="Frame" value={frameMs > 0 ? `${frameMs.toFixed(1)}ms` : '--'} />
      <Cell label="Calls" value={calls > 0 ? String(calls) : '--'} />
      <Cell label="Tris" value={tris > 0 ? tris.toLocaleString() : '--'} />
      <Cell label={memLabel} value={memValue} />
      {attached && paused && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Paused" />}
    </div>
  );
}
