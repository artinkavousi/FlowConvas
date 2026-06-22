---
name: dev-spec-feature
description: Add a new feature, capability, or spec change to an already-in-flight project and wire it cleanly into the existing spec artifacts. Use whenever the user wants to add/implement a new feature, capability, requirement, or enhancement to an existing project mid-stream — phrases like "add support for X", "now I want it to also do Y", "implement this new feature", "we need a new spec for Z". Updates spec/prd.md, spec/plan.md, spec/tasks.md, spec/decisions.md consistently, then hands the new tasks to /dev-spec-build. Plan under Opus, build under Sonnet.
---

# spec-feature

The mid-project entry point. Runs a focused mini-cycle (scope → design → tasks) for
a single addition and stitches it into the existing `spec/` so nothing drifts out of
sync. Plan under Opus; execution can drop to Sonnet/Haiku.

## Steps

1. **Load project state.** Read `spec/prd.md`, `spec/plan.md`, `spec/decisions.md`,
   and `spec/tasks.md`. Skim the relevant existing code. If there's no `spec/`
   folder, this project wasn't built with the pipeline — offer to either bootstrap a
   minimal one (capture current state into a short PRD + plan) or just scope the
   feature on its own. Proceed per the user's choice.

2. **Scope the feature.** Brief interview (fewer questions than `/dev-spec-prd` since the
   project context exists): what it does, who it's for, acceptance, and what it must
   NOT change. Use AskUserQuestion with options.

3. **Consistency check — do this before writing anything.** Compare the feature
   against the existing PRD, architecture, decisions, and **non-goals**. If it
   conflicts with a stated non-goal, a logged decision (D-n), or the current
   architecture, surface the conflict and ask how to proceed — don't silently
   override prior intent. Note any existing behavior at risk of regression.

4. **Update the artifacts, in place and consistent:**
   - `spec/prd.md`: append new functional requirements with fresh stable IDs
     (continue the sequence; never renumber existing FRs), with acceptance + priority.
   - `spec/plan.md`: add a short design section for the feature; update the
     architecture only as needed and flag what changed.
   - `spec/tasks.md`: add a new **epic or wave** of self-contained, dependency-ordered
     tasks (same template and rules as `/dev-spec-plan`); reference the new FR-IDs and any
     existing tasks they depend on. Leave completed tasks untouched.
   - `spec/decisions.md`: log the decision to add it and any architecture change.

5. **Readiness gate** on just the new tasks (PASS / CONCERNS / FAIL), same checklist
   as `/dev-spec-plan`. State the verdict.

6. **Hand off or build.** For a trivial addition you may implement directly using the
   `/dev-spec-build` discipline (test-first, verify, tick off). Otherwise tell the user
   the new tasks are queued and `/dev-spec-build` will pick them up.

## Gotchas

- **Don't break what works.** Treat regression risk as first-class; if the feature
  touches shared code, add an explicit task to cover the existing behavior with a test.
- **Respect prior intent.** Non-goals and past decisions exist for reasons — get
  explicit sign-off before reversing one.
- **Stable IDs.** Append; never renumber existing FRs or tasks, or traceability breaks.
- **Keep the cycle proportional.** A small feature gets a few tasks, not a new
  research phase and a five-section design doc.

## Quality bar

After this runs, the `spec/` artifacts read as if the feature had been planned from
the start — consistent IDs, no contradictions, new tasks as executable as the
originals, and any architectural impact recorded.
