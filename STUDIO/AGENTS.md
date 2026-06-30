# AGENTS.md — ARTINOS Studio

> Rules for any agent building, converting, or maintaining modules in the ARTINOS Studio.
> Read with the root `AGENTS.md` (preserve identity, port directly, verify with proof),
> root `MEMORY.md` (current package boundaries and accepted project memory), and the canonical
> converter docs in the `docs/` hub: `docs/converter-pipeline.md` (the 11-step pipeline — single source
> of truth, conversion modes, report format), `docs/module-and-lab-standards.md` (the module/Lab
> contract), and `docs/blueprinting.md` (the mandatory pre-build blueprint).
> ARTINOS is single-user, local-first; the registry is file-based; PANELFLOW is a built dependency —
> don't rebuild it.

## 1. Reuse first (run before building anything — ARTINOS-PRD §15)

In order, before writing new code:
1. Is there already a similar module? — `npm run check-registry -w STUDIO` lists them; or search `searchModules`.
2. Can an existing module be **extended** instead of duplicated?
3. Should this be a new reusable module (vs. staying local)?
4. Should it get a showcase? (automatic once registered)
5. Should it get a registry entry? (yes, if reusable)
6. Should it expose inspector controls? (define a `schema`)
7. Is it likely to be reused later?

ARTINOS grows through reuse, not duplication. If a module already covers the need, reuse/extend it and stop.

**Three ways to discover existing modules before building:**
- **Agent panel** (in the dock) — every module's agent record (id, category, tags, `agentNotes`,
  `usage`, deps, validation) with copy-as-JSON + the reuse-first checklist.
- **MCP tools** (`npm run mcp -w STUDIO`, see `MCP.md`) — `search_modules`, `get_module` let an
  agent discover/read a module programmatically without opening source; `scaffold_module` +
  `check_registry` cover create + gate.
- **Graph spotlight** — every module is also a graph node (`module/<id>`); press **Space** on the
  Node Graph canvas to search and drop one in.

## 2. How modules and Labs are structured

A new reusable module uses the self-contained module shape:
```
STUDIO/src/modules/<category>/
  <Feature>.ts(x) | .js   # self-contained runtime/component source (no .module infix; .js for untyped Three/TSL)
  <Feature>.showcase.tsx  # bridge-driven live showcase
  <Feature>.meta.ts       # default export: ArtinosModule (id === schema.id)
```
Scaffold with `npm run new-module -w STUDIO -- <id> --category <category/path>`, then fill the TODOs.
Use explicit category paths (`core`, `webgpu`, `input`, `performance`, `math`, `physics/fluid`,
`physics/particles`, `rendering/postfx`, `shaders`, `painting`, etc.). Existing legacy modules under
`STUDIO/src/modules/<id>/<id>.module.ts` remain supported; do not use that shape for new conversions.

A full project conversion must also create a faithful Lab:
```
STUDIO/src/labs/<id>/
  <PascalId>Lab.tsx
  <PascalId>Lab.meta.ts
  create<PascalId>Lab.js
  modules/                # local snapshots of required reusable modules
  local/                  # project-specific presets/composition/tuning/interaction
```

**Smart decomposition rule:** full conversions should grow the library with reusable building blocks,
not just wrap a demo. Extract obvious core systems into capability-based categories such as `webgpu`,
`rendering/postfx`, `rendering/environments`, `physics/particles`, `input`, `math`, and
`performance`. Keep source-specific adapters, presets, tuning, and composition in the Lab when they
are not yet broadly reusable. The faithful Lab preserves the original identity; the canonical modules
should be general enough to build other projects.

**Preview rule (decisions ADR-13):** read the bridge as a raw slice and default *outside* the
selector — `useBridgeStore((s) => s.componentValues['<id>'])`, then `values?.x ?? fallback`.
Never `... || {}` inside the selector (it loops on getSnapshot).

## 3. agentNotes — what every entry must carry

`agentNotes` must let another agent use/extend the module **without reading the source first**:
- whether it's controlled (props like `value`/`onChange`) or self-contained;
- the key props and what they do;
- runtime needs (e.g. `'webgpu'`) and whether it's copy-paste portable;
- the bridge id (always `=== module.id`).

Keep it one tight paragraph. Fill `usage`, `dependencies`, `tags`, `related`, and `presets` too.

## 4. Library sync (ARTINOS-PRD §13 — FR-20)

- When a module's **source changes**, update its entry (`description`, `usage`, `version`,
  `updatedAt`, `agentNotes`) and confirm its showcase still works.
- When a showcase reveals a reusable pattern, extract it into the library.
- When a project produces useful systems, extract canonical modules and rebuild the original as a
  copy-pasteable Lab with `modules/` snapshots.
- No useful system stays trapped in a one-off demo.
- After any module change, run `npm run check-registry -w STUDIO` — it gates entry completeness,
  `id === schema.id`, `sourcePath` resolution, schema validity, and duplicate ids.

## 5. Definition of Done (every module / change)

- [ ] `npm run check-registry -w STUDIO` passes.
- [ ] `npm run lint -w STUDIO` passes.
- [ ] Dev preview: the module's showcase opens, the live preview renders, a control drives it —
      **zero console errors**.
- [ ] For conversions: side-by-side fidelity vs the source confirmed; deviations reported
      (root `AGENTS.md` §4).
- [ ] Nothing outside scope changed; PANELFLOW not modified casually.
- [ ] New/changed modules are discoverable via the Agent panel, the MCP `list_modules`, and the
      graph spotlight (all three read the registry automatically — just confirm the entry is complete).

"It builds" is not done. Show the evidence (command output / screenshot / console).
