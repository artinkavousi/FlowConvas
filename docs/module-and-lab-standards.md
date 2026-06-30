# ARTINOS Module & Lab Capsule Standards

> The authoring contract for every library module and Lab capsule: the self-contained module standard,
> the `ArtinosModule` registry entry, naming, category paths, the Lab capsule shape, provenance/sync,
> and module→package promotion. Read with [`docs/converter-pipeline.md`](converter-pipeline.md) (how
> things get built) and [`docs/architecture.md`](architecture.md) (the registry + control pipeline).

---

## 1. The JSM / ESM self-contained module standard

Every module added to the master library or a Lab capsule adheres to a strict ESM drop-in format.

- **Fully portable.** A developer can copy-paste the file/folder into a separate external project and
  have it work out of the box with **zero dependency pain**.
- **Decoupled architecture.** No hidden application contexts, no deep internal framework imports, **zero
  global application-state coupling**. PANELFLOW/bridge wiring lives only in the showcase/wrapper, never
  in the reusable core.
- **Human & agent readable.** Clear naming + structural metadata (the `ArtinosModule` entry) so other AI
  agents can discover, parse, and orchestrate the module dynamically.
- **Ownership over abstraction.** Raw, readable, high-performance source logic — **not** abstract wrapper
  frameworks, premature packages, or complex abstraction layers.

A good single-file module holds, in order:

```txt
1 Imports   2 Local types   3 Constants / default config   4 Small helpers
5 Main runtime/component   6 Local subcomponents   7 Exports   8 Usage notes   9 dispose()/cleanup   10 Agent notes
```

Default shapes:

```txt
ModuleName.tsx           # React: imports → types → constants → helpers → main component → subcomponents → exports
ModuleName.ts            # non-React runtime (typed): imports → types → constants → helpers → main class/fn → defaults → exports
ModuleName.js            # untyped Three.js / TSL runtime (repo uses allowJs, no checkJs)
```

**Clean naming — no `.module` infix.** Runtime files are `<Feature>.ts` / `<Feature>.tsx` / `<Feature>.js`
(e.g. `TslPcgHash.js`, not `TslPcgHash.module.js`). The registry discovers entries by `<Feature>.meta.ts`
and the showcase/meta import the runtime explicitly, so the runtime filename is free — keep it short. The
only `.module.*` files are **legacy one-folder registry entries** (`<id>/<id>.module.ts`), still supported
but not for new work; a runtime named `*.module.ts(x)` can also collide with that legacy discovery glob, so
avoid it.

### Split rules — default to compact (pipeline step 8)

Prefer one strong compact file over many weak ones. **Split only when** the file is genuinely hard to
understand · a module is reused by real features · a system has a clearly separate responsibility · the
split makes the project easier (not enterprise-shaped) · the new file has a strong name · the extracted
part can be reused/tested independently · keeping it together would hide important logic. Never create
reflexive `index.ts / types.ts / utils.ts / helpers.ts / constants.ts / hooks.ts / adapters.ts`
scaffolding unless each file earns its place.

### Engine + wrapper pattern (3D / shader / WebGPU)

- **Self-contained `*.ts(x)` / `*.js` runtime** — owns the core logic, explicit dependencies, lifecycle,
  and `dispose()`/cleanup. For imported JavaScript engines keep source as direct as possible; Three.js
  is **untyped** in this repo (`allowJs`, no `checkJs`) — keep Three code in an untyped engine and never
  add `@types/three` or `@ts-expect-error` on the import.
- **Thin typed `*.showcase.tsx` wrapper** that owns the bridge read, canvas ref, `ResizeObserver`, and
  `dispose()`.
- **UI modules** → a self-contained `.tsx`, React-only deps where possible.

---

## 2. Naming rules

A filename must tell a human and an agent exactly what it contains.

Good: `NavierStokesFluid2D.js · ParticleSystem.js · WebGPUAdapter.js ·
WebGPUFluidModule.tsx · FluidSimLab.tsx · createFluidSimLab.js`.

Avoid: `index.ts · main.ts · utils.ts · helpers.ts · stuff.ts · demo.ts · module1.ts · newComponent.tsx`.

| Name | Role |
|---|---|
| `<Feature>.ts(x)` / `<Feature>.js` | Self-contained reusable runtime/component source (no `.module` infix; `.js` for untyped Three/TSL) |
| `<Feature>.meta.ts` | Registry entry (`ArtinosModule`); `id` kebab-case; **`id === schema.id`** |
| `<Feature>.showcase.tsx` | Live preview/showcase; reads the bridge by `schema.id` |
| `<PascalId>Lab.tsx` | A Lab replica's rebuilt-project component |
| `<PascalId>Lab.meta.ts` | Lab registry entry (`ArtinosModule`) |
| `create<PascalId>Lab.js` | The Lab composition (wires engine systems like the original) |
| `labs/<id>/modules/*` | Lab snapshot copies of required reusable modules |
| `labs/<id>/local/*` | Lab-specific presets, composition, tuning, interaction |

