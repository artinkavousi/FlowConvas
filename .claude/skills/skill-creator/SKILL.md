---
name: skill-creator
description: "Authors a new Claude Code skill for the ARTINOS repo, scaffolded under .claude/skills/, following the repo's authoring rules and ARTINOS context. Use when the user wants to create, scaffold, author, or design a new skill/slash-command for this project (e.g. 'create a skill for X', 'make a /foo skill', 'add a project skill that…')."
allowed_tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# skill-creator (ARTINOS)

Creates a well-formed, ARTINOS-aware Claude Code skill. A skill is a **folder**
`.claude/skills/<name>/SKILL.md` (+ optional supporting `.md` files), invoked as
`/<name>`. Mirrors the global rules in `~/.claude/rules/core/SKILL_AUTHORING.md` and
makes generated skills lean on what ARTINOS already provides instead of reinventing it.

## When to use
The user wants a new skill/slash-command for this repo — module workflows, conversion,
review, scaffolding, docs, anything reusable across sessions. Not for one-off tasks.

## Process

1. **Clarify the trigger, not just the topic.** Ask (or infer) the *when*: what phrases/
   situations should activate it. The `description` must contain `Use when …` with concrete
   triggers — that's how the model decides to fire it.
2. **Pick `allowed_tools` to match the work** (see global rules table): code/scaffold skills →
   Read/Write/Edit/Glob/Grep/Bash; review/audit → Read/Glob/Grep; research → WebSearch/WebFetch/Read.
3. **Scaffold the folder.** Create `.claude/skills/<kebab-name>/SKILL.md` from `template.md`.
   Add supporting files only when SKILL.md would exceed ~120 lines (progressive disclosure).
4. **Wire in ARTINOS context** (below) so the skill reuses the registry/MCP/converter rather than
   re-deriving them.
5. **Write a `## Gotchas` section** — minimum 3, specific failure patterns. This is mandatory and
   the highest-value part of any skill.
6. **Validate** against the checklist, then tell the user how to invoke it (`/<name>`).

## ARTINOS context to bake into generated skills

When the new skill touches modules, reference these instead of restating them:
- **Registry** is file-based: `STUDIO/src/modules/<id>/{<id>.module.ts, <PascalId>Preview.tsx}`,
  auto-discovered (`registry.ts`). One `ArtinosModule` per module.
- **Scaffold**: `npm run new-module -w STUDIO -- <id> --category <cat>`.
- **Gate / DoD**: `npm run check-registry -w STUDIO` (must be green) + build/preview/console proof.
  "It builds" is not done.
- **Discovery for agents**: the Agent panel, the MCP server (`npm run mcp -w STUDIO`, `STUDIO/MCP.md`:
  `list_modules / search_modules / get_module / scaffold_module / check_registry`), and the graph
  spotlight (every module is a `module/<id>` node).
- **Conventions live in** `STUDIO/AGENTS.md`, `spec/converter-workflow.md`, `spec/decisions.md` (ADRs),
  and the global rules under `~/.claude/rules/`. A module skill should cite these, not duplicate them.

## Validation checklist (before finishing)
- [ ] Frontmatter has `name`, `description` (with `Use when…`), `allowed_tools`.
- [ ] `allowed_tools` matches what the skill actually does.
- [ ] SKILL.md ≤ ~120 lines; longer content split into supporting `.md` files.
- [ ] Has a `## Gotchas` section with ≥3 specific items.
- [ ] Reuses ARTINOS surfaces (registry/MCP/scripts) instead of restating them.
- [ ] Shows good/bad examples where it teaches a pattern; gives principles, not rigid step lists.

## Gotchas
- **A description is a trigger, not a summary.** "Manages ARTINOS modules" is wrong; "Use when the
  user wants to add/convert a module…" is right. Without `Use when…`, the skill never auto-fires.
- **Don't restate the repo's rules inside the skill.** The DoD, naming, and converter steps live in
  `STUDIO/AGENTS.md` / `spec/converter-workflow.md` — link to them. Copies drift and lie (we already
  hit exactly this with `spec/tasks.md`).
- **`category` is a free string but the canonical set is fixed** (ui, 3d, shader, particles, postfx,
  material). A generated module skill must use those so the gallery/website filters stay coherent.
- **Three.js modules have no types** — the repo pattern is an untyped `engine.js` + a typed `.tsx`
  wrapper (`allowJs`, no `checkJs`). A skill that scaffolds 3D must follow this, not add `@types/three`.
- **Skills are folders, not single files.** Put the skeleton in `template.md` and reference it; don't
  inline 200 lines of boilerplate into SKILL.md.

> Skeleton to copy: `template.md` in this folder.
