# AURORA — build tasks

Dependency-ordered, self-contained tasks. Each is ready to hand to an executor: it names the scaffold
command, the source to port, the showcase that proves reuse, deps, and the acceptance check. Common
rules for every task (do not restate per task):

- Scaffold first: `npm run new-module -w STUDIO -- <id> --category <category/path>` (id === schema.id).
- Port the real code from `ref/AURORA/src/...` verbatim into an untyped `*.module.js`; add a typed
  `*.showcase.tsx` wrapper (canvas ref + `ResizeObserver` + `dispose`). No `@types/three`.
- Fill `*.meta.ts` completely incl. provenance (`ported from ref/AURORA/<path>; dropped/changed: …`).
- WebGPU modules: `dependencies: ['three','webgpu','react']`.
- Bridge: `useBridgeStore((s) => s.componentValues['<id>'])`, defaults outside the selector.
- **Acceptance (every task):** `npm run check-registry -w STUDIO` green + `npm run lint -w STUDIO`
  green + showcase renders with a control driving it and **zero console errors**.

---

## Phase 1 — Universal cores

- [ ] **T1.1 `webgpu/tsl-structured-array`** — port `physic/structuredarray.ts`. Showcase: a tiny TSL
  compute kernel that writes a struct field per index and reads it back into a visible grid (NOT MPM).
- [ ] **T1.2 `math/tsl-noise`** — port `physic/noise.ts`. Showcase: fullscreen TSL quad sampling the
  fractal noise; control = scale/octaves.
- [ ] **T1.3 `math/tsl-hsv`** — port `physic/hsv.ts`. Showcase: HSV→RGB sweep swatch; control = hue.
- [ ] **T1.4 `core/app-init-pipeline`** — port `APP/pipeline.ts` (`AppPipeline`, `PipelineReporter`).
  No Three dep. Showcase: 3 fake weighted async steps driving a progress bar + step log.
- [ ] **T1.5 `performance/adaptive-performance-manager`** — port `APP/performance.ts`. No Three dep.
  Showcase: a slider injects synthetic FPS; UI shows the tier (high/medium/low) + reason.
- [ ] **T1.6 `input/pointer-raycast-force`** — extract the pointer→ray→plane-intersect→force model
  from `APP.ts` (`onMouseMove`, `raycaster`, `plane`) and the `setMouseRay(origin,dir,pos)` contract.
  Showcase: a dot follows the pointer's plane intersection on a flat plane; control = plane depth.
- [ ] **T1.7 `math/tsl-colormap-palette`** — port `visuals/colorpalette.ts`. Showcase: apply each
  named colormap to a 0..1 ramp quad; control = palette enum.

## Phase 2 — Solver core + minimal render

- [ ] **T2.1 `physics/fluid/mls-mpm-solver`** — port `physic/mls-mpm.ts` verbatim (kernels
  `clearGrid→p2g1→p2g2→updateGrid→g2p`, FLIP/PIC, vorticity, surface tension, sparse grid, adaptive
  timestep, `setMouseRay`, audio uniforms, color modes). Depends on T1.1, T1.2, T1.3. **Verify the TSL
  operator situation first** (see decisions ADR-A3); record any `.add()/.mul()` rewrite as a
  deviation. Showcase: solver + a simple GPU point cloud, gravity = center; control = particle count,
  speed, gravity type.
- [ ] **T2.2 `physics/particles/particle-boundaries`** — port `physic/boundaries.ts` (shapes,
  collision response, optional glass-container viz). Depends on T1.1. Showcase: box/sphere container
  deflecting a basic moving point cloud; control = shape + restitution/friction.
- [ ] **T2.3 `rendering/particles/particle-renderer-system`** — port `RENDERER/renderercore.ts` +
  `mesh/point/sprite/trail` renderers + `visuals/colormodes.ts` (fold texture managers + materialvisuals
  in unless a 2nd consumer appears). Depends on T1.7. Showcase: render an arbitrary instanced point
  buffer; control = render mode (MESH/POINT/SPRITE/TRAIL) + color mode + size.
- [ ] **T2.4 — integration check:** wire T2.1 + T2.2 + T2.3 in T2.1's showcase so MLS-MPM particles
  render inside the box in MESH mode — the first real AURORA-look frame. (No new module; proves the
  three compose.)

## Phase 3 — Physics dressing

- [ ] **T3.1 `physics/particles/particle-force-fields`** — port `physic/forcefields.ts`
  (attractor/repeller/vortex). Showcase: fields acting on a basic point cloud; control = field type +
  strength.
