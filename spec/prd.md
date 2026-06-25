# PRD — ARTINOS

> Status: draft · Owner: arkonline · Sources: ARTINOS-PRD.md (master vision), PANELFLOW/DOCS/PANELFLOW_PRD.md, PANELFLOW/DOCS/PANELFLOW_IMPLEMENTATION_GUIDE.md · Updated: 2026-06-22

## 1. Summary

ARTINOS is a **single-user, local-first creative studio** for building, converting, and reusing interactive visual modules — React components, animated UI blocks, landing sections, Three.js/R3F scenes, TSL shaders, and WebGPU effects. It is a **studio + registry + converter + showcase + agent-operable workflow**, not a component library, a static gallery, or a one-shot generator. Anything built or imported into ARTINOS resolves into a permanent, documented, reusable library asset with a live showcase and machine-readable registry entry — never a disposable demo. The studio UI is built on **PANELFLOW** (`@artinos/panelflow`, already built), which provides the panel OS, editor dock, auto-generated control panels, graph canvas, and glass design system. This PRD defines the full ARTINOS system and front-loads the **Studio MVP** as the first concrete buildable increment.

## 2. Problem

Every existing tool solves one slice and none solve the whole. Component libraries (MUI, Chakra) are black-box dependencies with no 3D/shader concept. shadcn/ui gave code ownership but stops at flat React/Tailwind. ReactBits / 21st.dev are galleries you copy from, not workspaces you edit, convert, or operate. Spline does browser 3D but isn't code-first or agent-operable. Three.js/TSL/WebGPU give raw power but no studio, no registry, no reuse discipline — every project restarts from zero. The cost: the same interactive systems get re-derived repeatedly, useful work stays trapped in one-off demos, and neither a human nor an AI agent can rediscover and reuse what already exists. ARTINOS targets a creator (and the AI agent working alongside them) who keeps rebuilding the same kinds of visual systems and wants one compounding library instead.

## 3. Goals & non-goals

**Goals** (measurable/observable):
- G-1: Stand up an ARTINOS Studio app that mounts the PANELFLOW shell (viewport + dock + command palette) and runs locally with no backend.
- G-2: Make every reusable thing a registered, file-based library asset with a complete registry entry — registry coverage of built modules trends to 100%.
- G-3: Give every major module a live, interactive showcase (real preview + controls + usage + deps), not a static thumbnail.
- G-4: Provide a repeatable converter workflow that turns any accepted input (idea, component, repo, demo, shader) into a registered, showcased ARTINOS module while preserving its original visual/interaction identity.
- G-5: Make the library agent-operable — every entry carries machine-readable metadata and agent instructions a coding agent can read, discover, and act on.
- G-6: Grow by reuse, not duplication — new builds prefer extending/reusing existing modules over re-creating them.

**Non-goals** (deliberately out of scope):
- NG-1: Rebuilding PANELFLOW. ARTINOS consumes it as a dependency; panel/control/design work happens in the PANELFLOW package, not here.
- NG-2: Multi-user accounts, auth, cloud sync, or real-time collaboration in v1.
- NG-3: A hosted public marketplace / monetization platform in v1 (the `Website/` is later).
- NG-4: A database-backed registry, server, or cloud persistence in v1.
- NG-5: A custom bespoke agent runtime or sandbox engine in v1 (the converter is a documented agent workflow over structured files).
- NG-6: Generic admin-dashboard / starter-template visual identity — explicitly disallowed by the quality bar.
- NG-7: Promotion of modules into independently published npm packages in v1 (modules stay in-studio source).

## 4. Users & journeys

- **Persona — The Creator (primary).** A solo developer/designer building high-end interactive visuals across many projects. Wants ownership of source (shadcn-style), premium output quality, and to never rebuild the same fluid sim / shader card / magnetic dock twice. Works locally, values speed from idea to working showcase.
- **Persona — The Coding Agent (co-operator).** An AI agent (Claude Code) that operates the studio end-to-end: analyzes inputs, decomposes work, reuses existing modules, builds new ones, registers them, builds showcases, and verifies. Needs machine-readable registry entries and agent instructions to act without re-deriving context.

