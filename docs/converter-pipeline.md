# ARTINOS Module Converter — Pipeline (Single Source of Truth)

> **What this is.** The one canonical reference for the ARTINOS **self-contained reusable module
> pipeline**: how any input (idea, component, demo, repo, shader, scene, PRD, or whole project) is
> analyzed deeply, decomposed into the reusable systems inside it, extracted into clean independent
> modules added to the ARTINOS library, and — for full projects — rebuilt as a **faithful Lab replica**
> that uses those modules.
>
> **Authority.** This document is the **single source of truth** for the converter. Everything else
> adopts it and stays aligned:
> - [`docs/module-and-lab-standards.md`](module-and-lab-standards.md) — the module/Lab contract, naming, categories, provenance, promotion.
> - [`docs/blueprinting.md`](blueprinting.md) + [`docs/templates/blueprint.template.md`](templates/blueprint.template.md) — step 7's mandatory artifact.
> - [`docs/architecture.md`](architecture.md) — where code lands, the registry, the control/bridge pipeline.
> - [`AGENTS.md`](../AGENTS.md) (root) + [`STUDIO/AGENTS.md`](../STUDIO/AGENTS.md) — operating constitution, reuse-first, fidelity, DoD.
> - [`spec/decisions.md`](../spec/decisions.md) — accepted ADRs (ADR-5 schema, ADR-7 converter-is-a-workflow, ADR-13 bridge rule, ADR-21/22/23 Mode B + smart decomposition).
> - [`.claude/skills/artinos-module/`](../.claude/skills/artinos-module) — the executable skill that runs this pipeline.
>
> The converter is a **workflow + scaffold script, not a bespoke runtime** (ADR-7). **When this
> document and any other doc, spec, or skill disagree, this document wins — update the other to match.**
>
> **Path mapping.** The reference namespace `artinos/...` maps to the shipped repo root `STUDIO/src/`:
> `artinos/modules/*` → `STUDIO/src/modules/*`, `artinos/labs/*` → `STUDIO/src/labs/*`,
> `artinos/registry/*` → `STUDIO/src/registry/*`.

---

## 1. Mission & dual output

Take any project, repo, demo, PRD, idea, shader, or visual example; analyze it deeply; identify the
reusable systems inside it; extract them into clean **self-contained** modules; add those modules to
the ARTINOS library; then **rebuild the original as a faithful ARTINOS Lab** using those modules.

Every converted **project** produces **two major outputs**:

1. **Canonical Reusable Library Modules** — universal or domain-reusable modules usable across many
   future projects: `STUDIO/src/modules/<category>/<Feature>.ts(x)` (untyped Three/TSL runtimes may be `.js`).
2. **Faithful Lab / Example Replica** — the original rebuilt from ARTINOS modules plus any
   project-specific modules needed to preserve its behavior, visuals, interactions, and capabilities:
   `STUDIO/src/labs/<id>/`.

The result must **never** be a one-off demo. Each conversion **strengthens the library** while also
producing a faithful, independent, copy-pasteable Lab that stays synced with the registry, gallery,
showcases, and future projects.

> A single small input (one reusable core, no full app to replicate) produces **only output 1** — see
> Mode A in §3. The dual output is the rule for **projects**, not for every snippet.

---

## 2. Accepted inputs

Rough idea · PRD · existing React component · Three.js / R3F scene · ShaderToy shader · WebGPU/WebGL
demo · GitHub repo · CodePen · local project (e.g. a folder under `REF/`) · UI block · full page ·
mini app. Reference projects are staged under `REF/`.

Two example framings the agent may receive:

```txt
Input Type: Existing Project
Input Source: REF/WebGpu-Fluid-Simulation-master
Goal: Extract reusable modules + rebuild as a faithful ARTINOS Lab.
Target Category: 3d / shader (WebGPU / Fluid / Interactive Visual)
Expected Output: Canonical reusable modules + a Lab replica + auto-showcase + controls + presets +
                 usage + blueprint + provenance + validation.
```

```txt
Input Type: Idea / PRD
Idea: An interactive fluid hero background with audio reactivity and pointer splats.
Goal: Create a reusable visual module + showcase.
Target Category: Interactive Visual / Hero / WebGPU
Expected Output: Module, presets, control schema, registry entry, blueprint, auto-showcase route.
```

