/**
 * AuroraShaderPreview — live preview for the aurora-shader (TSL/WebGPU) module.
 * Thin typed wrapper over engine.js; bridge-driven. WebGPU-only — PreviewStage
 * shows a capability notice when WebGPU is unavailable (module dependency 'webgpu').
 */

import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createAurora } from './engine.js';

const BRIDGE_ID = 'aurora-shader';

export default function AuroraShaderPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(p: unknown): void; resize(): void; dispose(): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    if (!canvasRef.current) return;
    let engine: { update(p: unknown): void; resize(): void; dispose(): void } | null = null;
    try {
      engine = createAurora(canvasRef.current);
      engineRef.current = engine;
    } catch (err) {
      console.error('[aurora-shader] init failed', err);
      return;
    }
    const ro = new ResizeObserver(() => engine?.resize());
    ro.observe(canvasRef.current);
    return () => {
      ro.disconnect();
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.update(values ?? {});
  }, [values]);

  return (
    <div className="w-full h-full" style={{ background: '#04050a' }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
