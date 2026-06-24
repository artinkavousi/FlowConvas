import type { ArtinosModule } from '../../registry/types';
import type { ParameterDef } from '@artinos/panelflow';
import { lazy } from 'react';

const AudioReactivePreview = lazy(() => import('./AudioReactivePreview'));

const parameters: ParameterDef[] = [
  // Analysis
  { key: 'gain', label: 'Input Gain', type: 'number', default: 1, min: 0, max: 3, step: 0.01, group: 'Analysis' },
  { key: 'sensitivity', label: 'Sensitivity', type: 'number', default: 1.2, min: 0.1, max: 4, step: 0.05, group: 'Analysis' },
  { key: 'smoothing', label: 'Smoothing', type: 'number', default: 0.6, min: 0, max: 0.95, step: 0.01, group: 'Analysis' },
  // Appearance
  {
    key: 'style',
    label: 'Style',
    type: 'enum',
    default: 'bars',
    options: [
      { label: 'Bars', value: 'bars' },
      { label: 'Radial', value: 'radial' },
    ],
    group: 'Appearance',
  },
  { key: 'bars', label: 'Bar Count', type: 'number', default: 48, min: 8, max: 128, step: 1, group: 'Appearance' },
  { key: 'color', label: 'Low Color', type: 'color', default: '#38e8c8', group: 'Appearance' },
  { key: 'accent', label: 'High Color', type: 'color', default: '#f5a3ff', group: 'Appearance' },
  { key: 'background', label: 'Background', type: 'color', default: '#05060c', group: 'Appearance' },
  // Overlays
  { key: 'beatFlash', label: 'Beat Flash', type: 'boolean', default: true, group: 'Overlays' },
  { key: 'showMeters', label: 'Band Meters', type: 'boolean', default: true, group: 'Overlays' },
];

const audioReactiveModule: ArtinosModule = {
  id: 'audio-reactive',
  name: 'Audio Reactive Engine',
  category: 'ui',
  description:
    'A self-contained audio-reactivity engine + live visualizer: mic / test-tone / file input → FFT feature extraction (perceptual bands, spectral centroid/flux), beat & BPM tracking, LFO/sample-hold modulators, and a routing matrix. Extracted as a standalone, framework-agnostic system so ANY module can become audio-reactive. The preview renders a spectrum + band meters + beat pulse; the reusable value is the per-frame AudioFrame snapshot a consumer maps to its own parameters.',
  tags: ['audio', 'audio-reactive', 'fft', 'spectrum', 'beat', 'bpm', 'visualizer', 'web-audio', 'reactive', 'analyser'],
  schema: {
    id: 'audio-reactive',
    name: 'Audio Reactive Engine',
    category: 'ui',
    parameters,
  },
  preview: AudioReactivePreview,
  sourcePath: 'STUDIO/src/modules/audio-reactive/audio/AudioReactivity.js',
  dependencies: ['@artinos/panelflow'],
  usage:
    "import { AudioReactivity } from './modules/audio-reactive/audio/AudioReactivity.js';\n\nconst audio = new AudioReactivity();\nawait audio.startMic();              // or startTone() / startFile({ file })\n\n// In your render loop (config keys are optional; defaults shown):\nconst cfg = { AUDIO_ENABLED: true, AUDIO_GAIN: 1, AUDIO_FX_AMOUNT: 1, AUDIO_BINDING_MODE: 'off' };\nconst f = audio.update(cfg, dt);     // { energy, bass, mid, treble, beat, bpm, spectrum, frame }\nmaterial.uniforms.uBass.value = f.bass;   // drive anything from the AudioFrame",
  presets: {
    'Spectrum Bars': { style: 'bars', bars: 48, color: '#38e8c8', accent: '#f5a3ff', beatFlash: true },
    'Neon Radial': { style: 'radial', bars: 64, color: '#6bb8ff', accent: '#ff6b9d', beatFlash: true },
    'Minimal Mono': { style: 'bars', bars: 32, color: '#cbd5e1', accent: '#94a3b8', beatFlash: false, showMeters: false },
    'High Sensitivity': { sensitivity: 2.6, smoothing: 0.4, gain: 1.6 },
  },
  related: [],
  agentNotes:
    'Standalone audio-reactivity system extracted (Mode B) full-fidelity from REF/WebGpu-Fluid-Simulation-master/src/audio — the reusable system was buried inside the fluid project (off by default) and is lifted here as its own module. The entire DSP lives self-contained under audio/: AudioGraph (mic/file/tone sources + optional AudioWorklet), FeatureExtractor (FFT → perceptual bands {sub,bass,lowMid,mid,highMid,presence,air}, spectral centroid/flux, legacy {energy,bass,mid,treble,spectrum[16]}), BeatTracker (BPM + beat edges + confidence), Modulators (LFO/SampleAndHold), ModulationMatrix + routePresets/targetRegistry (fluid-style routing — INERT here: no target world is set, mode stays "off"), AudioBus, MacroStore. Public facade is AudioReactivity: startMic()/startTone()/startFile(payload)/stop(), setGain(v), and update(config, dt) -> snapshot. update() reads only AUDIO_* config keys (AUDIO_ENABLED/GAIN/FX_AMOUNT/BINDING_MODE/USE_WORKLET/LATENCY_MS); pass them or accept defaults. Audio needs a user gesture to start (autoplay policy) — the preview overlays Test-tone / Mic buttons. The bridge controls (gain + visualizer params) are presentation; the DSP is verbatim from the source. Bridge id "audio-reactive". No WebGPU/Three dependency — pure Web Audio. To make another module audio-reactive, hold one AudioReactivity instance and feed update()\'s snapshot into that module\'s params.',
  reuseNotes:
    'Use as: a standalone music/voice visualizer (bars or radial), or as a shared audio driver for other modules (feed the AudioFrame into a shader/particle module). Strong package-promotion candidate (master guideline §14) once ≥3 modules consume it — the core has zero PANELFLOW/Studio hard-dependency (only the Preview wraps the bridge). Dropped from the source: Tweakpane GUI, performance HUD, and the fluid-specific modulation targets (kept inert).',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default audioReactiveModule;
