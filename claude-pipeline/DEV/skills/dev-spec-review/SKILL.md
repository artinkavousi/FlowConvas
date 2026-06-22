---
name: dev-spec-review
description: Review current changes against the plan and tasks before calling work done, with a severity-ranked report. Stage 4 of the spec pipeline. Use whenever the user wants a review, a correctness check, to verify a task or feature is actually complete, or before opening a PR. Checks the diff against spec/tasks.md acceptance criteria, the Definition of Done, and scope. Best run in a fresh context, or delegated to a subagent in Claude Code.
---

# spec-review

Stage 4: an independent check before "done". The value comes from fresh eyes —
a new session, or a Claude Code subagent that sees only the diff and the criteria,
not the reasoning that produced the change.

## Steps

1. **Gather the target.** Get the diff (`git diff` or a named range) and read
   `spec/tasks.md` and `spec/plan.md` for the criteria.

2. **Delegate when possible.** In Claude Code, hand the review to a subagent with a
   clean context; otherwise review directly. Either way, judge the diff on its own terms.

3. **Check, in this order:**
   - **Definition of Done:** for each task marked `[x]`, does its acceptance check
     actually pass? Run it and cite the output.
   - **Requirements:** does the change satisfy the FRs the tasks claim?
   - **Scope:** did anything change outside what the tasks named?
   - **Correctness:** real bugs, broken edge cases, missing error handling.
   - **Plan fidelity:** does it match `spec/plan.md`, or did it drift? Drift isn't
     automatically wrong — flag it for a decision.

4. **Report findings ranked by severity:**
   - **Blocker** — wrong, broken, or out of scope; must fix before done.
   - **Major** — a real gap or risk worth fixing now.
   - **Minor** — small correctness improvement.
   For each: what, where, why it matters, and the smallest fix.

## What NOT to flag

A reviewer told to find problems will manufacture them. Report only correctness,
requirement, scope, and DoD issues. Do **not** suggest extra abstraction,
speculative generality, tests for impossible states, or style preferences — those
create the over-engineering the pipeline exists to avoid. If the diff meets the
criteria and has no real bug, say so plainly and stop.

## Gotchas

- **Fresh context is the whole point.** Reviewing in the session that wrote the code
  inherits its blind spots — start clean or use a subagent.
- **Run the checks, don't eyeball them.** Cite real output; a claimed pass isn't one.
- **Severity discipline.** Don't inflate a style nit to a blocker, or bury a real
  bug among minors.
