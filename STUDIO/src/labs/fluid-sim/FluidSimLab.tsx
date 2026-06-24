/**
 * FluidSimLab — live preview for the fluid-sim Lab (full faithful replica).
 *
 * Thin typed wrapper over createFluidSimLab (engine.js convention): owns the
 * canvas + ResizeObserver + dispose; bridge-driven (ADR-13). WebGPU-only —
 * PreviewStage shows a capability notice when WebGPU is unavailable. Drag to
 * inject dye/velocity. Audio reactivity needs a user gesture, so the Lab
 * overlays a mic toggle.
 */

import { useEffect, useRef, useState } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createFluidSimLab } from './createFluidSimLab.js';

const BRIDGE_ID = 'fluid-sim';

type Engine = {
  update(p: unknown): void;
  startAudio(kind: 'mic' | 'tone'): Promise<void>;
  stopAudio(): Promise<void>;
  resize(): void;
  dispose(): void;
};

export default function FluidSimLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [audioOn, setAudioOn] = useState(false);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    if (!canvasRef.current) return;
    let engine: Engine | null = null;
    try {
      engine = createFluidSimLab(canvasRef.current) as Engine;
      engineRef.current = engine;
    } catch (err) {
      console.error('[fluid-sim] init failed', err);
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

  async function toggleAudio() {
    const engine = engineRef.current;
    if (!engine) return;
    try {
      if (audioOn) {
        await engine.stopAudio();
        setAudioOn(false);
      } else {
        await engine.startAudio('mic');
        setAudioOn(true);
      }
    } catch (err) {
      console.error('[fluid-sim] audio toggle failed', err);
    }
  }

  return (
    <div className="w-full h-full relative" style={{ background: '#000' }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      <button
        onClick={toggleAudio}
        className="absolute top-3 right-3 px-2.5 py-1 text-[11px] rounded-md bg-white/10 hover:bg-white/20 text-white/80 backdrop-blur"
      >
        {audioOn ? '■ Stop mic' : '● Audio react (mic)'}
      </button>
    </div>
  );
}
