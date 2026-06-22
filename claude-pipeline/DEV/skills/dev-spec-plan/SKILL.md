---
name: dev-spec-plan
description: Turn a PRD/spec into a well-designed architecture plus dependency-ordered, self-contained tasks that a cheaper model can implement without re-reasoning, then gate-check that the plan is implementation-ready. Stage 2 of the spec pipeline. Use whenever the user wants to plan a build, design the architecture, break work into tasks/todos/epics, or asks "how should we build this". Reads spec/prd.md (and spec/research.md); writes spec/plan.md, spec/tasks.md, spec/decisions.md. Run under Opus.
---

# spec-plan

Stage 2 of the spec pipeline. Convert `spec/prd.md` into an executable plan and a
set of ready-to-build tasks. The point is to do the hard thinking now so execution
becomes mechanical. Best on Opus.

## Steps

1. **Read inputs.** Read `spec/prd.md` and `spec/research.md` if present. If the PRD
   is missing, tell the user to run `/dev-spec-prd` (or offer to). In a repo, read the
   relevant existing code so the plan fits reality. Resolve the PRD's open questions
   with the user before planning around them.

2. **Design — write `spec/plan.md`** from `references/plan-template.md`: approach,
   architecture (modules, data model, public interfaces, data flow), key decisions
   with alternatives, risks with concrete mitigations, the test/verification
   strategy, and observability. Honor the repo's conventions and any active
   architecture skill; prefer the smallest structure that satisfies the
   requirements and say where you deliberately kept it simple. For UI work, set a
   design direction (don't default to generic "AI slop" layouts).

3. **Decompose — write `spec/tasks.md`** from `references/task-template.md`. This is
   the deliverable that decides whether a cheap model executes cleanly:
   - Break work into tasks each completable in ~one sitting.
   - **Size each task** S/M/L. Any L gets split before handoff — oversized tasks are
     the main cause of execution drift.
   - **Order by dependency.** For larger efforts, group tasks under **epics**, and
     mark independent tasks as **parallel-safe waves** (disjoint files) so multiple
     executors or worktrees won't collide.
   - Make every task **self-contained** (see the rule below) and trace it to FR-IDs.

4. **Log decisions** in `spec/decisions.md` — one short ADR entry per non-obvious
   choice (context → decision → consequences). Append; never rewrite history.

5. **Readiness gate — self-assess before handing off.** Score the plan against the
   readiness checklist and emit a verdict:
   - **PASS** — hand off to `/dev-spec-build`.
   - **CONCERNS** — proceed, but list the risks to watch, attached to the tasks.
   - **FAIL** — stop; name what's missing and fix it (usually underspecified tasks
     or an unresolved PRD question) before building.
   State the verdict explicitly to the user.

## The self-contained task rule (the crux)

A weak executor can only follow; it can't reconstruct intent. Every task carries,
with no reference to this conversation: exact **files**, the **interface/signature**,
the existing **pattern** to mirror, what's **out of scope**, the **acceptance** check
(test/command + expected result), and its **dependencies**. Test each task: *could a
competent stranger with only this repo and this entry finish it correctly?* If no,
it's underspecified — enrich it. That enrichment is the product of this stage.

## Readiness checklist

- [ ] Every FR maps to at least one task; every task traces to an FR.
- [ ] No task is sized L (all split to S/M).
- [ ] Each task passes the self-contained test above.
- [ ] Dependencies are acyclic and ordered; parallel-safe tasks touch disjoint files.
- [ ] The test/verification strategy is defined and each task names its check.
- [ ] No PRD open question still blocks the first wave.

## Gotchas

- **Don't over-architect.** Add a layer only when a requirement or a second caller
  forces it; a reviewer-style "what if we also…" is how 50 lines become 500.
- **Sequencing is the silent killer.** A task that depends on something not yet
  built will stall a cheap executor — verify the order before emitting tasks.
- **Acceptance must be runnable.** "Works correctly" is not a check; name the test
  or command and the expected output.

## Quality bar

The plan is good when execution requires following, not deciding. Architecture is
minimal and justified; risks name a concrete mitigation; the gate verdict is honest.
