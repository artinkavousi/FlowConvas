# Tasks — ARTINOS (Studio MVP)

> **⚠ v0.3 reconciliation (2026-06-23) — historical record.** All 16 MVP tasks below were completed,
> but the architecture has since moved on; this list no longer mirrors the code 1:1:
> - **T-7/T-8/T-9** built `STUDIO/src/shell/Gallery.tsx` + `Showcase.tsx`. Those files were **deleted**
>   in the v0.3 panel pivot (ADR-14→17). Their behavior now lives in `shell/StudioViewport.tsx`,
>   `shell/PreviewStage.tsx`, and the dock panels `panels/library.panel.tsx` + `panels/inspector.panel.tsx`.
> - **T-14** stripped the fluid's audio/emitters/presets. v0.3 **restored them to full fidelity**
>   (`sim/audio`, `sim/emitters`, `sim/presets`, `sim/performance`, `sim/params.ts`) — see ADR-18.
> - Ongoing completion work is tracked in **`spec/tasks-completion.md`** (tasks C-1…C-19), not here.
>
> Based on: spec/plan.md · Execute with /dev-spec-build · Tick boxes as completed.
> `[ ]` todo · `[x]` done · Size: S/M/L (no L) · "Parallel-safe" = disjoint files, no shared dep.
> All paths are relative to the repo root `G:\CODE2026\.PROJECTS\ARTINOS`.
> Verification follows AGENTS.md §10: targeted checks (tsc/build/dev-preview/console/visual), no heavyweight test infra.

**Execution order (waves):**
1. T-1 → 2. T-2 → 3. T-3 ∥ T-4 → 4. T-5 → 5. T-6 → 6. T-7 → 7. T-8 → 8. T-9 → 9. T-10 ∥ T-11 → 10. T-12 ∥ T-13 → 11. T-14(gated) → 12. T-15 → 13. T-16

---

## Epic A — Studio foundation & shell

#### [x] T-1 (S): Create root npm workspace
- **Satisfies:** FR-2
- **Files:** `package.json` (create at repo root)
- **Interface:** `{ "name": "artinos", "private": true, "workspaces": ["PANELFLOW", "STUDIO"] }`
- **Pattern:** standard npm workspaces root; PANELFLOW's `package.json` is already named `@artinos/panelflow`.
- **Out of scope:** any STUDIO files (T-2); do not modify `PANELFLOW/package.json`.
- **Acceptance:** `npm install` at the repo root completes without error; `node -e "console.log(require('./package.json').workspaces)"` prints `[ 'PANELFLOW', 'STUDIO' ]`.
- **Depends on:** none

#### [x] T-2 (M): Scaffold the STUDIO Vite + React + TS app on PANELFLOW
- **Satisfies:** FR-1, FR-2, FR-3
- **Files (create):** `STUDIO/package.json`, `STUDIO/vite.config.ts`, `STUDIO/tsconfig.json`, `STUDIO/index.html`, `STUDIO/src/main.tsx`, `STUDIO/src/ArtinosStudio.tsx`, `STUDIO/src/studio.css`
- **Interface:**
  - `ArtinosStudio.tsx` renders `<PanelFlowProvider theme="dark"><Workspace viewport={<div className="studio-viewport-stub" />} /></PanelFlowProvider>` (real `StudioViewport` lands in T-7).
  - `main.tsx` imports React, mounts `<ArtinosStudio/>`, and imports the design-system CSS from PANELFLOW source: `../PANELFLOW/src/tokens.css` and `../PANELFLOW/src/globals.css`, then `./studio.css`.
  - `vite.config.ts` uses `@vitejs/plugin-react` + `@tailwindcss/vite`, and `resolve.alias` maps `@artinos/panelflow` → absolute path of `../PANELFLOW/src/export.ts`, and `@` → `../PANELFLOW/src` (PANELFLOW source uses the `@/` alias internally).
  - `studio.css` contains `@import "tailwindcss";` and `@source "../../PANELFLOW/src";` so Tailwind v4 scans PANELFLOW source classes (R-1).
