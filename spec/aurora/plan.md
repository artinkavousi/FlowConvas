# AURORA → ARTINOS — conversion plan

> Mode B. Produces **~19 canonical reusable modules** + **1 faithful Lab** (`labs/aurora/`). Follows
> `spec/converter-workflow.md` and `ARTINPRD MODULE CONVERTER.md`. Port directly, preserve identity
> (FR-15). Each module proves reuse via a standalone showcase or is folded back in.

## 1. Decomposition principle applied

AURORA is a domain demo (Anadol-style MLS-MPM art) sitting on top of a stack of **universal
primitives**. Per the aggressive-decomposition rule, the bigger library win is the non-domain
substrate hiding under it: a GPGPU structured-buffer manager, TSL noise/color math, an init pipeline,
an adaptive-performance state machine, a pointer-force model, a multi-mode particle renderer, an HDR
stage, a multi-pass postFX chain, a glass overlay, and a full audio-analysis stack — each reusable far
beyond this one piece. The MLS-MPM solver, boundaries, force fields, emitters, materials, and the
21-mode visualization sequencer are the domain/AURORA-specific layers that compose them.

## 2. Module inventory (the deliverables)

Categories use explicit paths (converter-workflow §5). `U` = Core Universal · `D` = Domain Reusable ·
`L` = Lab-local · `X` = Dropped.

| # | Target id | Category | Type | Source file(s) | Deps | Standalone showcase (proof of reuse) |
|---|-----------|----------|------|----------------|------|--------------------------------------|
| 1 | `tsl-structured-array` | `webgpu` | U | `physic/structuredarray.ts` | three, webgpu | Drive a trivial compute kernel writing/reading a struct buffer (non-MPM). |
| 2 | `tsl-noise` | `math` | U | `physic/noise.ts` | three, webgpu | Visualize fractal noise on a fullscreen TSL quad. |
| 3 | `tsl-hsv` | `math` | U | `physic/hsv.ts` | three, webgpu | HSV→RGB sweep swatch on a quad. |
| 4 | `app-init-pipeline` | `core` | U | `APP/pipeline.ts` | (none) | Run 3 fake weighted async steps, render a progress bar. |
| 5 | `adaptive-performance-manager` | `performance` | U | `APP/performance.ts` | (none) | Feed synthetic FPS, show tier transitions high→low. |
| 6 | `pointer-raycast-force` | `input` | U | `APP.ts` (onMouseMove/raycaster/plane) + `mls-mpm.setMouseRay` contract | three | Pointer → ray → plane-intersect dot moved live on a plane. |
| 7 | `mls-mpm-solver` | `physics/fluid` | D | `physic/mls-mpm.ts` | three, webgpu | Solver + minimal point renderer, no postfx/audio. |
| 8 | `particle-boundaries` | `physics/particles` | D | `physic/boundaries.ts` | three, webgpu | Box/sphere container deflecting a basic particle cloud. |
| 9 | `particle-force-fields` | `physics/particles` | D | `physic/forcefields.ts` | three, webgpu | Attractor/repeller/vortex on a basic point cloud. |
| 10 | `particle-emitters` | `physics/particles` | D | `physic/emitters.ts` | three, webgpu | Emit particles into a basic buffer. |
| 11 | `mpm-material-manager` | `physics/fluid` | D | `physic/materials.ts` | three, webgpu | Switch MPM material presets on the Phase-2 solver showcase. |
| 12 | `particle-renderer-system` | `rendering/particles` | D | `RENDERER/renderercore.ts` + `mesh/point/sprite/trail` + `visuals/colormodes.ts` | three, webgpu | Render an arbitrary instanced point buffer in all 4 modes. |
| 13 | `tsl-colormap-palette` | `math` | U | `visuals/colorpalette.ts` | three, webgpu | Apply named colormaps to a 0..1 ramp quad. |
| 14 | `aurora-postfx` | `rendering/postfx` | D | `POSTFX/postfx.ts` | three, webgpu | Bloom + grade + vignette + grain on a spinning emissive mesh. |
| 15 | `hdr-stage-scenery` | `rendering/environments` | D | `STAGE/scenery.ts` | three, webgpu | HDR-lit stage + orbit controls showing a PBR mesh. |
| 16 | `glass-lens-overlay` | `rendering/screenspace` | D | `GLASS/glass-lens-panel.ts` + `GLASS/presets.ts` + `GLASS/types.ts` | three, webgpu | Screen-fixed glass overlay refracting a scene behind it. |
| 17 | `audio-analysis-engine` | `audio-reactive` | D | `AUDIO/audio-manager.ts` + `soundreactivity.ts` + `core/enhanced-audio-analyzer.ts` + `beat-analyzer.ts` | (Web Audio) | Mic/file → live bass/mid/treble/beat meters. |
| 18 | `ai-music-analyzer` | `audio-reactive` | U | `AUDIO/ai-music-analyzer.ts` | (none) | Feed feature frames → genre/mood/tempo readout. |
| 19 | `audio-visual-modulation` | `audio-reactive` | D | `AUDIO/color-modulation.ts` + `audio-forces.ts` | three | Audio frame → modulated color/force values on a demo mesh. |

