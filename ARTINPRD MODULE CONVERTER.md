# ARTINOS Module Converter — Master Guideline

> **What this is.** The single, comprehensive reference for the ARTINOS **self-contained reusable
> module pipeline**: how any input (idea, component, demo, repo, shader, scene, PRD, or whole project)
> is analyzed deeply, decomposed into the reusable systems inside it, extracted into clean independent
> modules added to the ARTINOS library, and — for full projects — rebuilt as a **faithful Lab replica**
> that uses those modules.
>
> **Authority.** This document is the **single source of truth** for the module-converting pipeline.
> Everything else **adopts** it and must stay aligned to it:
> - `spec/converter-workflow.md` — the step-by-step procedure (the operational layer of this doc).
> - `spec/promotion-workflow.md` — when a module graduates into a package.
> - `STUDIO/AGENTS.md` — reuse-first + library-sync discipline.
> - root `AGENTS.md` §4 — preserve identity, port directly, verify with proof.
> - `ARTINOS-PRD.md` §9/§10/§11/§15/§17/§18/§21 and `spec/decisions.md` (ADR-5, ADR-7, ADR-13).
> - `.claude/skills/artinos-module/` — the executable skill that runs this pipeline.
>
> The converter is a **workflow + scaffold script, not a bespoke runtime** (ADR-7). **When this
> document and any other doc, spec, or skill disagree, this document wins — update the other to match
> and note the change.** Keep the operational specs in sync with it, not the other way around.
>
> **Path mapping.** The reference spec uses an idealized `artinos/...` namespace. In the shipped repo
> that root is `STUDIO/src/`: `artinos/modules/*` → `STUDIO/src/modules/*`, `artinos/labs/*` →
> `STUDIO/src/labs/*`, `artinos/registry/*` → `STUDIO/src/registry/*`. The nested category model is
> followed exactly; existing flat legacy modules remain supported only for compatibility.

---

## 1. Mission

Take any project, repo, demo, PRD, idea, shader, or visual example, analyze it deeply, identify the
reusable systems inside it, extract them into clean **self-contained** modules, add those modules to
the ARTINOS library, and then **rebuild the original project as a clean ARTINOS Lab** using those
modules.

Every converted **project** produces **two major outputs**:

1. **Canonical Reusable Library Modules** — universal or domain-reusable modules that can be reused
   across many future projects (`STUDIO/src/modules/<category>/<Feature>.module.ts(x)`).
2. **Faithful Lab / Example Replica** — a rebuilt version of the original project using ARTINOS
   modules, plus any project-specific modules needed to preserve the original behavior, visuals,
   interactions, and capabilities (`STUDIO/src/labs/<id>/`).

The final result must **never** be a one-off demo. Each project should **strengthen the ARTINOS
module library** while also producing a faithful, independent, copy-pasteable Lab example that stays
synced with the library, gallery, showcases, examples, and future projects.

> A single small input (one reusable core, no full app to replicate) produces **only output 1** — see
> Mode A in §3. The dual output is the rule for **projects**, not for every snippet.

---

## 2. Accepted inputs (ARTINOS-PRD §10)

Rough idea · PRD · existing React component · Three.js / R3F scene · ShaderToy shader · WebGPU demo ·
GitHub repo · CodePen · local project (e.g. a folder under `REF/`) · UI block · full page · mini app.

Two example framings the agent may receive:

```txt
Input Type: Existing Project
Input Source: REF/WebGpu-Fluid-Simulation-master
Goal: Extract reusable modules + rebuild as a faithful ARTINOS Lab.
Target Category: 3d / shader (WebGPU / Fluid / Interactive Visual)
Expected Output: Canonical reusable modules + a Lab replica + auto-showcase + controls + presets +
                 usage + provenance + validation.
```

```txt
Input Type: Idea / PRD
Idea: An interactive fluid hero background with audio reactivity and pointer splats.
Goal: Create a reusable visual module + showcase.
Target Category: Interactive Visual / Hero / WebGPU
Expected Output: Module, presets, control schema, registry entry, auto-showcase route.
```

Input projects are staged under `REF/` (e.g. the live fluid systems were ported full-fidelity from
`REF/WebGpu-Fluid-Simulation-master`).

---

## 3. Two conversion modes

The same pipeline scales to two shapes of input. Pick the mode from what the input actually contains —
don't manufacture complexity.

### Mode A — Single reusable module (the common case)

One input that holds **one** reusable creative core → one self-contained module under
`STUDIO/src/modules/<category>/`, registered and auto-showcased. This is the default; most conversions are
Mode A. There is **no Lab** for a Mode A input — the module itself is the deliverable.

### Mode B — Dual output: library modules + a faithful Lab replica (a full project)

One input (or several reference projects) that holds **multiple** reusable systems → **multiple
canonical modules** under `STUDIO/src/modules/`, **plus a faithful Lab replica** under
`STUDIO/src/labs/<id>/` that rebuilds the original from those modules. Use Mode B when the input is a
real project/app with its own identity to preserve (e.g. a WebGPU adapter + a fluid solver + an
emitter system + audio reactivity that compose into one interactive piece).

