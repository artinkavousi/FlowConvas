import { useEffect, useRef } from 'react';
import { useStoreApi } from '@xyflow/react';
import { getBounces } from '@/graph/physics-events';

// Reactive dot-grid physics, in graph WORLD space so it pans + zooms with the
// nodes and aligns to them. Spring physics run in world units; rendering applies
// the live XYFlow viewport transform.
const GRID = 40; // world units
const MAX_DIST = 90;
const PUSH = 25;
const STIFF = 0.08;
const DAMP = 0.75;
const HOVER_R = 240; // screen px
const BRIGHT_R = 180; // world units
const PULSE_SPEED = 380; // world u/s
const PULSE_WIDTH = 70; // world u
const PULSE_DURATION = 1600;
const MAX_PARTICLES = 300;

type Dot = { gx: number; gy: number; x: number; y: number; vx: number; vy: number; size: number; near: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number };
type Rect = { x: number; y: number; w: number; h: number };

export function DotGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const storeApi = useStoreApi();
  const dotsRef = useRef<Map<string, Dot>>(new Map());
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const lastPulseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;

    let rafId = 0;
    const resize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const dpr = window.devicePixelRatio || 1;
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: MouseEvent) => (mouseRef.current = { x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const state = storeApi.getState() as unknown as {
        transform: [number, number, number];
        nodeLookup: Map<string, { position: { x: number; y: number }; measured?: { width?: number; height?: number }; internals?: { positionAbsolute?: { x: number; y: number } } }>;
      };
      const [tx, ty, zoom] = state.transform;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      // Fixed unified spacing
      const eg = GRID;

      const toScreen = (wx: number, wy: number) => ({ x: wx * zoom + tx, y: wy * zoom + ty });

      // node rects in world space (so dots align to and react to the nodes)
      const rects: Rect[] = [];
      state.nodeLookup.forEach((n) => {
        const p = n.internals?.positionAbsolute ?? n.position;
        rects.push({ x: p.x, y: p.y, w: n.measured?.width ?? 170, h: n.measured?.height ?? 90 });
      });

      const pushAt = (bx: number, by: number) => {
        let px = 0;
        let py = 0;
        let near = Infinity;
        for (const r of rects) {
          const cx = Math.max(r.x, Math.min(bx, r.x + r.w));
          const cy = Math.max(r.y, Math.min(by, r.y + r.h));
          const dx = bx - cx;
          const dy = by - cy;
          const d = Math.hypot(dx, dy);
          if (d < near) near = d;
          if (d > 0) {
            const nd = Math.min(d / MAX_DIST, 1);
            const amt = Math.pow(1 - nd, 3) * PUSH;
            px += (dx / d) * amt;
            py += (dy / d) * amt;
          }
        }
        return { px, py, near };
      };

      const mouse = mouseRef.current ? { x: mouseRef.current.x - rect.left, y: mouseRef.current.y - rect.top } : null;
      const mouseIn = mouse && mouse.x >= 0 && mouse.y >= 0 && mouse.x <= w && mouse.y <= h ? mouse : null;
      const hoverAt = (sx: number, sy: number) => {
        if (!mouseIn) return 0;
        const d = Math.hypot(sx - mouseIn.x, sy - mouseIn.y);
        return d > HOVER_R ? 0 : Math.pow(1 - d / HOVER_R, 2) * 0.6;
      };

      const now = performance.now();
      const pulseAt = (wx: number, wy: number) => {
        let m = 0;
        for (const p of getBounces()) {
          const age = now - p.t;
          if (age > PULSE_DURATION) continue;
          const sc = 0.5 + p.intensity * 0.5;
          const radius = (age / 1000) * PULSE_SPEED * sc;
          const fromWave = Math.abs(Math.hypot(wx - p.x, wy - p.y) - radius);
          const width = PULSE_WIDTH * sc;
          if (fromWave < width) m = Math.max(m, (1 - fromWave / width) * (1 - age / PULSE_DURATION) * p.intensity);
        }
        return m;
      };

      // visible world rect (+margin); build/refresh dots, prune offscreen
      const margin = eg * 2;
      const wx0 = Math.floor((-tx / zoom - margin) / eg) * eg;
      const wy0 = Math.floor((-ty / zoom - margin) / eg) * eg;
      const wx1 = (w - tx) / zoom + margin;
      const wy1 = (h - ty) / zoom + margin;

      const dots = dotsRef.current;
      const seen = new Set<string>();
      for (let gx = wx0; gx <= wx1; gx += eg) {
        for (let gy = wy0; gy <= wy1; gy += eg) {
          const key = `${gx},${gy}`;
          seen.add(key);
          if (!dots.has(key)) dots.set(key, { gx, gy, x: gx, y: gy, vx: 0, vy: 0, size: 1, near: Infinity });
        }
      }
      
      const cx_world = (w/2 - tx) / zoom;
      const cy_world = (h/2 - ty) / zoom;
      const prune_dist = (Math.max(w, h) / zoom) * 1.5 + 400;
      
      if (dots.size > 4000) {
        for (const [k, dot] of dots.entries()) {
          if (!seen.has(k) && (Math.abs(dot.gx - cx_world) > prune_dist || Math.abs(dot.gy - cy_world) > prune_dist)) {
            dots.delete(k);
          }
        }
      }

      const t = now / 1000;

      // pass 1 — spring physics + sizing (world space, with idle shimmer)
      dots.forEach((dot) => {
        if (!seen.has(`${dot.gx},${dot.gy}`) && (Math.abs(dot.gx - cx_world) > prune_dist * 0.5 || Math.abs(dot.gy - cy_world) > prune_dist * 0.5)) return;
        const { px, py, near } = pushAt(dot.gx, dot.gy);
        dot.near = near;
        const phase = dot.gx * 0.03 + dot.gy * 0.03;
        const tgX = dot.gx + px + Math.sin(t * 0.6 + phase) * 0.6;
        const tgY = dot.gy + py + Math.cos(t * 0.5 + phase) * 0.6;
        dot.vx = (dot.vx + (tgX - dot.x) * STIFF) * DAMP;
        dot.vy = (dot.vy + (tgY - dot.y) * STIFF) * DAMP;
        dot.x += dot.vx;
        dot.y += dot.vy;
        const targetSize = 1.0;
        dot.size = targetSize;
      });

      // pass 2 — dots rendering
      const rScale = Math.max(0.6, Math.min(1.2, Math.sqrt(zoom)));
      dots.forEach((dot) => {
        if (!seen.has(`${dot.gx},${dot.gy}`)) return;
        const s = toScreen(dot.x, dot.y);
        if (s.x < -12 || s.y < -12 || s.x > w + 12 || s.y > h + 12) return;
        
        const bd = Math.min(dot.near / BRIGHT_R, 1);
        const boost = (1 - Math.pow(bd, 3)) * 0.5;
        const hov = hoverAt(s.x, s.y);
        const pEff = pulseAt(dot.x, dot.y);
        
        const opacity = Math.min(1, 0.08 + boost * 0.8 + hov * 0.9 + pEff);
        // Mute colors so they don't look like strong white artifacts
        const c = Math.round(100 + (1 - Math.pow(bd, 2)) * 50);
        
        const radius = Math.max(0.5, dot.size * rScale * (1 + pEff * 0.3));
        const hc = Math.min(200, Math.round(c + (hov + pEff) * 50));
        ctx.fillStyle = hov > 0.05 || pEff > 0.1 ? `rgba(${hc}, ${hc}, ${hc}, ${opacity})` : `rgba(${c}, ${c}, ${c}, ${opacity})`;
        
        ctx.beginPath();
        ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
      
      // Reset composite operation to not affect external canvases if shared
      ctx.globalCompositeOperation = 'source-over';
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('mousemove', onMove);
    };
  }, [storeApi]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
    />
  );
}

function ingestBounces(particles: Particle[], lastRef: { current: number }) {
  const bounces = getBounces();
  for (let i = bounces.length - 1; i >= 0; i--) {
    if (bounces[i].t <= lastRef.current) break;
    const b = bounces[i];
    const count = Math.round(6 + b.intensity * 14);
    for (let k = 0; k < count; k++) {
      const a = (Math.PI * 2 * k) / count + Math.random() * 0.5;
      const speed = (1 + Math.random() * 3) * (0.4 + b.intensity);
      const max = 400 + Math.random() * 400;
      particles.push({ x: b.x, y: b.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: max, max });
    }
  }
  if (bounces.length) lastRef.current = bounces[bounces.length - 1].t;
  if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
}

function stepParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  toScreen: (x: number, y: number) => { x: number; y: number },
) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life -= 16.67;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    const s = toScreen(p.x, p.y);
    ctx.beginPath();
    ctx.arc(s.x, s.y, 1.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220, 230, 245, ${(p.life / p.max) * 0.8})`;
    ctx.fill();
  }
}