---

## 3. Two conversion modes

Pick the mode from what the input **actually contains** — don't manufacture complexity.

### Mode A — Single reusable module (the common case)

One input holding **one** reusable creative core → one self-contained module under
`STUDIO/src/modules/<category>/`, registered and auto-showcased. **No Lab** — the module is the deliverable.

### Mode B — Dual output: library modules + a faithful Lab replica (a full project)

One input (or several reference projects) holding **multiple** reusable systems → **multiple canonical
modules** under `STUDIO/src/modules/`, **plus a faithful Lab replica** under `STUDIO/src/labs/<id>/`
that rebuilds the original from those modules. Use Mode B when the input is a real project with its own
identity to preserve.

| Output | Where | What |
|---|---|---|
| Canonical reusable modules | `STUDIO/src/modules/<category>/…` | The extracted systems — each independently registered + showcased |
| Faithful Lab replica | `STUDIO/src/labs/<id>/` | The complete original experience rebuilt from those modules, with its own self-contained `modules/` snapshot capsule |

Both register identically (§13) so the gallery, graph, Agent panel, website, and MCP surface them uniformly.

---

## 4. The 11-step execution pipeline

For **every** accepted input, execute this sequence with precision. Steps 1–7 are **planning** (run the
strongest model here); step 7 emits a committed blueprint; steps 8–11 are **execution** (a cheaper
model can run them from the blueprint alone). Reuse-first (§5) gates the whole thing — if an existing
module already covers the input, extend it and stop.

### Step 1 — Deep Input Analysis
Analyze the source deeply, whatever its shape (abstract idea, explicit PRD, visual reference, local
repo, legacy project). **Locate and read the real files** — structure, dependencies, runtime logic, UI,
shaders, interactions, presets, controls, render/lifecycle. If the source can't be found, **report
BLOCKED** with the missing path; never invent a replacement (root `AGENTS.md` §4, FR-15).

### Step 2 — System Triage & Pipeline Conversion
Identify the core, real reusable systems trapped inside the source. List **all** major systems (render
pipeline, GPGPU/WebGPU adapter, physics/particles, emitters, input/pointer, environment, postfx, math,
noise, color, performance, audio …).

> 💡 **Pipeline Rule (TSL triage).** If the reference is written in raw **WebGL / WebGL2 / WebGPU**, or
> another language/pipeline, **evaluate converting it to adopt the Three.js TSL (Three Shading Language)
> pipeline** (`three/webgpu` + `three/tsl`). Rebuilding with TSL is the **highly preferred** method —
> it is the project's target stack (`TSL → WebGPU → WebGL2 → WebGL`). It remains **optional** when the
> mathematical migration introduces **prohibitively complex** architectural cost; in that case port the
> source faithfully on its original pipeline and **record the TSL-deferral decision** in the blueprint
> and the deviation report.
>
> Repo note: STUDIO has **no TSL operator-overload plugin** — translate operator-overloaded source
> (`a + b * c`) into chained calls (`a.add(b.mul(c))`) during the port.

### Step 3 — Module Decomposition
Decompose the codebase into logical, clean, **independent** modules. Decompose **aggressively** —
extract the maximum set of genuinely reusable cores (§6). Name each by **capability**, not by the demo.

### Step 4 — Scope Partitioning
Explicitly decide, per system: which graduates to a **global reusable library module**
(`STUDIO/src/modules/`), which stays **local to the Lab capsule** (`labs/<id>/local/`), and which
**views** constitute the full showcase/demo (the Lab replica). Classify every part (§6).

### Step 5 — Library Cross-Checking (reuse-first)
Cross-examine the existing master library to see if a module already covers, replaces, or can be reused
within the identified systems. Search via `searchModules`, the **Agent panel**, the **MCP** tools
`search_modules` / `get_module` (`npm run mcp -w STUDIO`; see `STUDIO/MCP.md`), and the **graph
spotlight** (every module is a `module/<id>` node). If an existing module covers it, **extend it and stop**.

