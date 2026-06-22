# Plan — ARTINOS

> Status: draft · Based on: spec/prd.md, ARTINOS-PRD.md (master vision), PANELFLOW (built dependency) · Updated: 2026-06-22
> Readiness: PASS (see §8)

## 1. Approach

PANELFLOW already provides the panel OS, editor dock, auto-generated control panels, graph canvas, command palette, and glass design system. ARTINOS does **not** rebuild any of that — it builds a thin **Studio app** in `STUDIO/` that *consumes* PANELFLOW and adds the three things PANELFLOW doesn't have: a **file-based reusable-block registry**, **showcase pages** per module, and a **documented converter workflow** that turns inputs into registered modules.

Order of attack: (1) stand up the Studio shell on PANELFLOW; (2) define the registry data model and runtime discovery; (3) port the first real module so the registry/gallery/showcase loop is testable end-to-end; (4) build the gallery + showcase UI; (5) add the remaining seed modules + the converter workflow + scaffold/validation scripts; (6) close the agent-operability + library-sync loop. The MVP is everything in §7 milestones M-1…M-5; Post-MVP (graph-node exposure, MCP tools, public Website, package promotion) is deferred per PRD §12.

The guiding constraint is the compact-module philosophy (AGENTS.md §3) and **reuse over rebuild**: every capability that overlaps PANELFLOW is delegated to PANELFLOW, not reimplemented.

## 2. Architecture

**Components & responsibilities**

