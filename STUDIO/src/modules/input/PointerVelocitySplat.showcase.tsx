import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createPointerVelocitySplat } from './PointerVelocitySplat.module';

const BRIDGE_ID = 'pointer-velocity-splat';

// Pure 2D-canvas demo (no WebGPU): pointer velocity drives fading splat trails.
export default function PointerVelocitySplatShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cfgRef = useRef({ dotScale: 600, trailFade: 0.08 });
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pointer = createPointerVelocitySplat(canvas, { velocityScale: 1 });
    const splats: { x: number; y: number; speed: number }[] = [];
    const off = pointer.onSplat((s) => {
      splats.push({ x: s.x, y: s.y, speed: Math.hypot(s.vx, s.vy) });
      if (splats.length > 400) splats.shift();
    });

    let raf = 0;
    const loop = () => {
      const w = (canvas.width = canvas.clientWidth || 1);
      const h = (canvas.height = canvas.clientHeight || 1);
      ctx.fillStyle = `rgba(0,0,0,${cfgRef.current.trailFade})`;
      ctx.fillRect(0, 0, w, h);
      for (const sp of splats) {
        const r = Math.max(1, sp.speed * cfgRef.current.dotScale);
        const px = sp.x * w;
        const py = (1 - sp.y) * h;
        const hue = Math.min(280, sp.speed * 4000);
        ctx.fillStyle = `hsl(${200 + hue}, 90%, 60%)`;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
      pointer.tick();
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      off();
      pointer.dispose();
    };
  }, []);

  useEffect(() => {
    const v = (values ?? {}) as Record<string, unknown>;
    if (v.dotScale !== undefined) cfgRef.current.dotScale = Number(v.dotScale);
    if (v.trailFade !== undefined) cfgRef.current.trailFade = Number(v.trailFade);
  }, [values]);

  return (
    <div className="h-full w-full bg-black">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />
    </div>
  );
}
