import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createTslSepiaScene } from './TslSepia.module';

const BRIDGE_ID = 'tsl-sepia';

export default function TslSepiaShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ReturnType<typeof createTslSepiaScene> | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = createTslSepiaScene(canvas, {});
    engineRef.current = engine;
    const resize = () => engine.resize(canvas.clientWidth || 1, canvas.clientHeight || 1);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    engine.renderer.setAnimationLoop(() => engine.renderFrame());
    return () => { ro.disconnect(); engine.dispose(); engineRef.current = null; };
  }, []);

  useEffect(() => { engineRef.current?.update(values ?? {}); }, [values]);

  return (
    <div className="h-full w-full bg-black">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