Journeys:
- J-1: As the Creator, I open the Studio and browse the module gallery, preview a module live with its controls, and copy its source into another project. (idea/library → reuse)
- J-2: As the Creator, I point ARTINOS at an existing project (e.g. a WebGPU fluid sim), and get back a clean reusable module + live showcase + registry entry, with the original behavior preserved. (external → module)
- J-3: As the Creator, I describe a rough idea; the agent decomposes it, reuses existing modules where possible, builds the new parts, registers them, and creates a showcase. (idea → module → showcase → library)
- J-4: As the Coding Agent, before building anything I query the registry for similar modules and reuse/extend instead of duplicating; after building I register, showcase, and verify. (reuse-first loop)

## 5. Functional requirements

Priority: M(ust) / S(hould) / C(ould). **Phase**: MVP = first concrete increment; Post = full-system, later.

### 5a. Studio shell & workspace

| ID | Requirement (what, not how) | Priority | Phase | Acceptance criterion |
|----|------------------------------|----------|-------|----------------------|
| FR-1 | The Studio shall run as a local app in `STUDIO/` that mounts the PANELFLOW workspace (viewport slot, editor dock, command palette). | M | MVP | `npm run dev` in `STUDIO/` serves a studio that renders the PANELFLOW dock + command palette; no console errors. |
| FR-2 | The Studio shall consume PANELFLOW as a local workspace/file dependency so PANELFLOW changes flow in without npm publishing. | M | MVP | Editing a PANELFLOW source file is reflected in the Studio dev server (after rebuild/HMR) without `npm publish`. |
| FR-3 | The Studio shall apply the PANELFLOW glass design system as its visual identity (tokens, glass surfaces, motion). | M | MVP | Studio chrome uses PANELFLOW tokens/`injectTheme`; visual QA confirms premium glass identity, no generic-dashboard look. |
| FR-4 | The Studio shall provide a viewport that hosts the active module's live preview, owned by the Studio (not PANELFLOW). | M | MVP | Selecting a module renders its live, interactive preview in the viewport. |

### 5b. Reusable block registry

| ID | Requirement (what, not how) | Priority | Phase | Acceptance criterion |
|----|------------------------------|----------|-------|----------------------|
| FR-5 | The system shall represent every reusable module with a registry entry containing the fields in ARTINOS-PRD §11 (id, name, category/type, description, source path, preview path, dependencies, controls/presets, tags, related, usage, agent instructions, validation status, version/date, reuse notes). | M | MVP | A module's entry validates against the registry schema; missing required fields are flagged. |
| FR-6 | The registry shall be persisted as local files (entry co-located with each module) plus a generated, git-friendly index. | M | MVP | Registry entries exist as files; regenerating the index discovers all entries with no DB/server. |
| FR-7 | The Studio shall provide a gallery to browse, search, and filter registered modules by category, tag, and text. | M | MVP | Typing a query / selecting a category filters the gallery to matching modules. |
| FR-8 | The system shall reject or warn on duplicate module ids and on entries whose source/preview paths don't resolve. | S | MVP | Registering a duplicate id or a broken path produces a visible warning, not a silent failure. |
| FR-9 | The registry shall expose modules as graph nodes (typed inputs/outputs/inspector) on the PANELFLOW graph canvas. | C | Post | A registered module can be dropped onto the graph canvas as a node with its controls. |

### 5c. Showcase pages

