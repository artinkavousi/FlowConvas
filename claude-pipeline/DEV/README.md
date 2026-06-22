# Spec Pipeline — a universal global skill set for Verdent / Claude Code

Install once into your skill store, then in **any** repo you get a clean, repeatable
path from idea → research → polished PRD → well-designed plan → self-contained
tasks → verified implementation — plus a command to fold new features into an
in-flight project. No framework, no per-project setup, no dependencies.

It's built so the **expensive model plans** and a **cheap model executes** —
because planning produces tasks detailed enough that execution is mechanical. The
output documents borrow the strongest ideas from the best agentic tooling:
research-first grounding, BMAD-style readiness gates and epics/waves, Task-Master
complexity sizing, Superpowers' test-first execution and fresh-context review, and
the skill-authoring conventions (worked examples, gotchas, progressive disclosure).

```
/dev-spec-research → spec/research.md     prior art, options, tradeoffs   (Opus + web)
/dev-spec-prd      → spec/prd.md          what & why                      (Opus)
/dev-spec-plan     → spec/plan.md         design, risks, readiness gate   (Opus)
                    spec/tasks.md          ordered, sized, self-contained tasks
                    spec/decisions.md      ADR-lite log
/dev-spec-build    → implements next task test-first + verifies           (Sonnet/Haiku)
/dev-spec-review   → severity-ranked review of the diff vs the tasks      (fresh context)
/dev-spec-feature  → add a feature to a live project, wired into spec/    (Opus → Sonnet)
```

## Install

```bash
cd claude-pipeline
bash install.sh
```

The installer copies the six flat skills into the skill stores your agent reads
(leaving other skills alone):

- **Verdent** → `~/.verdent/skills/<skill>/` — appears in **Customize → Skills** and the `/` menu.
- **Claude Code** → `~/.claude/skills/<skill>/` — available to the CLI / agent runtime.

Override locations with `VERDENT_HOME=…` / `CLAUDE_HOME=…`. **Verdent does not support
nested skills or `/` namespaces**, so the skills are flat-named (`dev-spec-prd`, …) and
invoked as `/dev-spec-prd`. **Restart the app** (or open a new session) after installing
so the skill list refreshes, then type `/dev-spec-prd` in any project.

## Use it

```
/model opusplan            # Opus plans, Sonnet executes — automatic

/dev-spec-research   # optional: grounds the work in prior art + your codebase
/dev-spec-prd        # interviews you, writes a comprehensive spec/prd.md
/dev-spec-plan       # design + sized, ordered, self-contained tasks + readiness gate
/dev-spec-build      # implements the next task test-first, verifies, ticks it off
/dev-spec-review     # independent severity-ranked pass before "done"

/dev-spec-feature    # mid-project: scope a new feature and wire it into spec/
```

`/clear` between stages is encouraged — each stage reloads what the previous one
wrote from `spec/`. Start at `/dev-spec-prd` for well-understood work; reach for
`/dev-spec-research` when the approach is genuinely uncertain.

## Why the output is higher quality

- **Research-grounded.** `/dev-spec-research` resolves "what's the best way" with cited
  evidence and a committed recommendation before requirements are written.
- **Comprehensive but proportional docs.** Templates cover personas, NFR budgets,
  edge cases, data model, interfaces, observability, and rollout — and explicitly
  scale down for small work (drop sections that don't apply).
- **A readiness gate.** `/dev-spec-plan` won't quietly hand off a half-baked plan; it
  emits PASS / CONCERNS / FAIL against a checklist (every FR mapped, no oversized
  task, dependencies acyclic, acceptance runnable).
- **Self-contained, sized tasks.** Each names files, interface, pattern, scope,
  test-first note, and acceptance — so a cheap model just follows.
- **Verified, not asserted.** Execution is test-first; review runs in fresh context
  and is told not to manufacture findings or over-engineer.

## Definition of Done

A task is done only when its acceptance check passes (evidence shown), nothing
outside its scope changed, it matches repo conventions, and `/dev-spec-review` finds no
blocker. "It runs" is not done.

## Customize

- **Rename / re-namespace:** the skills are flat-named `dev-spec-*` to match Verdent's
  convention. To change the prefix, rename the folders under `DEV/skills/` and update each
  `name:` field to match its folder, then re-run `install.sh`.
- **Output folder:** skills write to `spec/`; find-and-replace `spec/` across the
  `SKILL.md` files for `docs/specs/` etc.

## What's in the box

```
claude-pipeline/
├── install.sh                    # the installer (run this) — installs to Verdent + Claude Code
├── DEV.zip                       # snapshot of DEV/ (the package, for distribution)
└── DEV/                          # the pipeline package
    ├── README.md
    ├── CLAUDE.md                 # the flow, model split, Definition of Done, principles
    ├── settings.json            # cheap default model + destructive-cmd guardrails (Claude Code)
    └── skills/                   # flat; each installs to <store>/skills/<skill>
        ├── dev-spec-research/ SKILL.md + references/research-template.md
        ├── dev-spec-prd/      SKILL.md + references/prd-template.md
        ├── dev-spec-plan/     SKILL.md + references/{plan,task}-template.md
        ├── dev-spec-build/    SKILL.md
        ├── dev-spec-review/   SKILL.md
        └── dev-spec-feature/  SKILL.md
```

Skills are flat-named (no `/` namespace) because **Verdent only supports flat skills**.
Each `SKILL.md` has `name: dev-spec-<stage>` matching its folder, and is invoked as
`/dev-spec-<stage>` in any project.
