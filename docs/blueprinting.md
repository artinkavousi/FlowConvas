# High-Effort Blueprinting (Converter Step 7)

> The mandatory planning artifact of the converter pipeline. **Every** conversion (Mode A and Mode B)
> writes a blueprint **before any code**. The blueprint is the contract between the strong planning model
> and whatever model executes it — it must be so granular that a **completely blind downstream agent**
> can build the whole conversion from the blueprint alone, with no further instructions or context.
>
> Read with [`docs/converter-pipeline.md`](converter-pipeline.md) (the 11-step pipeline) and
> [`docs/module-and-lab-standards.md`](module-and-lab-standards.md) (the module/Lab contract). Template:
> [`docs/templates/blueprint.template.md`](templates/blueprint.template.md).

---

## 1. Why it exists

Planning quality determines execution quality. Front-loading the hard thinking under the strongest model
lets execution run cheaply and faithfully. The blueprint captures **all** of the analysis (steps 1–6) —
deep source reading, system triage, the TSL-pipeline decision, the decomposition map, harvested assets,
and every architecture choice — and turns it into an explicit, file-by-file, function-by-function build
plan. If the executing agent ever has to *infer* something, the blueprint failed.

---

## 2. When & where

- **When:** at pipeline step 7, after analysis/triage/decomposition/cross-checking/harvesting (steps
  1–6) and **before** any implementation (steps 8–11).
- **Where:** `docs/conversions/<id>-conversion-plan.md`, where `<id>` is the kebab-case conversion id
  (the Lab id for Mode B, the module id for Mode A). Keep it **flat** — one file per conversion, no
  nested per-id folder.
- **Scope:** mandatory for both modes. A Mode A blueprint is shorter (one module) but still complete; a
  Mode B blueprint covers every canonical module **and** the Lab capsule.

> The append-only project ADR log stays at [`spec/decisions.md`](../spec/decisions.md). Optional
> per-conversion research can sit beside the plan as `docs/conversions/<id>-research.md`.

---

## 3. What "blind-executable" requires

A blueprint passes only if a competent stranger with **only this repo and this file** could finish the
conversion correctly. Concretely it must specify:

- **An at-a-glance Overview section at the very top** (before the deep detail) — a clean, minimal,
  scannable summary so a reader instantly understands the plan: a one-line "what", the mode/status, and
  three short lists — **decomposed modules** (clean name · category · status), **reuse** (existing
  modules to extend, not duplicate), and **direct copy** (files harvested near-verbatim from the source).
  This is the first thing in every conversion plan; the detailed sections follow.
- **Exact file plan** — how many files, exact paths/filenames, and what each file is for. Use clean
  names with **no `.module` infix** (`<Feature>.ts`/`.js` runtime, `<Feature>.showcase.tsx`,
  `<Feature>.meta.ts`). Honor the split guardrails (step 8): every file must earn its place by
  standalone reuse/testability.
- **Per-file contents** — for each file: its public exports, the classes/functions it defines, and the
  order of sections (imports → types → constants → helpers → main → exports).
- **Function-level detail** — for each non-trivial function: signature, **explicit parameters** (name +
  type + meaning), **exact return value/type**, side effects, and the source lines it ports from.
- **Render / hardware details** — renderer (`WebGPURenderer` vs `WebGLRenderer`), TSL vs GLSL, animation
  loop (`setAnimationLoop` vs rAF), buffer formats, ping-pong/compute layout, resize/`dispose()` paths,
  capability checks and fallbacks, and any GPU constraints.
- **TSL-triage decision** — whether the source is rebuilt on TSL or ported on its original pipeline, and
  **why** (record the deferral reason if TSL is skipped). Note operator rewrites (`+ *` → `.add().mul()`).
- **The `ArtinosModule` entry plan** — id (`=== schema.id`), category path, every `schema.parameters`
  item (key/label/type/default; min/max/step), `dependencies`, `presets`, `related`, and the `agentNotes`
  text.
- **Mode B Lab plan** — the capsule layout, which canonical modules get snapshotted into
  `labs/<id>/modules/`, the `local/` project-specific files, the composition wiring (`create<PascalId>Lab.js`),
  and provenance for each snapshot.
- **Fidelity & provenance** — the exact source paths each module is ported from, what is preserved
  verbatim, and any planned/unavoidable deviation.
- **Ordered task checklist** — dependency-ordered todos, each naming its files, the pattern to mirror,
  what is out of scope, and its acceptance check (command + expected result).
- **Validation plan** — the DoD gates: `check-registry`, `lint`, live preview with a control driving it,
  zero console errors, side-by-side fidelity.

---

## 4. Quality bar (self-check before handing off)

- [ ] Could a model with **no other context** execute every step without asking a question?
- [ ] Is every file named, scoped, and justified against the split guardrails?
- [ ] Does every non-trivial function have a signature, params, and return value?
- [ ] Are renderer/TSL/loop/buffer/dispose details explicit?
- [ ] Is the reuse-first result recorded (what already exists; what is genuinely new)?
- [ ] Is each module's source provenance and fidelity plan stated?
- [ ] Is the `ArtinosModule` entry fully specified (incl. schema params + `agentNotes`)?
- [ ] For Mode B: is the Lab capsule + snapshots + composition fully specified?
- [ ] Is there a dependency-ordered task checklist with per-task acceptance checks?

If any box is unchecked, the blueprint is not done — fix the blueprint, don't push the gap downstream.

---

## 5. Relationship to the global spec pipeline

The global `/DEV/spec-*` pipeline (PRD → plan → tasks) is for **building features**. The converter
blueprint is the converter's equivalent of plan+tasks, specialized for porting a source into modules + a
Lab. For a large multi-source effort you may still run a higher-level PRD/research first, but every
individual conversion lands its own `docs/conversions/<id>-conversion-plan.md`.
