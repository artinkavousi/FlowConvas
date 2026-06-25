/**
 * AdaptivePerformanceManagerShowcase — bridge-driven live showcase.
 * Feeds a synthetic, sliderable FPS into the manager every frame and shows the resulting tier
 * (high/medium/low) plus the streak diagnostics + a log of tier transitions — proving the
 * hysteresis state machine works standalone.
 */

import { useEffect, useRef, useState } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import {
  AdaptivePerformanceManager,
  adaptivePerformanceDefaults,
  type PerformanceTier,
} from './AdaptivePerformanceManager';

const BRIDGE_ID = 'adaptive-performance-manager';

const TIER_COLOR: Record<PerformanceTier, string> = {
  high: '#34d399',
  medium: '#fbbf24',
  low: '#f87171',
};

export default function AdaptivePerformanceManagerShowcase() {
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const targetFps = (values?.targetFps as number) ?? 60;
  const jitter = (values?.jitter as number) ?? 4;

  const [tier, setTier] = useState<PerformanceTier>('high');
  const [diag, setDiag] = useState(() => ({ fps: 60, tier: 'high' as PerformanceTier, lowStreak: 0, criticalStreak: 0, highStreak: 0 }));
  const [log, setLog] = useState<string[]>([]);

  const fpsRef = useRef(targetFps);
  const jitterRef = useRef(jitter);
  fpsRef.current = targetFps;
  jitterRef.current = jitter;

  useEffect(() => {
    const manager = new AdaptivePerformanceManager(adaptivePerformanceDefaults, {
      onTierChange: (ctx) => {
        setTier(ctx.tier);
        setLog((l) => [`${ctx.tier.toUpperCase()} — ${ctx.reason} @ ${ctx.fps.toFixed(0)}fps`, ...l].slice(0, 8));
      },
    });

    let raf = 0;
    const tick = () => {
      const noisy = Math.max(1, fpsRef.current + (Math.random() * 2 - 1) * jitterRef.current);
      manager.update(1 / noisy);
      setDiag(manager.getDiagnostics());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex h-full w-full flex-col gap-4 p-8 text-sm text-zinc-200">
      <div className="text-xs uppercase tracking-wide text-zinc-400">Adaptive Performance Manager</div>
      <div className="flex items-center gap-4">
        <div
          className="rounded-lg px-4 py-3 text-lg font-semibold"
          style={{ background: `${TIER_COLOR[tier]}22`, color: TIER_COLOR[tier] }}
        >
          {tier.toUpperCase()}
        </div>
        <div className="font-mono text-xs text-zinc-400">
          fps {diag.fps.toFixed(0)} · low {diag.lowStreak} · crit {diag.criticalStreak} · high {diag.highStreak}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-md bg-black/30 p-3 font-mono text-xs leading-5">
        {log.length === 0 ? <div className="text-zinc-500">drag Target FPS below 45/30 to trigger downgrades…</div> : null}
        {log.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}