- **Root workspace** (`package.json` at repo root) — npm workspaces over `PANELFLOW` and `STUDIO`; hoists PANELFLOW's runtime deps so the Studio can import PANELFLOW source directly. Owns nothing else.
- **Studio shell** (`STUDIO/src/ArtinosStudio.tsx`, `main.tsx`) — mounts `PanelFlowProvider` + `Workspace`, injects PANELFLOW styles, owns the viewport content. Delegates all panel/dock/palette behavior to PANELFLOW.
- **Studio store** (`STUDIO/src/studio-store.ts`) — minimal Zustand store for *navigation only*: `view` (`gallery` | `showcase`) and `activeModuleId`. No router dependency in the MVP (local-first, single-user; URLs are Post-MVP).
- **Registry** (`STUDIO/src/registry/`) — `types.ts` (the `ArtinosModule` entry shape, mapping ARTINOS-PRD §11) and `registry.ts` (runtime discovery via Vite `import.meta.glob` + search/filter/lookup). Files are the source of truth; no DB, no codegen step.
- **Modules** (`STUDIO/src/modules/<id>/`) — each module is a self-contained folder: a preview component + an `<id>.module.ts` exporting a typed `ArtinosModule`. The module's control schema is a PANELFLOW `ComponentSchema` (canonical — see D-2).
- **Studio UI** (`STUDIO/src/shell/`) — `StudioViewport.tsx` (renders the active module's live preview or the gallery landing), `Gallery.tsx` (browse/search/filter — FR-7), `Showcase.tsx` (per-module live preview + inline auto-generated controls + usage/deps/related/agent-notes/status — FR-10..13).
- **Tooling** (`STUDIO/scripts/`) — `new-module.ts` (scaffold a module folder + entry skeleton) and `check-registry.ts` (the library-sync validator — FR-8/FR-20, metric M-2/M-5).
- **Converter workflow** (`spec/converter-workflow.md`) — the documented, agent-followed procedure (ARTINOS-PRD §10/§17/§18) that produces a registered, showcased module from any accepted input. Agent-operable, not bespoke runtime (PRD §9).

**Data model**

`ArtinosModule` (the registry entry — one per module, co-located):
```ts
import type { ComponentSchema } from '@artinos/panelflow';
import type { ComponentType } from 'react';

export interface ArtinosModule {
  id: string;                 // unique, kebab-case
  name: string;               // display name
  category: string;           // 'ui' | '3d' | 'shader' | 'effect' | 'layout' | ...
  description: string;        // what it does + when to use
  tags: string[];             // searchable keywords
  schema: ComponentSchema;    // PANELFLOW control schema (canonical — D-2)
  preview: ComponentType;     // live preview; reads values from PANELFLOW bridge by schema.id
  sourcePath: string;         // owned source location, repo-relative
  dependencies: string[];     // runtime deps + runtime requirements (e.g. 'webgpu')
  usage: string;              // copy-paste / install snippet
  presets?: Record<string, Record<string, any>>; // named param presets
  related?: string[];         // related module ids
  agentNotes: string;         // agent-readable usage/extension notes (FR-18)
  reuseNotes?: string;        // known reuse patterns / prior usage
  validation?: { build: boolean; preview: boolean; console: boolean }; // last verify result
  version: string;            // semver-ish
  updatedAt: string;          // ISO 8601 UTC date
}
```

Live parameter values are **not** stored in the registry — they live in PANELFLOW's `useBridgeStore` keyed by `schema.id`. Module previews subscribe there; controls write there. This keeps modules portable (no ARTINOS store dependency in module logic).

**Public interfaces (contracts the rest of the system depends on)**
```ts
// STUDIO/src/registry/registry.ts
export const REGISTRY: ArtinosModule[];                 // built from import.meta.glob, eager
export function getModule(id: string): ArtinosModule | undefined;
export function searchModules(q: { query?: string; category?: string; tag?: string }): ArtinosModule[];
export function listCategories(): string[];

// STUDIO/src/studio-store.ts
export const useStudioStore: <T>(sel: (s: StudioState) => T) => T;
interface StudioState { view: 'gallery' | 'showcase'; activeModuleId: string | null;
  openGallery(): void; openShowcase(id: string): void; }

// Module folder contract (every STUDIO/src/modules/<id>/<id>.module.ts)
export default { /* satisfies ArtinosModule */ } as ArtinosModule;

// PANELFLOW API the Studio relies on (already built — do not modify here):
//   PanelFlowProvider, Workspace, AutoGeneratedPanel, registerComponent,
//   unregisterComponent, useBridgeStore, initializeBridgeDefaults,
//   ComponentSchema, ParameterDef  — from '@artinos/panelflow'
//   '@artinos/panelflow/styles'  — design-system CSS
```

**Data / control flow**
```
STUDIO/src/main.tsx
  └─ <PanelFlowProvider theme="dark">          (PANELFLOW: theme + auto-panel generation)
       └─ <ArtinosStudio>
            ├─ <Workspace viewport={<StudioViewport/>}/>   (PANELFLOW: dock, rail, palette)
            │     └─ StudioViewport ── reads useStudioStore.view/activeModuleId
            │            view==='gallery'  → <Gallery/>          (searchModules → cards)
            │            view==='showcase' → active module <preview/> (reads useBridgeStore)
            └─ Showcase panel/section for active module:
                  on mount: registerComponent(module.schema) + initializeBridgeDefaults
                  controls: <AutoGeneratedPanel schema={module.schema}/>  (FR-11)
                  preview:  module.preview  ── useBridgeStore[schema.id] drives it (FR-11)
                  on unmount: unregisterComponent(module.id)

registry.ts:  import.meta.glob('../modules/*/*.module.{ts,tsx}',{eager:true}) → REGISTRY
scripts/check-registry.ts:  validate every entry (fields, paths resolve, schema valid) → FR-8/20
```

Repo shape after the MVP:
```
ARTINOS/
  package.json                  # NEW — npm workspaces [PANELFLOW, STUDIO]
  PANELFLOW/                     # existing (built dependency, unchanged)
  STUDIO/                        # NEW — the Studio app
    package.json  vite.config.ts  tsconfig.json  index.html
    src/
      main.tsx  ArtinosStudio.tsx  studio.css  studio-store.ts
      registry/{types.ts, registry.ts}
      shell/{StudioViewport.tsx, Gallery.tsx, Showcase.tsx}
      modules/
        gooey-slider/{GooeySliderPreview.tsx, gooey-slider.module.ts}
        bubble-rating/{...}
        elastic-menu/{...}
    scripts/{new-module.ts, check-registry.ts}
  spec/converter-workflow.md     # NEW — the documented converter
```

**Design direction** (UI work)

Inherit PANELFLOW's identity: dark cinematic base (`#0a0a0a`), frosted glass surfaces, teal accent (`#2dd4bf`), grain texture, elastic spring motion — via PANELFLOW tokens and `injectTheme`, never re-themed. The **Gallery** reads as a premium creative-lab grid (ReactBits / 21st.dev tier): glass module cards with live-or-static preview thumbnails, category chips, hover elevation — *not* a generic dashboard table. The **Showcase** is a focused stage: large live preview centered, controls in a glass panel, usage/deps/agent-notes in collapsible glass sections. Honor AGENTS.md §5/§6 (premium feel, visual QA gate). No purple gradients, no gray-on-gray, no AI-slop layouts.

## 3. Key decisions

- D-1: **Workspace wiring** — npm workspaces at the repo root + a Vite `resolve.alias` mapping `@artinos/panelflow` → `../PANELFLOW/src/export.ts` (and `/styles` → PANELFLOW source CSS). Chosen over (a) `file:` dep on PANELFLOW's built `dist` (loses instant HMR, needs a watch build) and (b) path alias only (no dep hoisting). Consequence: STUDIO consumes PANELFLOW **source**, so PANELFLOW's runtime deps must hoist (workspaces) and STUDIO's Tailwind must scan PANELFLOW source (`@source "../PANELFLOW/src"`). Satisfies FR-2 (changes flow with no publish). (→ decisions.md)
- D-2: **Canonical control schema** — reuse PANELFLOW `ComponentSchema`/`registerComponent` directly as the schema; `ArtinosModule` embeds it as `schema`. Chosen over a separate ARTINOS schema that wraps it (avoids a translation layer and keeps showcases driven by the existing auto-panel). (→ decisions.md)
- D-3: **File-based registry, runtime glob discovery** — per-module `<id>.module.ts` discovered via `import.meta.glob(..., { eager: true })`; no codegen, no DB. Chosen over a generated `registry.generated.ts` (extra build step) and SQLite (unneeded for local-first). Validation/sync handled by a separate script. (→ decisions.md)
- D-4: **Converter = documented workflow + scaffold script** — `spec/converter-workflow.md` (agent-followed) plus `scripts/new-module.ts` (removes boilerplate). Chosen over a bespoke converter runtime or MCP tool (Post-MVP), per PRD §9. (→ decisions.md)
- D-5: **Navigation without a router** — a tiny `useStudioStore` (`gallery`/`showcase` + `activeModuleId`). Chosen over `react-router-dom` because local-first single-user needs no shareable URLs in v1; a router is a clean Post-MVP add. (→ decisions.md)
- D-6: **Seed set** — port PANELFLOW's `GooeySlider`, `BubbleRatingSlider`, `ElasticMenu` as the first three registered modules (guaranteed available, already premium); the external-conversion proof (FR-16, ARTINOS-PRD §17 WebGPU Fluid) is **gated on the source being provided** since it is not present in the repo. (→ decisions.md)
- D-7: **Showcase controls are inline `AutoGeneratedPanel`** — render PANELFLOW's exported `AutoGeneratedPanel` inside the showcase for the controls section, and also let `registerComponent` surface the panel in the dock rail/command palette. Chosen over building any new control UI (PANELFLOW already does this). (→ decisions.md)

## 4. Risks

- R-1: **Consuming PANELFLOW source breaks Tailwind class resolution in the Studio** → mitigation: configure Tailwind v4 to scan PANELFLOW source (`@source "../PANELFLOW/src"`) in T-2 and verify glass surfaces render in the dev preview before proceeding; documented fallback = consume PANELFLOW `dist` + `build:lib --watch`.
- R-2: **Dep version skew** between PANELFLOW (React 19) and Studio → mitigation: Studio pins the same React major; workspaces hoist a single React copy; verify no duplicate-React runtime error on first dev boot (T-2 acceptance).
- R-3: **`import.meta.glob` path/eager pitfalls** (wrong glob root, missing default export) → mitigation: registry test in T-6 asserts the seed module is discovered; `check-registry.ts` (T-15) fails loudly on a module missing a default export.
- R-4: **External conversion source absent** (WebGPU Fluid not in repo) → mitigation: D-6 gates FR-16; T-14 first *locates* the source and reports BLOCKED per AGENTS.md if absent, substituting an available non-trivial Three.js/R3F/shader source on user confirmation. The registry/showcase loop is fully proven by the three ported modules regardless.
- R-5: **Bridge state collision** if two modules share a `schema.id` → mitigation: `schema.id` must equal `module.id` (enforced by `check-registry.ts`); duplicate ids warned at discovery (T-6).
- R-6: **Scope creep into Post-MVP** (graph nodes, MCP, Website) → mitigation: those FRs (FR-9/21/22/23) are out of the MVP waves and explicitly fenced in §7.

## 5. Test & verification strategy

This is a Vite/React app; per AGENTS.md §10 verification is **targeted, not theatrical**, and we do **not** build heavyweight test infra. Per task, "done" requires runnable proof:

- **Type/build checks** (every task touching TS): `tsc --noEmit` (the `lint` script) and, for shell tasks, `vite build` succeeds.
- **Runtime/console checks** (UI tasks): `npm run dev -w STUDIO`, load the route, capture console (use the preview tooling) — zero errors.
- **Visual QA** (Gallery/Showcase/preview tasks): screenshot at desktop + one mobile width; confirm premium glass identity and that controls drive the preview (AGENTS.md §6 gate).
- **Logic checks** (registry/scripts): a small runnable assertion — `searchModules` filters correctly; `check-registry.ts` exits non-zero on a deliberately broken entry and zero on the seed set.
- **Whole-effort "done" (MVP)**: `npm run dev -w STUDIO` boots with the PANELFLOW shell; the gallery lists ≥3 modules; each opens a showcase with a *live* preview whose controls change it within a frame; `node STUDIO/scripts/check-registry.ts` passes for all seed modules; one external conversion exists or is documented BLOCKED with the reason.

## 6. Observability

Local-first, so "observability" is dev-facing: (1) `check-registry.ts` prints a per-module validation table (fields/paths/schema) and is the FR-20 sync gate; (2) each module's `validation` field records the last build/preview/console result, shown as a status indicator on its showcase (FR-10) and in the gallery; (3) registry discovery logs duplicate-id and broken-path warnings to the console (FR-8); (4) the success metrics (PRD §10) are computed by reading the registry index (module count, % with complete entries, % with `related` links) — a future `scripts/registry-stats.ts` (Post-MVP).

## 7. Milestones

MVP milestones (each delivers something verifiable):
- **M-1 — Studio shell live.** Done when `npm run dev -w STUDIO` serves the PANELFLOW workspace (dock + Ctrl+K palette + glass identity) with no console errors. (Epic A)
- **M-2 — Registry model + discovery.** Done when `REGISTRY` is built from module folders via glob, `searchModules` filters by query/category/tag, and the first seed module is discovered. (Epic B)
- **M-3 — Gallery + Showcase loop.** Done when the gallery lists modules and opening one shows a live preview with inline auto-generated controls that drive it within a frame. (Epic C)
- **M-4 — Seed library + converter workflow.** Done when all three PANELFLOW components are registered modules with passing showcases, the converter workflow doc exists, and the scaffold script stamps a valid new module. (Epic D)
- **M-5 — Agent-operability + sync gate.** Done when every entry carries agent notes, `check-registry.ts` passes for the seed set and fails on a broken entry, and the reuse-first + sync rules are documented for the agent. (Epic E)

Post-MVP (fenced, not planned here): FR-9 graph-node exposure, FR-21 MCP tool endpoints, FR-22 public Website, FR-23 package promotion.

## 8. Readiness gate

**Verdict: PASS.** Every MVP FR maps to ≥1 task and every task traces to an FR (see tasks.md). No task is sized L. Dependencies are acyclic and ordered; parallel-safe tasks touch disjoint files. Each task names a runnable acceptance check. The PRD's six open questions are resolved as D-1…D-6 and logged in decisions.md, so none blocks Wave 1. One watch item carried into execution (CONCERNS-level, not blocking): R-1 Tailwind-source-scanning must be confirmed in T-2 before the UI tasks, and R-4 (external conversion source) is gated by design.
