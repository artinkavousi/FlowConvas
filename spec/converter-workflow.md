# ARTINOS Module Converter — Workflow

> The documented, agent-followed procedure for turning any accepted input into a
> registered, showcased ARTINOS module. This is the converter (ARTINOS-PRD §10) —
> a workflow + scaffold script, **not** a bespoke runtime (decisions ADR-7).
> Pair this with `STUDIO/AGENTS.md` (reuse-first + sync rules) and the root `AGENTS.md`
> (preserve identity, port directly, verify with proof).

---

## 0. Before you convert — reuse first

Run the reuse-first checklist (ARTINOS-PRD §15, also in `STUDIO/AGENTS.md`):
search the registry (`searchModules`) for an existing module that already does this.
If one exists, **extend or reuse it** instead of converting a duplicate. Only proceed
when the input is genuinely new.

## 1. Accepted inputs (ARTINOS-PRD §10)

Rough idea, PRD, existing React component, Three.js example, R3F scene, ShaderToy
shader, WebGPU demo, GitHub repo, CodePen, local project, UI block, full page, or mini app.

## 2. Conversion process (ARTINOS-PRD §10 / §17)

1. **Locate & inspect the source first.** Read the actual files — structure, deps,
   runtime logic, UI, shaders, interactions, presets, controls. If the source can't
   be found, **report BLOCKED** with the missing path; do not invent a replacement
   (root `AGENTS.md` §4).
2. **Identify the reusable core.** Separate the valuable, reusable system from
   project-specific scaffolding.
3. **Strip unrelated scaffolding.** Drop build harnesses, demo routing, unrelated pages.
4. **Decompose** per the model below (§4) — compact modules, no over-splitting.
5. **Port directly, preserve identity.** Copy the original implementation as directly
   as possible; keep visuals, behavior, physics, animation, sound, and shader logic
   exactly (root `AGENTS.md` §4). Make only minimal edits for imports/paths/types.
   Report any unavoidable deviation.
6. **Add controls + presets** — define the parameter schema and named presets.
7. **Build the showcase** — automatic: a registered module gets its showcase from the
   Studio's `Showcase` component (live preview + auto-generated controls + usage).
8. **Add registry metadata** — fill every `ArtinosModule` field (§3).
9. **Add dependency + usage + agent notes.**
10. **Validate inside ARTINOS** — `npm run check-registry -w STUDIO` plus build /
    preview / console proof (§5).

## 3. Deliverables → where they live (ARTINOS-PRD §18 mapped to the module contract)

A module is a folder `STUDIO/src/modules/<id>/` discovered automatically by the
registry (`import.meta.glob`). Map each §18 deliverable to a file/field:

| §18 deliverable | Where it goes |
|-----------------|---------------|
| Reusable source module | `STUDIO/src/modules/<id>/` (ported source) or referenced via `sourcePath` if owned in PANELFLOW |
| Showcase / demo page | Automatic — the Studio `Showcase` renders it from the entry (no per-module page) |
| Registry entry | `<id>.module.ts` → `export default` an `ArtinosModule` |
| Component metadata | `ArtinosModule` fields: `id, name, category, description, tags, version, updatedAt` |
| Dependency list | `ArtinosModule.dependencies` (include `'webgpu'` if required) |
| Preview configuration | `<PascalId>Preview.tsx` (reads the PANELFLOW bridge by `schema.id`) + `ArtinosModule.preview` |
| Inspector controls | `ArtinosModule.schema` (PANELFLOW `ComponentSchema`) — drives the auto-panel |
| Usage documentation | `ArtinosModule.usage` (copy-paste snippet) |
| Copy-paste instructions | `ArtinosModule.usage` + `dependencies` + `sourcePath` |
| Agent instructions | `ArtinosModule.agentNotes` |
| Validation checklist | `ArtinosModule.validation` + `npm run check-registry` |
| Optional graph/node def | Post-MVP (FR-9) — not required |
| Optional app/page template | Post-MVP — not required |
| Optional export package | Post-MVP — not required |

## 4. Decomposition model (ARTINOS-PRD §9, AGENTS.md §3)

Classify the work; prefer one strong compact file over many weak ones:
- **Reusable Component** — small self-contained UI/visual → a `*.tsx` in the module folder.
- **Reusable Module** — behavior + state + visuals + controls bundled → the module folder.
- **Showcase** — automatic via the registry + `Showcase`.
- **Runtime System** — a system reused across modules (e.g. a Three.js runtime) → lives
  in PANELFLOW or a shared Studio file, referenced by `dependencies`/`sourcePath`.

Do **not** create deep nesting, fake abstractions, or split a file unless it is
genuinely too large or reused by more than one module.

## 5. Module-folder contract (mirror the seed modules)

Copy the shape of `STUDIO/src/modules/gooey-slider/`:

```
STUDIO/src/modules/<id>/
  <PascalId>Preview.tsx   # default export; reads useBridgeStore raw slice (default OUTSIDE the selector — ADR-13)
  <id>.module.ts          # default export: ArtinosModule (id === schema.id)
```

**Rules learned in execution (decisions.md ADR-13):** the preview must select the raw
bridge slice — `useBridgeStore((s) => s.componentValues['<id>'])` — and apply fallback
defaults *outside* the selector. Never `... || {}` inside the selector.

Scaffold the boilerplate with: `npm run new-module -w STUDIO -- <id> --category <cat>`.

## 6. Validation (Definition of Done)

A converted module is done only when:
- `npm run check-registry -w STUDIO` passes (complete entry, `id === schema.id`,
  `sourcePath` resolves, schema valid, no duplicate id).
- `npm run lint -w STUDIO` passes.
- Dev preview: the module's showcase opens, the live preview renders, and changing a
  control drives it — with zero console errors.
- Fidelity: a side-by-side check confirms the converted module matches the source;
  deviations are reported.
- The library stays in sync (`STUDIO/AGENTS.md` §sync) — entry + showcase reflect the
  current source.
