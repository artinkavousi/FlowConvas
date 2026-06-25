import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createTslInfiniteTerrainField } from './TslInfiniteTerrainField.module';

const BRIDGE_ID = 'tsl-infinite-terrain-field';

export default function TslInfiniteTerrainFieldShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(values: Record<string, unknown>): void; resize(): void; dispose(): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = createTslInfiniteTerrainField(canvas, values ?? {});
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
    <div className="h-full w-full bg-black">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
