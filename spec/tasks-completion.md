# Tasks — ARTINOS Completion (v0.3 → v1)

> Based on `spec/plan-completion.md`. Execute with `/dev-spec-build`. Tick boxes as completed.
> `[ ]` todo · `[x]` done · Size S/M/L. Paths relative to repo root `G:\CODE2026\.PROJECTS\ARTINOS`.
> Verification follows `STUDIO/AGENTS.md` DoD: `check-registry` green + build/preview/console proof.
> "Self-contained" rule (global): each task names files, interface, pattern-to-mirror, out-of-scope, acceptance.

**Wave order:**
P0: C-1 → C-2 → C-3
P1: C-4 → C-5 ∥ C-6  (parallel-safe with all of P2)
P2: C-7 → C-8 ∥ C-9 ∥ C-10 ∥ C-11 ∥ C-12 → C-13
P3: C-14 → C-15 ∥ C-16 → C-17
P4: C-18 → C-19

---

## Phase 0 — Stabilize (commit + re-sync truth)

#### [ ] C-1 (S): Commit the v0.3 working tree on branch `v0.3`
- **Closes:** G-1
- **Files:** none authored — `git add -A` the existing tree (new `STUDIO/.../sim/{audio,emitters,presets,performance}`, `params.ts`, `PANELFLOW/src/{controls,components/ui}`, `performance-telemetry.ts`, modified panels/configs).
- **Interface:** one commit on `v0.3`, message summarizing the v0.3 panel pivot + fluid full-fidelity re-expansion; end with the `Co-Authored-By` trailer.
- **Pattern:** repo commit conventions; do NOT push (push needs user authorization — ask first).
- **Out of scope:** any code edits, any `main` changes, merging.
- **Acceptance:** `git status` clean afterward; `git log -1` shows the commit; `npm run check-registry -w STUDIO` still 4/4; `npm run build -w STUDIO` still green.
- **Depends on:** none

#### [ ] C-2 (M): Re-sync `spec/tasks.md` + `spec/plan.md` to the v0.3 panel architecture
- **Closes:** G-2
- **Files:** `spec/tasks.md` (annotate), `spec/plan.md` (annotate)
- **Interface:** add a dated "v0.3 reconciliation" note at the top of each: the MVP Gallery/Showcase pages were superseded by the live-viewport + dock-panel model (ADR-14→17); `Gallery.tsx`/`Showcase.tsx` no longer exist (now `StudioViewport.tsx`+`PreviewStage.tsx`+`panels/{library,inspector}.panel.tsx`); T-14's fluid was re-expanded to full fidelity. Keep the original MVP text as historical record — annotate, don't delete.
- **Pattern:** mirror the ADR tone in `spec/decisions.md`; factual, append-style.
- **Out of scope:** rewriting MVP history; new tasks (they live in this file).
- **Acceptance:** a reader comparing `spec/tasks.md` to `STUDIO/src` finds no contradiction about which files exist; the fluid-stripped claim is corrected.
- **Depends on:** C-1

#### [ ] C-3 (S): Append ADRs for the fluid re-expansion + this completion plan
- **Closes:** G-3
- **Files:** `spec/decisions.md` (append ADR-18, ADR-19)
- **Interface:** ADR-18 — "Fluid module re-expanded to full source fidelity" (context: T-14 stripped audio/emitters/presets; decision: restore them since fidelity > minimalism for the flagship conversion per FR-15/§17; consequences: heavier bundle, lazy-chunked). ADR-19 — "Completion plan adopts D-A…D-F" (reference `spec/plan-completion.md`).
- **Pattern:** existing ADR format (context → decision → consequences).
- **Out of scope:** code.
- **Acceptance:** both ADRs present, append-only (no rewrite of ADR-1…17).
- **Depends on:** C-1

---

## Phase 1 — Studio completeness (§6.1 + FR-12/13/18 in the panel model)

