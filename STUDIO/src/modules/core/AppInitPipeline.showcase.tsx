/**
 * AppInitPipelineShowcase — bridge-driven live showcase for AppInitPipeline.
 * Runs a set of fake weighted async steps and renders the normalized progress bar + step log,
 * proving the executor works outside any AURORA/engine context.
 */

import { useEffect, useRef, useState } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { AppInitPipeline, type PipelineStep } from './AppInitPipeline';

const BRIDGE_ID = 'app-init-pipeline';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function AppInitPipelineShowcase() {
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const stepCount = Math.round((values?.stepCount as number) ?? 5);
  const stepDelayMs = Math.round((values?.stepDelayMs as number) ?? 350);
  const skipEvery = Math.round((values?.skipEvery as number) ?? 0);
  const loop = (values?.loop as boolean) ?? true;

  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const runIdRef = useRef(0);

  useEffect(() => {
    const myRun = ++runIdRef.current;
    let cancelled = false;

    const runOnce = async () => {
      if (cancelled || runIdRef.current !== myRun) return;
      setProgress(0);
      setLog([]);

      const steps: PipelineStep[] = Array.from({ length: stepCount }, (_, i) => ({
        id: `step-${i + 1}`,
        label: `Stage ${i + 1}`,
        weight: 1 + (i % 3),
        enabled: () => !(skipEvery > 0 && (i + 1) % skipEvery === 0),
        run: async () => {
          await wait(stepDelayMs);
        },
      }));

      const pipeline = new AppInitPipeline(steps);
      await pipeline.execute({
        progress: (frac) => {
          if (!cancelled && runIdRef.current === myRun) setProgress(frac);
        },
        reporter: {
          onStepStart: ({ step }) => {
            if (!cancelled && runIdRef.current === myRun) setLog((l) => [...l, `▶ ${step.label}`]);
          },
          onStepComplete: ({ step, durationMs }) => {
            if (!cancelled && runIdRef.current === myRun)
              setLog((l) => [...l, `✓ ${step.label} (${durationMs.toFixed(0)}ms)`]);
          },
          onStepSkipped: ({ step }) => {
            if (!cancelled && runIdRef.current === myRun) setLog((l) => [...l, `⏭ ${step.label} skipped`]);
          },
        },
        settleDelayMs: 0,
      });

      if (loop && !cancelled && runIdRef.current === myRun) {
        await wait(600);
        runOnce();
      }
    };

    runOnce();

    return () => {
      cancelled = true;
      runIdRef.current++;
    };
  }, [stepCount, stepDelayMs, skipEvery, loop]);

  return (
    <div className="flex h-full w-full flex-col gap-4 p-8 text-sm text-zinc-200">
      <div className="text-xs uppercase tracking-wide text-zinc-400">App Init Pipeline</div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-700/50">
        <div
          className="h-full rounded-full bg-teal-400 transition-[width] duration-200"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <div className="text-xs text-zinc-400">{Math.round(progress * 100)}%</div>
      <div className="min-h-0 flex-1 overflow-auto rounded-md bg-black/30 p-3 font-mono text-xs leading-5">
        {log.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}