`<id>` is kebab-case and equals the registry id; previews/wrappers/Labs use the PascalCase form. Legacy
`<id>.module.ts` registry entries remain supported for existing modules only — do not use that shape for
new conversions.

---

## 3. Category paths

Use explicit category paths so a human and an agent know the domain from the path alone. Add a new path
only when none fit **and** the name is explicit.

| Category | Use for |
|---|---|
| `core` | Animation loops, lifecycle utilities, performance-monitor contracts |
| `webgpu` | Adapters, ping-pong buffers, render-target pools, GPGPU compute fields |
| `input` | Pointer brush, gesture input, splat/interaction models |
| `performance` | Quality scalers, telemetry, profiling |
| `math` | Noise, color, spatial, grid/index, sampling helpers |
| `physics/fluid` | Fluid solvers, pressure/advection/vorticity systems |
| `physics/particles` | Particle systems, N-body forces, spatial grids |
| `physics/metaballs` | Field solvers and metaball surfaces |
| `rendering/screenspace` | Screen-space surfaces and renderers |
| `rendering/postfx` | Bloom, chromatic aberration, grain, post effects |
| `rendering/environments` | Adaptive rooms, scenes, framing primitives |
| `shaders` | TSL / WebGPU / GLSL shader modules |
| `painting` | Brush engines, stroke emitters, painting interactions |
| `ui` | Self-contained UI/visual React components |
| `lab` | Faithful Lab registry entries (under `labs/`) |

---

## 4. The `ArtinosModule` entry — the registry contract

One entry per module **and per Lab**, co-located as `<Feature>.meta.ts`, `export default`. The control
schema reuses PANELFLOW's `ComponentSchema` as the canonical source (ADR-5), so the showcase drives
PANELFLOW's auto-generated panel directly. Fill **every** field — `agentNotes` must let another agent use
the module **without opening the source**.

```ts
export interface ArtinosModule {
  id: string;                 // kebab-case, unique. MUST equal schema.id (the bridge keys on it)
  name: string;
  category: string;           // path: 'core' | 'webgpu' | 'physics/fluid' | 'rendering/postfx' | 'lab' | …
  description: string;        // what it does + when to use it
  tags: string[];             // for a Lab include 'lab' + 'replica' + 'composition'
  schema: ComponentSchema;    // PANELFLOW — powers the auto-panel (each param: key/label/type/default; min/max/step for numbers)
  preview: ComponentType;     // live preview (module) or the rebuilt project (Lab); reads the bridge
  sourcePath: string;         // repo-relative location of owned source (must resolve on disk)
  dependencies: string[];     // packages + runtime reqs (include 'webgpu' if WebGPU-only, so the degrade notice fires)
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

### `agentNotes` — what every entry must carry

Written so another agent can use/extend the module without reading the source first:
- whether it's controlled (props like `value`/`onChange`) or self-contained;
- the key props and what they do;
- runtime needs (e.g. `'webgpu'`) and whether it's copy-paste portable;
- the bridge id (always `=== module.id`);
- **provenance** for conversions (where it was ported from + what was dropped/changed).

### Wire the preview to the bridge (ADR-13)

```ts
// default OUTSIDE the selector — never `... || {}` INSIDE it (a fresh {} loops getSnapshot)
const values = useBridgeStore((s) => s.componentValues['<id>']) ?? DEFAULTS;
```

### Deliverables → where they live

| Deliverable | Where it goes |
|---|---|
| Reusable source module | `STUDIO/src/modules/<category>/<Feature>.ts(x)` (or `.js`; ported source) or referenced via `sourcePath` |
| Faithful Lab replica | `STUDIO/src/labs/<id>/` (rebuilt project + `modules/` snapshot capsule) |
| Showcase / demo page | **Automatic** — the Studio `Showcase` renders it from the entry (no per-module page/router) |
| Registry entry | `<Feature>.meta.ts` → `export default` an `ArtinosModule` |
| Component metadata | `ArtinosModule` fields (`id, name, category, description, tags, version, updatedAt`) |
| Dependency list | `ArtinosModule.dependencies` |
| Preview configuration | `<Feature>.showcase.tsx` / `<PascalId>Lab.tsx` + `ArtinosModule.preview` |
| Inspector controls | `ArtinosModule.schema` (PANELFLOW `ComponentSchema`) |
| Usage / copy-paste | `ArtinosModule.usage` + `dependencies` + `sourcePath` |
| Agent instructions | `ArtinosModule.agentNotes` |
| Validation checklist | `ArtinosModule.validation` + `npm run check-registry` |
| Provenance | `agentNotes` / `reuseNotes` (+ optional exported `moduleProvenance` const) |
| Blueprint | `docs/conversions/<id>-conversion-plan.md` |

> Registering an entry is the **single act** that publishes it to the gallery, graph, Agent panel,
> website, and MCP. There is nothing else to wire.

---

## 5. The Lab capsule standard

Each Lab is a **rebuilt version of the original reference project** — a faithful, independent,
copy-pasteable replica that matches the original capabilities completely, **never** a one-off simplified
demo. A Lab must:

- replicate the original visually and behaviorally;
- use ARTINOS reusable modules;
- include **local copied snapshots** of the required modules (so it runs independently);
- keep **project-specific modules** grouped by purpose (`local/presets/`, `local/composition/`,
  `local/tuning/`, `local/interaction/`);
- include a **showcase dashboard with parameter controllers** to test physics/shaders/visuals live;
- include metadata + validation notes;
- be copy-pasteable into another project without breaking.

Shape (mapped to the live `labs/fluid-sim/`):

```txt
STUDIO/src/labs/<id>/
  <PascalId>Lab.tsx          # rebuilt project (bridge-driven preview)
  <PascalId>Lab.meta.ts      # ArtinosModule entry (schema, presets, provenance)
  create<PascalId>Lab.js     # composition: wires module systems like the original
  modules/                   # self-contained snapshots of every reusable module the Lab needs
    webgpu/  physics/fluid/  input/  rendering/postfx/  …
  local/
    presets/      <id>Presets.ts
    composition/  <id>Composition.ts
    tuning/       <id>OriginalTuning.ts
    interaction/  <id>Interaction.ts