- [ ] **T3.2 `physics/particles/particle-emitters`** — port `physic/emitters.ts`. Showcase: emit into
  a basic buffer; control = rate + emitter shape.
- [ ] **T3.3 `physics/fluid/mpm-material-manager`** — port `physic/materials.ts`. Showcase: switch MPM
  material presets on the Phase-2 solver showcase; control = material enum.

## Phase 4 — Look

- [ ] **T4.1 `rendering/environments/hdr-stage-scenery`** — port `STAGE/scenery.ts` (WebGPURenderer +
  scene + HDR env + lights + camera + OrbitControls + tone mapping + shadows + raycaster factory).
  Ship only the default-referenced HDR/texture assets. Showcase: HDR-lit stage + orbit controls
  showing a PBR mesh; control = environment intensity + exposure.
- [ ] **T4.2 `rendering/postfx/aurora-postfx`** — port `POSTFX/postfx.ts` (MRT bloom + radial focus +
  radial CA + vignette + film grain + color grading + lens distortion; drop legacy disabled blocks).
  Showcase: a spinning emissive mesh; controls = bloom strength/threshold + grade + vignette + grain.
- [ ] **T4.3 `rendering/screenspace/glass-lens-overlay`** — port `GLASS/glass-lens-panel.ts` +
  `presets.ts` + `types.ts` (screen-fixed `MeshPhysicalNodeMaterial` overlay on ortho camera +
  displacement). Showcase: glass overlay refracting a scene behind it; control = preset + dispersion.

## Phase 5 — Audio

- [ ] **T5.0 — reuse re-evaluation:** compare against existing `audio-reactive` module + `fluid-sim`
  audio. Confirm AURORA's stack is a superset (AI genre/mood, 21 modes) → port as distinct ids
  (decision in decisions ADR-A4). Record outcome.
- [ ] **T5.1 `audio-reactive/audio-analysis-engine`** — port `AUDIO/audio-manager.ts` +
  `soundreactivity.ts` + `core/enhanced-audio-analyzer.ts` + `beat-analyzer.ts`. Showcase: mic/file
  toggle → live bass/mid/treble/beat meters (needs user gesture; overlay a mic button).
- [ ] **T5.2 `audio-reactive/ai-music-analyzer`** — port `AUDIO/ai-music-analyzer.ts` (no Three dep).
  Showcase: feed feature frames → genre/mood/tempo readout.
- [ ] **T5.3 `audio-reactive/audio-visual-modulation`** — port `AUDIO/color-modulation.ts` +
  `audio-forces.ts`. Showcase: audio frame → modulated color/force on a demo mesh; control = influence.

## Phase 6 — Lab replica (`labs/aurora/`)

- [ ] **T6.1 — capsule + snapshots.** Create `STUDIO/src/labs/aurora/`. Copy each used canonical
  module into `modules/<category>/` (snapshot, with provenance back to `src/modules/...`). Ship only
  Scenery-referenced assets in `modules/assets/`.
- [ ] **T6.2 — composition.** Port `FlowApp` init order + update loop into `createAuroraLab.js`
  (config → scenery → postfx → glass → boundaries → physics → renderers → audio → interaction; update
  loop = scenery.update → audio → renderer state → glass → simulation → postfx.render → perf). Wire
  via `core/app-init-pipeline` + `performance/adaptive-performance-manager` +
  `input/pointer-raycast-force`.
- [ ] **T6.3 — local modes/presets/tuning.** Port `AUDIO/visualization-modes.ts` + `mode-sequencer.ts`
  + `mode-parameters.ts` into `local/modes/`; build `local/presets/AuroraPresets.ts` from
  `config.ts defaultConfig`; put config defaults + `PARAM_TO_CONFIG` + `provenance.ts` in
  `local/tuning/`.
- [ ] **T6.4 — PANELFLOW schema + wrapper.** `AuroraLab.meta.ts` with `AURORA_PARAMS` (curated subset:
  particle count/size, sim speed/noise/gravity, bloom, glass preset, audio binding/gain, viz mode,
  render mode, preset enum). `AuroraLab.tsx` typed wrapper (canvas + ResizeObserver + dispose + bridge
  + mic toggle overlay). Bridge id `aurora`.
- [ ] **T6.5 — fidelity pass + report.** Side-by-side vs `ref/AURORA` (run `npm run dev` in
  `ref/AURORA`): particle look, bloom, glass, audio reactivity, presets. Record deviations. Write the
  final conversion report (plan.md §8).

---

### Suggested commit cadence
One commit per phase gate (after DoD green), e.g. `feat(modules): AURORA phase 1 universal cores`.
Branch off `main` (current branch is `v0.3`); do not commit until the user asks.
