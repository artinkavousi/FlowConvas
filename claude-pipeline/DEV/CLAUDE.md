<!-- BEGIN spec-pipeline -->
# Spec pipeline (global)

A universal, project-agnostic workflow for turning any idea into clean docs, a
well-designed plan, and self-contained tasks that a cheaper model can implement
without re-reasoning. Six commands, one `spec/` folder per project.

## The flow

```
/dev-spec-research → spec/research.md     prior art, options, tradeoffs   (Opus + web)
/dev-spec-prd      → spec/prd.md          what & why                      (Opus)
/dev-spec-plan     → spec/plan.md         how, design, risks, readiness   (Opus)
                 spec/tasks.md         dependency-ordered, self-contained tasks
                 spec/decisions.md     ADR-lite log
/dev-spec-build    → implement next task + verify                          (Sonnet/Haiku)
/dev-spec-review   → review the diff against the tasks                     (fresh context)
/dev-spec-feature  → add a feature to an in-flight project, wired in       (Opus → Sonnet)
```

Each stage reads what the previous stage wrote, so the chain survives `/clear`.
Artifacts always live under `spec/` at the repo root. Research is optional;
start at `/dev-spec-prd` for well-understood work.

## Model assignment

Planning quality determines execution quality. Spend the expensive model where it
pays off and the cheap one where it doesn't.

- `/dev-spec-research`, `/dev-spec-prd`, `/dev-spec-plan`, planning in `/dev-spec-feature` → **Opus**.
- `/dev-spec-build` and execution → **Sonnet**; **Haiku** for pure boilerplate.
- Easiest: start with `/model opusplan` — Opus plans, Sonnet executes, auto-routing
  back to Opus when a step needs re-planning.

## The rule that makes cheap-model execution work

A task is ready to hand off only if it is **self-contained**: it names the exact
files, the interface/signature, the existing pattern to mirror, what is out of
scope, and the acceptance check (test/command + expected result). Test each task:
*could a competent stranger with only this repo and this entry finish it
correctly?* If no, it's underspecified — fix the task, don't push it.

## Definition of Done (applies to every task)

A task is done only when: its acceptance check passes (with evidence shown), it
changed nothing outside its stated scope, the change matches the repo's
conventions, and `/dev-spec-review` finds no blocking issue. "It runs" is not done.

## Scale to the work

The artifacts are an upper bound, not a quota. A 3-task feature doesn't need
epics, waves, or a research stage. Drop sections that don't apply and say why.
Skip the pipeline entirely for trivial work (a typo, a rename, a one-line fix).

## Operating principles (all stages, all models)

- **No silent assumptions.** Verify your mental model before changing code; ask
  when a requirement is ambiguous rather than guessing.
- **Minimal solution first.** Don't turn 50 lines into 500. Add abstraction only
  when a second real caller exists.
- **Stay in scope.** Touch only what the task names. Flag adjacent problems;
  don't fix them unasked.
- **Verify before "done".** Show evidence — the command and its output, the
  passing test, the screenshot — not an assertion.
- **Match the repo.** Follow existing conventions and structure over defaults.
<!-- END spec-pipeline -->
