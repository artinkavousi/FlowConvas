/**
 * TimelineView — record per-frame telemetry (fps / cpu / gpu / draw-calls /
 * triangles / pass tree) into a buffer, then scrub frames to inspect any one.
 *
 * Recording flips `store.timeline.recording`; the engine's `resolveFrame` pushes
 * a `TimelineFrame` each text-cadence tick while recording is on.
 */

import { useEffect, useRef } from 'react';
import { Circle, Square, Trash2 } from 'lucide-react';
import { useInspectorStore } from '@/inspector/inspector-store';
import { StatTree } from '../widgets/StatTree';

export function TimelineView() {
  const recording = useInspectorStore((s) => s.timeline.recording);
  const frames = useInspectorStore((s) => s.timeline.frames);
  const selected = useInspectorStore((s) => s.timeline.selected);
  const setRecording = useInspectorStore((s) => s.setRecording);
  const clearTimeline = useInspectorStore((s) => s.clearTimeline);
  const selectTimelineFrame = useInspectorStore((s) => s.selectTimelineFrame);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedFrame = selected !== null ? frames[selected] : frames[frames.length - 1];

  // Draw a tri-line overview (fps / calls / triangles) of the whole recording.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (frames.length < 2) return;

    const lines: { key: 'fps' | 'calls' | 'triangles'; color: string }[] = [
      { key: 'fps', color: '#2dd4bf' },
      { key: 'calls', color: '#60a5fa' },
      { key: 'triangles', color: '#f87171' },
    ];
    for (const line of lines) {
      let max = 1;
      for (const f of frames) max = Math.max(max, f[line.key]);
      ctx.beginPath();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 1.3;
      frames.forEach((f, i) => {
        const x = (i / (frames.length - 1)) * w;
        const y = h - (f[line.key] / max) * (h - 4) - 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    // selected marker
    if (selected !== null && frames.length > 1) {
      const x = (selected / (frames.length - 1)) * w;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }, [frames, selected]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setRecording(!recording)}
          className={
            'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition ' +
            (recording
              ? 'border-red-400/40 bg-red-500/15 text-red-300'
              : 'border-white/10 bg-white/[0.05] text-white/65 hover:bg-white/10 hover:text-white')
          }
        >
          {recording ? <Square size={12} /> : <Circle size={12} />}
          {recording ? 'Stop' : 'Record'}
        </button>
        <span className="font-mono text-[10px] text-white/40">{frames.length} frames</span>
        <button
          onClick={clearTimeline}
          title="Clear"
          className="ml-auto rounded-lg border border-white/8 bg-white/[0.045] p-1.5 text-white/55 transition hover:bg-white/10 hover:text-white"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
          <span>Recording</span>
          <span className="flex items-center gap-3 font-mono">
            <span className="text-teal-300">fps</span>
            <span className="text-blue-300">calls</span>
            <span className="text-red-300">tris</span>
          </span>
        </div>
        <canvas ref={canvasRef} style={{ width: '100%', height: 84 }} className="rounded-lg border border-white/6 bg-black/30" />
        <input
          type="range"
          min={0}
          max={Math.max(0, frames.length - 1)}
          value={selected ?? Math.max(0, frames.length - 1)}
          disabled={frames.length < 2}
          onChange={(e) => selectTimelineFrame(Number(e.target.value))}
          className="w-full accent-teal-300"
        />
      </div>

      {selectedFrame ? (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'FPS', value: selectedFrame.fps.toFixed(0) },
              { label: 'Calls', value: String(selectedFrame.calls) },
              { label: 'Triangles', value: selectedFrame.triangles.toLocaleString() },
              { label: 'CPU', value: `${selectedFrame.cpu.toFixed(2)}ms` },
              { label: 'GPU', value: `${selectedFrame.gpu.toFixed(2)}ms` },
              { label: 'Total', value: `${selectedFrame.total.toFixed(2)}ms` },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-white/7 bg-black/24 p-2">
                <div className="text-[8px] font-black uppercase tracking-[0.16em] text-white/30">{m.label}</div>
                <div className="mt-1 font-mono text-sm font-bold text-white/85">{m.value}</div>
              </div>
            ))}
          </div>
          <StatTree passes={selectedFrame.passes} />
        </div>
      ) : (
        <div className="grid min-h-[120px] flex-1 place-items-center rounded-xl border border-dashed border-white/8 bg-white/[0.018] text-center text-[10px] uppercase tracking-[0.18em] text-white/30">
          {recording ? 'Recording…' : 'Press Record to capture frames'}
        </div>
      )}
    </div>
  );
}