#### [ ] C-4 (M): Console / diagnostics dock panel
- **Closes:** G-4 (D-D)
- **Files (create):** `STUDIO/src/panels/console.panel.tsx`; register it (mirror how `library.panel.tsx`/`inspector.panel.tsx` are registered — find the `definePanel`/`registerPanel`/icon-rail wiring used for those and add this panel the same way).
- **Interface:** a panel that (a) subscribes to a console/error ring buffer (wrap `console.log/info/warn/error` + `window.addEventListener('error'|'unhandledrejection')` once at studio mount; restore originals on unmount), (b) shows WebGPU availability via PANELFLOW's `WebGPUCapabilities`/`WebGPUCapabilities.ts`, (c) shows the active module's `validation` status from `useStudioStore`+`getModule`. Filter chips: all/warn/error.
- **Pattern:** `STUDIO/src/panels/inspector.panel.tsx` for panel structure + store reads; `PANELFLOW/src/WebGPUCapabilities.ts` for capability detection; glass tokens.
- **Out of scope:** persisting logs to disk; a logging framework (D-D).
- **Acceptance:** opening the panel shows live console output (trigger a `console.warn` and see it); WebGPU status reflects the machine; the fluid module's validation badge renders; toggling it open/closed leaves console clean. Screenshot + console proof.
- **Depends on:** C-1

#### [ ] C-5 (S): Surface validation status + FR-13 degrade notice in the inspector
- **Closes:** G-5 (FR-13, FR-18 partial)
- **Files:** `STUDIO/src/panels/inspector.panel.tsx` (modify), `STUDIO/src/shell/PreviewStage.tsx` (modify)
- **Interface:** inspector renders a `validation` badge (pass/unknown) for the active module. `PreviewStage` wraps the live `module.preview` in a React error boundary that shows an in-panel error notice instead of crashing, and a capability notice when `module.dependencies` includes `'webgpu'` and WebGPU is unavailable.
- **Pattern:** the MVP T-9 error-boundary/degrade pattern (was in the deleted `Showcase.tsx` — re-implement here); `WebGPUCapabilities.ts`.
- **Out of scope:** responsive work (C-6).
- **Acceptance:** throwing inside a preview shows the notice (no blank screen/crash); on a WebGPU-less context the fluid shows the capability notice; console clean. Proof via a temporary throw + screenshot, reverted after.
- **Depends on:** C-4

#### [ ] C-6 (S): Responsive QA pass of the dock + viewport (FR-12)  *(parallel-safe with C-5)*
- **Closes:** G-5 (FR-12)
- **Files:** `STUDIO/src/panels/library.panel.tsx` (modify if needed), `STUDIO/src/studio.css` (modify if needed)
- **Interface:** verify and fix the studio at 375 / 768 / 1440 widths — library grid reflows, dock panels usable, viewport not clipped. Only change what's broken.
- **Pattern:** breakpoints per `DESIGN_PROCESS.md`; existing token spacing.
- **Out of scope:** new features; mobile-specific redesign.
- **Acceptance:** resize screenshots at 375/768/1440 show no overflow/clipping; console clean. If nothing needed fixing, note that with the three screenshots as evidence.
- **Depends on:** C-4

---

## Phase 2 — Library breadth (4 → 12+, M-6, D-F)

> Each module follows `spec/converter-workflow.md` + the module-folder contract
> (`<id>/<id>.module.{ts,tsx}` + `<PascalId>Preview.tsx`). Scaffold with `npm run new-module -w STUDIO -- <id>`.
> DoD per module: `check-registry` green + build + live-preview-with-controls + zero console errors.

