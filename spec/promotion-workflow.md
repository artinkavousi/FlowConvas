# ARTINOS Module → Package Promotion Workflow

> When and how a proven in-Studio module graduates into a standalone, publishable package.
> Answers ARTINOS-PRD §21 (promotion criteria) and PRD principle §7 "Studio first, packages later".
> Read with `spec/converter-workflow.md` (how modules are created) and `STUDIO/AGENTS.md` (DoD).

## Principle

A module stays in `STUDIO/src/modules/<id>/` until reuse **proves** it deserves a package.
Premature packaging is an explicit non-goal (PRD §19). Promotion is the rare exception, not the
default — most modules live their whole life as owned, copy-paste source inside the Studio.

## Promotion criteria (ALL must hold)

A module is eligible to promote only when every one of these is true:

1. **Proven reuse** — used in **≥3 real projects/apps** (not demos), copy-pasted or imported, with at
   least one consumer outside ARTINOS itself.
2. **Stable API** — its props/`schema`/exported surface has not had a breaking change in **≥4 weeks**.
3. **Self-contained core** — its logic does **not** hard-depend on PANELFLOW or the Studio bridge
   (NFR-3). The bridge wiring lives only in the `Preview`/wrapper, never in the reusable core.
4. **Validated** — `check-registry` green, build/preview/console clean, and `validation` recorded.
5. **Owns its deps** — a clear, minimal dependency list (the module's `dependencies` field) with no
   ARTINOS-internal imports in the core.
6. **A second maintainer signal** — someone other than the original author has read/used it and the
   `agentNotes` let an agent use it without opening source.

If any criterion fails, **do not promote** — keep iterating in the Studio.

## Promotion steps

1. **Extract the core.** Move the framework-agnostic logic (e.g. `engine.js`, the component, the
   shader graph) into a new package folder `packages/<id>/` with its own `package.json`
   (`@artinos/<id>`), `tsconfig`, and a single public `index.ts`. Leave PANELFLOW/bridge glue behind.
2. **Keep the Studio module as the showcase.** The `STUDIO/src/modules/<id>/` entry stays, but its
   `Preview`/wrapper now imports the **package** instead of local files. The registry entry's
   `sourcePath` points at the package; `dependencies` lists `@artinos/<id>`.
3. **Version & changelog.** Start the package at the module's current `version`; add a `CHANGELOG.md`.
   Use semver from here on; breaking changes bump major.
4. **Add the workspace.** Add `packages/<id>` to the root `package.json` `workspaces` so it builds and
   the Studio consumes it via the workspace (mirror how `@artinos/panelflow` is wired).
5. **Re-validate.** `check-registry` green, Studio showcase still works (now backed by the package),
   build/preview/console clean. The public Website still lists it (it reads the registry, unchanged).
6. **Record the decision.** Append an ADR noting which module was promoted and why (which criteria
   were met), so the bar stays consistent.

## What does NOT change on promotion

- The registry entry, showcase, Agent-panel record, graph node, and MCP visibility — all driven by the
  same `ArtinosModule` entry, which simply re-points `sourcePath`/`dependencies` at the package.
- The library-sync discipline (PRD §13): a promoted module's entry + showcase still move with it.

## De-promotion

If a promoted package proves not worth the maintenance (one consumer, churny API), fold it back into
`STUDIO/src/modules/<id>/` as plain source and drop the package. Reversibility keeps the bar honest.
