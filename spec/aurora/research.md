# AURORA — source analysis

> Stage 0 of the conversion. Read-only inspection of `ref/AURORA` to feed the decomposition in
> [plan.md](plan.md). Port fidelity rule (root `AGENTS.md` §4 / FR-15): we copy the real
> shaders/physics/behavior — this doc inventories *what* exists, not a re-imagining.

## What it is

- Upstream: **"Flow"** by holtsetio — realtime **MLS-MPM** (Moving Least Squares Material Point
  Method) fluid simulation, all GPU compute via Three.js **TSL** on `WebGPURenderer`. Originally an
  implementation guided by matsuoka-601's WebGPU-Ocean, restyled toward Refik Anadol aesthetics.
- This fork (`ref/AURORA`) is a **heavily extended creative tool**: ~13.5K lines of engine code plus
  a large Tweakpane "glassmorphic" UI layer and ~180 design docs under `DOC/`.
- Stack: `three@0.176` (`three/webgpu` + `three/tsl`), React 19 + R3F (only as a thin host), Vite,
  Tweakpane 4 + plugins, zustand, is-mobile. **WebGPU-only** (hard-fails without `navigator.gpu`).
- Entry: `index.ts` → `src/APP.ts` (`FlowApp`) orchestrates everything via a weighted init pipeline
  (`APP/pipeline.ts`) and a single async `update(delta, elapsed)` loop.

## Systems (grouped, with sizes)

### GPU substrate & math (universal)
- `PARTICLESYSTEM/physic/structuredarray.ts` (192) — `StructuredArray`: aligned GPU structured buffer
  manager with atomic support. The GPGPU substrate every kernel writes through.
- `PARTICLESYSTEM/physic/noise.ts` (104) — TSL noise (triangle-wave + fractal) primitives.
- `PARTICLESYSTEM/physic/hsv.ts` (57) — TSL HSV↔RGB color math.
- `APP/pipeline.ts` — `AppPipeline`: weighted async init steps with progress + skip predicates.
- `APP/performance.ts` — `AdaptivePerformanceManager`: FPS-tier state machine (high/medium/low) that
  drives render-mode downgrades.

### Physics (domain)
- `PARTICLESYSTEM/physic/mls-mpm.ts` (1536) — `MlsMpmSimulator`: the core solver. Compute kernels
  `clearGrid / p2g1 / p2g2 / updateGrid / g2p`, FLIP/PIC blend, vorticity confinement, surface
  tension, sparse grid, adaptive timestep (CFL), mouse-ray force, audio uniforms, color modes.
- `PARTICLESYSTEM/physic/boundaries.ts` (1535) — `ParticleBoundaries`: boundary shapes (box/sphere/…),
  collision response (stiffness/restitution/friction), optional glass-container visualization.
- `PARTICLESYSTEM/physic/forcefields.ts` (484) — `ForceFieldManager`: attractors/repellers/vortex.
- `PARTICLESYSTEM/physic/emitters.ts` (545) — `ParticleEmitterManager`.
- `PARTICLESYSTEM/physic/materials.ts` (511) — `MaterialManager`: MPM material models.

### Rendering (domain)
- `PARTICLESYSTEM/RENDERER/renderercore.ts` (298) — `RendererManager` + `ParticleRenderMode`
  (MESH/POINT/SPRITE/TRAIL) + `IParticleRenderer` interface, hot-switching by perf tier.
- `…/meshrenderer.ts` (324), `pointrenderer.ts` (99), `spriterenderer.ts` (319),
  `trailrenderer.ts` (247) — the four renderers (instanced mesh look-at + density scale + AO; GPU
  points; sprites; trails).
- `PARTICLESYSTEM/visuals/` — `colorpalette.ts` (383), `colormodes.ts` (100), `materialvisuals.ts`,
  `config.ts`, texture managers (`proceduralGPU.ts`, `texturemanager.ts`, `unified-texture-system.ts`).

### Stage / postFX / glass (domain)
- `STAGE/scenery.ts` (529) — `Scenery`: owns the `WebGPURenderer`, scene, HDR environment, lights,
  `PerspectiveCamera` + `OrbitControls`, tone mapping, shadows, raycaster factory.
- `POSTFX/postfx.ts` (853) — `PostFX`: MRT bloom (per-object intensity, custom screen blend) +
  radial focus blur + radial chromatic aberration + vignette + film grain + color grading + lens
  distortion, with audio-driven dynamics.
