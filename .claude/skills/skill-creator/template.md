# SKILL.md skeleton (copy into `.claude/skills/<name>/SKILL.md`)

Replace every `<…>`. Keep SKILL.md under ~120 lines; split long content into sibling `.md` files.

```markdown
---
name: <kebab-name>
description: "<one line: what it does>. Use when <concrete trigger phrases/situations>."
allowed_tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# <Name>

<One or two sentences: what this skill does and the shape of its output.>

## When to use
<The exact situations that should activate it. Mirror the description's "Use when".>

## Process / Rules
1. <Step or principle — say WHAT to check and WHY, not a rigid click-by-click script.>
2. <…>
3. Verify: <the acceptance check — command + expected result. For ARTINOS modules:
   `npm run check-registry -w STUDIO` green + build/preview/console proof.>

## Examples (show, don't just tell)
- **Good:** <a concrete correct example>
- **Bad:** <the tempting-but-wrong version, and why>

## Gotchas
- **<Bold lead-in>.** <Specific failure pattern this skill hits and what to do instead.>
- **<…>.** <…>
- **<…>.** <…>

> Supporting files (optional): code-patterns.md, examples.md, checklists.md — reference, don't inline.
```

## ARTINOS snippets to drop in when relevant

**Module folder contract**
```
STUDIO/src/modules/<category>/
  <Feature>.ts(x) / .js   # self-contained runtime/component source (no .module infix)
  <Feature>.showcase.tsx  # useBridgeStore raw slice, default OUTSIDE the selector (ADR-13)
  <Feature>.meta.ts       # default export: ArtinosModule, id === schema.id
```

**Definition of Done line**
```
DoD: `npm run check-registry -w STUDIO` green + `npm run lint -w STUDIO` + live preview with a
control driving it, zero console errors. Conversions also report side-by-side fidelity vs source.
```

**Agent discovery line**
```
Discover existing modules first (reuse over rebuild): Agent panel · MCP `search_modules`/`get_module`
(`npm run mcp -w STUDIO`) · graph spotlight (`module/<id>` nodes).
```

**Conversion blueprint line** (for any skill that ports/converts a source)
```
Write `docs/conversions/<id>-conversion-plan.md` FIRST (Overview section first) — granular enough for a
blind downstream agent (exact files, function signatures, render details, task checklist). Build only after.
Spec: `docs/blueprinting.md` · template: `docs/templates/blueprint.template.md` ·
pipeline: `docs/converter-pipeline.md`.
```