- **Pattern:** mirror `PANELFLOW/src/App.tsx`, `PANELFLOW/src/main.tsx`, `PANELFLOW/vite.config.ts`, `PANELFLOW/index.html`, `PANELFLOW/tsconfig.json`.
- **Out of scope:** registry, gallery, showcase, modules; keep the viewport a stub.
- **Acceptance:** `npm run dev -w STUDIO` serves; the browser shows the PANELFLOW editor dock and `Ctrl+K` opens the command palette; glass/teal identity is visible (screenshot, desktop). Console shows zero errors and no duplicate-React warning (R-2). `npm run lint -w STUDIO` (`tsc --noEmit`) passes.
- **Depends on:** T-1

#### [x] T-3 (S): Studio navigation store  *(parallel-safe with T-4)*
- **Satisfies:** FR-4, FR-7
- **Files:** `STUDIO/src/studio-store.ts` (create)
- **Interface:**
  ```ts
  interface StudioState { view: 'gallery' | 'showcase'; activeModuleId: string | null;
    openGallery(): void; openShowcase(id: string): void; }
  export const useStudioStore = create<StudioState>(...)
  ```
- **Pattern:** mirror the `create(...)` Zustand store style in `PANELFLOW/src/control-engine.ts` (`useBridgeStore`).
- **Out of scope:** registry, any UI, routing/URLs (D-5).
- **Acceptance:** `npm run lint -w STUDIO` passes; default `view` is `'gallery'`, `openShowcase('x')` sets `view='showcase'` and `activeModuleId='x'`.
- **Depends on:** T-2

---

## Epic B — Registry model & discovery

#### [x] T-4 (S): Registry entry type `ArtinosModule`  *(parallel-safe with T-3)*
- **Satisfies:** FR-5, FR-18
- **Files:** `STUDIO/src/registry/types.ts` (create)
- **Interface:** the `ArtinosModule` interface from plan §2 (all ARTINOS-PRD §11 fields: `id, name, category, description, tags, schema, preview, sourcePath, dependencies, usage, presets?, related?, agentNotes, reuseNotes?, validation?, version, updatedAt`). Import `ComponentSchema` from `@artinos/panelflow`; `preview: ComponentType`.
- **Pattern:** mirror `ComponentSchema` in `PANELFLOW/src/control-engine.ts`.
- **Out of scope:** discovery/search (T-6), any UI.
- **Acceptance:** `npm run lint -w STUDIO` passes; `ArtinosModule` is exported and references `ComponentSchema` from the package alias.
- **Depends on:** T-2

#### [x] T-5 (M): First seed module — GooeySlider
- **Satisfies:** FR-5, FR-16 (internal-seed half), FR-19
- **Files (create):** `STUDIO/src/modules/gooey-slider/GooeySliderPreview.tsx`, `STUDIO/src/modules/gooey-slider/gooey-slider.module.ts`
- **Interface:**
  - `GooeySliderPreview` reads `useBridgeStore(s => s.componentValues['gooey-slider'] || {})` (from `@artinos/panelflow`) and renders PANELFLOW's `GooeySlider` driven by those values (e.g. `value`, `color`).
  - `gooey-slider.module.ts` `export default` an `ArtinosModule`: `id: 'gooey-slider'`, `schema.id` MUST equal `'gooey-slider'`, params mirroring the PANELFLOW README example (a `number` with min/max, a `color`), `preview: GooeySliderPreview`, `sourcePath: 'PANELFLOW/src/components/GooeySlider.tsx'`, `dependencies: ['@artinos/panelflow']`, a real `usage` snippet, `agentNotes`, `category: 'ui'`, `version: '0.1.0'`, `updatedAt` = today (UTC ISO date).
