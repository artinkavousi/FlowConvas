# Plan — Mode B Conversion of `REF/WebGpu-Fluid-Simulation-master`

> **Status: COMPLETE ✓** (2026-06-24). Delivered: `audio-reactive`, `fluid-emitters`,
> `webgpu-fluid-sim` (3 components) + `fluid-studio` (faithful replica). Old `webgpu-fluid` deleted
> (git rm). Registry 13/13 green, lint clean. Decision recorded in ADR-21. All engine code ported
> verbatim from `REF/src`. Live verification: WebGPU bound + preset applied + loop ticking + zero
> console errors (full animated capture blocked only by the hidden-preview rAF/WebGPU-capture limit —
> see memory `preview-raf-paused-when-hidden`).
> Governed by `ARTINPRD MODULE CONVERTER.md` (master guideline, Mode B / §3 / §6 / §15) and
> `spec/converter-workflow.md`. This plan decomposes the whole REF fluid project into reusable
> ARTINOS component modules **and** rebuilds the original app faithfully from them.
>
> **Supersedes:** `STUDIO/src/modules/webgpu-fluid/` (the old monolithic single-module port). That
> module is the *older workflow*; it is left untouched during the build and is removed/deprecated only
> once the new faithful replica reaches visual+behavioural parity (Phase 5).

---

## 1. Goal

1. **Decompose** `REF/WebGpu-Fluid-Simulation-master` into its genuinely reusable systems, each a
   registered, auto-showcased ARTINOS module (Mode B).
2. **Replicate** the original fluid app *fully* — same visuals, interactions, presets, emitters,
   particles, audio reactivity, quality scaling — as a composition built from those modules, with the
   Tweakpane GUI replaced by the PANELFLOW control bridge and the HUD by `usePerformanceTelemetry`.
3. **Ignore / supersede** the old `webgpu-fluid` monolith.

Priority order (guideline §4): preserve identity & interactions → premium quality → compact reusable
modules → minimal sprawl → strong naming & performance. **Fidelity rule (FR-15): port the real
source, never paraphrase.**

---

## 2. Source inventory (grounded facts)

| System | Lines / files | Import coupling | Runtime coupling | Verdict |
|---|---|---|---|---|
| `audio/` | 2639 / 13 | none | none — pure Web Audio | **Standalone module** (independent) |
| `fluid/` | 4850 / 8 | imports `particles` | owns the WebGPU pipeline + render targets | **Fluid engine core** |
| `particles/` | 272 / 1 | none | constructed *inside* `FluidSimulation`; advected by velocity field | **Engine sub-system** (not standalone) |
| `emitters/` | 1338 / 20 | none | fed to sim via `input.emitters`; writes dye/velocity | **Standalone-ish module** (injection source) |
| `presets/` | 3013 / 2 | none | `PresetManager(config, emitters)`; fluid-specific data | **Project data + reusable PresetManager util** |
| `performance/` | 164 / 1 | none | `QualityScaler({ simulation })` | **Engine util** (no standalone visual) |
| `compat/` | 15 / 1 | none | `requireWebGPU()` capability guard | **Shared util** |
| `ui/` | 4728 / 11 | — | Tweakpane GUI + PerformanceHud | **DROP** → PANELFLOW bridge + telemetry |
| `recording/` | 131 / 1 | — | video recorder | **DROP** (out of scope) |
| `input.js` | 202 | — | pointer/touch → emitter splats | **Engine input** (port into replica) |
| `config.js` | 300 | — | device defaults + param store | **Engine config** (port into replica) |
| `main.js` | 246 | — | orchestrator | **Becomes the replica composition** |
| `test-scene.js` | 25 | — | dev scaffold | **DROP** |

Orchestration (from `main.js`): `renderer → audio → emitters → presets(config,emitters) →
simulation(renderer,canvas) → qualityScaler(simulation)`; loop = `audio.update → simulation.update(input) → simulation.render`.

**Decomposition reality:** only `audio` is truly app-independent. The fluid solver, particles,
emitters, presets, and quality scaler are reusable *within the fluid domain* but share the GPU
pipeline — they don't each stand alone as a gallery visual. The plan reflects that instead of
pretending every folder is an independent component.

---

## 3. Target deliverables

### 3a. Reusable component modules (registered, gallery-worthy, each with a live preview)

| # | Module id | Category | Source system | Standalone preview | Status |
|---|---|---|---|---|---|
| 1 | `audio-reactive` | `ui` | `audio/` | spectrum + meters + beat visualizer | **Built (pending review)** |
| 2 | `fluid-emitters` | `particles` | `emitters/` + a light dye/particle field | emitters painting a field | **Built ✓** (check-registry + lint green; live, animating; 8 dye types verified distinct; force-only wind/attractor excluded) |
| 3 | `webgpu-fluid-sim` | `3d` | `fluid/` (+ `particles/` sub-system) | the fluid solver itself, pointer-interactive | **Built ✓** (check-registry + lint green; WebGPU init clean, renderer bound, loop ticking) |