### Step 6 — Direct Asset Harvesting
Check whether the source already contains **pre-existing reusable modules or utility files** that can be
**harvested by direct copy** into the library — or improved/optimized in one clean pass. Harvest these
first (they are the cheapest, highest-fidelity wins); port them per the integrity rules (§9) and
register them like any other module.

### Step 7 — High-Effort Blueprinting (downstream-agent optimization) · MANDATORY ARTIFACT
Gather all analysis, harvested scripts, decomposition mappings, and architecture choices into one
**incredibly detailed, comprehensive, actionable implementation plan**, written to
**`docs/conversions/<id>-conversion-plan.md`** — for **every** conversion (Mode A and B), **before any code**.

The blueprint must:
- be written with maximum technical effort, under the strongest available model;
- contain every information item, design choice, and explicit task/todo step;
- specify **exactly** how many files to split into, what goes in each file, exact filenames, what each
  function does, explicit parameters, exact return values, and critical hardware/rendering details;
- be **so granular that a secondary, completely blind AI model can execute it flawlessly** with no
  further instructions or context.

Use the template at [`docs/templates/blueprint.template.md`](templates/blueprint.template.md). Full
spec and checklist: [`docs/blueprinting.md`](blueprinting.md). This artifact is the contract between
the planning model and the executing model — steps 8–11 implement it verbatim.

### Step 8 — Strict Splitting Guardrails
Split files **only** when genuine readability, reuse, or independent testability benefits **heavily
outweigh** the cognitive overhead of managing multiple files, and **only** when the extracted segment
can be tested or reused **standalone**. Prefer one strong compact file over many weak ones. Do **not**
create reflexive `index.ts / types.ts / utils.ts / helpers.ts / constants.ts / hooks.ts / adapters.ts`
sprawl — each file must earn its place (§6, AGENTS.md §3).

### Step 9 — Fidelity Preservation
Preserve all original visual appearances, interactions, physics, behaviors, styling, **exact naming
conventions**, and source logic wherever useful. Port directly; adapt minimally; substitute nothing
from memory (§9 Porting & Code Integrity). A from-memory re-creation that "looks similar" is a
**failure, not a conversion**.

### Step 10 — Lab Capsule Rebuild (Mode B)
Reconstruct the reference project accurately as an independent ARTINOS Lab under `STUDIO/src/labs/<id>/`,
composing the canonical modules exactly as the original wired its systems. The Lab must reproduce the
original's full capabilities, visuals, and scripts — not a simplified demo.

### Step 11 — Capsule Isolation Integration (Mode B)
Copy all required shared modules **directly into the Lab capsule** (`labs/<id>/modules/<category>/`) so
the Lab is fully standalone and portable. Record provenance for each snapshot (canonical source,
copiedFor, syncStatus). The Lab must not break if moved into another project.

> **Then:** add controls + presets, wire the preview/Lab to the bridge (ADR-13), fill the
> `ArtinosModule` entry completely, register, and **validate** (§8). Close with the report format (§10).

---

## 5. Reuse first — never duplicate (gate before all 11 steps)

Before building anything, run the reuse-first checklist (root `AGENTS.md`, `STUDIO/AGENTS.md`,
ARTINOS-PRD reuse priority): search the registry, the Agent panel, the MCP tools, and the graph
spotlight. If an existing module already covers the input, **extend it and stop**. Only proceed when the
input is genuinely new. ARTINOS grows through **reuse, not duplication**.

---

## 6. Smart decomposition — extract the maximum set of universal cores

The converter must not merely wrap a demo. **Decompose aggressively: extract the maximum set of
genuinely reusable cores the source contains** so each conversion compounds the library with flexible,
general-purpose building blocks. A minimal "solver + input" split of a rich source is an
**under-decomposition failure** (ADR-23).

**Look under the domain for the universal primitives.** A domain demo (a fluid, a galaxy, a paint app)
almost always hides non-domain, *universal* systems that are the bigger library win. For each system
ask: *what is its generalized form, and what else could it build?* Lift those out as their own cores;
leave only genuinely domain-specific logic in a domain module.

Worked example — a TSL fluid demo yields **two universal cores + two domain cores + one universal input**
(five modules, not one):