- **Pattern:** import `GooeySlider`, `useBridgeStore` from `@artinos/panelflow`; schema shape from `PANELFLOW/README.md` (Auto-generated control panels example); preview reads the bridge exactly as `PANELFLOW/src/panels/auto-panel.tsx` does.
- **Out of scope:** gallery/showcase UI (Epic C), other modules.
- **Acceptance:** `npm run lint -w STUDIO` passes; the default export satisfies `ArtinosModule` with `id === schema.id === 'gooey-slider'`.
- **Depends on:** T-4

#### [x] T-6 (M): Registry discovery + search
- **Satisfies:** FR-6, FR-7, FR-8
- **Files:** `STUDIO/src/registry/registry.ts` (create)
- **Interface:**
  ```ts
  export const REGISTRY: ArtinosModule[];            // from import.meta.glob('../modules/*/*.module.{ts,tsx}', { eager: true }), mapped to .default
  export function getModule(id: string): ArtinosModule | undefined;
  export function searchModules(q: { query?: string; category?: string; tag?: string }): ArtinosModule[];
  export function listCategories(): string[];
  ```
  On build of `REGISTRY`, `console.warn` on duplicate `id` and on any entry missing a `default` export or whose `id !== schema.id` (R-5).
- **Pattern:** Vite `import.meta.glob` eager index; keep it a plain module (no store).
- **Out of scope:** the validation script (T-15), any UI.
- **Acceptance:** with the gooey-slider module present, `REGISTRY.length >= 1`, `getModule('gooey-slider')` returns it, `searchModules({ query: 'gooey' })` returns it, `searchModules({ category: 'nope' })` returns `[]`. Verify by a temporary `console.log` on the dev server (remove after) or a one-off `tsx` assertion; `npm run lint -w STUDIO` passes.
- **Depends on:** T-4, T-5

---

## Epic C — Gallery + Showcase loop

#### [x] T-7 (M): StudioViewport + Gallery
- **Satisfies:** FR-4, FR-7
- **Files:** `STUDIO/src/shell/StudioViewport.tsx` (create), `STUDIO/src/shell/Gallery.tsx` (create), `STUDIO/src/ArtinosStudio.tsx` (modify — pass `<StudioViewport/>` to `Workspace`, replacing the T-2 stub)
- **Interface:**
  - `StudioViewport` reads `useStudioStore`; `view === 'gallery'` → `<Gallery/>`; `view === 'showcase'` → render the active module's `preview` (Showcase wiring completes in T-8; here render the bare `preview` or a placeholder).
  - `Gallery` calls `searchModules` with a controlled search box + category chips (`listCategories`), renders a grid of glass module cards (name, category badge, description, tags); a card click calls `useStudioStore.openShowcase(module.id)`.
- **Pattern:** glass cards using PANELFLOW tokens (`var(--color-surface)`, `var(--radius-lg)`, `.glass-panel` from `globals.css`); follow the plan §2 Design direction (premium creative-lab grid, not a dashboard table). Mirror spacing/typography conventions from PANELFLOW panels.
- **Out of scope:** showcase internals (T-8), responsive polish (T-9).
- **Acceptance:** dev server shows a gallery grid listing the gooey-slider module; typing `gooey` filters to it; selecting a category chip filters; clicking the card switches `view` to `showcase`. Screenshot (desktop); console clean.
- **Depends on:** T-3, T-6

