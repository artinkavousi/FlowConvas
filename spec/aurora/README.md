# AURORA → ARTINOS conversion — plan docs

`ref/AURORA` (internal name **"Flow"**) is a realtime **MLS-MPM** particle-fluid simulation on the
Three.js `WebGPURenderer`, styled after Refik Anadol's digital artwork, then heavily extended into a
full creative tool (audio reactivity + AI music analysis, multi-pass postFX, glass-lens overlay,
multi-mode particle renderer, force fields, emitters, boundaries, a glassmorphic Tweakpane UI).

This is a **Mode B** conversion (full project → reusable canonical modules **+** a faithful Lab
replica), run through `/artinos-module` and the converter pipeline (`docs/converter-pipeline.md`,
single source of truth; contract in `docs/module-and-lab-standards.md`).

> ⚠️ **Canonical plan moved.** Per the 11-step pipeline (step 7), the authoritative, blind-executable
> blueprint now lives at **[`spec/conversions/aurora/blueprint.md`](../conversions/aurora/blueprint.md)**.
> The files below are the earlier draft (analysis + ADR log) kept for reference — when they differ from
> the blueprint, **the blueprint wins**.

| Doc | What it is |
|-----|-----------|
| [research.md](research.md) | Source analysis: what AURORA is, its systems, line sizes, what to drop. |
| [plan.md](plan.md) | The decomposition map, module inventory, Lab capsule layout, dependency graph, gated phases, DoD. |
| [tasks.md](tasks.md) | Dependency-ordered, self-contained build tasks (one phase = one gated batch). |
| [decisions.md](decisions.md) | ADR-lite log of conversion decisions. |

**Status:** planning complete; build not started. Execution is phased (Phase 1 → 6), each phase
ending green on `npm run check-registry -w STUDIO` + `npm run lint -w STUDIO` + a live control driving
the preview with zero console errors. See [tasks.md](tasks.md).
