import { useInspectorStore } from '@/inspector/inspector-store';
import { formatBytes } from '@/inspector/core/frame-normalizer';
import { LiveGraph } from '../widgets/LiveGraph';

const GRAPH_SERIES = [{ name: 'memTotal', color: '#fbbf24' }];

export function MemoryView() {
  const memory = useInspectorStore((s) => s.memory);

  if (!memory) {
    return (
      <div className="grid min-h-[160px] place-items-center rounded-xl border border-dashed border-white/8 bg-white/[0.018] text-[10px] uppercase tracking-[0.2em] text-white/30">
        No renderer attached
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/7 bg-black/24 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">Total GPU Memory</span>
          <span className="font-mono text-lg font-bold leading-none text-white/90">{formatBytes(memory.total)}</span>
        </div>
        <div className="mt-3">
          <LiveGraph series={GRAPH_SERIES} height={56} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/7 bg-black/24">
        <div
          className="grid gap-2 border-b border-white/8 bg-white/[0.025] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/40"
          style={{ gridTemplateColumns: 'minmax(0,1fr) 56px 80px' }}
        >
          <span>Resource</span>
          <span className="text-right">Count</span>
          <span className="text-right">Size</span>
        </div>
        {memory.rows.map((row) => (
          <div
            key={row.key}
            className="grid items-center gap-2 border-b border-white/[0.04] px-3 py-1.5 text-[11px] last:border-0 hover:bg-white/[0.025]"
            style={{ gridTemplateColumns: 'minmax(0,1fr) 56px 80px' }}
          >
            <span className="truncate text-white/70">{row.label}</span>
            <span className="text-right font-mono text-white/80">{row.count}</span>
            <span className="text-right font-mono text-white/45">{row.size === null ? 'N/A' : formatBytes(row.size)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