The live fluid conversion is the reference shape:

| Output | Where | What |
|---|---|---|
| Canonical reusable modules | `STUDIO/src/modules/webgpu-fluid-sim/`, `…/fluid-emitters/`, `…/audio-reactive/` | The extracted solver, emitter system, audio reactivity — each independently registered + showcased |
| Faithful Lab replica | `STUDIO/src/labs/fluid-sim/` | The complete original experience rebuilt from those modules, with its own self-contained `modules/` snapshot capsule |

> The Lab is the faithful replica of the *original project*; the modules are the reusable systems it
> was built from. Both register identically (§16) so the gallery, graph, Agent panel, website, and MCP
> surface them uniformly.

---

## 4. Priority order

When converting, rebuilding, porting, or upgrading, follow this order:

1. **Preservation of original identity and interactions** (root `AGENTS.md` §4, FR-15).
2. **Premium visual / UI quality.**
3. **Compact, self-contained reusable modules.**
4. **Clear architecture with minimal file sprawl** (ARTINOS-PRD §9).
5. **Strong naming and performance-conscious implementation.**

Do not sacrifice the soul of the original project for architecture theater. Preserve: visual
identity · interaction behavior · animation timing · shader behavior · physics behavior · audio
reactivity · layout feel · motion language · control behavior · original UX. The ARTINOS version
should feel like the original was **carefully upgraded into a reusable system** — **not** replaced by
a generic remake.

---

## 5. Core principle — build a reusable system first, then rebuild the project from it

When ARTINOS receives a project, the agent must ask:

- What parts are **universal** and reusable across many projects?
- What parts are **domain-specific** but still reusable?
- What parts are **only specific to this reference project**?
- What parts are **app scaffolding** and should be discarded?
- What parts are needed to **replicate the original faithfully**?
- What should become a **canonical ARTINOS module** (`modules/`)?
- What should become a **Lab-specific local module** (inside the Lab capsule)?
- What should be **copied into the Lab capsule** so the Lab can run independently?
- What **existing ARTINOS modules** can be reused instead of duplicated?

Build the reusable system first; then rebuild the project from that system.

### Smart extraction — decompose aggressively into generalized, universal cores

The converter must not merely wrap a demo. **Decompose aggressively: extract the maximum set of
genuinely reusable cores the source contains** so each conversion compounds the library with
flexible, general-purpose building blocks usable across many future projects. A minimal "solver +
input" split of a rich source is an **under-decomposition failure**.

**Look under the domain for the universal primitives.** A domain demo (a fluid, a galaxy, a paint app)
almost always hides non-domain, *universal* systems that are the bigger library win. For each system
ask: *what is its generalized form, and what else could it build?* Lift those out as their own cores;
leave only the genuinely domain-specific logic in a domain module. Worked example: a TSL fluid demo
yields universal cores (`webgpu` GPGPU compute-field substrate, `math` grid/index sampling,
`rendering/screenspace` field-color display, `input` pointer velocity splat) plus **one**
fluid-specific module (the Navier–Stokes solver) — five modules, not one. (See §15.)

Systems to look for and pull out (name + categorize by **capability**, not by the demo):
- rendering and postprocessing pipelines; field/data visualization and colormap display;
- WebGPU adapters, GPGPU compute fields / ping-pong buffers, render targets, capability/fallback;
- physics and particle systems, with backend adapters isolated from universal particle/render logic;
- adaptive environments, cameras, layout/framing, and reusable scene composition primitives;
- input, pointer, gesture, drag, brush, splat, and interaction models;
- math, noise, color, spatial, grid/index, sampling, and performance utilities.

**Prove the reuse, don't just assert it.** Every extracted core must be generalized enough that its
own showcase demonstrates it working **outside** the source's domain (e.g. the compute-field core runs
a trivial non-fluid kernel; the field-color display visualizes an arbitrary field). If a candidate
can't stand alone like that, it isn't a real core — fold it back in.

Source-specific behavior still belongs in the faithful Lab. Generalize each core only as far as the
source justifies, with source-specific physics/render/input adapters split out when that keeps the
core usable by other projects. **Both failure modes are real:** under-decomposing a rich source into
one demo-shaped module, *and* over-decomposing into fake helper files (`utils/index/types/helpers`)
that aren't independently reusable. Aim high on extraction, but every module must earn its place by
clean boundaries and standalone reuse.

### Reuse first — never duplicate

Before building anything, run the reuse-first checklist (ARTINOS-PRD §15, `STUDIO/AGENTS.md`): search
the registry (`searchModules`), the **Agent panel**, the **MCP** tools `search_modules` / `get_module`
(`npm run mcp -w STUDIO`; see `STUDIO/MCP.md`), and the **graph spotlight** (every module is a
`module/<id>` node). If an existing module already covers the input, **extend it and stop**. Only
proceed when the input is genuinely new.

---

## 6. Module categories (classification → where code lands)

Every extracted part is classified into one of these. The classification is a **decomposition thinking
tool**; the **physical** layout is the real Studio structure in §8.

### 1. Core Universal Module