### Lab-local (`labs/aurora/local/…`) — AURORA-specific, not standalone-reusable
- `composition/` — the `FlowApp` wiring (init order + update loop), ported as `createAuroraLab.js`.
- `modes/` — `AUDIO/visualization-modes.ts` + `mode-sequencer.ts` + `mode-parameters.ts` (the 21
  audio-reactive visualization modes + sequencer — couples audio to this specific scene).
- `presets/` — curated named presets built from `config.ts` `defaultConfig` + mode params.
- `tuning/` — `config.ts` defaults + `PARAM_TO_CONFIG` map + `provenance.ts`.
- `interaction/` — pointer/gravity-sensor glue specific to the Anadol scene.

### Dropped (`X`) — recorded in provenance, not ported
- `PANEL/**` (entire glassmorphic Tweakpane framework + all panel tabs + CSS) → replaced by the
  PANELFLOW schema in the Lab meta. The glass UI aesthetic is a possible future standalone `ui/`
  conversion, explicitly out of scope.
- React/R3F host, `index.ts`/`index.html` loading screen, Vite/Babel harness, `DOC/**`.
- Legacy disabled config blocks + unused alternate HDR/texture assets (see research.md).

> **Decomposition guardrail:** texture managers (`visuals/proceduralGPU.ts`, `texturemanager.ts`,
> `unified-texture-system.ts`) and `materialvisuals.ts` are folded into `particle-renderer-system`
> unless Phase 3 shows a second consumer — then promote. Do not create fake `utils/index/types`
> modules. Both under- and over-decomposition are failures.

## 3. Lab capsule layout (`STUDIO/src/labs/aurora/`)

```
STUDIO/src/labs/aurora/
  AuroraLab.tsx              # typed React wrapper: canvas ref + ResizeObserver + dispose + bridge
  AuroraLab.meta.ts          # ArtinosModule (category 'lab') + AURORA_PARAMS PANELFLOW schema
  createAuroraLab.js         # faithful FlowApp init order + update loop (untyped engine)
  modules/                   # self-contained SNAPSHOT copies of the canonical modules it uses
    webgpu/        tsl-structured-array
    math/          tsl-noise, tsl-hsv, tsl-colormap-palette
    core/          app-init-pipeline
    performance/   adaptive-performance-manager
    input/         pointer-raycast-force
    physics/fluid/        mls-mpm-solver, mpm-material-manager
    physics/particles/    particle-boundaries, particle-force-fields, particle-emitters
    rendering/particles/  particle-renderer-system
    rendering/postfx/     aurora-postfx
    rendering/environments/ hdr-stage-scenery
    rendering/screenspace/ glass-lens-overlay
    audio-reactive/       audio-analysis-engine, ai-music-analyzer, audio-visual-modulation
    assets/               only HDR/OBJ/textures referenced by Scenery defaults
  local/
    composition/   (createAuroraLab wiring helpers)
    modes/         (21 visualization modes + sequencer + mode-parameters)
    presets/       AuroraPresets.ts
    tuning/        config defaults, PARAM_TO_CONFIG, provenance.ts
    interaction/   pointer + gravity-sensor glue
```

`modules/` snapshots keep the Lab portable/copy-pasteable (Lab Capsule Standard, per `fluid-sim`).
Each snapshot's provenance points back to the canonical `src/modules/...` source.

## 4. Dependency graph (build order falls out of this)

```
webgpu/tsl-structured-array ─┬─> physics/fluid/mls-mpm-solver ──┬─> rendering/particles/particle-renderer-system
math/tsl-noise ──────────────┘        │                          │
math/tsl-hsv ───────────────> (color) │                          │
                                       ├─ physics/particles/particle-boundaries
                                       ├─ physics/particles/particle-force-fields
                                       ├─ physics/particles/particle-emitters
                                       └─ physics/fluid/mpm-material-manager
core/app-init-pipeline ───────────────────────────> labs/aurora (composition)
performance/adaptive-performance-manager ─────────> labs/aurora
input/pointer-raycast-force ──────────────────────> labs/aurora
rendering/environments/hdr-stage-scenery ─────────> labs/aurora
rendering/postfx/aurora-postfx ───────────────────> labs/aurora
rendering/screenspace/glass-lens-overlay ─────────> labs/aurora
math/tsl-colormap-palette ───> particle-renderer-system / audio-visual-modulation
audio-reactive/audio-analysis-engine ─> audio-visual-modulation ─> labs/aurora
audio-reactive/ai-music-analyzer ─────> labs/aurora
```

