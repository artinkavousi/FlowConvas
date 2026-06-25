import { useEffect, useRef, useState } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createSingularityLab, singularityLabDefaults } from './createSingularityLab';
import { SingularityTrianglePreloader } from './modules/ui/SingularityTrianglePreloader';

const BRIDGE_ID = 'singularity';

export default function SingularityLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(p: unknown): void; resize(): void; dispose(): void } | null>(null);
  const [preloading, setPreloading] = useState(true);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createSingularityLab(canvas, singularityLabDefaults);
    const resize = () => engine.resize(canvas.clientWidth || 1, canvas.clientHeight || 1);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    const preloadTimer = window.setTimeout(() => setPreloading(false), 1400);
    engineRef.current = {
      update: (params) => engine.update(params as Record<string, unknown>),
      resize,
      dispose: () => {
        window.clearTimeout(preloadTimer);
        ro.disconnect();
        engine.dispose();
      },
    };

    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.update(values ?? {});
  }, [values]);

  const showOverlay = ((values?.preloadOverlay as boolean | undefined) ?? singularityLabDefaults.preloadOverlay) && preloading;

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />
      {showOverlay ? (
        <div className="pointer-events-none absolute inset-0">
          <SingularityTrianglePreloader active starCount={100} triangleCells={9} />
        </div>
      ) : null}
    </div>
  );
}
