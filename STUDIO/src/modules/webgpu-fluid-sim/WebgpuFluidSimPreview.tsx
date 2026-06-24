/**
 * WebgpuFluidSimPreview — live preview for the webgpu-fluid-sim module.
 *
 * Thin typed wrapper over createFluidSim (engine.js convention): owns the
 * canvas + ResizeObserver + dispose; bridge-driven (ADR-13). WebGPU-only —
 * PreviewStage shows a capability notice when WebGPU is unavailable (module
 * dependency 'webgpu'). Drag on the canvas to inject dye/velocity.
 */

import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createFluidSim } from './createFluidSim.js';

const BRIDGE_ID = 'webgpu-fluid-sim';

type Engine = { update(p: unknown): void; resize(): void; dispose(): void };

export default function WebgpuFluidSimPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    if (!canvasRef.current) return;
    let engine: Engine | null = null;
    try {
      engine = createFluidSim(canvasRef.current) as Engine;
      engineRef.current = engine;
    } catch (err) {
      console.error('[webgpu-fluid-sim] init failed', err);
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
    <div className="w-full h-full" style={{ background: '#000' }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