Reusable across many different projects.

```txt
WebGPUAdapter   RenderTargetPool   PingPongBuffer   PointerInput   AnimationLoop
NoiseFunctions  EmitterSystem      ParticleSystem   GPUSort        SpatialHashGrid
NBodyForces     ColorRamp          PerformanceMonitor
```

**Lands in** the matching `STUDIO/src/modules/<category>/` path, for example:

```txt
STUDIO/src/modules/core/
STUDIO/src/modules/webgpu/
STUDIO/src/modules/input/
STUDIO/src/modules/performance/
STUDIO/src/modules/math/
```

A proven cross-project core may later be **promoted to `packages/<id>/`** (§14); until then it stays
as owned Studio source in the canonical module tree.

### 2. Domain Reusable Module

Reusable inside a specific domain (fluids, particles, shaders, painting, metaballs, galaxies).

```txt
NavierStokesFluid2D   MLSPMFluid          ScreenSpaceFluidSurface   MetaballField
ParticleGalaxy        BrushStrokeEmitter  FluidEmitterSystem        VorticityConfinement
PressureSolver        AdvectionPass
```

**Lands in** the matching domain path, for example:

```txt
STUDIO/src/modules/physics/fluid/
STUDIO/src/modules/physics/particles/
STUDIO/src/modules/physics/metaballs/
STUDIO/src/modules/rendering/screenspace/
STUDIO/src/modules/rendering/postfx/
STUDIO/src/modules/shaders/
STUDIO/src/modules/painting/
```

### 3. Project-Specific Reusable Module

Reusable inside the Lab or close future variants, but not universal enough to be core yet.

```txt
FluidSimNavierPresetSet   GalaxyHeroComposition       MetaballLandingScene
PaintBrushInteractionModel  OriginalProjectControlMapping  ReferenceVisualTuning
```

**Lands inside the Lab capsule**, organized into meaningful subfolders by purpose — **not** one flat
`local/`:

```txt
STUDIO/src/labs/<id>/local/presets/
STUDIO/src/labs/<id>/local/composition/
STUDIO/src/labs/<id>/local/tuning/
STUDIO/src/labs/<id>/local/interaction/
```

If a project-specific module is reused in multiple Labs later, **promote it** into `modules/`.

### 4. Scaffolding — discarded

Build harness, demo routing, unrelated pages, one-off app glue.

---

## 7. Self-contained module standard (JSM / ESM style)

Every ARTINOS module follows a JSM/ESM-style self-contained format. A module is: independent ·
copy-pasteable · explicit about dependencies · readable without hidden context · usable in another
project with minimal changes · free of global app coupling · free of deep internal imports · owned
source (not a black-box package) · compact · clearly named.

A good single-file module, when reasonable, holds in one file:

```txt
1. Imports        2. Local types     3. Constants / default config   4. Small helpers
5. Main runtime/component   6. Local subcomponents   7. Exports
8. Short usage notes        9. Dispose/cleanup        10. Agent notes
```

Default shapes:

```txt
ModuleName.tsx           # React: imports → types → constants → helpers → main component → subcomponents → exports
ModuleName.module.ts     # non-React runtime: imports → types → constants → helpers → main class/fn → defaults → exports
```

> In the Studio, the preferred **registry entry** is `<Feature>.meta.ts` (the `ArtinosModule`), while
> `<Feature>.module.ts(x)` owns the reusable runtime/component source. Legacy `<id>.module.ts`
> registry entries remain supported so older modules keep working. "Self-contained module standard"
> is the authoring discipline for each runtime file — one concept, copy-pasteable, no hidden context.

### Split rules — default to compact

Prefer one strong, compact file over many weak ones. **Split only when** the file is genuinely hard to
understand · a module is reused by real features · a system has a clearly separate responsibility · the
split makes the project easier (not just enterprise-shaped) · the new file has a strong name · the
extracted part can be reused/tested independently · keeping it together would hide important logic.

Do **not** split into reflexive `index.ts / types.ts / utils.ts / helpers.ts / constants.ts /
hooks.ts / adapters.ts` scaffolding unless each file earns its place. Prefer:

```txt
NavierStokesFluid2D.module.ts   WebGPUFluidModule.tsx   ParticleSystem.module.ts   GalaxyLab.tsx
```

over a `fluid/{index,types,utils,constants,hooks,helpers,adapters}.ts` sprawl.

---

## 8. The real ARTINOS structure

The reference spec's idealized tree maps onto the shipped Studio like this. Keep it **shallow and
readable**; add nesting only when it improves clarity.

