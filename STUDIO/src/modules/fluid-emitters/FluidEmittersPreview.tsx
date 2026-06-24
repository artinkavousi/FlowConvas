/**
 * FluidEmittersPreview — live preview for the fluid-emitters module.
 *
 * Thin typed wrapper over createEmitterField (engine.js convention): owns the
 * canvas + ResizeObserver + dispose; bridge-driven (ADR-13). Renders the real
 * ported EmitterSystem's splats into a 2D dye field. Pure 2D canvas — no WebGPU.
 */

import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createEmitterField } from './createEmitterField.js';

const BRIDGE_ID = 'fluid-emitters';

type Engine = { update(p: unknown): void; resize(): void; dispose(): void };

export default function FluidEmittersPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    if (!canvasRef.current) return;
    let engine: Engine | null = null;
    try {
      engine = createEmitterField(canvasRef.current) as Engine;
      engineRef.current = engine;
    } catch (err) {
      console.error('[fluid-emitters] init failed', err);
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
    <div className="w-full h-full" style={{ background: '#05060c' }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