#### [ ] C-7 (S): Category taxonomy + scaffold check before content
- **Closes:** G-6 (prep)
- **Files:** `STUDIO/src/registry/types.ts` (modify only if `category` is a closed union that lacks needed values), `spec/converter-workflow.md` (modify — add the target category list)
- **Interface:** ensure `category` supports at least: `ui`, `3d`, `shader`, `particles`, `postfx`, `material`. If `category` is a free string, no type change — just document the canonical set. Confirm `new-module` accepts `--category`.
- **Pattern:** `STUDIO/src/registry/types.ts`; `check-registry.ts`.
- **Out of scope:** building modules (C-8…C-12).
- **Acceptance:** `npm run new-module -w STUDIO -- tmp-cat --category 3d` creates a discoverable folder that `check-registry` accepts; delete it after; `tsc` clean.
- **Depends on:** C-1

#### [ ] C-8 (M): 3D scene module — convert one Three.js/R3F scene  *(parallel-safe with C-9..C-12)*
- **Closes:** G-6
- **Files (create):** `STUDIO/src/modules/<id>/<id>.module.ts`, `STUDIO/src/modules/<id>/<PascalId>Preview.tsx` (+ a compact `sim/` or scene file if ported)
- **Interface:** pick a source under `REF/` if present, else a small self-contained Three.js scene; `category: '3d'`; ≥3 bridge-driven controls; `agentNotes`, `usage`, `dependencies`, `version`, `updatedAt` per the contract. Preserve original visuals/behavior per AGENTS.md §4.
- **Pattern:** `STUDIO/src/modules/webgpu-fluid/*` (thin wrapper + ported core); `spec/converter-workflow.md`.
- **Out of scope:** other categories.
- **Acceptance:** appears in the library, showcase opens with a live scene whose controls drive it, `check-registry` green, console clean. Screenshot + fidelity note.
- **Depends on:** C-7

#### [ ] C-9 (M): TSL shader module  *(parallel-safe)*
- **Closes:** G-6
- **Files (create):** `STUDIO/src/modules/<id>/{<id>.module.ts, <PascalId>Preview.tsx}`
- **Interface:** a TSL/WebGPU shader effect (e.g. a gradient/noise/raymarch card), `category: 'shader'`; `dependencies` includes `'webgpu'` so C-5's degrade path applies; ≥3 controls; full contract fields.
- **Pattern:** fluid module's TSL usage; `WebGPUCapabilities.ts` for the fallback notice.
- **Out of scope:** other categories.
- **Acceptance:** library + live showcase + controls drive it; on WebGPU-less context shows the capability notice (not a crash); `check-registry` green; console clean.
- **Depends on:** C-7, C-5

#### [ ] C-10 (S): Particle-field module  *(parallel-safe)*
- **Closes:** G-6
- **Files (create):** `STUDIO/src/modules/<id>/{<id>.module.ts, <PascalId>Preview.tsx}`
- **Interface:** a reusable particle field, `category: 'particles'`; ≥3 controls (count, speed, color); full contract.
- **Pattern:** the fluid module's `sim/particles/ParticleSystem.js` if a thin reuse fits, else a compact standalone; module-folder contract.
- **Out of scope:** other categories.
- **Acceptance:** library + live showcase + controls; `check-registry` green; console clean; meets NFR-1 (stays interactive).
- **Depends on:** C-7

#### [ ] C-11 (S): Post-processing effect module  *(parallel-safe)*
- **Closes:** G-6
- **Files (create):** `STUDIO/src/modules/<id>/{<id>.module.ts, <PascalId>Preview.tsx}`
- **Interface:** a post-fx (bloom/chromatic/grain) over a simple stage, `category: 'postfx'`; ≥3 controls; full contract.
- **Pattern:** fluid `sim/fluid/postfx.js` for reference; module-folder contract.
- **Out of scope:** other categories.
- **Acceptance:** library + live showcase + controls; `check-registry` green; console clean.
- **Depends on:** C-7

