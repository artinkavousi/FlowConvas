# Completion Plan — ARTINOS v0.3 → v1 (close all gaps)

> Companion to `spec/plan.md` (the MVP plan). This plan closes the gaps found in the
> 2026-06-23 ground-truth audit (ran lint/build/check-registry/live-preview, not doc-trust).
> Execute with `/dev-spec-build`. Tasks live in `spec/tasks-completion.md`.
> Conventions, fidelity rules, and the verify loop follow the root `AGENTS.md` and `STUDIO/AGENTS.md`.

---

## 1. Where we are (verified, not assumed)

**Working (proven by running it):** `tsc` clean · `vite build` green (2743 modules) · `check-registry` 4/4 ·
live studio renders the WebGPU fluid on a real canvas with **zero** console errors/warnings.
Architecture pivoted to a live-viewport + multi-panel dock (ADR-14→17); the fluid module was
re-expanded to full fidelity (audio, 15+ emitter types, 18 presets, 111 controls) — beyond MVP scope.

**Goal achieved ≈ 40-45%.** Foundation + the flagship conversion are real. Breadth and the agent
layer are missing.

### Gap ledger (what this plan closes)

| # | Gap | PRD ref | Phase |
|---|-----|---------|-------|
| G-1 | ~10K lines of v0.3 work **uncommitted**; one fragile state | §13 sync discipline | 0 |
| G-2 | `spec/tasks.md`/`plan.md` describe deleted Gallery/Showcase + "stripped fluid" — docs lie about code | §13 | 0 |
| G-3 | No ADRs for the v0.3 fluid re-expansion / panel pivot rationale beyond ADR-14-17 stubs | — | 0 |
| G-4 | No **Console/diagnostics panel** | §6.1 | 1 |
| G-5 | Validation-status not surfaced; FR-12 responsive + FR-13 degrade unverified in panel model | FR-12, FR-13, FR-18 | 1 |
| G-6 | Library is **4 modules** vs ≥12 target; no 3D-scene / shader / particle / post-fx categories | M-6, FR-5/§13 | 2 |
| G-7 | Modules are **not graph nodes** (engine exists, unwired) | FR-9 | 3 |
| G-8 | No **Agent panel**; agent-operability is metadata-only | §6.1, FR-18/19 | 3 |
| G-9 | No agent-callable **tool endpoints (MCP)** | FR-21 | 3 |
| G-10 | No public **Website/** gallery (empty folder) | FR-22 | 4 |
| G-11 | No **package-promotion** criteria/workflow | FR-23 | 4 |

---

## 2. Design decisions for the new work

These extend the MVP ADRs; each becomes a numbered ADR in `spec/decisions.md` when built.

- **D-A · Graph-node exposure is a generated adapter, not hand-authored nodes (FR-9).**
  A single `moduleToNode(module)` adapter maps an `ArtinosModule` → PANELFLOW `NodeDefinition`
  (params from `schema.parameters`, one output port for the preview, `registerNode` at registry build).
  Modules stay graph-agnostic; no per-module node files. Mirrors ADR-6 (glob → register).

- **D-B · The Agent panel reads the registry; it does not embed an LLM.**
  A dock panel (`agent.panel.tsx`) renders the registry as agent-facing JSON (id, category, tags,
  `agentNotes`, usage, deps, validation) with copy actions + a reuse-first checklist view. It is the
  human-visible face of FR-18/19 — discovery and copy, not generation.

- **D-C · MCP endpoints wrap the existing registry/scripts, no new source of truth (FR-21).**
  A small local stdio MCP server (`STUDIO/scripts/mcp-server.ts`) exposes `list_modules`,
  `search_modules`, `get_module`, `scaffold_module` (reuse `new-module.ts`), `check_registry`
  (reuse `check-registry.ts`). Files remain canonical (ADR-2). Ships as an opt-in, documented tool.

- **D-D · The Console panel is a thin console/error mirror + runtime status, not a logging framework.**
  `console.panel.tsx` taps `console.*` + `window.onerror`/`unhandledrejection` into a ring buffer,
  shows WebGPU/dependency capability status, and the active module's validation badge. Satisfies the
  §6.1 console panel and folds FR-13's degrade notices into one place.

- **D-E · Website is a static reader of the same registry (FR-22), build-time generated.**
  `Website/` is a minimal Vite/React app (or Astro) that imports the registry index and renders a
  public, copy-first gallery. Read-only; no studio runtime. Reuse over rebuild — share the registry
  types and module metadata, not the live previews (those stay studio-only for v1).

- **D-F · Library breadth grows by converter discipline, one category at a time (G-6).**
  Each new module follows `spec/converter-workflow.md` + `STUDIO/AGENTS.md` DoD (check-registry green +
  build/preview/console proof). Target the missing categories so the registry proves it is multi-domain,
  not just UI: **3D scene, TSL shader, particle field, post-processing, 2-3 premium UI blocks**.

---

## 3. Phasing & sequence

```
Phase 0  Stabilize        G-1 G-2 G-3        (commit + doc re-sync + ADRs)         — blocks nothing downstream but must land first
Phase 1  Studio complete  G-4 G-5            (console panel, validation, responsive/degrade QA)
Phase 2  Library breadth  G-6                (4 → 12+ modules across categories)   — runs parallel to Phase 1 after P0
Phase 3  Agent layer      G-7 G-8 G-9        (graph nodes, agent panel, MCP)       — needs P2's richer registry to be meaningful
Phase 4  Reach            G-10 G-11          (public website, package promotion)   — last; reads everything above
```

Phase 2 (content) and Phase 1 (studio chrome) touch disjoint files and can interleave. Phase 3 is
most valuable once the registry has ≥10 varied modules (Phase 2). Phase 4 is the public surface.

---

## 4. Risks & mitigations

- **R-A · Uncommitted v0.3 lost before P0 lands.** Mitigation: Phase 0 Task 1 commits first, before any
  new edits. (Push requires user authorization — call out, don't auto-push.)
- **R-B · Doc re-sync drifts again.** Mitigation: keep `spec/tasks.md` as the historical MVP record;
  track all new work here + in `spec/tasks-completion.md`; ADRs append-only.
- **R-C · MCP/agent endpoints scope-creep into a runtime.** Mitigation: D-C wraps existing scripts only;
  no new persistence, no codegen.
- **R-D · New 3D/shader modules tank perf or break WebGPU-less machines.** Mitigation: D-D capability
  status + FR-13 degrade notices; NFR-1 budgets enforced in the verify step per module.
- **R-E · Website duplicates the studio.** Mitigation: D-E read-only static reader sharing registry
  metadata; no live preview runtime copied.

---

## 5. Definition of Done (this plan)

Done when: every gap G-1…G-11 has a landed task with shown evidence; `check-registry` is green with
**≥12 modules across ≥4 categories**; the studio shows a Console panel + Agent panel; modules appear as
graph nodes; the MCP server answers `list/search/get/scaffold/check`; `Website/` renders the registry;
a package-promotion doc exists; and `spec/tasks.md`/`decisions.md` truthfully reflect the code.
"It runs" is not done — each task shows build/preview/console proof per `STUDIO/AGENTS.md`.