```

`modules/` holds **local copied snapshots** of the reusable systems; `local/` holds **project-specific**
modules grouped by purpose. This makes the Lab fully portable.

---

## 6. Library ↔ Lab relationship · provenance · sync

- **Canonical Library Module** — the master source: `STUDIO/src/modules/<category>/<Feature>.ts(x)` (or `.js`).
- **Lab snapshot copy** — the copy the Lab runs from: `STUDIO/src/labs/<id>/modules/…`.

Labs keep a snapshot so they stay exportable. Record provenance so ARTINOS knows where a copy came from,
which Lab uses it, and whether it's outdated. Provenance lives in `agentNotes`/`reuseNotes` and, when a
file-level marker helps, an exported const:

```ts
export const moduleProvenance = {
  canonicalSource: 'STUDIO/src/modules/physics/fluid/NavierStokesFluid2D.js',
  copiedFor: 'STUDIO/src/labs/fluid-sim',   // which Lab
  version: '0.1.0',
  syncStatus: 'snapshot',                   // snapshot | synced | drifted
};
```

**Sync discipline.** The entry, source, and showcase move together. When source changes, update the
entry (`description`, `usage`, `version`, `updatedAt`, `agentNotes`, `validation`) and confirm the
showcase still works. When a canonical module improves, update the Lab snapshot (or mark
`syncStatus: 'drifted'`) so the library never silently diverges. After any change run
`npm run check-registry -w STUDIO`. A module is the **single source of truth** for its gallery card,
graph node, Agent record, website listing, and MCP visibility.

---

## 7. Promotion to a package (rare — gated — reversible) {#promotion}

A canonical module stays as owned source in `STUDIO/src/modules/<category>/` until reuse **proves** it
deserves a package. Premature packaging is an explicit non-goal. Promote **only** when **all** hold
(ADR-20):

1. **Proven reuse** — used in **≥3 real projects** (not demos), with ≥1 consumer **outside** ARTINOS.
2. **Stable API** — no breaking change to props/`schema`/exports in **≥4 weeks**.
3. **Self-contained core** — no hard dependency on PANELFLOW or the Studio bridge (bridge wiring lives
   only in the wrapper).
4. **Validated** — `check-registry` green, build/preview/console clean, `validation` recorded.
5. **Owns its deps** — a clear, minimal dependency list; no ARTINOS-internal imports in the core.
6. **A second-maintainer signal** — someone other than the author has read/used it; `agentNotes` let an
   agent use it without opening source.

**Promotion steps:** extract the framework-agnostic core to `packages/<id>/` (`@artinos/<id>`, own
`package.json` + `tsconfig` + single public `index.ts`); keep the Studio module as the showcase but
re-point its `sourcePath`/`dependencies` at the package; add `packages/<id>` to the root workspaces;
re-validate; append an ADR. Everything else (registry, showcase, graph, Agent panel, MCP) is unchanged
because they read the same `ArtinosModule` entry. **De-promotion** (fold back to Studio source) is
allowed — reversibility keeps the bar honest.
