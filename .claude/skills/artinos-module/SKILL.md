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
project — and lands it as one compact, **registered + showcased** ARTINOS module that passes the
gate. Output is a module folder under `STUDIO/src/modules/<id>/`, discoverable everywhere at once.

## When to use
Adding/converting/porting anything reusable into the Studio. **Not** for one-off edits to an
existing module (edit it directly) or for whole-app features.

## Process (what to do, and why)

1. **Reuse first — don't duplicate.** Search before building: Agent panel · MCP
   `search_modules`/`get_module` (`npm run mcp -w STUDIO`) · graph spotlight (`module/<id>` nodes).
   If a module already covers it, **extend it and stop**. (ARTINOS-PRD §15; `STUDIO/AGENTS.md`.)
2. **Decompose, don't over-split** (ARTINOS-PRD §9, AGENTS.md §3). Find the reusable core(s);
   strip unrelated scaffolding. One strong file beats many weak ones. **Mode A** (the common case):
   one core → one module. **Mode B** (a full project with several reusable systems): one module per
   system + an optional composition module that rebuilds the original faithfully — no `labs/` tree
   (the module's self-contained engine *is* the capsule). See the master guideline §3/§6.
3. **Scaffold:** `npm run new-module -w STUDIO -- <id> --category <cat>`. Use a canonical category:
   `ui · 3d · shader · particles · postfx · material`. Pick `<id>` kebab-case; `id === schema.id`.
4. **Port the source DIRECTLY — preserve identity** (root `AGENTS.md` §4, FR-15). Copy the real
   visuals/behavior/physics/shaders; do **not** rewrite from memory or substitute a generic demo.
   - **UI** → self-contained `.tsx`, react-only deps where possible.
   - **3D/shader** → untyped `engine.js` (Three.js core) + thin typed `.tsx` wrapper that owns the
     canvas ref + `ResizeObserver` + `dispose()`. See `examples.md`. Never add `@types/three`.
5. **Fill the `ArtinosModule` entry** completely: `description`, `tags`, real `usage` snippet,
   `dependencies` (add `'webgpu'` for WebGPU-only so the degrade notice fires), `presets`, `related`,
   and `agentNotes` written so another agent can use it **without opening the source**. Record
   **provenance** (where it was ported from + what was dropped/changed) in `agentNotes`/`reuseNotes`
   — that is the library's lineage record (master guideline §14).
6. **Wire the preview to the bridge** (ADR-13): `useBridgeStore((s) => s.componentValues['<id>'])` —
   default *outside* the selector, never `... || {}` inside it (it loops on getSnapshot).
7. **Gate it (DoD).** `npm run check-registry -w STUDIO` green + `npm run lint -w STUDIO` + live
   preview with a control driving it, **zero console errors**. For conversions, report a side-by-side
   fidelity note vs the source, and close with the **conversion report format** (PASS / BLOCKED /
   NEEDS HUMAN DECISION — master guideline §18). "It builds" is not done.

> **Source of truth — `ARTINPRD MODULE CONVERTER.md`** (repo root): the master guideline this skill
> adopts (full model, conversion modes, provenance/promotion, report format). If anything here and the
> guideline differ, the guideline wins.
> Detailed contract, the engine.js pattern, and good/bad examples: **`examples.md`** (this folder).
> Operational procedure & deliverables map: `spec/converter-workflow.md`. ADRs: `spec/decisions.md`.

## Examples (show, don't tell)

- **Good:** ShaderToy noise field → `aurora-shader/engine.js` (TSL on `WebGPURenderer`, uniforms
  driven by the bridge) + `AuroraShaderPreview.tsx` (canvas + dispose) + entry with `dependencies:
  ['three','webgpu','react']`. check-registry green, preview renders, presets mutate it live.
- **Bad:** Pasting the demo's whole repo into one module, importing `@types/three`, leaving
  `description`/`agentNotes` as TODO stubs, or "recreating the look" instead of porting the actual code.

## Gotchas
- **Port, don't paraphrase.** The fidelity rule (FR-15) means copying the source's real shader/physics
  code. A from-memory re-creation that "looks similar" is a failure, not a conversion.
- **`category` is a free string but the set is fixed** (ui/3d/shader/particles/postfx/material). Using
  a novel category silently breaks the gallery + website filters — they expect those values.
- **Three.js has no types in this repo.** Keep Three code in an untyped `engine.js` (the repo uses
  `allowJs`, no `checkJs`) and a typed `.tsx` wrapper. Adding `@types/three` or `@ts-expect-error` on
  the engine import is wrong — the import resolves as-is.
- **Don't restate the repo's rules in the module.** DoD/naming/converter steps live in
  `STUDIO/AGENTS.md` and `spec/converter-workflow.md` — follow them, don't copy them (copies drift).
- **A module isn't done at "renders".** It's done when `check-registry` is green AND a control drives
  the live preview with zero console errors. Skipping the gate is the most common miss.
