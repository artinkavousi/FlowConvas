# ARTINOS Documentation

> The single, centralized home for ARTINOS project documentation. This hub is **canonical** — when
> anything elsewhere disagrees with a doc here, the doc here wins. The root `AGENTS.md`, root `MEMORY.md`,
> and `STUDIO/AGENTS.md` are slim operating files that **point into** this hub.

---

## Read in this order

1. **[AGENTS.md](../AGENTS.md)** (repo root) — the operating constitution: prime directive, reuse-first,
   port directly, verify with proof, completion gate. Read before every task.
2. **[product.md](product.md)** — what ARTINOS is and why: vision, problem, principles, registry schema,
   non-goals, success metrics, resolved decisions, roadmap.
3. **[architecture.md](architecture.md)** — how it's wired: STUDIO ↔ PANELFLOW boundary, the file-based
   registry, the control/bridge pipeline, the real folder structure, visual identity, verification gates.
4. **[converter-pipeline.md](converter-pipeline.md)** — the **single source of truth** for the module
   converter: the 11-step pipeline (incl. TSL triage, asset harvesting, mandatory blueprinting), the two
   modes, code-integrity rules, validation, and the report format.
5. **[module-and-lab-standards.md](module-and-lab-standards.md)** — the authoring contract: the JSM/ESM
   self-contained module standard, the `ArtinosModule` entry, naming, category paths, the Lab capsule
   standard, provenance/sync, and module→package promotion.
6. **[blueprinting.md](blueprinting.md)** — converter step 7: the mandatory `docs/conversions/<id>-conversion-plan.md`
   artifact + its quality bar. Template: **[templates/blueprint.template.md](templates/blueprint.template.md)**.

---

## Documentation map

| Topic | Canonical doc |
|---|---|
| Operating rules / agent constitution | [`AGENTS.md`](../AGENTS.md) (root) · [`STUDIO/AGENTS.md`](../STUDIO/AGENTS.md) (Studio-specific) |
| Fast memory index | [`MEMORY.md`](../MEMORY.md) (root) |
| Product vision & requirements | [`docs/product.md`](product.md) |
| System architecture | [`docs/architecture.md`](architecture.md) |
| Module converter pipeline | [`docs/converter-pipeline.md`](converter-pipeline.md) |
| Module & Lab standards / contract | [`docs/module-and-lab-standards.md`](module-and-lab-standards.md) |
| Blueprinting (step 7) + template | [`docs/blueprinting.md`](blueprinting.md) · [`docs/templates/blueprint.template.md`](templates/blueprint.template.md) |
| Accepted decisions (ADR log) | [`spec/decisions.md`](../spec/decisions.md) (append-only) |
| Per-conversion blueprints | `docs/conversions/<id>-conversion-plan.md` |
| Feature/conversion plans (in flight) | `spec/<feature>/` (e.g. `spec/inspector/`, `spec/aurora/`) |
| PANELFLOW package | [`PANELFLOW/README.md`](../PANELFLOW/README.md) · `PANELFLOW/DOCS/*` |
| MCP server | [`STUDIO/MCP.md`](../STUDIO/MCP.md) |
| Executable converter skill | [`.claude/skills/artinos-module/`](../.claude/skills/artinos-module) |

---

## What lives where (and what doesn't)

- **`docs/`** — durable, canonical product/architecture/pipeline documentation. Centralized here.
- **`spec/`** — working artifacts: the append-only ADR log (`decisions.md`), per-conversion blueprints
  (`conversions/<id>/blueprint.md`), and in-flight feature plans (`inspector/`, `aurora/`, the legacy
  `*-modeb-conversion-plan.md` records).
- **Root `AGENTS.md` / `MEMORY.md`** — kept at root by convention (external agentic tools and the harness
  read them there). They stay slim and defer to `docs/`.
- **`PANELFLOW/DOCS/`** — the PANELFLOW package's own docs (owned by the package).

---

## Doc governance

- **One source of truth per topic.** Don't restate a rule in two docs — link to the canonical one. Copies
  drift.
- **The converter doc wins.** If a spec, skill, or note disagrees with
  [`converter-pipeline.md`](converter-pipeline.md), update the other to match.
- **ADRs are append-only.** Record new decisions in [`spec/decisions.md`](../spec/decisions.md); never
  rewrite history. Summarize durable ones in root `MEMORY.md`.
- **Keep it accurate.** When code changes a documented behavior, update the doc in the same change.

*Lineage: this hub supersedes the former root `ARTINOS-PRD.md`, `ARTINPRD MODULE CONVERTER.md`, scratch
`notes.md` / `notes - Copy.md`, and the `spec/{prd,plan,tasks,converter-workflow,promotion-workflow,plan-completion,tasks-completion}.md`
documents (removed; recoverable via git history).*