| ID | Requirement (what, not how) | Priority | Phase | Acceptance criterion |
|----|------------------------------|----------|-------|----------------------|
| FR-10 | Every major module shall have a showcase route with a live interactive preview, full inspector controls, presets, usage snippet, dependency list, copy/install actions, plain-language explanation, console/runtime status, and links to related modules. | M | MVP | Opening a module's showcase shows all listed elements working against the real module (not static). |
| FR-11 | Showcase controls shall be generated from the module's parameter schema via the PANELFLOW control engine (`registerComponent` / auto-panel). | M | MVP | Changing a control in the showcase updates the live preview within one frame via the PANELFLOW bridge. |
| FR-12 | Showcases shall demonstrate responsive behavior across the standard breakpoints. | S | MVP | The showcase renders correctly at mobile/tablet/desktop widths. |
| FR-13 | A showcase shall degrade gracefully when its module is unmounted, missing a dependency, or running without WebGPU. | M | MVP | Each failure surfaces a clear in-panel notice; the studio does not crash. |

### 5d. Module converter

| ID | Requirement (what, not how) | Priority | Phase | Acceptance criterion |
|----|------------------------------|----------|-------|----------------------|
| FR-14 | The system shall provide a documented converter workflow that accepts the input types in ARTINOS-PRD §10 (idea, PRD, React component, Three.js/R3F scene, ShaderToy, WebGPU demo, repo, CodePen, local project, UI block, page, mini app) and produces the §18 deliverables (module, showcase, registry entry, metadata, deps, controls, usage, agent notes, validation). | M | MVP | Running the workflow on one real input yields all required deliverables, registered and showcased. |
| FR-15 | The converter shall preserve the source's original visuals, behavior, interactions, physics, animation, sound, and shader logic (port directly per AGENTS.md §4, not rewrite from memory). | M | MVP | A side-by-side fidelity check shows the converted module matches the source behavior; deviations are reported. |
| FR-16 | At least one non-trivial external project shall be converted end-to-end to prove the loop (reference: the WebGPU Fluid Simulation worked example in ARTINOS-PRD §17). | M | MVP | One real conversion exists in the library with a passing showcase and complete registry entry. |
| FR-17 | The converter shall strip unrelated scaffolding and decompose work into compact, reusable modules per the decomposition model (ARTINOS-PRD §9), extracting generalized rendering, WebGPU, physics/particle, input, environment, postfx, math, and performance systems when present without over-splitting files. | S | MVP | Converted output follows the compact module philosophy (AGENTS.md §3); useful systems are not trapped inside demo-shaped modules; source-specific adapters/composition stay in the faithful Lab; no deep folder nesting or fake abstractions. |

### 5e. Agent operability & library sync

| ID | Requirement (what, not how) | Priority | Phase | Acceptance criterion |
|----|------------------------------|----------|-------|----------------------|
| FR-18 | Every registry entry shall carry machine-readable agent instructions and validation status that a coding agent can read to discover, use, and extend the module. | M | MVP | An agent can read an entry and reuse the module without opening the source first. |
| FR-19 | The system shall enforce a reuse-first checklist (ARTINOS-PRD §15) so new work reuses/extends existing modules before creating new ones. | M | MVP | The agent workflow documents and follows the checklist; reuse opportunities are checked before any new build. |
| FR-20 | The library shall stay synchronized: when a module changes, its showcase and registry entry update with it; reusable patterns found in showcases/projects are extracted back into the library (ARTINOS-PRD §13). | M | MVP | Changing a module without updating its entry/showcase is caught by a sync check; no useful system stays trapped in a one-off. |
| FR-21 | The system shall provide agent-callable tool endpoints (e.g. MCP) for registry query / convert / showcase actions so agents can operate the studio programmatically. | C | Post | An agent can list/search/register modules via a tool API without file-by-file edits. |

### 5f. Public surface (later)

| ID | Requirement (what, not how) | Priority | Phase | Acceptance criterion |
|----|------------------------------|----------|-------|----------------------|
| FR-22 | The system shall provide a public-facing website/gallery for discovery and copy/remix of modules. | C | Post | The `Website/` app renders the registry as a browsable public gallery. |
| FR-23 | The system shall define criteria and a workflow to promote a proven module into a standalone package. | C | Post | A documented promotion process exists with concrete trigger criteria. |