```txt
STUDIO/src/
  modules/                         # canonical reusable library modules (Core Universal + Domain Reusable)
    core/
      AnimationLoop.module.ts
      PointerInput.module.ts
      PerformanceMonitor.module.ts
    webgpu/
      WebGPUAdapter.module.ts
      PingPongBuffer.module.ts
      RenderTargetPool.module.ts
    math/
      NoiseFunctions.module.ts
      ColorFunctions.module.ts
    physics/
      fluid/
        NavierStokesFluid2D.module.ts
        FluidEmitterSystem.module.ts
      particles/
        ParticleSystem.module.ts
        NBodyForces.module.ts
    rendering/
      postfx/
        BloomPass.module.ts
    shaders/
      TSLGradient.module.ts
    <category>/
      <Feature>.module.tsx         # self-contained runtime/component source
      <Feature>.showcase.tsx       # bridge-driven live showcase (ADR-13)
      <Feature>.meta.ts            # ArtinosModule entry (id === schema.id)
  labs/                            # faithful project replicas (Mode B compositions)
    <id>/
      <PascalId>Lab.tsx            # the rebuilt project; bridge-driven preview
      <PascalId>Lab.meta.ts        # ArtinosModule entry (category, schema, presets, provenance)
      create<PascalId>Lab.js       # composition: wires the engine systems like the original
      modules/                     # local copied snapshots of every canonical module the Lab needs
        webgpu/  physics/  input/  rendering/  shaders/  …
      local/                       # project-specific modules, grouped by purpose
        presets/  composition/  tuning/  interaction/
  registry/
    registry.ts                    # import.meta.glob over *.meta + legacy entries — files are the truth
    module-to-node.ts  types.ts
  studio/ (ArtinosStudio.tsx, panels, shell)  # automatic Showcase — no per-module page, no router
```

> `registry/ModuleRegistry.ts`/`LabRegistry.ts`/`CategoryRegistry.ts` and `studio/ShowcaseRouter.tsx`
> are conceptual names from the idealized spec. The shipped reality is one glob-based `registry.ts`
> (which provides `searchModules` + `listCategories`) and an automatic Showcase. The module and Lab
> folder model above is the template for new conversions.

### Engine + wrapper pattern (3D / shader / WebGPU)

- **Self-contained `*.module.ts(x)` runtime** — own the core logic, explicit dependencies, lifecycle,
  and `dispose()`/cleanup. For imported JavaScript engines, keep source as direct as possible.
- **Thin typed `*.showcase.tsx` wrapper** that owns the bridge read, canvas ref, `ResizeObserver`, and
  `dispose()` when needed.
- **UI modules** → a self-contained `.tsx`, React-only deps where possible.

---

## 9. Naming rules

Use explicit, searchable names. A filename should tell a human and an agent exactly what it contains.

Good:

```txt
NavierStokesFluid2D.module.ts   ParticleSystem.module.ts   WebGPUAdapter.module.ts
WebGPUFluidModule.tsx           WebgpuFluidSimPreview.tsx   FluidSimLab.tsx
FluidEmitterSystem.js           AudioReactiveFluid.js       createFluidSimLab.js
```

Avoid vague: `index.ts · main.ts · utils.ts · helpers.ts · stuff.ts · demo.ts · test.ts ·
module1.ts · newComponent.tsx`.

Conventions the tooling depends on:

| Name | Role |
|---|---|
| `<Feature>.module.ts(x)` | Self-contained reusable runtime/component source |
| `<Feature>.meta.ts` | Registry entry (`ArtinosModule`); `id` kebab-case; **`id === schema.id`** |
| `<Feature>.showcase.tsx` | Live preview/showcase; reads the bridge by `schema.id` |
| `<PascalId>Lab.tsx` | A Lab replica's rebuilt-project component |
| `<PascalId>Lab.meta.ts` | Lab registry entry (`ArtinosModule`) |
| `create<PascalId>Lab.js` | The Lab composition (wires engine systems like the original) |
| `labs/<id>/modules/*` | Lab snapshot copies of required reusable modules |
| `labs/<id>/local/*` | Lab-specific presets, composition, tuning, interaction |

`<id>` is kebab-case and equals the registry id; the preview/wrapper/Lab use the PascalCase form.

---

## 10. Module contract — the `ArtinosModule` entry

One entry per module **and per Lab**, co-located as `<Feature>.meta.ts`, `export default`. Legacy
`<id>.module.ts` registry entries are accepted for existing modules only. The control
schema reuses PANELFLOW's `ComponentSchema` as the canonical source (ADR-5), so the showcase drives
PANELFLOW's auto-generated panel directly. Fill **every** field — `agentNotes` must let another agent
use the module **without opening the source**.

```ts
export interface ArtinosModule {
  id: string;                 // kebab-case, unique. MUST equal schema.id (bridge keys on it)
  name: string;
  category: string;           // path: 'core' | 'webgpu' | 'physics/fluid' | 'rendering/postfx' | 'lab' | …
  description: string;        // what it does + when to use it
  tags: string[];             // for a Lab include 'lab' + 'replica' + 'composition'
  schema: ComponentSchema;    // PANELFLOW — powers the auto-panel
  preview: ComponentType;     // live preview (module) or the rebuilt project (Lab); reads the bridge
  sourcePath: string;         // repo-relative location of owned source
  dependencies: string[];     // packages + runtime reqs (include 'webgpu' if WebGPU-only)
  usage: string;              // copy-paste / install snippet
  presets?: Record<string, Record<string, unknown>>;
  related?: string[];         // for a Lab: the canonical modules it was built from
  agentNotes: string;         // how to use/extend WITHOUT opening source + provenance
  reuseNotes?: string;
  validation?: { build: boolean; preview: boolean; console: boolean };
  version: string;
  updatedAt: string;          // ISO 8601 UTC
}
```