```txt
webgpu/TslComputeField2D.js                  # universal GPGPU ping-pong substrate (any grid sim)
math/TslGridSampling.js                       # universal index/neighbor/bilinear sampling
physics/fluid/TslStableFluids2D.js           # the ONLY fluid-specific module (built on the cores)
rendering/screenspace/TslFieldColorDisplay.js # colormap display of ANY field
input/PointerVelocitySplat.js                # universal 2D pointer-velocity splats
labs/tsl-fluid/...                           # faithful composition + bloom + presets
```

Systems to look for and pull out (name + categorize by **capability**, not the demo):
- rendering / postprocessing pipelines; field/data visualization and colormap display;
- WebGPU adapters, GPGPU compute fields / ping-pong buffers, render targets, capability/fallback;
- physics and particle systems, with backend adapters isolated from universal particle/render logic;
- adaptive environments, cameras, layout/framing, reusable scene-composition primitives;
- input, pointer, gesture, drag, brush, splat, interaction models;
- math, noise, color, spatial, grid/index, sampling, performance utilities.

**Prove the reuse, don't just assert it.** Every extracted core must be generalized enough that its own
showcase demonstrates it working **outside** the source's domain (the compute-field runs a trivial
non-fluid kernel; the field-color display visualizes an arbitrary field). If a candidate can't stand
alone like that, it isn't a real core — fold it back in. **Both failure modes are real:**
under-decomposing a rich source into one demo-shaped module, *and* over-decomposing into fake helper
files. Aim high on extraction, but every module earns its place by clean boundaries and standalone reuse.

### Classification → where code lands

| Layer | Reuse scope | Lands in |
|---|---|---|
| **Core Universal Module** | many different projects | `STUDIO/src/modules/{core,webgpu,input,performance,math}/` |
| **Domain Reusable Module** | one domain (fluids, particles, shaders, painting…) | `STUDIO/src/modules/{physics/fluid,physics/particles,physics/metaballs,rendering/screenspace,rendering/postfx,shaders,painting}/` |
| **Project-Specific Reusable Module** | this Lab or close variants | `STUDIO/src/labs/<id>/local/{presets,composition,tuning,interaction}/` |
| **Lab Snapshot Copy** | the Lab's portable copy | `STUDIO/src/labs/<id>/modules/<category>/` (provenance back to canonical) |
| **Scaffolding** | discarded | — (build harness, demo routing, one-off app glue) |

