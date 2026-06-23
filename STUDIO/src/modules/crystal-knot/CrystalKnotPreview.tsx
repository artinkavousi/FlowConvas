/**
 * CrystalKnotPreview — live preview for the crystal-knot 3D module.
 * Thin typed wrapper over engine.js (Three.js WebGL); bridge-driven params.
 */

import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createKnot } from './engine.js';

const BRIDGE_ID = 'crystal-knot';

export default function CrystalKnotPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(p: unknown): void; resize(): void; dispose(): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = createKnot(canvasRef.current);
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
    <div className="w-full h-full"
      style={{ background: 'radial-gradient(120% 120% at 50% 30%, rgba(45,212,191,0.05), transparent 70%)' }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