### Deliverables → where they live (ARTINOS-PRD §18 mapped to the contract)

| Deliverable | Where it goes |
|---|---|
| Reusable source module | `STUDIO/src/modules/<category>/<Feature>.module.ts(x)` (ported source), or referenced via `sourcePath` |
| Faithful Lab replica | `STUDIO/src/labs/<id>/` (rebuilt project + self-contained `modules/` snapshot capsule) |
| Showcase / demo page | **Automatic** — the Studio `Showcase` renders it from the entry (no per-module page/router) |
| Registry entry | `<Feature>.meta.ts` → `export default` an `ArtinosModule` |
| Component metadata | `ArtinosModule` fields (`id, name, category, description, tags, version, updatedAt`) |
| Dependency list | `ArtinosModule.dependencies` (include `'webgpu'` when required) |
| Preview configuration | `<Feature>.showcase.tsx` / `<PascalId>Lab.tsx` (reads bridge by `schema.id`) + `ArtinosModule.preview` |
| Inspector controls | `ArtinosModule.schema` (PANELFLOW `ComponentSchema`) — drives the auto-panel |
| Usage documentation | `ArtinosModule.usage` |
| Copy-paste instructions | `ArtinosModule.usage` + `dependencies` + `sourcePath` |
| Agent instructions | `ArtinosModule.agentNotes` |
| Validation checklist | `ArtinosModule.validation` + `npm run check-registry` |
| Provenance (where it came from) | `agentNotes` / `reuseNotes` (canonical source · copiedFor · syncStatus — §14) |
| Graph / node def · app template · export package | Post-MVP (FR-9) — not required |

> **Reconciliation note.** Earlier drafts proposed separate `*Registry.ts`, `*Controls.ts`,
> `*Presets.ts`, and `*Showcase.tsx` files plus a bespoke `controls` object. The shipped contract
> folds all of these into the **one** `ArtinosModule` entry: `schema` (PANELFLOW) replaces the
> bespoke controls object, `presets` is a field, and the showcase is automatic. Use the real contract.

### Wire the preview to the bridge (ADR-13)

```ts
// default OUTSIDE the selector — never `... || {}` INSIDE it (loops on getSnapshot)
const values = useBridgeStore((s) => s.componentValues['<id>']) ?? DEFAULTS;
```

---

## 11. Reusable component API & handle

The wrapper should expose a clean, typed public API. Conceptual example:

```tsx
<WebGPUFluidModule
  preset="aurora"
  interactive
  audioReactive={false}
  showParticles
  quality="high"
  className="absolute inset-0"
/>
```

```ts
export type WebGPUFluidModuleProps = {
  preset?: 'aurora' | 'bass-drop' | 'deep-space' | 'molten-metal';
  interactive?: boolean;
  audioReactive?: boolean;
  showParticles?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'auto';
  className?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
};

export type WebGPUFluidModuleHandle = {
  setPreset: (presetId: string) => void;
  reset: () => void;
  pause: () => void;
  resume: () => void;
  captureFrame: () => Promise<Blob>;
  getPerformanceStats: () => { fps: number; gpuTier?: string; quality: string };
};
```

The module should handle: capability checks (e.g. WebGPU) with a graceful fallback notice, pointer
interaction, preset loading, responsive resizing, performance scaling, cleanup on unmount, optional
audio-permission flow, optional particles, and optional controls connection.

**Performance telemetry is a shared contract.** Heavy modules publish stats through the Studio's
`usePerformanceTelemetry` monitor rather than a bespoke HUD.

---

## 12. Controls, presets, inputs & outputs

**Controls** are a PANELFLOW `ComponentSchema` (`ArtinosModule.schema`), ideally derived from a single
source of truth shared with the wrapper (e.g. a `PARAM_TO_CONFIG` map → both the schema's `parameters`
and the engine config). This keeps the panel and the component in lockstep.

**Presets** are named parameter maps on `ArtinosModule.presets` (`presetName -> { paramKey -> value }`).

Typical **inputs**: `preset · quality · interactive · audioReactive · showParticles · className ·
style · controlsOverride · initialEmitters · onReady · onError`.

Typical **outputs**: ready state · error state · current preset · performance stats · available
presets · capture/export fn · runtime ref · control state · diagnostic messages.

---

## 13. Showcase & usage

The showcase is **automatic**: a registered module (or Lab) gets live preview + auto-generated
controls + usage from the Studio's `Showcase` component. There is no per-module showcase page to author
and no router to wire — registering the entry is what publishes it to the gallery, graph, Agent panel,
website, and MCP at once.

After conversion the module/Lab is consumable in any project:

