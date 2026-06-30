/**
 * LiveGraph — a canvas line graph that reads the engine's ring buffers directly
 * from its own rAF. Drawing here (not from React state) is what keeps 60 fps
 * sampling off the React render path.
 */

import { useEffect, useRef } from 'react';
import { getInspector } from '@/inspector/attach';

export interface GraphSeries {
  /** Ring-buffer name registered by the engine: 'fps' | 'cpu' | 'gpu' | 'memTotal'. */
  name: string;
  color: string;
}

export function LiveGraph({ series, height = 92 }: { series: GraphSeries[]; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const draw = () => {
      const insp = getInspector();
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // baseline
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h - 1);
      ctx.lineTo(w, h - 1);
      ctx.stroke();

      for (const s of series) {
        const buf = insp.series.get(s.name);
        if (buf.length < 2) continue;
        const max = Math.max(1, buf.recomputeMax());
        ctx.beginPath();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 1.4;
        buf.forEach((v, idx) => {
          const x = (idx / (buf.capacity - 1)) * w;
          const y = h - (v / max) * (h - 4) - 2;
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [series]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height }}
      className="rounded-lg border border-white/6 bg-black/30"
    />
  );
}
