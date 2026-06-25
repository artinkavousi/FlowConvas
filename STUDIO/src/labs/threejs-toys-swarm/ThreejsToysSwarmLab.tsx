import { useEffect, useRef, useState } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createThreejsToysSwarmLab } from './createThreejsToysSwarmLab';

const BRIDGE_ID = 'threejs-toys-swarm';
type SwarmPalette = { colorA: string; colorB: string; colorC: string };

export default function ThreejsToysSwarmLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(p: Record<string, unknown>): void; resize(): void; randomizeColors(): SwarmPalette; dispose(): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const [palette, setPalette] = useState<SwarmPalette>({ colorA: '#ffffff', colorB: '#2dd4bf', colorC: '#8b5cf6' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = createThreejsToysSwarmLab(canvas, values ?? {});
    const resize = () => engine.resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    engineRef.current = engine;
    return () => {
      ro.disconnect();
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.update((values ?? {}) as Record<string, unknown>);
  }, [values]);

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-black text-white"
      onClick={() => {
        const next = engineRef.current?.randomizeColors();
        if (next) setPalette(next);
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full touch-none" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center">
        <div className="select-none">
          <h1
            className="m-0 text-[50px] font-bold leading-[70px] tracking-normal text-white"
            style={{
              textShadow: '0 0 5px #000, 0 0 20px #000',
              fontFamily: 'Montserrat, Inter, system-ui, sans-serif',
            }}
          >
            SWARM
            <br />
            BACKGROUND
          </h1>
          <div
            className="mt-3 text-sm font-semibold text-white/90"
            style={{ textShadow: '0 0 5px #000, 0 0 20px #000' }}
          >
            github/threejs-toys
          </div>
          <div className="mx-auto mt-5 flex w-fit gap-2">
            {[palette.colorA, palette.colorB, palette.colorC].map((color) => (
              <span
                key={color}
                className="h-2.5 w-8 border border-white/30"
                style={{ background: color, boxShadow: `0 0 18px ${color}` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