#### [x] T-8 (M): Showcase — live preview + inline auto-generated controls
- **Satisfies:** FR-10, FR-11, FR-13
- **Files:** `STUDIO/src/shell/Showcase.tsx` (create), `STUDIO/src/shell/StudioViewport.tsx` (modify — render `<Showcase module={...}/>` when `view==='showcase'`)
- **Interface:** `Showcase({ module }: { module: ArtinosModule })`:
  - on mount: `registerComponent(module.schema)` + `initializeBridgeDefaults(module.schema)`; on unmount: `unregisterComponent(module.id)` (all from `@artinos/panelflow`).
  - renders the live `module.preview` as the stage, and `<AutoGeneratedPanel schema={module.schema}/>` (from `@artinos/panelflow`) as the controls section (FR-11).
  - renders: `usage` snippet (with copy button), `dependencies` list, `related` links (each opens that module's showcase), `agentNotes`, `presets` (apply sets bridge values), and a runtime/console status indicator.
  - if `module` or `module.preview` is missing → show a clear in-panel fallback, no crash (FR-13).
- **Pattern:** controls come from PANELFLOW's exported `AutoGeneratedPanel` (see `PANELFLOW/src/panels/auto-panel.tsx`); the preview is already bridge-driven from T-5.
- **Out of scope:** responsive breakpoints + error boundary (T-9); other modules.
- **Acceptance:** opening the gooey-slider showcase shows a live `GooeySlider`; changing a control in the auto-panel updates the preview within one frame; usage/deps/related/agentNotes all render; returning to the gallery works. Console clean; screenshot.
- **Depends on:** T-6, T-7

#### [x] T-9 (S): Showcase + Gallery states — responsive, status, empty, error
- **Satisfies:** FR-12, FR-13
- **Files:** `STUDIO/src/shell/Showcase.tsx` (modify), `STUDIO/src/shell/Gallery.tsx` (modify)
- **Interface:** add responsive layout for 375 / 768 / 1440 widths; render a validation status badge from `module.validation`; gallery empty state when `REGISTRY` is empty; wrap the preview in a React error boundary that shows an error notice (FR-13) instead of crashing, and a capability notice when a `dependencies` entry is `'webgpu'` and WebGPU is unavailable.
- **Pattern:** breakpoints per `DESIGN_PROCESS.md` (375/768/1440); a minimal class error boundary around `module.preview`.
- **Out of scope:** any new features.
- **Acceptance:** showcase renders correctly at 375/768/1440 (resize screenshots); deliberately throwing inside a preview shows the error notice (not a blank screen/crash); console clean.
- **Depends on:** T-8

---

## Epic D — Seed library & converter

#### [x] T-10 (S): Seed module — BubbleRatingSlider  *(parallel-safe with T-11)*
- **Satisfies:** FR-5, FR-19
- **Files (create):** `STUDIO/src/modules/bubble-rating/BubbleRatingPreview.tsx`, `STUDIO/src/modules/bubble-rating/bubble-rating.module.ts`
- **Interface:** same contract as T-5 for PANELFLOW's `BubbleRatingSlider`; `id: 'bubble-rating'`, `schema.id === 'bubble-rating'`, `category: 'ui'`, `sourcePath: 'PANELFLOW/src/components/BubbleRatingSlider.tsx'`.
- **Pattern:** mirror `STUDIO/src/modules/gooey-slider/*` exactly.
- **Out of scope:** any UI changes (the registry auto-discovers it).
- **Acceptance:** the gallery lists it; its showcase opens with a live preview whose controls drive it; `npm run lint -w STUDIO` passes.
- **Depends on:** T-8 *(parallel-safe with T-11 — disjoint folder)*

#### [x] T-11 (S): Seed module — ElasticMenu  *(parallel-safe with T-10)*
- **Satisfies:** FR-5, FR-19
- **Files (create):** `STUDIO/src/modules/elastic-menu/ElasticMenuPreview.tsx`, `STUDIO/src/modules/elastic-menu/elastic-menu.module.ts`
- **Interface:** same contract as T-5 for PANELFLOW's `ElasticMenu`; `id: 'elastic-menu'`, `schema.id === 'elastic-menu'`, `category: 'ui'`, `sourcePath: 'PANELFLOW/src/components/ElasticMenu.tsx'`.
- **Pattern:** mirror `STUDIO/src/modules/gooey-slider/*` exactly.
- **Out of scope:** any UI changes.
- **Acceptance:** the gallery lists it; its showcase opens with a live preview whose controls drive it; `npm run lint -w STUDIO` passes.
- **Depends on:** T-8 *(parallel-safe with T-10 — disjoint folder)*

#### [x] T-12 (M): Converter workflow document  *(parallel-safe with T-13)*
- **Satisfies:** FR-14, FR-15, FR-17
- **Files:** `spec/converter-workflow.md` (create)
- **Interface:** a concrete, agent-followable procedure that: lists accepted inputs (ARTINOS-PRD §10); gives the step-by-step conversion process (§17 agent process); enumerates the §18 deliverables and maps each to the preferred module/Lab contracts (`modules/<category>/<Feature>.module.ts(x)` + `<Feature>.showcase.tsx` + `<Feature>.meta.ts`, plus `labs/<id>/` for Mode B); states the fidelity rules (AGENTS.md §4 — port directly, preserve visuals/behavior/physics/shaders, report deviations); and the smart decomposition model (§9) that extracts reusable cores/adapters without over-splitting (AGENTS.md §3). References the scaffold (T-13) and validation (T-15) scripts.
- **Pattern:** mirror ARTINOS-PRD §10/§17/§18 and AGENTS.md §4; map outputs to the `ArtinosModule` fields from T-4.
- **Out of scope:** performing any specific conversion (T-14).
- **Acceptance:** every §18 deliverable maps to a named file/field; a reader with only the repo + this doc could produce a registered, showcased module without further context.
- **Depends on:** T-4

#### [x] T-13 (S): Module scaffold script  *(parallel-safe with T-12)*
- **Satisfies:** FR-14
- **Files:** `STUDIO/scripts/new-module.ts` (create), `STUDIO/package.json` (modify — add `"new-module": "tsx scripts/new-module.ts"`)
- **Interface:** `npm run new-module -w STUDIO -- <id> [--category ui]` creates `STUDIO/src/modules/<id>/{<id>.module.ts, <PascalId>Preview.tsx}` from a template matching the `ArtinosModule` contract (`schema.id === <id>`, placeholder params, `agentNotes` stub, `version: '0.1.0'`, `updatedAt` = today UTC ISO date).
- **Pattern:** use the gooey-slider module files as the template; Node `fs` run via `tsx` (already a PANELFLOW devDep — add `tsx` to STUDIO devDeps).
- **Out of scope:** registering into anything (glob auto-discovers).
- **Acceptance:** running it with a throwaway id (e.g. `tmp-test`) creates a folder that `REGISTRY` discovers and `tsc` accepts; delete the throwaway module afterward and confirm `npm run lint -w STUDIO` still passes.
- **Depends on:** T-5

#### [x] T-14 (M): External conversion proof — WebGPU Fluid Simulation
> **DONE (2026-06-22):** Source provided at `REF/WebGpu-Fluid-Simulation-master` (Three.js r184 + TSL + WebGPU). Ported the reusable fluid core verbatim into `STUDIO/src/modules/webgpu-fluid/sim/` (config, input, compat, fluid/*, particles, asset); stripped audio/emitters/UI/presets/recording scaffolding (AGENTS.md §4). Thin `WebGPUFluidModule.tsx` wrapper replicates main.js's minimal init+loop+dispose; 7 live controls + 4 presets via the bridge→`config` singleton. Verified: lint, build, check-registry (4/4), dev preview renders the fluid faithfully with zero console errors, "Neon Pulse" preset mutates live config (CURL=44, particles on, bloom 1.1).
- **Satisfies:** FR-16, FR-15
- **Files (create):** `STUDIO/src/modules/<converted-id>/*` (id determined from the source)
- **Interface:** FIRST locate the WebGPU Fluid Simulation source (ARTINOS-PRD §17 names `WebGpu-Fluid-Simulation-master`). It is **not present in the repo** as of planning. Per AGENTS.md §4: if the source cannot be found, **report BLOCKED** and ask the user to provide it (or confirm an alternative available Three.js/R3F/ShaderToy source). Once available, port it **directly** (preserve visuals, behavior, shaders, interactions, presets, audio-reactivity), decompose per §9 into a compact module, and register it as an `ArtinosModule` with a working showcase.
- **Pattern:** AGENTS.md §4 (direct copy → minimal compat edits → integration wrapper); the module-folder contract (T-5); `spec/converter-workflow.md` (T-12).
- **Out of scope:** rewriting from memory or substituting a generic demo; do not flatten the original identity.
- **Acceptance:** the converted module appears in the gallery with a working showcase whose controls drive the live effect, a side-by-side fidelity note confirms it matches the source, and its entry passes `check-registry` — **OR** a documented BLOCKED status naming the missing source and the unblock step.
- **Depends on:** T-9, T-12, T-13

---

## Epic E — Agent operability & library-sync gate

#### [x] T-15 (M): Registry validation / library-sync check script
- **Satisfies:** FR-8, FR-20
- **Files:** `STUDIO/scripts/check-registry.ts` (create), `STUDIO/package.json` (modify — add `"check-registry": "tsx scripts/check-registry.ts"`)
- **Interface:** load every module entry (reuse the glob or fs-scan `src/modules/*/*.module.*`) and validate: all required `ArtinosModule` fields present and non-empty; `schema.id === module.id`; `sourcePath` resolves on disk; `schema.parameters` each have `key/label/type/default`; no duplicate `id`s. Print a per-module pass/fail table; exit non-zero on any failure.
- **Pattern:** Node + `tsx`; mirror the discovery logic in `registry.ts` (T-6).
- **Out of scope:** auto-fixing entries.
- **Acceptance:** `npm run check-registry -w STUDIO` exits 0 for the seed set (gooey-slider, bubble-rating, elastic-menu); temporarily blanking one entry's `description` or breaking its `sourcePath` makes it exit non-zero with a clear message; restore after.
- **Depends on:** T-6, T-10, T-11

#### [x] T-16 (S): Agent-operability + library-sync rules (STUDIO AGENTS guide)
- **Satisfies:** FR-18, FR-19, FR-20
- **Files:** `STUDIO/AGENTS.md` (create)
- **Interface:** document, concisely: (a) the reuse-first checklist to run before building (ARTINOS-PRD §15); (b) the library-sync rules (§13) — when a module changes, update its entry + showcase and run `check-registry`; (c) what every entry's `agentNotes` must contain so an agent can use/extend the module without opening source first; (d) the Definition of Done — `check-registry` passes + build/preview/console proof. Cross-reference `spec/converter-workflow.md` and the root `AGENTS.md`.
- **Pattern:** mirror the root `AGENTS.md` tone; concise checklists, no filler.
- **Out of scope:** code.
- **Acceptance:** the doc exists and is self-sufficient — an agent reading it + the converter workflow could register, reuse, sync, and verify a module without this conversation.
- **Depends on:** T-12, T-15

---

<!--
FR coverage (MVP): FR-1 T-2 · FR-2 T-1,T-2 · FR-3 T-2 · FR-4 T-3,T-7 · FR-5 T-4,T-5,T-10,T-11 ·
FR-6 T-6 · FR-7 T-6,T-7 · FR-8 T-6,T-15 · FR-10 T-8 · FR-11 T-8 · FR-12 T-9 · FR-13 T-8,T-9 ·
FR-14 T-12,T-13 · FR-15 T-12,T-14 · FR-16 T-5,T-14 · FR-17 T-12 · FR-18 T-4,T-16 · FR-19 T-16,T-10,T-11 ·
FR-20 T-15,T-16.   Post-MVP (not tasked): FR-9, FR-21, FR-22, FR-23.
Every task is doable with only this repo + its entry. No task sized L.
-->
