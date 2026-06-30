# ARTINOS — Product Vision & Requirements

> The canonical product document: what ARTINOS is, why it exists, its principles, the registry schema,
> non-goals, success metrics, resolved open questions, and the roadmap. System design lives in
> [`docs/architecture.md`](architecture.md); the converter lives in
> [`docs/converter-pipeline.md`](converter-pipeline.md).

---

## 1. Overview

ARTINOS is a **single-user, local-first creative studio, registry, converter, and agent-operable build
system** for reusable interactive visual modules: React components, animated UI blocks, landing
sections, Three.js/R3F scenes, TSL shader modules, WebGPU effects, and full interactive pages. It is
**not** a conventional component library, a static gallery, or a one-shot code generator. It is a
**studio + registry + converter + showcase + agent workflow**, designed so that anything built or
imported into it — a component, a shader, a scene, a page — becomes a permanent, documented, reusable
asset with a live showcase and a machine-readable registry entry, never a disposable demo.

ARTINOS accepts almost any input — a rough idea, a full PRD, a visual reference, a local project, a
GitHub repo, a Three.js demo, a single React component, a raw shader, or a WebGPU/TSL experiment — and
turns it into a clean, decomposed, registered, showcased, agent-readable module (and, for full projects,
a faithful Lab replica) inside one continuously growing library.

The Studio UI is built on **PANELFLOW** (`@artinos/panelflow`, already built), which provides the panel
OS, editor dock, auto-generated control panels, graph canvas, and glass design system.

---

## 2. Vision

Build one synchronized master library where every reusable interactive visual component, page, 3D
system, shader, and creative pattern lives together, stays in sync, and can be rediscovered and reused
across all future projects — by a human or by an AI coding agent — without re-deriving the same work
twice.

---

## 3. Problem

Every existing tool solves one slice and none solve the whole. Component libraries (MUI, Chakra) are
black-box dependencies with no 3D/shader concept. shadcn/ui gave code ownership but stops at flat
React/Tailwind. ReactBits / 21st.dev are galleries you copy from, not workspaces you edit, convert, or
operate. Framer Marketplace solves reuse but is locked to Framer's runtime. Spline does browser 3D but
isn't code-first or agent-operable. Three.js/TSL/WebGPU give raw power but no studio, no registry, no
reuse discipline — every project restarts from zero. The cost: the same interactive systems get
re-derived repeatedly, useful work stays trapped in one-off demos, and neither a human nor an AI agent
can rediscover and reuse what already exists.

ARTINOS merges the strengths of all of these into one agent-operable, continuously growing library:
**owned source** (shadcn) + **polished interactive components** (ReactBits) + **a discoverable registry**
(21st.dev) + **a marketplace-style reuse flow** (Framer) + **browser-based 3D authoring** (Spline) +
**high-end shader/WebGPU power** (Three.js/TSL).

---

## 4. Core principles

1. **Nothing is a one-off.** Every accepted idea, repo, or demo resolves into a reusable library asset.
2. **Studio first, packages later.** ARTINOS is one integrated Studio app with compact modules; code is
   promoted to a standalone package only after proven reuse across multiple real projects.
3. **Ownership over abstraction.** Modules are real, readable, copy-pasteable source — not framework
   lock-in, premature packages, or fake abstraction layers.
4. **Agent-operable by design.** Every module, registry entry, and showcase carries metadata an AI
   coding agent can read, discover, and act on.
5. **Continuous compounding growth.** The library gets measurably smarter with every module added —
   reuse, not duplication, is the growth engine.
6. **Premium visual bar.** Output quality sits alongside ReactBits, 21st.dev, Framer, and Spline — never
   generic admin-dashboard or starter-template visuals.

---

## 5. What the system does (capabilities)

- **Studio interface** — a single visual workspace: live viewport stage, dock panels (Scene Settings,
  Inspector, Library, Lab Capsules), graph canvas (optional), console/diagnostics, Agent panel, module
  converter. See [`docs/architecture.md`](architecture.md).
- **Reusable block registry** — a file-based registry scoped beyond UI to every category of reusable
  creative asset (UI components, animated blocks, 3D scenes, shaders, TSL/WebGPU modules, materials,
  particles, panels, interaction systems, layout templates, mini apps). Schema in §7.
- **Ownership model** — components are owned source the user can modify directly (shadcn-style), not
  version-locked dependencies.
- **3D / shader / WebGPU block system** — code-first, agent-operable, Spline-style live authoring:
  Three.js (r184+), TSL, WebGPU, R3F where it adds value, materials/particles/postfx, and self-contained
  "scene capsules" bundling a scene with its controls and presets.
- **Module converter** — turns any input into a registered, showcased module (and, for projects, a
  faithful Lab). The full 11-step pipeline is [`docs/converter-pipeline.md`](converter-pipeline.md).

---

## 6. Intelligent decomposition model

