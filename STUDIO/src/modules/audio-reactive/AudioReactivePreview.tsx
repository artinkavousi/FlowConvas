/**
 * AudioReactivePreview — live preview for the audio-reactive module.
 *
 * Thin typed wrapper: owns the canvas + ResizeObserver + animation loop +
 * dispose, drives the ported DSP engine (`audio/AudioReactivity.js`), and renders
 * its AudioFrame snapshot through AudioReactiveVisualizer. Visual + gain params
 * come from the PANELFLOW bridge (ADR-13). Audio sources need a user gesture
 * (browser autoplay policy), so the preview overlays Start controls.
 */

import { useEffect, useRef, useState } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { AudioReactivity } from './audio/AudioReactivity.js';
import { createVisualizer } from './AudioReactiveVisualizer.js';

const BRIDGE_ID = 'audio-reactive';

type EngineSnapshot = {
  enabled: boolean;
  bass: number;
  mid: number;
  treble: number;
  beat: boolean;
  bpm: number;
  spectrum: number[];
};

type Engine = {
  startMic(): Promise<void>;
  startTone(payload?: unknown): Promise<void>;
  startFile(payload: unknown): Promise<void>;
  stop(): Promise<void>;
  setGain(v: number): void;
  update(config: Record<string, unknown>, dt: number): EngineSnapshot;
};

type Visualizer = {
  draw(snap: EngineSnapshot): void;
  resize(): void;
  setParams(p: Record<string, unknown>): void;
  dispose(): void;
};

export default function AudioReactivePreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const vizRef = useRef<Visualizer | null>(null);
  const valuesRef = useRef<Record<string, unknown>>({});
  const [source, setSource] = useState<'idle' | 'mic' | 'tone'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Select the raw slice; default OUTSIDE the selector (ADR-13).
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  valuesRef.current = (values as Record<string, unknown>) ?? {};

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new AudioReactivity() as Engine;
    const viz = createVisualizer(canvasRef.current) as Visualizer;
    engineRef.current = engine;
    vizRef.current = viz;

    const ro = new ResizeObserver(() => viz.resize());
    ro.observe(canvasRef.current);

    let raf = 0;
    let running = true;
    let last = performance.now();
    const tick = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(tick); // reschedule FIRST — a bad frame must not kill the loop
      const eng = engineRef.current;
      const vz = vizRef.current;
      if (!eng || !vz) return;
      const dt = Math.min(0.1, (now - last) / 1000) || 1 / 60;
      last = now;
      const v = valuesRef.current;
      const gain = typeof v.gain === 'number' ? v.gain : 1;
      const config = {
        AUDIO_ENABLED: true,
        AUDIO_GAIN: gain,
        AUDIO_FX_AMOUNT: 1,
        AUDIO_BINDING_MODE: 'off', // standalone: no fluid-style matrix routing
        AUDIO_USE_WORKLET: false,
        AUDIO_LATENCY_MS: 0,
      };
      eng.setGain(gain);
      const snap = eng.update(config, dt);
      vz.setParams({
        bars: v.bars,
        sensitivity: v.sensitivity,
        smoothing: v.smoothing,
        color: v.color,
        accent: v.accent,
        beatFlash: v.beatFlash,
        showMeters: v.showMeters,
        style: v.style,
        background: v.background,
      });
      vz.draw(snap);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      void engine.stop();
      viz.dispose();
      engineRef.current = null;
      vizRef.current = null;
    };
  }, []);

  async function start(kind: 'mic' | 'tone') {
    const engine = engineRef.current;
    if (!engine) return;
    setError(null);
    try {
      if (kind === 'mic') await engine.startMic();
      else await engine.startTone();
      setSource(kind);
    } catch (err) {
      setError(kind === 'mic' ? 'Microphone permission denied' : 'Could not start audio');
      console.error('[audio-reactive] start failed', err);
    }
  }

  async function stop() {
    await engineRef.current?.stop();
    setSource('idle');
  }

  return (
    <div className="w-full h-full relative" style={{ background: '#05060c' }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute top-3 right-3 flex gap-2">
        {source === 'idle' ? (
          <>
            <button
              onClick={() => start('tone')}
              className="px-2.5 py-1 text-[11px] rounded-md bg-white/10 hover:bg-white/20 text-white/80 backdrop-blur"
            >
              ♪ Test tone
            </button>
            <button
              onClick={() => start('mic')}
              className="px-2.5 py-1 text-[11px] rounded-md bg-white/10 hover:bg-white/20 text-white/80 backdrop-blur"
            >
              ● Mic
            </button>
          </>
        ) : (
          <button
            onClick={stop}
            className="px-2.5 py-1 text-[11px] rounded-md bg-white/10 hover:bg-white/20 text-white/80 backdrop-blur"
          >
            ■ Stop ({source})
          </button>
        )}
      </div>
      {error && (
        <div className="absolute bottom-3 left-3 text-[11px] text-rose-300/90">{error}</div>
      )}
    </div>
  );
}
