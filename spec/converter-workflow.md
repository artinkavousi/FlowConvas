# ARTINOS Module Converter — Workflow

> The documented, agent-followed **procedure** for turning any accepted input into a
> registered, showcased ARTINOS module or faithful Lab replica. This is the converter (ARTINOS-PRD §10) —
> a workflow + scaffold script, **not** a bespoke runtime (decisions ADR-7).
> This is the operational layer of — and **adopts** — the master guideline
> `ARTINPRD MODULE CONVERTER.md` (repo root, the single source of truth): read that for the
> full conceptual model, the two conversion modes, provenance/promotion, and the final
> conversion report format. **If this procedure and the guideline ever differ, the guideline
> wins — update this file to match.** Pair this with `STUDIO/AGENTS.md` (reuse-first + sync
> rules) and the root `AGENTS.md` (preserve identity, port directly, verify with proof).

---

## 0. Before you convert — reuse first

Run the reuse-first checklist (ARTINOS-PRD §15, also in `STUDIO/AGENTS.md`):
search the registry for an existing module that already does this — via `searchModules`,
the **Agent panel**, the **MCP** `search_modules`/`get_module` tools (`STUDIO/MCP.md`), or the
**graph spotlight** (every module is a `module/<id>` node). If one exists, **extend or reuse it**
instead of converting a duplicate. Only proceed when the input is genuinely new.

## 1. Accepted inputs (ARTINOS-PRD §10)

Rough idea, PRD, existing React component, Three.js example, R3F scene, ShaderToy
shader, WebGPU demo, GitHub repo, CodePen, local project, UI block, full page, or mini app.

## 2. Conversion process (ARTINOS-PRD §10 / §17)

1. **Locate & inspect the source first.** Read the actual files — structure, deps,
   runtime logic, UI, shaders, interactions, presets, controls. If the source can't
   be found, **report BLOCKED** with the missing path; do not invent a replacement
   (root `AGENTS.md` §4).
2. **List all major systems.** Identify universal systems, domain-reusable systems, project-specific
   systems, scaffolding to discard, and everything needed to replicate the original faithfully.
3. **Search existing ARTINOS modules.** Reuse or extend existing modules instead of duplicating.
4. **Strip unrelated scaffolding.** Drop build harnesses, demo routing, unrelated pages.
5. **Decompose aggressively** per the model below (§4) — extract the **maximum set** of genuinely
   reusable cores, especially the universal primitives hiding under the domain logic (GPGPU substrates,
   grid/sampling math, field display, input/splat models, postfx). Name by capability; each core must
   prove reuse outside the source (its showcase runs it standalone) or be folded back in. Keep modules
   compact and avoid fake helper sprawl — a one-module split of a rich source is a failure.
6. **Port directly, preserve identity.** Copy the original implementation as directly
   as possible; keep visuals, behavior, physics, animation, sound, and shader logic
   exactly (root `AGENTS.md` §4). Make only minimal edits for imports/paths/types.
   Report any unavoidable deviation.
7. **Create canonical reusable modules** under `STUDIO/src/modules/<category>/`.
8. **For full projects, rebuild a faithful Lab** under `STUDIO/src/labs/<id>/` using the modules,
   with local copied snapshots in `labs/<id>/modules/` and project-only code in grouped `local/`
   folders (`presets/`, `composition/`, `tuning/`, `interaction/`, ...).
9. **Add controls + presets** — define the PANELFLOW schema and named presets.
10. **Build the showcase** — automatic: a registered module/Lab gets its showcase from the
   Studio's `Showcase` component (live preview + auto-generated controls + usage).
11. **Add registry metadata** — fill every `ArtinosModule` field (§3), including provenance.
12. **Add dependency + usage + agent notes.**
13. **Validate inside ARTINOS** — `npm run check-registry -w STUDIO` plus build /
    preview / console proof (§5).

## 3. Deliverables → where they live (ARTINOS-PRD §18 mapped to the module contract)

Preferred registry entries are `*.meta.ts` files discovered automatically by the registry
(`import.meta.glob`). Legacy direct `<id>.module.ts` entries remain supported. Map each §18
deliverable to a file/field:

| §18 deliverable | Where it goes |
|-----------------|---------------|
| Reusable source module | `STUDIO/src/modules/<category>/<Feature>.module.ts(x)` (ported source) or referenced via `sourcePath` if owned in PANELFLOW |
| Faithful Lab replica | `STUDIO/src/labs/<id>/` with `modules/` snapshots + grouped `local/` project modules |
| Showcase / demo page | Automatic — the Studio `Showcase` renders it from the entry (no per-module page) |
| Registry entry | `<Feature>.meta.ts` → `export default` an `ArtinosModule` |
| Component metadata | `ArtinosModule` fields: `id, name, category, description, tags, version, updatedAt` |
| Dependency list | `ArtinosModule.dependencies` (include `'webgpu'` if required) |
| Preview configuration | `<Feature>.showcase.tsx` or `<PascalId>Lab.tsx` (reads the PANELFLOW bridge by `schema.id`) + `ArtinosModule.preview` |
| Inspector controls | `ArtinosModule.schema` (PANELFLOW `ComponentSchema`) — drives the auto-panel |
| Usage documentation | `ArtinosModule.usage` (copy-paste snippet) |
| Copy-paste instructions | `ArtinosModule.usage` + `dependencies` + `sourcePath` |
| Agent instructions | `ArtinosModule.agentNotes` |
| Validation checklist | `ArtinosModule.validation` + `npm run check-registry` |
| Provenance | `agentNotes` / `reuseNotes` plus optional exported `moduleProvenance` |
| Optional graph/node def | Automatic from registry where available |
| Optional app/page template | Post-MVP — not required |
| Optional export package | Post-MVP — not required |