#### [ ] C-12 (S): Two premium UI block modules  *(parallel-safe)*
- **Closes:** G-6
- **Files (create):** `STUDIO/src/modules/<id-a>/{...}`, `STUDIO/src/modules/<id-b>/{...}`
- **Interface:** two new premium UI blocks (e.g. magnetic dock, animated card, marquee) — port from a real source or build to the ReactBits/21st quality bar; `category: 'ui'`; full contract each.
- **Pattern:** `STUDIO/src/modules/gooey-slider/*` exactly.
- **Out of scope:** 3D/shader.
- **Acceptance:** both in library with live showcases + controls; `check-registry` green; console clean.
- **Depends on:** C-7

#### [ ] C-13 (S): Library-breadth gate — ≥12 modules, ≥4 categories
- **Closes:** G-6 (verify)
- **Files:** `STUDIO/scripts/check-registry.ts` (modify — add a summary line: total modules + distinct categories; optional `--min` flags)
- **Interface:** `check-registry` prints `N modules across M categories`; add (non-fatal unless `--min` passed) a check that N ≥ 12 and M ≥ 4.
- **Pattern:** existing `check-registry.ts` table/summary.
- **Out of scope:** changing module files.
- **Acceptance:** `npm run check-registry -w STUDIO` reports ≥12 modules, ≥4 categories, all green; `npm run build -w STUDIO` green.
- **Depends on:** C-8, C-9, C-10, C-11, C-12

---

## Phase 3 — Agent operability (FR-9, FR-18/19, FR-21)

#### [ ] C-14 (M): Expose registry modules as graph nodes (FR-9, D-A)
- **Closes:** G-7
- **Files (create):** `STUDIO/src/registry/module-to-node.ts`; (modify) `STUDIO/src/registry/registry.ts` to `registerNode` each module's generated node at index build.
- **Interface:** `moduleToNode(m: ArtinosModule): NodeDefinition` mapping `schema.parameters` → node `Param[]`, a single output port (preview), `domain` from `category`. On `REGISTRY` build, call PANELFLOW `registerNode(moduleToNode(m))` for each.
- **Pattern:** `PANELFLOW/src/graph/NodeDefinitions.ts` (`defineNode`/`registerNode`/`NodeDefinition`/`Param`/`Port`); registry glob in `registry.ts`.
- **Out of scope:** drag-from-library-onto-canvas UX (note as follow-up); executing node graphs.
- **Acceptance:** opening the graph panel shows the modules available as nodes (e.g. via spotlight search/`allNodes()`); adding one places a node with its params; `tsc` clean; console clean. Screenshot.
- **Depends on:** C-13

#### [ ] C-15 (M): Agent panel — registry-as-agent-surface (D-B, FR-18/19)  *(parallel-safe with C-16)*
- **Closes:** G-8
- **Files (create):** `STUDIO/src/panels/agent.panel.tsx`; register it like the other STUDIO panels.
- **Interface:** renders, per module, the agent-facing record (id, category, tags, `agentNotes`, `usage`, `dependencies`, `validation`) with a copy-JSON action; plus a static reuse-first checklist (ARTINOS-PRD §15). Reads `REGISTRY`/`searchModules`.
- **Pattern:** `STUDIO/src/panels/library.panel.tsx` (registry reads + search) + `inspector.panel.tsx` (copy actions).
- **Out of scope:** running an LLM (D-B); editing entries.
- **Acceptance:** panel lists all modules; copy-JSON yields a valid record an agent could act on; search filters; console clean. Screenshot.
- **Depends on:** C-13

