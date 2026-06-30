---
name: artinos-module
description: "Convert any input into a registered, showcased ARTINOS module. Use when the user wants to add, convert, port, or wrap a module, 3D scene, shader, particle/postfx effect, or UI block into STUDIO — e.g. 'turn this repo/demo into a module', 'add a module for X', 'port this Three.js example', 'make this reusable'."
allowed_tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# ARTINOS Module Converter

Takes an input — an idea, a React component, a Three.js/R3F/ShaderToy demo, a repo, or a local
project — and lands it as self-contained ARTINOS library modules and, for full projects, a faithful
Lab replica. Outputs: canonical modules under `STUDIO/src/modules/<category>/` plus, for Mode B, a Lab
capsule under `STUDIO/src/labs/<id>/` with `modules/` snapshots and grouped `local/` files.

**Mode A** = one reusable core → one canonical module (no Lab). **Mode B** = a full project / several
systems → canonical modules **plus** a faithful Lab replica.

## The 11-step pipeline (run it in order)

Steps 1–7 are planning (think hard, strongest model). **Step 7 emits a committed blueprint.** Steps
8–11 are execution. Reuse-first gates everything (step 5) — if a module already covers it, extend & stop.

1. **Deep Input Analysis.** Locate and *read the real source files* — structure, deps, runtime, shaders,
   interactions, presets, lifecycle. Source missing → **report BLOCKED** with the path; never invent.
2. **System Triage & Pipeline Conversion.** List **all** major systems. **TSL triage:** if the source is
   raw WebGL/WebGL2/WebGPU (or another pipeline), *evaluate rebuilding it on the Three.js TSL pipeline*
   (`three/webgpu` + `three/tsl`) — preferred, but optional if the math migration is prohibitively
   complex; record the deferral reason. STUDIO has **no TSL operator plugin** → rewrite `a + b*c` as
   `a.add(b.mul(c))`.
3. **Module Decomposition — aggressively.** Look *under the domain* for the universal primitives (GPGPU
   substrates, grid/sampling math, field display, input/splat, postfx) and lift each out as its own core.
   For each system ask *"what is its generalized form, and what else could it build?"* A domain demo
   usually yields several universal cores **plus** one domain module (e.g. a TSL fluid → `webgpu`
   compute-field + `math` grid-sampling + `rendering/screenspace` field-display + `input` splat + the
   Navier–Stokes solver = five modules, not one). Name by capability, not the demo.
4. **Scope Partitioning.** Decide per system: global library module (`modules/`) vs Lab-local
   (`labs/<id>/local/`) vs the showcase views (the Lab replica).
5. **Library Cross-Checking (reuse-first).** Search before building: Agent panel · MCP
   `search_modules`/`get_module` (`npm run mcp -w STUDIO`) · graph spotlight (`module/<id>` nodes). Cover
   exists → extend & stop.
6. **Direct Asset Harvesting.** If the source already has reusable modules/utility files, harvest them by
   *direct copy* (cheapest, highest-fidelity win) and register like any module.
7. **High-Effort Blueprinting — MANDATORY, before any code.** Write `docs/conversions/<id>-conversion-plan.md`
   for **every** conversion, **Overview section first** (a clean at-a-glance list: decomposed modules /
   reuse / direct-copy). It must be so granular a *blind downstream agent* can build it with no other
   context: exact file plan (clean filenames, no `.module` infix, + per-file contents), function signatures (params + return
   values), render/hardware details, the TSL-triage decision, the full `ArtinosModule` entry plan, the
   Mode B Lab/capsule plan, fidelity/provenance, and a dependency-ordered task checklist with acceptance
   checks. Use `docs/templates/blueprint.template.md`; spec: `docs/blueprinting.md`.
8. **Strict Splitting Guardrails.** Split only when readability/reuse/independent-testability heavily
   outweighs the overhead **and** the part stands alone. Prefer one strong compact file; no reflexive
   `index/types/utils/helpers/constants/hooks/adapters` sprawl.
9. **Fidelity Preservation.** Port the source DIRECTLY — copy the real shader/physics/interaction code,
   preserve exact naming. Adapt only imports/paths/types/styling-hooks/pipeline. A from-memory
   "looks-similar" rebuild is a failure, not a conversion. Scaffold first:
   `npm run new-module -w STUDIO -- <id> --category <category/path>`.
   - **UI** → self-contained `.tsx`, react-only deps.
   - **3D/shader** → untyped `<Feature>.js` (Three.js core; never add `@types/three`; clean name, no
     `.module` infix) + a thin typed `<Feature>.showcase.tsx` wrapper owning canvas ref + `ResizeObserver` + `dispose()`.
10. **Lab Capsule Rebuild (Mode B).** Rebuild the original as `STUDIO/src/labs/<id>/`, composing the
    canonical modules exactly as the source wired them — full capabilities, not a simplified demo.
11. **Capsule Isolation Integration (Mode B).** Copy required modules into `labs/<id>/modules/<category>/`
    + grouped `local/` files so the Lab runs standalone; record provenance per snapshot.

Then: fill the `ArtinosModule` entry completely (incl. `agentNotes` + provenance), wire the preview to
the bridge (ADR-13: default *outside* the selector), register, **gate (DoD)**, and report (§report).

## Entry + DoD (don't skip)

- Fill every `ArtinosModule` field; `id === schema.id`; add `'webgpu'` to `dependencies` for WebGPU-only.
- `agentNotes` must let another agent use it **without opening source**; record provenance.
- **DoD:** the blueprint exists + matches the build · `npm run check-registry -w STUDIO` green ·
  `npm run lint -w STUDIO` · live preview with a control driving it, **zero console errors** ·
  side-by-side fidelity note. Close with the conversion report (PASS / BLOCKED / NEEDS HUMAN DECISION).
  "It builds" is not done.

> **Source of truth:** `docs/converter-pipeline.md` (the 11-step pipeline, modes, report format) —
> if anything here differs, the doc wins. Contract: `docs/module-and-lab-standards.md`. Blueprint:
> `docs/blueprinting.md`. Code shapes / good-bad: `patterns.md` (this folder). **Worked-example
> conversion plans (full Mode B): the `examples/` folder — `aurora-conversion-plan.md` and
> `false-earth-conversion-plan.md`.**

## Gotchas
- **Write the blueprint first.** Step 7 (`docs/conversions/<id>-conversion-plan.md`, Overview section
  first) is mandatory for **every** conversion, before any code. Jumping straight to building is the new
  most-common miss. Runtime files use clean names (`<Feature>.ts/.js`) — no `.module` infix.
- **Decompose aggressively — the universal primitives are the real win.** The biggest library wins are
  the *non-domain* systems hiding under the headline effect. Each core's showcase must run it **outside**
  the source's domain, or it isn't a real core. A "solver + input" split of a rich source under-decomposes.
- **Run the TSL triage.** Raw WebGL/WebGPU sources should usually be rebuilt on `three/webgpu`+`three/tsl`
  (preferred); defer only for prohibitive complexity and record why. Rewrite operator-overloaded TSL.
- **Port, don't paraphrase.** Copy the source's real shader/physics code (FR-15). Substituting a generic
  equivalent is a failure.
- **Three.js has no types here.** Keep Three code untyped (`allowJs`, no `checkJs`); never add
  `@types/three` or `@ts-expect-error` on the engine import.
- **A module isn't done at "renders".** Done = blueprint matched + `check-registry` green + a control
  drives the live preview with zero console errors.
