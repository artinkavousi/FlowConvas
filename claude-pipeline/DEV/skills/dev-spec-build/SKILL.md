---
name: dev-spec-build
description: Implement the next unchecked task from spec/tasks.md test-first, verify it, and tick it off. Stage 3 of the spec pipeline — the execution stage. Use whenever the user wants to start building, continue the plan, implement the next task, or work through the todos. Runs fine on Sonnet or Haiku since tasks are self-contained.
---

# spec-build

Stage 3 of the spec pipeline: execution. Because `/dev-spec-plan` made the tasks
self-contained, this stage is mechanical — Sonnet or Haiku is enough.

## Steps

1. **Pick the task.** Read `spec/tasks.md`. Take the first `[ ]` task whose
   dependencies are all `[x]`, unless the user named an ID. If a wave is unblocked
   and the user asked to parallelize, name the parallel-safe tasks (disjoint files)
   so they can run in separate sessions/worktrees.

2. **Load only what the task names.** Read the files and pattern it points to — not
   the whole repo. If the task is missing something you genuinely need (file,
   interface, acceptance), stop and say so rather than guessing; suggest re-running
   `/dev-spec-plan` on that task.

3. **Test first (RED → GREEN → REFACTOR).** If the task has a "Test first" note or a
   testable acceptance: write the failing test first and confirm it fails for the
   right reason, then implement until it passes, then tidy. For genuinely
   untestable changes (config, copy), skip to implementation and verify by other
   evidence.

4. **Implement in scope.** Follow the named pattern and the repo's conventions.
   Don't touch what's listed out of scope and don't add abstraction the task
   doesn't ask for. Spotted an adjacent problem? Note it for later; don't fix it here.

5. **Verify against the Definition of Done.** Run the acceptance check and show the
   actual output as evidence. If it fails, fix and re-run — never edit the test to
   make it pass. Confirm nothing outside scope changed.

6. **Record.** Flip `[ ]` to `[x]` in `spec/tasks.md`. If anything deviated from the
   plan, add a one-line note to `spec/decisions.md`.

7. **Stop or continue.** Report what landed and what's next. Continue only if asked;
   a fresh context (`/clear`) between unrelated tasks keeps quality high.

## Gotchas

- **One task at a time.** Finishing and verifying one beats half-doing three.
- **Evidence over assertion.** "Tests pass" must come with the output.
- **The task is the source of truth**, not your memory of the plan discussion.
- **Don't gold-plate.** Meeting the acceptance check is the goal; extra polish the
  task didn't ask for is scope creep.
