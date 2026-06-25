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
Lab replica. Outputs are canonical modules under `STUDIO/src/modules/<category>/` plus, for Mode B,
a Lab capsule under `STUDIO/src/labs/<id>/` with `modules/` snapshots and grouped `local/` files.

## When to use
Adding/converting/porting anything reusable into the Studio. Use Mode A for a single reusable core;
use Mode B for a full project that must be rebuilt faithfully as a Lab.

## Process (what to do, and why)

1. **Reuse first — don't duplicate.** Search before building: Agent panel · MCP
   `search_modules`/`get_module` (`npm run mcp -w STUDIO`) · graph spotlight (`module/<id>` nodes).
   If a module already covers it, **extend it and stop**. (ARTINOS-PRD §15; `STUDIO/AGENTS.md`.)
2. **Decompose aggressively — extract the maximum set of universal cores** (master guideline §5,
   ARTINOS-PRD §9, AGENTS.md §3). Inspect the full source, list all systems, then **look under the
   domain for the universal primitives** and lift them out as their own cores: GPGPU/WebGPU substrates,
   grid/index/sampling math, field/data display, rendering & postfx, physics/particle systems,
   input/pointer/splat models, environment builders, performance utilities. For each system ask *"what
   is its generalized form, and what else could it build?"* A domain demo usually yields several
   universal cores **plus** one domain-specific module (e.g. a TSL fluid → `webgpu` compute-field +
   `math` grid-sampling + `rendering/screenspace` field-display + `input` splat, plus the
   Navier–Stokes solver — five modules, not one). Every core must **prove reuse outside the source**
   (its showcase runs it standalone) or be folded back in — no fake `utils/index/types` files.
   **Mode A:** one reusable core → one canonical module. **Mode B:** several systems / full project →
   the canonical reusable modules **plus** a faithful Lab replica under `STUDIO/src/labs/<id>/`.
   Preserve source fidelity in the Lab; name/categorize reusable modules by capability, not the demo.
3. **Scaffold canonical modules:** `npm run new-module -w STUDIO -- <id> --category <category/path>`.
   Use explicit category paths such as `core`, `webgpu`, `input`, `performance`, `math`,
   `physics/fluid`, `physics/particles`, `physics/metaballs`, `rendering/screenspace`,
   `rendering/postfx`, `shaders`, or `painting`. Pick `<id>` kebab-case; `id === schema.id`.
4. **Port the source DIRECTLY — preserve identity** (root `AGENTS.md` §4, FR-15). Copy the real
   visuals/behavior/physics/shaders; do **not** rewrite from memory or substitute a generic demo.
   - **UI** → self-contained `.tsx`, react-only deps where possible.
   - **3D/shader** → untyped `engine.js` (Three.js core) + thin typed `.tsx` wrapper that owns the
     canvas ref + `ResizeObserver` + `dispose()`. See `examples.md`. Never add `@types/three`.
5. **For Mode B, build the Lab capsule.** Rebuild the original project as `STUDIO/src/labs/<id>/`
   using the canonical modules. Copy required modules into `labs/<id>/modules/<category>/` so the Lab
   runs independently. Put project-specific presets/composition/tuning/interaction in grouped
   `local/` subfolders. Never leave the result as a one-off demo.
6. **Fill the `ArtinosModule` entry** completely: `description`, `tags`, real `usage` snippet,
   `dependencies` (add `'webgpu'` for WebGPU-only so the degrade notice fires), `presets`, `related`,
   and `agentNotes` written so another agent can use it **without opening the source**. Record
   **provenance** (where it was ported from + what was dropped/changed) in `agentNotes`/`reuseNotes`
   — that is the library's lineage record (master guideline §14).
7. **Wire the preview/Lab to the bridge** (ADR-13): `useBridgeStore((s) => s.componentValues['<id>'])` —
   default *outside* the selector, never `... || {}` inside it (it loops on getSnapshot).
8. **Gate it (DoD).** `npm run check-registry -w STUDIO` green + `npm run lint -w STUDIO` + live
   preview with a control driving it, **zero console errors**. For conversions, report a side-by-side
   fidelity note vs the source, and close with the **conversion report format** (PASS / BLOCKED /
   NEEDS HUMAN DECISION — master guideline §18). "It builds" is not done.

> **Source of truth — `ARTINPRD MODULE CONVERTER.md`** (repo root): the master guideline this skill
> adopts (full model, conversion modes, provenance/promotion, report format). If anything here and the
> guideline differ, the guideline wins.
> Detailed contract, the engine.js pattern, and good/bad examples: **`examples.md`** (this folder).
> Operational procedure & deliverables map: `spec/converter-workflow.md`. ADRs: `spec/decisions.md`.

## Examples (show, don't tell)

- **Good:** ShaderToy noise field → `STUDIO/src/modules/shaders/AuroraShader.module.tsx` (TSL on
  `WebGPURenderer`, uniforms driven by the bridge) + `AuroraShader.showcase.tsx` (canvas + dispose)
  + `AuroraShader.meta.ts` with `dependencies: ['three','webgpu','react']`. check-registry green,
  preview renders, presets mutate it live.
- **Good Mode B:** fluid repo → `webgpu/*`, `physics/fluid/*`, `input/*`, and `audio-reactive`
  canonical modules + `STUDIO/src/labs/fluid-sim/` Lab with `modules/` snapshots, grouped `local/`
  presets/tuning, provenance, and side-by-side fidelity notes.
- **Good smart decomposition:** physics CodePen → reusable `rendering/postfx/*`,
  `rendering/environments/*`, `physics/particles/*`, and `input/*` modules, plus a faithful Lab that
  composes them with any source-specific adapter.
- **Bad:** Pasting the demo's whole repo into one module, importing `@types/three`, leaving
  `description`/`agentNotes` as TODO stubs, or "recreating the look" instead of porting the actual code.

## Gotchas
- **Decompose aggressively — the universal primitives are the real win.** A full demo is rarely one
  module, and the biggest library wins are the *non-domain* systems hiding under it (GPGPU substrate,
  grid/sampling math, field display, input/splat) — not the headline effect. Extract the maximum set
  of genuinely reusable cores, named by capability; keep source-specific glue/adapters separate. Test
  each: its showcase must run it **outside** the source's domain, or it isn't a real core. A "solver +
  input" split of a rich source is an under-decomposition failure.
- **Port, don't paraphrase.** The fidelity rule (FR-15) means copying the source's real shader/physics
  code. A from-memory re-creation that "looks similar" is a failure, not a conversion.
- **Use explicit category paths.** Prefer `core`, `webgpu`, `input`, `performance`, `math`,
  `physics/fluid`, `physics/particles`, `physics/metaballs`, `rendering/screenspace`,
  `rendering/postfx`, `shaders`, `painting`, or `lab`. Add a category only when it is clearly named.
- **Three.js has no types in this repo.** Keep Three code in an untyped `engine.js` (the repo uses
  `allowJs`, no `checkJs`) and a typed `.tsx` wrapper. Adding `@types/three` or `@ts-expect-error` on
  the engine import is wrong — the import resolves as-is.
- **Don't restate the repo's rules in the module.** DoD/naming/converter steps live in
  `STUDIO/AGENTS.md` and `spec/converter-workflow.md` — follow them, don't copy them (copies drift).
- **A module isn't done at "renders".** It's done when `check-registry` is green AND a control drives
  the live preview with zero console errors. Skipping the gate is the most common miss.
