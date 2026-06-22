---
name: dev-spec-prd
description: Create a clean, polished, comprehensive PRD / product spec / requirements document for a feature or whole project. Stage 1 of the spec pipeline. Use whenever the user wants a PRD, spec, requirements doc, product brief, or wants to define what to build before building it — even if they don't say "PRD". Consumes spec/research.md when present; writes spec/prd.md. Run under Opus.
---

# spec-prd

Stage 1 of the spec pipeline. Produce `spec/prd.md` defining **what** to build and
**why**, clearly enough that planning needs nothing more from you. Best on Opus.

## Steps

1. **Locate the spec folder.** Create `spec/` at the repo root if missing. Output
   is `spec/prd.md`; if it exists, ask whether to revise or replace.

2. **Ingest research if present.** If `spec/research.md` exists, read it and build
   on its recommendation — don't re-litigate settled questions. If it's absent and
   the problem space is genuinely uncertain, suggest `/dev-spec-research` first.

3. **Resolve scope before writing.** For anything not fully specified, interview
   the user first (use AskUserQuestion with selectable options). Cover: the problem
   and who has it; goals and explicit non-goals; the user personas and their key
   journeys; hard constraints; success metrics with targets; and what's out of
   scope. Ask only what you can't infer or read from the repo; one tight round
   usually suffices.

4. **Write `spec/prd.md`** from `references/prd-template.md`. Fill every applicable
   section; drop one only if genuinely irrelevant, and say so. Give each functional
   requirement a stable ID (FR-1, FR-2 …) and a per-requirement acceptance criterion
   so the plan and tasks can trace to it. Keep it decision-dense and skimmable — no
   filler, no marketing.

5. **Self-check against the quality checklist below**, fix gaps, then list anything
   still ambiguous under "Open questions" rather than inventing answers.

6. **Hand off.** Point the user to `spec/prd.md` and name `/dev-spec-plan` as next.
   Don't plan or code in this stage.

## Quality checklist (run before finishing)

- [ ] A newcomer could state what's being built, for whom, and within what limits.
- [ ] Every FR is testable and describes an outcome, not an implementation.
- [ ] Each FR has an acceptance criterion and a clear priority (must / should / could).
- [ ] Non-goals and out-of-scope are explicit enough to stop scope creep.
- [ ] Success metrics have targets, not just directions.
- [ ] Edge cases, error states, and key dependencies are named.
- [ ] No open question is silently resolved by assumption.

## Gotchas

- **What, not how.** Implementation choices belong in `/dev-spec-plan`; a PRD that
  dictates the design boxes the plan in prematurely.
- **Priority beats completeness.** A ranked, smaller set of requirements ships
  better than an exhaustive flat list — mark must/should/could.
- **Don't pad.** Length is not quality. Cut any sentence a reader could skip.

## Quality bar

Decision-dense, not long. The reader finishes knowing exactly what is being built,
for whom, within what limits, and how we'll know it worked.