## 6. Non-functional requirements

- NFR-1 (performance): Control parameter latency < 16ms (one frame); graph canvas 60fps with 50+ nodes; showcase initial load < 2s; studio cold mount (no heavy 3D) < 1s. (Inherits PANELFLOW §9.1 budgets.)
- NFR-2 (accessibility): Keyboard navigation (Tab/Esc/Enter), visible focus, `aria-label` on icon-only controls, command palette fully keyboard-navigable; contrast 4.5:1 normal / 3:1 large text. (Inherits PANELFLOW.)
- NFR-3 (portability): Every module is copy-paste portable into another React project with minimal, listed dependencies and no ARTINOS/PANELFLOW hard lock-in for the module's own logic. Modules follow the compact philosophy (one strong file > many weak ones).
- NFR-4 (compatibility): Modern evergreen browsers; 3D/shader modules use the `TSL → WebGPU → WebGL2 → WebGL` pipeline with capability detection and graceful fallback; React 18/19.
- NFR-5 (local-first): Studio works fully offline with no backend, account, or network dependency for core flows.
- NFR-6 (quality bar): Output reads as premium/intentional (ReactBits / 21st.dev / Framer / Spline tier); converted work preserves and elevates original identity, never flattens it. Visual QA gate (AGENTS.md §6) applies to all visual work.

## 7. Edge cases & error states

- EC-1: Module registered with an incomplete schema → showcase renders what it can and shows a validation warning; entry marked incomplete.
- EC-2: Converted module's runtime dependency missing/incompatible → showcase surfaces a clear dependency error in-panel; studio stays up.
- EC-3: Duplicate module id on registration → registry rejects or warns; no silent overwrite.
- EC-4: WebGPU unavailable → 3D modules fall back per the render pipeline or show a capability notice; no crash.
- EC-5: Module source/preview path moved or renamed → index regeneration flags the broken link.
- EC-6: Showcase opened while its component is unmounted → control panel falls back gracefully (PANELFLOW self-contained contract).
- EC-7: Source for a conversion can't be located or is incompatible → the agent reports BLOCKED with evidence instead of inventing a generic replacement (AGENTS.md).
- EC-8: Two modules with overlapping responsibility detected → reuse-first checklist surfaces the existing one before a duplicate is built.

## 8. Dependencies & integrations