A proven cross-project core may later be **promoted to `packages/<id>/`** — rare, gated; see
[`docs/module-and-lab-standards.md`](module-and-lab-standards.md#promotion).

---

## 7. Library Module & Lab Capsule standards (summary)

Authoring discipline for every file. Full contract, naming, categories, and the `ArtinosModule` entry:
[`docs/module-and-lab-standards.md`](module-and-lab-standards.md).

**JSM / ESM self-contained module standard** — every module is: independent · copy-pasteable · explicit
about dependencies · readable without hidden context · usable in another project with minimal changes ·
free of global app coupling · free of deep internal imports · owned source (not a black-box package) ·
compact · clearly named · agent-readable (carries discovery metadata).

**Lab capsule standard** — a Lab is a **faithful, independent, copy-pasteable replica** that matches the
original's capabilities completely (never a simplified demo). It uses ARTINOS modules, carries **local
copied snapshots** of the modules it needs, keeps project-specific code in grouped `local/` subfolders,
and ships a **showcase dashboard with parameter controllers** to test the physics/shaders/visuals live.

---

## 8. Validation — Definition of Done

A converted module/Lab is done **only** when:

- A `docs/conversions/<id>-conversion-plan.md` exists and the implementation matches it (step 7).
- `npm run check-registry -w STUDIO` passes — complete entry, `id === schema.id`, `sourcePath`
  resolves, schema valid, no duplicate id.
- `npm run lint -w STUDIO` passes.
- Dev preview: the showcase opens, the live preview renders, and **changing a control drives it** — with
  **zero console errors**.
- Fidelity: a side-by-side check confirms the module/Lab matches the source; deviations are reported.
- The library stays in sync (entry + showcase reflect the current source; Lab snapshots note their
  `syncStatus`).

"It builds" is **not** done. Do not mark complete unless build, preview, console, and interaction checks
were actually performed.

---

## 9. Port faithfully — Code Integrity rules (FR-15)

| Enforcement Rule | Direct Action |
|---|---|
| **Inspect First** | Locate, unpack, and comprehensively **read the raw source files** before generating logic. Do not guess or extrapolate. |
| **Direct Mapping** | Copy the original math and rendering implementations **as directly as possible**. Do not rewrite from memory or substitute a generic equivalent. |
| **Minimum Variance** | Restrict alterations strictly to import paths, type-safety definitions, framework styling hooks, or **pipeline conversions** (e.g. WebGL → TSL). |
| **Identity Defense** | Maintain animations, sounds, interaction states, shader loops, and physical constants with **100% fidelity**. Document any unavoidable technical deviation in a markdown section at the **very end** (the deviation report). |

Correct: `inspect → understand → copy faithfully → adapt minimally → verify behavior`.
Incorrect: `guess → write a generic sample → claim equivalence`.

Deviation report example:

```txt
Deviation:
- Original used a browser-only global audio context.
- ARTINOS wraps it in an AudioReactive module for React-lifecycle cleanup.
- Behavior preserved; integration changed only for lifecycle safety.
```

---

## 10. Final conversion report format

```txt
PASS / BLOCKED / NEEDS HUMAN DECISION

Input:
- REF/<source>

Blueprint:
- docs/conversions/<id>-conversion-plan.md  (committed before code)

Summary:
- Extracted reusable systems into canonical modules and rebuilt the original as a faithful Lab.

Created — Canonical Reusable Modules:
- STUDIO/src/modules/<category>/<Feature>.ts(x)  ×N

Created — Faithful Lab Replica (Mode B):
- STUDIO/src/labs/<id>/<PascalId>Lab.tsx | .meta.ts | create<PascalId>Lab.js
- STUDIO/src/labs/<id>/modules/...  (self-contained snapshot capsule)
- STUDIO/src/labs/<id>/local/...    (presets / composition / tuning / interaction)

Registered:
- <module-ids> + <lab-id> — categories: ...

Showcase:
- Automatic (Studio Showcase) — gallery / graph / Agent panel / website / MCP

Controls / Presets:
- PANELFLOW schema; presets: ...

Pipeline / TSL triage:
- Rebuilt on TSL | Ported on original pipeline (TSL deferred — reason)

Preserved:
- solver/physics behavior · interactions · shader logic · presets · audio · performance scaling · composition

Added / Changed for ARTINOS:
- ArtinosModule entries · bridge-driven previews · usePerformanceTelemetry stats · Lab capsule
- Dropped: <one-off app glue replaced by PANELFLOW + telemetry>

Provenance:
- Lab modules/ is a snapshot of the modules above (canonicalSource / copiedFor / syncStatus recorded)

Validation:
- check-registry: PASS/FAIL · lint: PASS/FAIL · preview: PASS/FAIL · console: PASS/FAIL (zero errors) · interaction: PASS/FAIL

Deviations:
- list any unavoidable deviations from the source, with the reason

Known Issues / Next:
- real unresolved issues only · recommended improvements / promotion candidacy
```

---

## 11. Operational checklist (condensed)

1. Reuse-first search — extend & stop if covered (§5).
2. Inspect the real source; BLOCKED if missing (step 1).
3. List all systems; run TSL triage (step 2).
4. Decompose aggressively by capability (steps 3–4, §6).
5. Harvest ready-made reusable files by direct copy (step 6).
6. **Write `docs/conversions/<id>-conversion-plan.md`** — granular, blind-executable, Overview-first (step 7).
7. Scaffold: `npm run new-module -w STUDIO -- <id> --category <category/path>`.
8. Port directly, preserve identity (steps 8–9, §9).
9. Mode B: rebuild the Lab + copy snapshots into the capsule (steps 10–11).
10. Fill the `ArtinosModule` entry completely incl. `agentNotes` + provenance.
11. Wire the preview/Lab to the bridge (ADR-13 — default OUTSIDE the selector).
12. Validate (§8) and report (§10).