#### [ ] C-16 (M): MCP tool server over the registry (FR-21, D-C)  *(parallel-safe with C-15)*
- **Closes:** G-9
- **Files (create):** `STUDIO/scripts/mcp-server.ts`; (modify) `STUDIO/package.json` add `"mcp": "tsx scripts/mcp-server.ts"`; (create) `STUDIO/MCP.md` usage doc.
- **Interface:** a stdio MCP server exposing `list_modules`, `search_modules({query,category,tag})`, `get_module({id})`, `scaffold_module({id,category})` (shell out to/reuse `new-module.ts`), `check_registry` (reuse `check-registry.ts`). Read modules via the same fs-scan `check-registry.ts` uses (avoid importing TSX previews in Node).
- **Pattern:** `@modelcontextprotocol/sdk` stdio server; reuse the fs-scan in `check-registry.ts`; no new persistence (D-C).
- **Out of scope:** convert/build actions that run the browser; auth.
- **Acceptance:** starting the server and calling `list_modules`/`search_modules`/`get_module` returns the ≥12 modules (verify with a one-off MCP client snippet or the inspector); `scaffold_module` creates a discoverable folder (delete after); `check_registry` returns the pass table.
- **Depends on:** C-13

#### [ ] C-17 (S): Wire agent operability into AGENTS docs + DoD
- **Closes:** G-8/G-9 (docs)
- **Files:** `STUDIO/AGENTS.md` (modify), `spec/converter-workflow.md` (modify)
- **Interface:** document the Agent panel, the graph-node exposure, and the MCP tools (commands + when to use); add "modules are discoverable as nodes + via MCP" to the reuse-first step.
- **Pattern:** existing `STUDIO/AGENTS.md` checklists.
- **Out of scope:** code.
- **Acceptance:** an agent reading the docs can discover/search/scaffold a module via MCP and find it as a node without this conversation.
- **Depends on:** C-14, C-15, C-16

---

## Phase 4 — Reach (FR-22, FR-23)

#### [ ] C-18 (M): Public website gallery reading the registry (FR-22, D-E)
- **Closes:** G-10
- **Files (create):** `Website/` minimal Vite+React app (`package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/Gallery.tsx`, `src/site.css`); (modify) root `package.json` workspaces to add `"Website"`.
- **Interface:** a read-only public gallery: import the registry metadata (share `ArtinosModule` type via the `@artinos/panelflow`-style alias to `STUDIO/src/registry`, or a generated JSON index), render cards (name, category, description, tags, deps, usage snippet with copy). No live previews in v1 (D-E). Glass identity via PANELFLOW tokens.
- **Pattern:** `STUDIO` scaffolding (vite.config alias, tokens import) as the template; `library.panel.tsx` card layout.
- **Out of scope:** live module execution; deploy/hosting; auth.
- **Acceptance:** `npm run dev -w Website` serves a gallery listing all ≥12 modules with working copy-usage; `npm run build -w Website` green; console clean. Screenshot.
- **Depends on:** C-13

#### [ ] C-19 (S): Package-promotion criteria + workflow doc (FR-23)
- **Closes:** G-11
- **Files (create):** `spec/promotion-workflow.md`; (modify) `spec/decisions.md` append ADR-20.
- **Interface:** concrete trigger criteria (e.g. reused in ≥N projects, stable API for ≥M weeks, has tests, no PANELFLOW hard-lock in its core) and the step-by-step to extract a module into a standalone package (where it lives, how the registry entry/showcase follow it, version policy). Answers ARTINOS-PRD §21 Q on promotion.
- **Pattern:** `spec/converter-workflow.md` structure; PRD §7 "Studio first, packages later".
- **Out of scope:** actually promoting a module.
- **Acceptance:** a reader with only the repo + this doc could promote a module deterministically; ADR-20 records the criteria.
- **Depends on:** C-13

---

<!--
Gap coverage: G-1 C-1 · G-2 C-2 · G-3 C-3 · G-4 C-4 · G-5 C-5,C-6 · G-6 C-7..C-13 ·
G-7 C-14 · G-8 C-15,C-17 · G-9 C-16,C-17 · G-10 C-18 · G-11 C-19.
FR coverage closed: FR-9 C-14 · FR-21 C-16 · FR-22 C-18 · FR-23 C-19 · (FR-12/13/18 reinforced C-5,C-6,C-15).
Every task names files/interface/pattern/out-of-scope/acceptance and is doable with only this repo + its entry.
-->
