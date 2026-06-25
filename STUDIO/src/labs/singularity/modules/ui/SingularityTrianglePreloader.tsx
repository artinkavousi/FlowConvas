import { useEffect, useRef } from 'react';

export type SingularityTrianglePreloaderProps = {
  active?: boolean;
  starCount?: number;
  triangleCells?: number;
  accent?: string;
  background?: string;
  speed?: number;
};

type Star = {
  x: number;
  y: number;
  r: number;
  alpha: number;
};

const defaults = {
  active: true,
  starCount: 100,
  triangleCells: 9,
  accent: '#ffffff',
  background: '#000000',
  speed: 1,
};

function clamp(value: number, min: number, max: number) {
  return value <= min ? min : value >= max ? max : value;
}

export function SingularityTrianglePreloader({
  active = defaults.active,
  starCount = defaults.starCount,
  triangleCells = defaults.triangleCells,
  accent = defaults.accent,
  background = defaults.background,
  speed = defaults.speed,
}: SingularityTrianglePreloaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ active, starCount, triangleCells, accent, background, speed });

  useEffect(() => {
    propsRef.current = { active, starCount, triangleCells, accent, background, speed };
  }, [active, starCount, triangleCells, accent, background, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let raf = 0;
    let width = 1;
    let height = 1;
    let current = performance.now();
    let elapsed = 0;
    let triangleState = 0;
    let stars: Star[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, canvas.clientWidth);
      height = Math.max(1, canvas.clientHeight);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.max(0, Math.floor(propsRef.current.starCount)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.floor(Math.random() * 2) + 1,
        alpha: (Math.floor(Math.random() * 10) + 1) / 20,
      }));
    };

    const drawSmallTriangle = (x: number, y: number, length: number, fill: string, flipped: boolean, offset = 0) => {
      let scale = 1 - clamp(triangleState - offset, 0, 1);
      scale = Math.max(0.02, scale);
      const nextLength = length * scale;
      const nextHeight = (nextLength * Math.sqrt(3)) / 2;
      const oldHeight = (length * Math.sqrt(3)) / 2;
      const offsetY = (oldHeight - nextHeight) / 3;
      ctx.beginPath();
      if (!flipped) {
        ctx.moveTo(x, y + nextHeight / 2 - offsetY);
        ctx.lineTo(x + nextLength / 2, y - nextHeight / 2 - offsetY);
        ctx.lineTo(x - nextLength / 2, y - nextHeight / 2 - offsetY);
      } else {
        ctx.moveTo(x, y - nextHeight / 2 - offsetY);
        ctx.lineTo(x + nextLength / 2, y + nextHeight / 2 - offsetY);
        ctx.lineTo(x - nextLength / 2, y + nextHeight / 2 - offsetY);
      }
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = background;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const drawTriangle = () => {
      const cells = Math.max(3, Math.floor(propsRef.current.triangleCells));
      const sideLength = height / 3;
      const triHeight = (sideLength * Math.sqrt(3)) / 2 + 1;
      const smallSide = sideLength / cells;
      const smallHeight = (smallSide * Math.sqrt(3)) / 2;
      const firstSmallHeight = triHeight;
      const firstMinX = Math.abs(-sideLength / 2 + Math.abs((-triHeight / 2 + firstSmallHeight / 2 + triHeight / 2) / Math.sqrt(3)));

      ctx.save();
      ctx.translate(width / 2, height / 2);
      for (let y = -triHeight / 2 + smallHeight / 2; y <= triHeight / 2 - smallHeight / 2; y += smallHeight) {
        const minX = -sideLength / 2 + Math.abs((y + triHeight / 2) / Math.sqrt(3));
        const maxX = sideLength / 2 - Math.abs((y + triHeight / 2) / Math.sqrt(3)) + 1;
        let offsetWhite = (2 * Math.abs(y)) / (sideLength / 2);
        let offsetBlack = Math.abs(y) / (sideLength / 2);
        for (let x = minX; x <= maxX - smallSide / 2; x += smallSide) {
          const offsetX = firstMinX / cells;
          const offsetY = firstMinX / 2 + 6;
          drawSmallTriangle(x + offsetX, y + offsetY, smallSide, propsRef.current.accent, false, offsetWhite);
          drawSmallTriangle(x + offsetX, y + offsetY, smallSide, propsRef.current.background, false, offsetBlack);
          if (x + smallSide / 2 <= maxX - smallSide) {
            drawSmallTriangle(x + offsetX + smallSide / 2, y + offsetY, smallSide, propsRef.current.accent, true, offsetWhite);
            drawSmallTriangle(x + offsetX + smallSide / 2, y + offsetY, smallSide, propsRef.current.background, true, offsetBlack);
          }
          offsetWhite = (3 * Math.abs(x + offsetX)) / (sideLength / 2);
          offsetBlack = (2 * Math.abs(x + offsetX)) / (sideLength / 2);
        }
      }
      ctx.restore();
    };

    const tick = (now: number) => {
      const dt = Math.min((now - current) / 1000, 0.06);
      current = now;
      if (propsRef.current.active) {
        elapsed += dt;
        triangleState += 3 * dt * propsRef.current.speed;
        if (triangleState > 4) triangleState = 0;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = propsRef.current.background;
        ctx.fillRect(0, 0, width, height);
        ctx.shadowColor = propsRef.current.accent;
        for (const star of stars) {
          star.y -= dt * 15 * propsRef.current.speed;
          if (star.y <= -10) star.y = height + 10;
          ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
          ctx.shadowBlur = star.r * 2;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        drawTriangle();
      } else if (elapsed !== -1) {
        ctx.clearRect(0, 0, width, height);
        elapsed = -1;
      }
      raf = requestAnimationFrame(tick);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    raf = requestAnimationFrame(tick);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [background]);

  return <canvas ref={canvasRef} className="block h-full w-full bg-black" aria-hidden="true" />;
}

export const singularityTrianglePreloaderDefaults = defaults;
