import { Activity, Cpu, Gauge, Timer } from 'lucide-react';
import { useInspectorStore } from '@/inspector/inspector-store';
import { LiveGraph } from '../widgets/LiveGraph';
import { StatTree } from '../widgets/StatTree';

function Metric({ icon: Icon, label, value, unit, tint }: { icon: any; label: string; value: string; unit?: string; tint: string }) {
  return (
    <div className="rounded-xl border border-white/7 bg-black/24 p-3">
      <div className="flex items-center justify-between gap-2">
        <Icon size={13} style={{ color: tint }} />
        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">{label}</span>
      </div>
      <div className="mt-2.5 font-mono text-lg font-bold leading-none text-white/90">
        {value}
        {unit && <span className="ml-1 text-[10px] font-medium text-white/35">{unit}</span>}
      </div>
    </div>
  );
}

const GRAPH_SERIES = [
  { name: 'fps', color: '#2dd4bf' },
  { name: 'cpu', color: '#fbbf24' },
  { name: 'gpu', color: '#34d399' },
];

export function PerformanceView() {
  const fps = useInspectorStore((s) => s.fps);
  const frame = useInspectorStore((s) => s.frame);
  const passes = useInspectorStore((s) => s.passes);
  const gpuTimestamps = useInspectorStore((s) => s.gpuTimestamps);
  const attached = useInspectorStore((s) => s.attached);

  // Frames are arriving but no per-pass tree → module renders on its own rAF
  // instead of renderer.setAnimationLoop(), so begin()/finish() never wrap a pass.
  const customLoop = attached && fps > 0 && passes.length === 0 && frame.total === 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Metric icon={Gauge} label="FPS" value={fps > 0 ? fps.toFixed(0) : '--'} tint="#2dd4bf" />
        <Metric icon={Timer} label="Frame" value={frame.total > 0 ? frame.total.toFixed(2) : '--'} unit="ms" tint="#e2e8f0" />
        <Metric icon={Cpu} label="CPU" value={frame.cpu > 0 ? frame.cpu.toFixed(2) : '--'} unit="ms" tint="#fbbf24" />
        <Metric
          icon={Activity}
          label="GPU"
          value={gpuTimestamps ? (frame.gpu > 0 ? frame.gpu.toFixed(2) : '0') : '-'}
          unit={gpuTimestamps ? 'ms' : undefined}
          tint="#34d399"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between rounded-lg border border-white/6 bg-black/24 px-3 py-2">
          <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/30">Draw Calls</span>
          <span className="font-mono text-sm font-bold text-white/85">{frame.calls > 0 ? frame.calls : '--'}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-white/6 bg-black/24 px-3 py-2">
          <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/30">Triangles</span>
          <span className="font-mono text-sm font-bold text-white/85">{frame.triangles > 0 ? frame.triangles.toLocaleString() : '--'}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
          <span>Frame Graph</span>
          <span className="flex items-center gap-3 font-mono">
            <span className="text-teal-300">fps</span>
            <span className="text-amber-300">cpu</span>
            <span className="text-emerald-300">gpu</span>
          </span>
        </div>
        <LiveGraph series={GRAPH_SERIES} />
        <div className="flex items-center justify-between px-1 text-[9px] uppercase tracking-[0.16em] text-white/26">
          <span>Miscellaneous / idle</span>
          <span className="font-mono text-white/45">{frame.miscellaneous.toFixed(2)} ms</span>
        </div>
      </div>

      <StatTree passes={passes} />

      {customLoop && (
        <p className="rounded-lg border border-amber-300/15 bg-amber-300/[0.04] px-3 py-2 text-[10px] leading-relaxed text-amber-100/45">
          This module renders on its own loop. FPS and memory are tracked, but per-pass CPU/GPU timing needs{' '}
          <code>renderer.setAnimationLoop()</code>.
        </p>
      )}

      {!gpuTimestamps && !customLoop && (
        <p className="rounded-lg border border-white/6 bg-black/24 px-3 py-2 text-[10px] leading-relaxed text-white/34">
          GPU timing requires WebGPU timestamp queries. CPU times are always shown; GPU columns read <code>-</code> on WebGL2.
        </p>
      )}
    </div>
  );
}
