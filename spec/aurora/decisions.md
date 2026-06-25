# AURORA conversion — decisions (ADR-lite)

## ADR-A1 — Mode B (cores + Lab), not a single module
AURORA is a full project (~13.5K engine lines, many independent systems). Per converter-workflow §4 it
is Mode B: extract the maximum set of canonical reusable modules **and** rebuild a faithful Lab
(`labs/aurora/`) that composes them. Mirrors the `fluid-sim` precedent.

## ADR-A2 — Decompose to ~19 canonical modules across `webgpu/math/core/performance/input/physics/rendering/audio-reactive`
The universal primitives under the demo (GPGPU structured array, TSL noise/hsv/colormap, init
pipeline, adaptive-performance, pointer-force, multi-mode renderer, HDR stage, postFX, glass overlay,
audio analysis) are the bigger library win and are extracted as their own cores. The MLS-MPM solver,
boundaries, force fields, emitters, materials, and the 21-mode sequencer are the domain/AURORA layers.
Each core must prove reuse via a non-AURORA showcase or be folded back in (no fake utils modules).

## ADR-A3 — Port physics/shaders verbatim, BUT rewrite TSL operators to method calls (confirmed)
**Confirmed:** `ref/AURORA` builds with `vite-plugin-tsl-operator` (operator overloading like
`a + b`, `a * b` on TSL nodes). STUDIO's `vite.config` runs only `react` + `tailwind` — **no
tsl-operator plugin** — and its existing TSL modules (e.g. `physics/fluid/TslStableFluids2D.module.js`)
use explicit method chaining (`.add()/.mul()/.sub()/.div()`). Therefore every ported TSL file from
AURORA (`mls-mpm.ts`, `boundaries.ts`, `noise.ts`, `hsv.ts`, `colorpalette.ts`, `postfx.ts`,
`glass-lens-panel.ts`, renderers) **must rewrite `+ - * /` on TSL nodes to `.add()/.sub()/.mul()/.div()`**
— a mechanical, behavior-preserving translation. This is the single largest porting cost and a recorded
deviation in every affected module's provenance. Do not otherwise refactor the kernels; preserve exact
kernel order and math (FR-15). Also note **three `0.184` (STUDIO) vs `0.176` (AURORA)** — watch for TSL
API renames (e.g. node imports) during the port; record any required adjustments as deviations.

> Option (do not adopt without user sign-off): adding `vite-plugin-tsl-operator` to STUDIO would let
> the TSL port stay verbatim, but it changes the shared build for all modules — out of scope, flagged.

## ADR-A4 — AURORA audio ported as distinct ids, not merged into existing `audio-reactive`
A reuse-first check (research.md) shows the existing `audio-reactive` module + `fluid-sim` audio are a
different (worklet-based) implementation; AURORA's stack is a richer superset (AI genre/mood
classification, beat/tempo, 21 visualization modes). Porting verbatim preserves identity. Re-confirm at
T5.0; fold/dedupe only if T5.0 proves true overlap.

## ADR-A5 — Drop the glassmorphic Tweakpane UI; controls become a PANELFLOW schema
`PANEL/**` (the entire glassmorphic Tweakpane framework + all panel tabs + CSS) and every `PANEL*.ts`
are dropped, exactly as `fluid-sim` dropped its Tweakpane GUI. Controls are re-expressed as the Lab's
`AURORA_PARAMS` PANELFLOW schema + `PARAM_TO_CONFIG`. The glass *aesthetic* could be a future
standalone `ui/` conversion — out of scope here (it is Tweakpane/DOM, not React/PANELFLOW).

## ADR-A6 — MLS-MPM solver categorized `physics/fluid`; boundaries/fields/emitters `physics/particles`
MLS-MPM is a grid+particle hybrid producing fluid-like motion; its headline use here is the
Anadol-style fluid, so the solver and material manager sit under `physics/fluid`. The
boundary/force-field/emitter systems are generic to any particle sim → `physics/particles`. The
multi-mode renderer gets a new explicit category `rendering/particles` (world-space instanced
renderers, distinct from `rendering/screenspace`).

## ADR-A7 — Lab carries self-contained `modules/` snapshots (Lab Capsule Standard)
`labs/aurora/modules/` holds copied snapshots of every canonical module the Lab uses so the Lab stays
portable/copy-pasteable, with provenance back to `src/modules/...`. Project-only code (composition,
21 modes, presets, tuning, interaction) lives under `local/`. Same standard as `fluid-sim`.

## ADR-A8 — Phased, gated build
Build in 6 phases (universal cores → solver+render → physics dressing → look → audio → Lab). Each
phase ends green on check-registry + lint + a live control-driven preview before the next starts. This
keeps the registry valid throughout and lets a cheaper model execute self-contained tasks.

## ADR-A9 — Ship only referenced assets
`src/assets/` has many alternate HDR/EXR/texture files. Only those referenced by `Scenery` defaults
ship in `labs/aurora/modules/assets/`; the rest are dropped and recorded in provenance.
