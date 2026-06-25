import type { ArtinosModule } from '../../registry/types';
import AdaptivePerformanceManagerShowcase from './AdaptivePerformanceManager.showcase';

const adaptivePerformanceManagerMeta: ArtinosModule = {
  id: 'adaptive-performance-manager',
  name: 'Adaptive Performance Manager',
  category: 'performance',
  description:
    'Frame-pacing analyzer that converts per-frame deltas into stable quality-tier transitions (high / medium / low) using hysteresis streaks, so any renderer can auto-balance quality vs responsiveness. Emits a tier-change callback with reason + fps. Pure TypeScript.',
  tags: ['performance', 'fps', 'adaptive', 'quality', 'lod', 'frame-pacing', 'telemetry'],
  schema: {
    id: 'adaptive-performance-manager',
    name: 'Adaptive Performance Manager',
    category: 'performance',
    parameters: [
      { key: 'targetFps', label: 'Target FPS', type: 'number', default: 60, min: 10, max: 120, step: 1, group: 'Simulated Load' },
      { key: 'jitter', label: 'FPS Jitter', type: 'number', default: 4, min: 0, max: 20, step: 1, group: 'Simulated Load' },
    ],
  },
  preview: AdaptivePerformanceManagerShowcase,
  sourcePath: 'STUDIO/src/modules/performance/AdaptivePerformanceManager.ts',
  dependencies: ['react'],
  usage:
    "import { AdaptivePerformanceManager, adaptivePerformanceDefaults } from './modules/performance/AdaptivePerformanceManager';\n\nconst perf = new AdaptivePerformanceManager(adaptivePerformanceDefaults, {\n  onTierChange: (ctx) => applyQuality(ctx.tier), // 'high' | 'medium' | 'low'\n});\n// in your render loop:\nperf.update(deltaSeconds);",
  presets: {
    'Smooth 60': { targetFps: 60, jitter: 4 },
    'Struggling 40': { targetFps: 40, jitter: 6 },
    'Critical 25': { targetFps: 25, jitter: 5 },
  },
  related: ['app-init-pipeline', 'particle-renderer-system'],
  agentNotes:
    'Ported verbatim from ref/AURORA/src/APP/performance.ts. Construct with options (thresholds + frame counts) and { onTierChange }. Call update(deltaSeconds) every frame; it computes fps=1/delta, accumulates hysteresis streaks, and only fires onTierChange when a streak crosses framesForLow/Critical/High — preventing flapping. Reasons: critical-low → low, low → medium, recover-high → high. registerManualOverride() resets streaks after a user quality change. adaptivePerformanceDefaults mirrors FlowApp (low45/crit30/high70, frames 45/30/180). In AURORA, low→POINT, medium→SPRITE renderer downgrades. Bridge id "adaptive-performance-manager".',
  reuseNotes:
    'Pair with any renderer that can switch quality tiers (e.g. particle-renderer-system). Engine-agnostic — only needs a per-frame delta.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default adaptivePerformanceManagerMeta;