- **PANELFLOW** (`@artinos/panelflow`, local workspace/file dependency) — panel OS, editor dock, control-panel engine (`registerComponent`/auto-panel/bridge), graph canvas, glass design system, command palette. The single source of truth for panels/controls/design.
- **React 19 + Vite + TypeScript + Tailwind v4** — Studio app stack (mirrors PANELFLOW's stack for compatibility).
- **Three.js (r184+) / TSL / WebGPU / R3F / three-stdlib** — per-module, for 3D/shader modules only; not core studio deps.
- **The coding agent (Claude Code) + converter workflow/skill** — operates the studio; reads/writes registry files and agent metadata.
- **Local filesystem + git** — registry persistence and versioning; no DB or server in v1.

## 9. Constraints & assumptions

- Single-user, local-first; no auth/accounts/cloud in v1 (confirmed).
- Registry is local file-based metadata + generated index; files are the source of truth (confirmed).
- "Agent-operable" in v1 means structured machine-readable metadata + agent instructions + a discoverable index; the converter is a documented agent workflow/skill, not bespoke runtime (confirmed). MCP/tool endpoints are Post-MVP.
- PANELFLOW is treated as built and stable; ARTINOS does not re-implement panel/control/design systems.
- Studio app lives in `STUDIO/` and consumes PANELFLOW via workspace/file dependency.
- Compact module philosophy and the AGENTS.md constitution govern all builds (preserve identity, port directly, verify with proof, no placeholders).
- `Website/` (public surface) and module→package promotion are deliberately later.

## 10. Success metrics

Tied to goals; measured over the first quarter after the Studio MVP ships.
- M-1 (G-6) **Reuse rate**: ≥ 50% of new builds reuse or extend an existing module rather than duplicating one.
- M-2 (G-2) **Registry coverage**: 100% of built modules carry a complete, schema-valid registry entry and a showcase.
- M-3 (G-4) **Conversion fidelity**: converted modules pass a manual fidelity checklist with 0 unreported behavioral regressions vs the source.
- M-4 (G-3/G-4) **Time to showcase**: < 1 working day from accepted input to a working, registered showcase (agent-assisted).
- M-5 (quality) **Verification pass rate**: 100% of tasks marked done first pass build + preview + console checks before merge.
- M-6 (G-2) **Library growth**: ≥ 12 registered modules in the first quarter, with cross-links (`related modules`) present on the majority.

## 11. Rollout & risk

- **Phasing**: Ship the **Studio MVP** first (FR-1–FR-8, FR-10–FR-20 at MVP phase): studio shell on PANELFLOW → file-based registry + gallery → showcase routing with control-engine controls → one real end-to-end conversion → agent metadata + reuse-first loop + sync checks. Then layer Post-MVP: graph-node exposure (FR-9), MCP tool endpoints (FR-21), public website (FR-22), package promotion (FR-23).
- **Risk — PANELFLOW coupling**: the Studio depends on PANELFLOW's evolving API. Mitigation: pin the workspace dependency and treat PANELFLOW's `export.ts` as the contract; if a needed capability is missing, fix it in PANELFLOW, not by forking logic into the Studio.
- **Risk — registry drift**: file-based entries can fall out of sync with source. Mitigation: index regeneration + a sync check (FR-20) in the build/verify loop.
- **Risk — conversion fidelity loss**: rewriting instead of porting flattens identity. Mitigation: AGENTS.md §4 port-direct discipline + the fidelity checklist (M-3).
- **Risk — scope creep into multi-user/marketplace**: explicitly fenced by NG-2/NG-3 and the Post phase.
- **Fallback**: if the converter workflow proves too broad for v1, narrow FR-14's accepted input set to the proven types (component, R3F scene, shader, repo) and defer the rest, keeping FR-16's single proven conversion as the bar.

## 12. Out of scope (for now)

- Multi-user, accounts, sharing, real-time collaboration.
- Hosted public marketplace, monetization, and the `Website/` public app.
- Database/server-backed registry and cloud persistence.
- Module → standalone npm package promotion.
- Custom agent sandbox/runtime and MCP tool endpoints.
- Graph-node exposure of every module (kept as a Post-MVP could).

## 13. Open questions

`/dev-spec-plan` resolves these first.
- Q-1: Exact registry entry file format and location convention — one co-located `*.registry.ts`/`.json` per module vs a single registry manifest the Studio imports? (Affects FR-5/FR-6 and the index generator.)
- Q-2: How does a module declare its parameter schema for showcases — reuse PANELFLOW's `ComponentSchema`/`registerComponent` directly as the canonical schema, or wrap it in an ARTINOS registry entry that references it? (Affects FR-5/FR-11.)
- Q-3: Workspace wiring mechanics for STUDIO → PANELFLOW — npm/pnpm workspaces vs a `file:` dependency vs path alias; and whether PANELFLOW is consumed as source or as its built `dist`. (Affects FR-2.)
- Q-4: Where does the converter workflow live and how is it invoked — a repo skill/command, an `AGENTS.md`-driven prompt, or a checklist doc the agent follows? (Affects FR-14.)
- Q-5: Minimum "complete registry entry" and "passing showcase" definitions for M-2/M-5 — the concrete validation rules the sync check enforces.
- Q-6: Seed set — which existing assets become the first registered modules (PANELFLOW's GooeySlider/BubbleRatingSlider/ElasticMenu, plus the WebGPU Fluid Simulation conversion), to hit M-6 and prove the loop.