For every input, classify the work into the correct layer(s) — without over-splitting, but with clear
separation of concepts (see the converter's smart-decomposition rule):

| Layer | Definition |
|---|---|
| **Reusable Component** | A small, self-contained React/UI/visual component |
| **Reusable Module** | A compact system with behavior, state, visuals, controls, and dependencies bundled together |
| **Showcase Page** | A polished demonstration of a module with full controls and real functionality |
| **Full App/Page / Lab** | A complete interactive page or faithful project replica composed from ARTINOS modules |
| **Runtime System** | A shared system reused across multiple modules (e.g. a WebGPU runtime) |
| **Registry Entry** | Metadata that lets ARTINOS and agents discover, preview, install, and reuse the module |
| **Node Definition** | An optional graph-node exposure of the module |

---

## 7. Registry schema

Every reusable module registers an `ArtinosModule` entry (full TypeScript contract in
[`docs/module-and-lab-standards.md`](module-and-lab-standards.md)):

| Field | Purpose |
|---|---|
| `id` / `name` | Unique kebab-case id (`=== schema.id`) + display name |
| `category` | Classification path (UI, 3D scene, shader, material, node, lab, …) |
| `description` | What it does and when to use it |
| `sourcePath` / `preview` | Owned-source location + live preview component |
| `dependencies` | Required packages and runtime requirements |
| `schema` / `presets` | PANELFLOW control schema + default presets |
| `tags` / `related` | Searchable keywords + cross-links to composable modules |
| `usage` | Copy-paste / install snippet |
| `agentNotes` | Agent-readable notes to use/extend without opening source |
| `validation` | Build/preview/console pass status |
| `version` / `updatedAt` | Versioning and freshness (ISO 8601 UTC) |
| `reuseNotes` | Known reuse patterns / provenance |

The registry powers gallery browsing, search, showcase routing, copy/install, AI-agent discovery, module
conversion, graph-node creation, and project generation.

---

## 8. Showcase, library sync & agent behavior

**Showcase** is automatic: registering an entry publishes a live, interactive preview + auto-generated
controls + usage to the gallery, graph, Agent panel, website, and MCP at once — no per-module page.

**Library sync** — the entry, source, and showcase move together. When source changes, its entry updates
with it; when a showcase reveals a reusable pattern, that pattern is extracted; when a project produces
something useful, it is captured as a module; no useful system stays trapped in a one-off demo.

**Agent behavior** — the agent operates as architect + designer + visual-systems engineer +
implementation engineer. For every task: understand intent → inspect structure → reuse-first → plan
decomposition → reuse existing modules → build the smallest strong version → register → showcase → keep
the library in sync → verify build/preview/console/behavior → report. The agent never builds isolated
one-off demos, ignores the library, duplicates systems, replaces custom systems with generic samples,
over-splits files, or claims "done" without verification.

**Reuse priority checklist (before building anything):** Is there already a similar module? Can an
existing one be extended? Should this be a new reusable module? A showcase? A registry entry? Inspector
controls? A graph node? Likely reused in future projects? ARTINOS grows through reuse, not duplication.

---

## 9. Non-goals

ARTINOS is **not**: a conventional UI-only component library · a static gallery of unreusable demos · a
black-box version-locked package system · a generic admin-dashboard/starter-template aesthetic · a pile
of deeply nested over-abstracted files · a one-shot code generator that discards context. Multi-user
collaboration, a backend/auth, a database-backed registry, and a bespoke converter runtime are explicit
v1 non-goals (deferred — see §11).

---

## 10. Success metrics

- **Reuse rate** — % of new builds that reuse an existing module rather than duplicating one.
- **Registry coverage** — % of built modules with a complete entry + showcase (trends to 100%).
- **Conversion fidelity** — how closely a converted module preserves the original behavior.
- **Time to showcase** — from accepted input to a working, registered showcase.
- **Verification pass rate** — % of "done" tasks that pass build/preview/console first.
- **Library growth curve** — rate at which module count and cross-module reuse increase.

---

## 11. Resolved open questions (decisions)

The PRD's original open questions are resolved by accepted ADRs (full text:
[`spec/decisions.md`](../spec/decisions.md)):

- **Single-user vs multi-user** → single-user, local-first in v1 (ADR-1). Multi-user deferred.
- **Persistence** → file-based registry, no database (ADR-2).
- **Agent operability** → structured metadata + documented workflow + MCP wrapping the file registry, no
  bespoke runtime/sandbox (ADR-3, ADR-19 D-B/D-C).
- **Control schema** → reuse PANELFLOW `ComponentSchema` (ADR-5).
- **Converter location** → a documented workflow + scaffold script, not a runtime (ADR-7).
- **Promotion criteria** → gated, criteria-driven, reversible module→package promotion (ADR-20; see
  [`docs/module-and-lab-standards.md`](module-and-lab-standards.md#promotion)).

---

## 12. Roadmap / open backlog

v0.3 → v1 closed the core loop (registry, showcases, converter, Agent panel, graph nodes, MCP, website).
Tracked next work:

- **Three.js r185 module extraction** — extract reusable WebGPU/TSL modules and complementary helpers
  from `REF/three.js-r185/examples/jsm` into the library (Mode B), and upgrade `three` to 0.185.
- **Inspector → PANELFLOW** — reimplement the r185 Inspector as React PANELFLOW panels (telemetry/scene),
  merged with existing inspector + performance monitoring. Plan: `spec/inspector/plan.md`.
- **Planned conversions** — AURORA (MLS-MPM "Flow", `spec/aurora/`) and other staged `REF/` projects.
- **First package promotion** — promote a proven core (e.g. `webgpu-fluid-sim`) once it meets the gate.

---

*Lineage: this document supersedes the former `ARTINOS-PRD.md` and `spec/prd.md`.*
