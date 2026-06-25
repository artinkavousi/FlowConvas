import type { ArtinosModule } from '../../registry/types';
import AppInitPipelineShowcase from './AppInitPipeline.showcase';

const appInitPipelineMeta: ArtinosModule = {
  id: 'app-init-pipeline',
  name: 'App Init Pipeline',
  category: 'core',
  description:
    'Weighted, sequential async init pipeline with per-step skip predicates, timing hooks, and normalized 0..1 progress reporting. Drives any multi-stage bootstrap (engine init, asset loading, scene assembly) and feeds a loading bar. Pure TypeScript, no engine deps.',
  tags: ['core', 'pipeline', 'bootstrap', 'progress', 'async', 'lifecycle', 'loading'],
  schema: {
    id: 'app-init-pipeline',
    name: 'App Init Pipeline',
    category: 'core',
    parameters: [
      { key: 'stepCount', label: 'Steps', type: 'number', default: 5, min: 1, max: 12, step: 1, group: 'Pipeline' },
      { key: 'stepDelayMs', label: 'Step Delay (ms)', type: 'number', default: 350, min: 50, max: 1500, step: 50, group: 'Pipeline' },
      { key: 'skipEvery', label: 'Skip Every Nth (0=off)', type: 'number', default: 0, min: 0, max: 5, step: 1, group: 'Pipeline' },
      { key: 'loop', label: 'Loop', type: 'boolean', default: true, group: 'Pipeline' },
    ],
  },
  preview: AppInitPipelineShowcase,
  sourcePath: 'STUDIO/src/modules/core/AppInitPipeline.ts',
  dependencies: ['react'],
  usage:
    "import { AppInitPipeline } from './modules/core/AppInitPipeline';\n\nconst pipeline = new AppInitPipeline([\n  { id: 'renderer', label: 'Renderer', weight: 2, run: async () => initRenderer() },\n  { id: 'audio', label: 'Audio', weight: 1, enabled: () => audioOn, run: async () => initAudio() },\n]);\nawait pipeline.execute({ progress: (f) => setBar(f), settleDelayMs: 100 });",
  presets: {
    'Fast (3 steps)': { stepCount: 3, stepDelayMs: 150, skipEvery: 0, loop: true },
    'Heavy (10 steps)': { stepCount: 10, stepDelayMs: 500, skipEvery: 0, loop: true },
    'With skips': { stepCount: 8, stepDelayMs: 300, skipEvery: 3, loop: true },
  },
  related: ['adaptive-performance-manager'],
  agentNotes:
    'Ported verbatim from ref/AURORA/src/APP/pipeline.ts (the FlowApp bootstrap executor); the source ProgressCallback type was inlined so the module is self-contained. new AppInitPipeline(steps) then await pipeline.execute({ progress, reporter, settleDelayMs }). Each step: { id, label, weight?, enabled?, run }. Progress fraction is weight-normalized over ENABLED steps only. enabled() is evaluated once at execute() start. Reporter hooks: onStepStart/onStepComplete(durationMs)/onStepSkipped. No Three/React dependency in the module itself (the showcase uses React only to render). Bridge id "app-init-pipeline".',
  reuseNotes:
    'Use to bootstrap any engine/scene with a progress bar and conditional stages. In the AURORA Lab this drives config → scenery → postfx → glass → boundaries → physics → renderers → audio → interaction.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default appInitPipelineMeta;
