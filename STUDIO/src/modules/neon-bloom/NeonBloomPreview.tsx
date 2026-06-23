/**
 * NeonBloomPreview — live preview for the neon-bloom post-processing module.
 * Thin typed wrapper over engine.js (Three.js EffectComposer); bridge-driven.
 */

import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createBloom } from './engine.js';

const BRIDGE_ID = 'neon-bloom';

export default function NeonBloomPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(p: unknown): void; resize(): void; dispose(): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = createBloom(canvasRef.current);
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
    <div className="w-full h-full" style={{ background: '#05060a' }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