> `particles/`, `performance/QualityScaler`, `compat/`, and the `PresetManager` util are **engine
> sub-systems**, shipped *inside* the fluid module's self-contained engine folder and documented in
> `agentNotes` as reusable building blocks — not separate gallery cards (they have no standalone
> visual / are pure utilities). This is the honest §6 classification, not file-per-module theater.

### 3b. Faithful replica (the full original app, rebuilt from the above)

| Module id | Category | Role |
|---|---|---|
| `fluid-studio` *(proposed)* | `3d` | Composition that wires solver + particles + emitters + audio + presets + quality + pointer input into the **complete** original experience. PANELFLOW controls replace Tweakpane; `usePerformanceTelemetry` replaces the HUD. This is the faithful replica that supersedes the old `webgpu-fluid`. |

---

## 4. ARTINOS mapping & conventions

- Folders: `STUDIO/src/modules/<id>/` (flat, auto-discovered by `import.meta.glob`). Engine self-
  contained under each module (e.g. `fluid-studio/engine/{fluid,particles,emitters,presets,performance,compat,input,config}`), ported **verbatim** from REF.
- Entry: one `<id>.module.ts` (`ArtinosModule`, `id === schema.id`); preview `<PascalId>Preview.tsx`
  reads the bridge (ADR-13, default outside selector).
- Controls: PANELFLOW `ComponentSchema` from a single shared params source (mirror `sim/params.ts`).
- Showcase: automatic. Registering publishes to gallery / graph / Agent panel / website / MCP.
- Categories from the canonical set only: `ui · 3d · shader · particles · postfx · material`.
- 3D/shader engines stay untyped JS (`allowJs`, no `@types/three`); typed `.tsx` wrapper owns canvas
  + `ResizeObserver` + `dispose()`.
- Provenance in `agentNotes`/`reuseNotes` (ported-from + dropped/changed). Heavy modules publish
  stats via `usePerformanceTelemetry`.

---

## 5. Phased build order (dependency-ordered; each phase gated before the next)

- **Phase 0 — Reuse check & scaffolds.** Confirm no existing module already covers each target
  (note: a seed `gpu-particles` exists — keep our fluid particles as an engine sub-system, not a
  competing `gpu-particles`). Scaffold module folders.
- **Phase 1 — `audio-reactive`** ✅ already built (verify it stays green; it is component #1).
- **Phase 2 — `fluid-emitters`.** Port `emitters/` verbatim into the module engine; build a light
  dye/particle field preview so emission patterns are visible standalone; schema for emitter type +
  params; presets per emitter family.
- **Phase 3 — `webgpu-fluid-sim`.** Port `fluid/` (+ `particles/` sub-system, `compat`, `QualityScaler`)
  verbatim into a self-contained engine; typed wrapper; pointer interaction; core dynamics/colour/
  render-mode schema; a handful of presets. This is the reusable fluid visual.
- **Phase 4 — `fluid-studio` replica.** Port `config.js`, `input.js`, and the `main.js` wiring into a
  composition that reproduces the **full** original: all emitters, presets (port `presets/` data +
  `PresetManager`), audio reactivity (consume the `audio-reactive` engine), quality scaling, full
  control surface via PANELFLOW, telemetry via the shared monitor. Side-by-side fidelity pass vs. the
  REF app running from `REF/`.
- **Phase 5 — Supersede old module.** Once the replica matches the old `webgpu-fluid` (and the REF
  app), remove `STUDIO/src/modules/webgpu-fluid/`; update `related`/registry; record an ADR.

**Per-phase DoD (every module):** `npm run check-registry -w STUDIO` green · `npm run lint -w STUDIO`
green · live preview renders and a control drives it with zero console errors · fidelity note vs.
source · provenance recorded. (Note: the preview tab runs hidden → rAF is paused; verify animated
output by pumping the engine/visualizer manually — see memory `preview-raf-paused-when-hidden`.)

---

## 6. Open decisions (need your call before I build)

1. **Granularity** — ship **3 component modules** (`audio-reactive`, `fluid-emitters`,
   `webgpu-fluid-sim`) **+ 1 replica** (`fluid-studio`)? Or fewer/more (e.g. fold emitters into the
   fluid engine and ship only the fluid module + replica)? Recommendation: the 3+1 split above.
2. **Replica id** — `fluid-studio`? (alt: `fluid-lab`, or reuse the slug `webgpu-fluid` after deleting
   the old one). Recommendation: new id `fluid-studio`, then delete the old `webgpu-fluid`.
3. **Old module fate** — delete `webgpu-fluid` at Phase 5 (recommended), or keep it deprecated?
4. **Keep `audio-reactive` as component #1** as-is (it already fits the decomposition)?

---

## 7. Alignment with the master guideline

- Mode B (§3): several reusable systems → several modules + a faithful composition. ✓
- §6 classification honoured: standalone modules vs. engine sub-systems vs. dropped scaffolding. ✓
- §7 fidelity: every system ported verbatim from REF, minimal integration edits, deviations reported. ✓
- §14: provenance recorded; `webgpu-fluid-sim`/`audio-reactive` are package-promotion candidates later.
- §15: this *is* the multi-system extraction worked example, bound to the real `STUDIO/src/modules/<id>/`
  structure (no `labs/` tree — each module's engine folder is its capsule).
```