## 4. Decomposition model (ARTINOS-PRD §9, AGENTS.md §3)

Pick the mode from what the input contains (master guideline §3):
- **Mode A** — one reusable core → **one** canonical module. The default for small inputs.
- **Mode B** — a full project / several reusable systems → canonical reusable modules **plus** a
  faithful Lab replica. The Lab has its own `modules/` snapshot copies so it remains exportable and
  copy-pasteable, plus grouped `local/` project-specific modules.

Classify the work; prefer one strong compact file over many weak ones:
- **Core Universal Module** — `core`, `webgpu`, `input`, `performance`, `math`.
- **Domain Reusable Module** — `physics/fluid`, `physics/particles`, `physics/metaballs`,
  `rendering/screenspace`, `rendering/postfx`, `shaders`, `painting`.
- **Project-Specific Reusable Module** — `labs/<id>/local/<purpose>/`.
- **Lab Snapshot Copy** — `labs/<id>/modules/<category>/`, with provenance back to the canonical source.
- **Scaffolding** — discarded unless required to reproduce the original experience.

Do **not** create deep nesting, fake abstractions, or split a file unless it is
genuinely too large or reused by more than one module.

Extraction bar (aim high — extract the maximum set of real cores):
- Do not trap reusable systems inside a demo-shaped module; a one-module split of a rich source fails.
- **Look under the domain for the universal primitives** — the non-domain systems hiding inside a demo
  are usually the bigger library win. For each system ask *"what is its generalized form, and what else
  could it build?"* (e.g. a TSL fluid → `webgpu` compute-field + `math` grid-sampling +
  `rendering/screenspace` field-display + `input` splat, plus the fluid solver — five modules, not one).
- Pull out obvious reusable rendering, WebGPU/GPGPU, physics/particle, input/interaction/splat,
  environment, postfx, field/data display, math, grid/sampling, and performance systems.
- Keep backend-specific or source-specific code as adapters when that makes the core usable by other
  projects.
- **Prove the reuse:** each extracted core must be generalized enough that its own showcase runs it
  **outside** the source's domain; if it can't stand alone, fold it back in (no fake
  `utils/index/types` files).
- Preserve the original behavior in the Lab composition; generalize the reusable modules by clean
  capability boundaries, not by weakening fidelity.

## 5. Module-folder contract

Preferred canonical module shape:

```
STUDIO/src/modules/<category>/
  <Feature>.module.tsx    # self-contained runtime/component source
  <Feature>.showcase.tsx  # bridge-driven live showcase (default OUTSIDE the selector — ADR-13)
  <Feature>.meta.ts       # default export: ArtinosModule (id === schema.id)
```

**Rules learned in execution (decisions.md ADR-13):** the preview must select the raw
bridge slice — `useBridgeStore((s) => s.componentValues['<id>'])` — and apply fallback
defaults *outside* the selector. Never `... || {}` inside the selector.

Scaffold the boilerplate with: `npm run new-module -w STUDIO -- <id> --category <category/path>`.

Use explicit category paths:

| Category | Use for |
|---|---|
| `core` | Animation loops, pointer-independent lifecycle utilities, performance monitor contracts |
| `webgpu` | Adapters, ping-pong buffers, render target pools |
| `input` | Pointer brush, gesture input, interaction models |
| `performance` | Quality scalers, telemetry, profiling |
| `math` | Noise functions, color functions, spatial helpers |
| `physics/fluid` | Fluid solvers, pressure/advection/vorticity systems |
| `physics/particles` | Particle systems, N-body forces, spatial grids |
| `physics/metaballs` | Field solvers and metaball surfaces |
| `rendering/screenspace` | Screen-space surfaces and renderers |
| `rendering/postfx` | Bloom, chromatic aberration, grain, post effects |
| `shaders` | TSL/WebGPU/GLSL shader modules |
| `painting` | Brush engines, stroke emitters, painting interactions |
| `lab` | Faithful Lab registry entries |

Add a new category path only when none of these fit and the name is explicit.

## 6. Validation (Definition of Done)

A converted module is done only when:
- `npm run check-registry -w STUDIO` passes (complete entry, `id === schema.id`,
  `sourcePath` resolves, schema valid, no duplicate id).
- `npm run lint -w STUDIO` passes.
- Dev preview: the module's showcase opens, the live preview renders, and changing a
  control drives it — with zero console errors.
- For Mode B: canonical modules are registered, the Lab replica is registered, the Lab contains
  required `modules/` snapshots with provenance, and project-specific code is grouped under `local/`.
- Fidelity: a side-by-side check confirms the converted module/Lab matches the source;
  deviations are reported.
- The library stays in sync (`STUDIO/AGENTS.md` §sync) — entry + showcase reflect the
  current source.

Close the conversion with the **report format** (PASS / BLOCKED / NEEDS HUMAN DECISION,
created/registered/preserved/deviations/validation/next) — master guideline §18.