No circular dependencies. Canonical modules never import the Lab.

## 5. Phases (each phase is a gate)

Each phase ends GREEN on the DoD (§6) before the next begins.

- **Phase 1 — Universal cores.** Modules 1–6, 13. Smallest, fully standalone, lowest risk; they
  unblock everything. Each gets a non-AURORA showcase proving reuse.
- **Phase 2 — Solver core + minimal render.** Modules 7, 8, 12. Goal: MLS-MPM particles render in a
  box boundary via the renderer system (point/mesh). First sign of the real AURORA look.
- **Phase 3 — Physics dressing.** Modules 9, 10, 11. Force fields, emitters, materials wired onto the
  Phase-2 solver showcase.
- **Phase 4 — Look.** Modules 14, 15, 16. HDR stage + Anadol bloom/postFX + glass lens. After this
  the standalone modules can reproduce the AURORA *visual* on the solver.
- **Phase 5 — Audio.** Modules 17, 18, 19. Re-evaluate fold-in vs the existing `audio-reactive`
  module here; port as distinct ids if it's a superset (it is — see research.md).
- **Phase 6 — Lab replica.** `labs/aurora/` composition: port `FlowApp` init order + update loop into
  `createAuroraLab.js`, copy `modules/` snapshots, add `local/` modes+presets+tuning, define the
  PANELFLOW `AURORA_PARAMS` schema + `PARAM_TO_CONFIG`, wire the bridge, run the side-by-side fidelity
  pass vs `ref/AURORA`, and write the conversion report.

## 6. Definition of Done (every module + the Lab)

Per `spec/converter-workflow.md` §6:
- `npm run check-registry -w STUDIO` green (complete entry, `id === schema.id`, `sourcePath`
  resolves, schema valid, no duplicate id).
- `npm run lint -w STUDIO` green (`tsc --noEmit`; Three stays in untyped `*.module.js`, typed
  `*.showcase.tsx` wrapper — **no `@types/three`, no `@ts-expect-error` on the engine import**).
- Live preview: showcase opens, renders, a control drives it, **zero console errors**.
- WebGPU modules set `dependencies: ['three','webgpu','react']` so the degrade notice fires.
- Bridge wiring: `useBridgeStore((s) => s.componentValues['<id>'])`, defaults applied **outside** the
  selector (ADR-13) — never `... || {}` inside it.
- Provenance recorded in `agentNotes`/`reuseNotes` (ported from `ref/AURORA/...`; what was
  dropped/changed).
- Lab (Phase 6): canonical modules registered, Lab registered, `modules/` snapshots present with
  provenance, project-only code under `local/`, fidelity note vs source.

## 7. Risks & mitigations

- **TSL operator rewrite (CONFIRMED, biggest cost).** AURORA builds with `vite-plugin-tsl-operator`
  (`a + b` on TSL nodes); STUDIO does **not** (only react+tailwind) and uses `.add()/.mul()` chaining.
  Every ported TSL file must translate `+ - * /` → `.add()/.sub()/.mul()/.div()` — mechanical but
  pervasive (mls-mpm, boundaries, noise, hsv, colorpalette, postfx, glass, renderers). Recorded per
  module as a deviation. See decisions ADR-A3. Also three `0.184` vs `0.176` — watch TSL API renames.
- **MLS-MPM + boundaries are ~1.5K lines of TSL each.** Port verbatim (apart from the operator
  rewrite) into one untyped `.module.js` each; do not refactor. Keep the exact kernel order
  (`clearGrid→p2g1→p2g2→updateGrid→g2p`).
- **WebGPU-only + heavy.** Mount one instance; preview rAF pauses when the tab is hidden
  ([[preview-raf-paused-when-hidden]]) — pump manually when verifying.
- **Audio needs a user gesture.** Mirror `fluid-sim`: preview overlays a mic toggle calling
  `handle.startAudio('mic')`.
- **Config is ~100 keys.** Expose a curated subset in `AURORA_PARAMS` (like `fluid-sim` exposed ~20 of
  ~67); the full surface stays in `local/tuning` config + `PARAM_TO_CONFIG`.
- **Assets are large.** Ship only Scenery-referenced HDR/OBJ/textures in `modules/assets/`.

## 8. Conversion report (filled at the end of each phase / final)

```
RESULT: PASS | BLOCKED | NEEDS HUMAN DECISION
Created:     <new module/lab files>
Registered:  <ids added to the registry; check-registry N modules / M categories>
Preserved:   <source behavior/shaders/physics ported verbatim>
Deviations:  <any unavoidable change, e.g. TSL operator plugin, dropped assets/UI>
Validation:  check-registry <green> · lint <green> · preview <control drives it, 0 console errors>
Fidelity:    <side-by-side vs ref/AURORA>
Next:        <next phase / open questions>
```
