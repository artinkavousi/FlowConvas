/**
 * GpuParticlesPreview — live preview for the gpu-particles module.
 * Thin typed wrapper over engine.js (Three.js WebGL Points); bridge-driven.
 */

import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createParticles } from './engine.js';

const BRIDGE_ID = 'gpu-particles';

export default function GpuParticlesPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(p: unknown): void; resize(): void; dispose(): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = createParticles(canvasRef.current);
    engineRef.current = engine;
    const ro = new ResizeObserver(() => engine.resize());
    ro.observe(canvasRef.current);
    return () => {
      ro.disconnect();
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.update(values ?? {});
  }, [values]);

  return (
    <div className="w-full h-full" style={{ background: 'radial-gradient(120% 120% at 50% 50%, rgba(20,30,40,0.5), #07090c 75%)' }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
