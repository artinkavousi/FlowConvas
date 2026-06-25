/**
 * ARTINOS Module: AppInitPipeline
 * Category: core
 * Dependencies: (none — pure TypeScript)
 * Reusable as: a weighted, sequential async init pipeline with progress + skip predicates +
 * per-step timing hooks. Drives any multi-stage bootstrap (engine init, asset loading, scene
 * assembly) and reports normalized progress (0..1) for a loading bar.
 *
 * Ported faithfully from ref/AURORA/src/APP/pipeline.ts (the FlowApp bootstrap executor).
 * Change: the source `ProgressCallback` (from APP/types.ts) is inlined here so the module is
 * self-contained.
 */

/** Progress callback: receives a 0..1 fraction and an optional settle delay in ms. */
export type ProgressCallback = (fraction: number, delayMs?: number) => Promise<void> | void;

/** Describes an executable step in the initialization pipeline. */
export interface PipelineStep {
  /** Stable identifier primarily used for logging and debugging. */
  readonly id: string;
  /** Human-friendly label for diagnostics. */
  readonly label: string;
  /** Relative weight used when computing progress fractions. Defaults to 1. */
  readonly weight?: number;
  /** Optional predicate determining whether this step should execute. */
  readonly enabled?: () => boolean;
  /** Function invoked to execute the step. */
  run: () => Promise<void> | void;
}

/** Callback hooks fired during pipeline execution to aid diagnostics or tracing. */
export interface PipelineReporter {
  onStepStart?(event: { step: PipelineStep; index: number }): void;
  onStepComplete?(event: { step: PipelineStep; index: number; durationMs: number }): void;
  onStepSkipped?(event: { step: PipelineStep; index: number }): void;
}

/** Options accepted by {@link AppInitPipeline.execute}. */
export interface PipelineRunOptions {
  progress?: ProgressCallback;
  reporter?: PipelineReporter;
  /** Optional final delay passed to the progress callback once execution finishes. */
  settleDelayMs?: number;
}

/**
 * Lightweight sequential pipeline executor. Runs enabled steps in order, computing a
 * weighted 0..1 progress fraction after each one and emitting reporter hooks.
 */
export class AppInitPipeline {
  constructor(private readonly steps: PipelineStep[]) {}

  /** Execute all configured steps sequentially. */
  public async execute(options: PipelineRunOptions = {}): Promise<void> {
    const { progress, reporter, settleDelayMs = 0 } = options;
    const stepStates = this.steps.map((step) => ({
      step,
      enabled: step.enabled ? step.enabled() : true,
    }));

    const totalWeight =
      stepStates
        .filter((state) => state.enabled)
        .reduce((sum, state) => sum + (state.step.weight ?? 1), 0) || 1;
    let completedWeight = 0;

    if (progress) {
      await progress(0);
    }

    for (let index = 0; index < stepStates.length; index++) {
      const { step, enabled } = stepStates[index];

      if (!enabled) {
        reporter?.onStepSkipped?.({ step, index });
        continue;
      }

      reporter?.onStepStart?.({ step, index });
      const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      await step.run();
      const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const durationMs = endTime - startTime;
      reporter?.onStepComplete?.({ step, index, durationMs });

      completedWeight += step.weight ?? 1;
      if (progress) {
        const fraction = Math.min(completedWeight / totalWeight, 1);
        await progress(fraction);
      }
    }

    if (progress && settleDelayMs > 0) {
      await progress(1, settleDelayMs);
    }
  }
}