```tsx
import { createFluidSimLab } from './labs/fluid-sim/createFluidSimLab.js';

// or a reusable module's public component:
import { WebGPUFluidModule } from './modules/webgpu-fluid-sim/WebGPUFluidModule';

export default function HeroFluidPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      <WebGPUFluidModule preset="aurora" className="absolute inset-0" />
      <section className="relative z-10 flex min-h-screen items-center justify-center">
        <h1 className="text-7xl font-semibold text-white">ARTINOS Fluid Engine</h1>
      </section>
    </main>
  );
}
```

---

## 14. Lab capsule standard · library ↔ Lab relationship · provenance · promotion

### Lab capsule standard

Each Lab is a **rebuilt version of the original reference project**. A Lab should:

- replicate the original project visually and behaviorally,
- use ARTINOS reusable modules,
- include **local copied snapshots** of the required modules (so it runs independently),
- include **project-specific modules** organized in their own related subfolders (`local/presets/`,
  `local/composition/`, `local/tuning/`, `local/interaction/`, …),
- include showcase controls + metadata + validation notes,
- be copy-pasteable into another project.

Shape (mapped to the live `labs/fluid-sim/`):

```txt
STUDIO/src/labs/<id>/
  <PascalId>Lab.tsx          # rebuilt project (bridge-driven preview)
  <PascalId>Lab.meta.ts      # ArtinosModule entry (schema, presets, provenance)
  create<PascalId>Lab.js     # composition: wires module systems like the original
  modules/                   # self-contained snapshots of every reusable module the Lab needs
    webgpu/
    physics/
      fluid/
    input/
    rendering/
      postfx/
  local/
    presets/      <id>Presets.ts
    composition/  <id>Composition.ts
    tuning/       <id>OriginalTuning.ts
```

The `modules/` folder holds **local copied snapshots** of the reusable systems the Lab requires; the
`local/` folder holds **project-specific** modules grouped by purpose. This makes the Lab fully
portable and copy-pasteable — it must not break if moved into another project.

### Library ↔ Lab relationship (keep both)

- **Canonical Library Module** — the master source: `STUDIO/src/modules/<category>/<Feature>.module.ts(x)`.
- **Lab snapshot copy** — the copy the Lab runs from: `STUDIO/src/labs/<id>/modules/…`.

Labs keep a snapshot copy so they stay exportable and self-contained. Record provenance so ARTINOS
knows where the copy came from, which Lab uses it, and whether it's outdated. In the shipped repo,
provenance lives in `agentNotes`/`reuseNotes` (and, when a file-level marker helps, an exported
`moduleProvenance` const), capturing:

```ts
export const moduleProvenance = {
  canonicalSource: 'STUDIO/src/modules/physics/fluid/NavierStokesFluid2D.module.ts',
  copiedFor: 'STUDIO/src/labs/fluid-sim',                   // which Lab
  version: '0.1.0',
  syncStatus: 'snapshot',                                   // snapshot | synced | drifted
};
```

This lets ARTINOS know where a module came from, which Labs use it, whether a Lab copy is outdated, and
whether improvements should sync back to the main library. When a canonical module improves, update the
Lab snapshot (or mark `syncStatus: 'drifted'`) so the library never silently diverges.

### Sync discipline (ARTINOS-PRD §13, `STUDIO/AGENTS.md`)

The entry, source, and showcase move together. When the source changes, update the entry (`updatedAt`,
`version`, `validation`) so the library never drifts. A module is the single source of truth for its
gallery card, graph node, Agent record, website listing, and MCP visibility — all from the one
`ArtinosModule` entry.

### Promotion to a package (rare — `spec/promotion-workflow.md`)

A canonical module stays as owned source in `STUDIO/src/modules/<category>/` until reuse **proves** it
deserves a package. Premature packaging is an explicit non-goal. Promote **only** when *all* hold:
proven reuse (≥3 real projects, ≥1 outside ARTINOS) · stable API (≥4 weeks no breaking change) ·
self-contained core (no hard PANELFLOW/bridge dependency) · validated · owns its deps · a
second-maintainer signal. On promotion the core moves to `packages/<id>/` and the module entry
re-points `sourcePath`/`dependencies` at it; everything else (registry, showcase, graph, MCP) is
unchanged. De-promotion is allowed. This is the canonical cross-project "shared library" mechanism.

---

## 15. Multi-system input — worked example (Mode B)

Reference projects under `REF/` often share systems:

```txt
REF/
  fluid-sim-navier/   (sim · emitters · webgpu adapter)
  metaball/           (screen-space rendering · field solver · webgpu adapter)
  mls-mpm/            (particle sim · grid transfer · fluid material)
  galaxy/             (particle system · n-body forces · emitters · webgpu adapter)
  painting/           (brush input · particle system · fluid sim · emitters · webgpu adapter)
```

The agent detects repeated systems:

```txt
Shared systems found:
- WebGPU adapter   → fluid, metaball, galaxy, painting
- Emitter system   → fluid, galaxy, painting
- Particle system  → mls-mpm, galaxy, painting
- Noise functions  → galaxy, painting, shaders
- Pointer brush    → painting, fluid
- Render-target pool → fluid, metaball, postfx
```

It then extracts canonical modules:

```txt
STUDIO/src/modules/webgpu-fluid-sim/        STUDIO/src/modules/fluid-emitters/
STUDIO/src/modules/particle-system/         STUDIO/src/modules/nbody-forces/
STUDIO/src/modules/pointer-brush/           STUDIO/src/modules/noise-functions/
```

…and rebuilds each reference project as a **Lab** that composes those modules into a faithful replica,
reusing already-registered modules where possible. The live `labs/fluid-sim/` is exactly this: its
`modules/` owns a snapshot of the solver + emitters + audio + particles, `createFluidSimLab.js`
reproduces the original init + render loop, and it is `related` to the standalone `webgpu-fluid-sim`,
`fluid-emitters`, and `audio-reactive` modules. A shared core that recurs across ≥3 projects and proves
outside reuse becomes a **promotion candidate** (§14).

---

## 16. Registry requirements

ARTINOS maintains the registry for **both modules and Labs** through one mechanism:

- `STUDIO/src/registry/registry.ts` discovers every entry via `import.meta.glob` over preferred
  `../modules/**/*.meta.{ts,tsx}` plus `../labs/*/*.meta.{ts,tsx}`. Legacy one-folder
  `../modules/*/*.module.{ts,tsx}` and `../labs/*/*.module.{ts,tsx}` entries remain supported so old
  modules do not break. Files are the source of truth — no codegen, no DB.
- Each entry default-exports an `ArtinosModule`; `id === schema.id`; duplicate ids are skipped with a
  warning.
- `searchModules({ query, category, tag })` and `listCategories()` power the gallery/showcase/MCP and
  cover what the idealized spec called `ModuleRegistry` / `CategoryRegistry`. A Lab is distinguished by
  living under `labs/` and tagging `'lab'` (covering the idealized `LabRegistry`) — no separate
  registry file is needed.
- `module-to-node.ts` exposes every entry as a `module/<id>` node on the PANELFLOW graph (FR-9).

> Registering an entry is the single act that publishes it to the gallery, graph, Agent panel,
> website, and MCP. There is nothing else to wire.

---

## 17. Port faithfully — fidelity rule (FR-15)

When porting, reusing, or adapting code from a source:

1. **Locate and inspect the real source files first.** If the source can't be found, **report
   BLOCKED** with the missing path — do not invent a replacement (root `AGENTS.md` §4).
2. **Copy the original implementation as directly as possible.**
3. Make **only** minimal changes for imports, paths, types, styling hooks, and integration.
4. Preserve source algorithms, visual behavior, shader logic, physics, timing, interaction feel,
   control mappings, and useful naming, plus project-specific tuning and original composition.
5. **Do not** rewrite from memory or substitute a generic equivalent.
6. **Report** every unavoidable deviation.

Correct behavior:

```txt
inspect source → understand source → copy faithfully → adapt minimally → verify behavior
```

Incorrect behavior:

```txt
guess behavior → write a generic sample → claim it is equivalent
```

Deviation report example:

```txt
Deviation:
- Original used a browser-only global audio context.
- ARTINOS wraps it in an AudioReactive module for React lifecycle cleanup.
- Behavior preserved; integration changed only for lifecycle safety.
```

> A from-memory re-creation that "looks similar" is a **failure, not a conversion**.

---

## 18. Agent decomposition steps (operational)

> Authoritative procedure: `spec/converter-workflow.md`. Summary:

1. **Inspect the full source** (and **reuse-first** §5 — if a module already covers it, extend and stop).
2. **Locate & inspect the real source files** before porting. BLOCKED if missing — never invent.
3. **List all major systems** in the source.
4. **Detect duplicate concepts** already present in ARTINOS; compare against existing modules.
5. **Decide which systems become canonical modules** (`modules/`) by general capability, not by demo
   name. **Decompose aggressively** (§5): extract the maximum set of genuinely reusable cores,
   especially the universal primitives hiding under the domain logic (GPGPU substrates, grid/sampling
   math, field display, input/splat models, postfx). Each core must prove reuse outside the source —
   its showcase runs it standalone — or be folded back in. A one-module split of a rich source fails.
6. **Decide which systems become Lab-specific local modules** (inside the Lab capsule), including
   source-specific adapters, composition, presets, and tuning that are not yet broadly reusable.
7. **Remove unnecessary scaffolding.**
8. **Preserve all original behavior, visuals, interactions, styling, naming, and source logic** (§17).
9. **Rebuild the reference project as a Lab** (Mode B) — or land the single module (Mode A).
10. **Copy required modules into the Lab capsule** (`labs/<id>/modules/…`) so the Lab runs independently.
11. **Add metadata + provenance** (canonical source, copiedFor, syncStatus — §14).
12. **Add controls (PANELFLOW schema) + presets**, ideally from one shared param source.
13. **Wire the preview/Lab to the bridge** (ADR-13 — default outside the selector).
14. **Add registry entries** — registering publishes everything automatically.
15. **Validate** build, preview, console, performance, interactions (§19).
16. **Report unavoidable deviations** (§20).

Never simply dump the original source into ARTINOS; never rewrite it as a generic simplified demo. The
correct output is a clean reusable module library **plus** a faithful Lab replica.

---

