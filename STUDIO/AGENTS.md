# AGENTS.md — ARTINOS Studio

> Rules for any agent building, converting, or maintaining modules in the ARTINOS Studio.
> Read with the root `AGENTS.md` (preserve identity, port directly, verify with proof),
> root `MEMORY.md` (current package boundaries and accepted project memory), and
> `spec/converter-workflow.md` (how to convert an input into a module). ARTINOS is single-user,
> local-first; the registry is file-based; PANELFLOW is a built dependency — don't rebuild it.

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

## 2. How a module is structured

A module is a folder `STUDIO/src/modules/<id>/` auto-discovered by the registry (`import.meta.glob`):
```
<id>/
  <PascalId>Preview.tsx   # default export; live preview
  <id>.module.ts          # default export: ArtinosModule (id === schema.id)
```
Scaffold with `npm run new-module -w STUDIO -- <id> --category <cat>`, then fill the TODOs.
Mirror an existing seed module (`gooey-slider`, `bubble-rating`, `elastic-menu`).

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
- When a project produces something useful, capture it as a module.
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

"It builds" is not done. Show the evidence (command output / screenshot / console).