- `GLASS/glass-lens-panel.ts` (573) — `GlassLensPanel`: screen-fixed glass overlay
  (`MeshPhysicalNodeMaterial` transmission/iridescence/dispersion) on an orthographic camera, with
  animated displacement patterns. `GLASS/presets.ts`, `GLASS/types.ts`.

### Audio (domain — a large stack)
- `AUDIO/audio-manager.ts` (323) — `AudioManager`: orchestrates capture/analysis/uniforms/presets.
- `AUDIO/soundreactivity.ts` (1022) — `SoundReactivity`: mic/file capture + FFT + band features.
- `AUDIO/core/enhanced-audio-analyzer.ts` (274) — `EnhancedAudioAnalyzer`.
- `AUDIO/beat-analyzer.ts` (351) — `BeatAnalyzer`: tempo/beat detection.
- `AUDIO/ai-music-analyzer.ts` (403) — `AIMusicAnalyzer`: genre/mood/tempo classification.
- `AUDIO/audio-forces.ts` (285), `AUDIO/color-modulation.ts` (276) — reusable audio→force/color maps.
- `AUDIO/visualization-modes.ts` (561), `AUDIO/mode-sequencer.ts` (405), `AUDIO/mode-parameters.ts`,
  `AUDIO/preset-manager.ts` — the 21-mode visualization composition + sequencer (AURORA-specific).

### UI — dropped (replaced by PANELFLOW)
- `PANEL/**` (Glassmorphic Tweakpane framework: `GlassmorphicPanelContainer`, `PanelManager`,
  `core/*` docking/theme/tab/state engines, all `PANEL*.ts` tabs + CSS) and every `PANEL*.ts` /
  `PANELxxx` panel. Per the `fluid-sim` precedent, the source GUI is **dropped**; controls are
  re-expressed as a PANELFLOW schema. The glass *aesthetic* is a possible future `ui/` conversion
  (out of scope here — Tweakpane/DOM, not React/PANELFLOW).

## Config surface
`src/config.ts` (`FlowConfig`, `defaultConfig`) is a ~100-key typed config — the single source of
tunables (particles, simulation, bloom + 6 more postFX blocks, camera, environment/tone mapping,
audio, audioReactive, appearanceReactivity, sequencer, glassLens, device sensors). This becomes the
basis for the Lab's PANELFLOW `parameters` + `PARAM_TO_CONFIG` map (mirror `fluid-sim`).

## Assets
`src/assets/` — many HDR/EXR environments, concrete PBR textures, `.obj` rounded boxes. Only the
ones actually referenced by `Scenery` defaults need to ship in the Lab `modules/assets/` snapshot;
the rest are alternates and can be dropped (record which in provenance).

## What to drop / not port
- Tweakpane glassmorphic UI framework + all panels (→ PANELFLOW schema).
- React/R3F host, `index.html` loading screen, Vite harness, `DOC/` (~180 status docs).
- Unused alternate HDR/texture assets.
- Legacy/disabled config blocks (`chromaticAberration`, `radialLensAberration`, `depthOfField`,
  `lensDistortion`, `colorGrade`) — keep only the active postFX path (`bloom`, `radialFocus`,
  `radialCA`, `vignette`, `filmGrain`, `colorGrading`, `lensDistortionFX`). Record in provenance.

## Reuse-first check (ARTINOS-PRD §15)
Existing modules to check before building (and how AURORA differs):
- `webgpu/TslComputeField2D`, `physics/fluid/TslStableFluids2D` — 2D Eulerian fluid; AURORA is **3D
  MLS-MPM particle** sim → genuinely new solver. No overlap beyond "WebGPU fluid".
- `audio-reactive` (+ `labs/fluid-sim/modules/audio/*`) — a different (worklet-based) reactivity
  stack; AURORA's is a richer **superset** (AI genre/mood, 21 modes). Port as distinct ids; do **not**
  silently merge. Re-evaluate folding at Phase 5.
- `rendering/postfx/WebgpuSsgiRoomRenderer`, `rendering/environments/AdaptiveOpenFrontBoxRoom` —
  different pipeline (SSGI room vs HDR stage + Anadol bloom). AURORA's postFX/stage are new.
- `gpu-particles` — simpler; not the MLS-MPM solver.

Conclusion: AURORA is genuinely new across the board; proceed with the decomposition in
[plan.md](plan.md).