## 19. Validation — Definition of Done

A converted module/Lab is done **only** when:

- `npm run check-registry -w STUDIO` passes — complete entry, `id === schema.id`, `sourcePath`
  resolves, schema valid, no duplicate id.
- `npm run lint -w STUDIO` passes.
- Dev preview: the showcase opens, the live preview renders, and **changing a control drives it** —
  with **zero console errors**.
- Fidelity: a side-by-side check confirms the module/Lab matches the source; deviations are reported.
- The library stays in sync (entry + showcase reflect the current source; Lab snapshots note their
  `syncStatus`).

"It builds" is **not** done. Do not mark complete unless build, preview, console, and interaction
checks were actually performed.

---

## 20. Final conversion report format

The agent must report like this:

```txt
PASS / BLOCKED / NEEDS HUMAN DECISION

Input:
- REF/WebGpu-Fluid-Simulation-master

Summary:
- Extracted reusable fluid systems into canonical modules and rebuilt the original project as a
  faithful ARTINOS Lab (full fidelity).

Created — Canonical Reusable Modules:
- STUDIO/src/modules/webgpu-fluid-sim/   (solver)
- STUDIO/src/modules/fluid-emitters/     (emitter system)
- STUDIO/src/modules/audio-reactive/     (audio reactivity)

Created — Faithful Lab Replica:
- STUDIO/src/labs/fluid-sim/FluidSimLab.tsx
- STUDIO/src/labs/fluid-sim/FluidSimLab.meta.ts
- STUDIO/src/labs/fluid-sim/createFluidSimLab.js
- STUDIO/src/labs/fluid-sim/modules/...   (self-contained module snapshot capsule)
- STUDIO/src/labs/fluid-sim/local/...     (presets / composition / tuning)

Registered:
- webgpu-fluid-sim, fluid-emitters, audio-reactive (modules) + fluid-sim (lab) — category: 3d

Showcase:
- Automatic (Studio Showcase) — gallery / graph / Agent panel / website / MCP

Controls / Presets:
- PANELFLOW schema; presets: Aurora, Deep Space, Bass Drop, Ocean Storm, Liquid Metal, ...

Preserved:
- solver behavior · pointer splats · shader logic · emitters · particles · presets · audio
  reactivity · performance scaling · original composition

Added / Changed for ARTINOS:
- ArtinosModule entries · bridge-driven previews · usePerformanceTelemetry stats · Lab capsule
- Dropped: Tweakpane GUI, perf HUD, recorder, URL preset-sharing (replaced by PANELFLOW + telemetry)

Provenance:
- Lab modules/ is a snapshot of the modules above (canonicalSource / copiedFor / syncStatus recorded)

Validation:
- check-registry: PASS / FAIL
- lint:           PASS / FAIL
- preview:        PASS / FAIL
- console:        PASS / FAIL (zero errors required)
- interaction:    PASS / FAIL (a control drives the live preview)

Deviations:
- list any unavoidable deviations from the source, with the reason

Known Issues:
- real unresolved issues only

Next:
- recommended improvements / promotion candidacy
```

---

## 21. Alignment summary (idealized spec → shipped reality)

This guideline follows the self-contained reusable-module pipeline exactly, mapped onto the shipped
architecture:

| Idealized spec | Shipped reality (use this) |
|---|---|
| `artinos/modules/core/`, `…/webgpu/`, `…/physics/fluid/` trees | **Real** `STUDIO/src/modules/core/`, `…/webgpu/`, `…/physics/fluid/` preferred for new conversions |
| `artinos/labs/<name>/` capsule with snapshot copies | **Real** `STUDIO/src/labs/<id>/` with `modules/` snapshot + `local/` + `<PascalId>Lab.meta.ts` |
| `moduleProvenance` files on every snapshot | Provenance in `agentNotes`/`reuseNotes` (+ optional `moduleProvenance` const); sharing also via package promotion |
| `registry/ModuleRegistry.ts` / `LabRegistry.ts` / `CategoryRegistry.ts` | One glob-based `registry.ts` (`searchModules` + `listCategories`); Labs tagged `'lab'` under `labs/` |
| Separate `*Registry.ts` / `*Controls.ts` / `*Presets.ts` / bespoke pages | One `<Feature>.meta.ts` `ArtinosModule` (schema + presets + auto-showcase) plus optional local control/preset files only when earned |
| Bespoke `controls` object | PANELFLOW `ComponentSchema` (ADR-5); preview reads the **bridge** (ADR-13) |
| `studio/ShowcaseRouter.tsx` / per-module pages | **Automatic** Showcase from the registry |
| Free-form categories | Use explicit category paths: `core · webgpu · input · performance · math · physics/fluid · physics/particles · rendering/postfx · shaders · painting · lab` |
| "npm install / npm run build" gate | `npm run check-registry -w STUDIO` + `npm run lint -w STUDIO` + live preview proof |

For the executable procedure, scripts, and ADRs, follow `spec/converter-workflow.md`,
`spec/promotion-workflow.md`, `STUDIO/AGENTS.md`, and `.claude/skills/artinos-module/`.
