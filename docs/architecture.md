# ARTINOS — System Architecture

> How the system is wired: the STUDIO ↔ PANELFLOW boundary, the file-based registry, the control/bridge
> pipeline, the real folder structure, the visual identity, and the verification gates. Product intent is
> in [`docs/product.md`](product.md); the converter is in [`docs/converter-pipeline.md`](converter-pipeline.md).

---

## 1. Two packages, one workspace

ARTINOS is an npm-workspaces monorepo with two first-class packages plus reference/material folders.

```txt
G:\CODE2026\.PROJECTS\ARTINOS\
  PANELFLOW/        # @artinos/panelflow — the universal UI/UX, dock, panel, design-system, control-surface package
  STUDIO/           # the ARTINOS Studio app — registry, modules, labs, converter, host branding
  REF/              # staged reference projects/sources to convert (e.g. three.js-r185, WebGpu-Fluid-Simulation-master)
  TSLGRAPH/         # TSL graph experiments
  Website/          # public read-only registry reader
  docs/             # canonical documentation (this hub)
  spec/             # ADR log + per-conversion blueprints + feature plans
```

**Boundary discipline (do not violate):**

| PANELFLOW owns | STUDIO / ARTINOS owns |
|---|---|
| Panel OS, panel registry/store/chrome, icon rail, dock modes, command palette | ARTINOS host branding + product copy |
| Editor dock + viewport slot infrastructure | The file-based reusable **module registry** |
| Control schema engine: `ComponentSchema`, `registerComponent`, generated panels, **bridge store**, instance support | Module discovery/search/selection, active-module state, preview stage |
| Frost Tweakpane integration + styling (`FrostPanePanel`) | Library + active-module Inspector panels specific to ARTINOS |
| Graph canvas + node/panel orchestration | The conversion workflow + scaffold/check scripts |
| Shared visual language: tokens, glass surfaces, teal accent, dock styling | ARTINOS modules (`modules/`) + Lab replicas (`labs/`) |
| The shared performance-monitor contract (`usePerformanceTelemetry`) | — |

**Rules:** PANELFLOW must stay host-brandable (not ARTINOS-branded by default), buildable as a package
(`npm run build:lib -w PANELFLOW`), and usable by other projects via `PANELFLOW/src/export.ts`. STUDIO
must **not** rebuild PANELFLOW's panel/control/dock/design systems, fork its logic, or add one-off demo
pages that bypass the panel/dock/viewport model.

---

## 2. Workspace wiring (how STUDIO consumes PANELFLOW)

- Root `package.json` declares npm workspaces `["PANELFLOW","STUDIO"]` (ADR-4).
- STUDIO declares `@artinos/panelflow` as `file:../PANELFLOW` **and** Vite-aliases the package to
  PANELFLOW **source** (`../PANELFLOW/src/export.ts`) for dev HMR (ADR-4, ADR-17). PANELFLOW edits reflect
  instantly; for production it consumes built `dist`.
- STUDIO declares the PANELFLOW runtime deps its own code imports (`zustand`, `lucide-react`, `clsx`) and
  **forces a single React copy** via explicit Vite aliases + `dedupe` + `optimizeDeps.include` — duplicate
  React breaks `useSyncExternalStore` (the "getSnapshot should be cached" loop) (ADR-12).
- `PANELFLOW/src/export.ts` is the package API contract; add exports there intentionally.

---

## 3. The file-based registry (no database)

Files are the source of truth — no codegen, no DB (ADR-2, ADR-6).

- `STUDIO/src/registry/registry.ts` discovers every entry via `import.meta.glob` over preferred
  `../modules/**/*.meta.{ts,tsx}` plus `../labs/*/*.meta.{ts,tsx}`. Legacy one-folder
  `../modules/*/*.module.{ts,tsx}` and `../labs/*/*.module.{ts,tsx}` entries remain supported.
- Each entry default-exports an `ArtinosModule`; `id === schema.id`; duplicate ids are skipped with a
  warning.
- `searchModules({ query, category, tag })` and `listCategories()` power the gallery/showcase/MCP.
- A **Lab** is distinguished by living under `labs/` and tagging `'lab'`.
- `module-to-node.ts` exposes every entry as a `module/<id>` node on the PANELFLOW graph.

> Registering an entry is the single act that publishes it to the gallery, graph, Agent panel, website,
> and MCP. **Discovery surfaces:** the **Agent panel** (every module's agent record), the **MCP** tools
> (`npm run mcp -w STUDIO`; `search_modules`, `get_module`, `scaffold_module`, `check_registry`; see
> `STUDIO/MCP.md`), and the **graph spotlight** (press Space on the graph canvas).

---

## 4. The control / bridge pipeline (ADR-5, ADR-11→17)

- PANELFLOW `ComponentSchema` is the canonical control schema; the `ArtinosModule` entry embeds it as
  `schema`. `schema.id` must equal the module `id`.
- `registerComponent(module.schema)` + the control engine generate control panels rendered with
  `FrostPanePanel` (tweakpane_frost) — `ParameterDef.group` → folders, `schema.modifiers` → folders.
- Edits write the shared `useBridgeStore` (keyed by `schema.id`, or by concrete instance id via
  `registerComponentInstance` for multiple copies). External bridge updates (presets) refresh the pane in
  place without remounting.
- **Preview rule (ADR-13):** a preview selects the **raw** bridge slice and applies defaults **outside**
  the selector:

  ```ts
  const values = useBridgeStore((s) => s.componentValues['<id>']);
  const color = values?.color ?? '#2dd4bf';
  // NEVER  s.componentValues[id] || {}  — a fresh {} each render loops getSnapshot
  ```

---

## 5. Studio shell model (ADR-14→17)

- The **viewport is the live stage**, not a documentation page: it renders only the active module's live
  preview (fullscreen `StudioViewport` → `PreviewStage`). Selecting a module sets
  `studio-store.activeModuleId`; a `useActiveModule` hook registers its schema, seeds bridge defaults, and
  opens its control panel + an Info panel in the dock.
- The **dock is a multi-panel host** (`openPanelIds` + `activePanelId`), rendering open panels as a tab
  strip with resizable split columns and a vertical icon rail. Current main surfaces: **Scene Settings ·
  Inspector · Library · Lab Capsules**; **Node Graph** is an optional/secondary panel, not the hardcoded
  center.
- Navigation is **router-free** (a tiny `useStudioStore`, ADR-10).
- The **Inspector** is the user-facing home for active component/project controls and information.
- The shared **performance monitor** displays real telemetry published through `usePerformanceTelemetry`
  / `publishPerformanceStats`; it shows unavailable values honestly rather than decorative constants.

---

## 6. Real folder structure (modules + labs)

```txt
STUDIO/src/
  modules/                         # canonical reusable library modules (Core Universal + Domain Reusable)
    core/        AppInitPipeline.meta.ts …
    webgpu/      TslComputeField2D.meta.ts  TslStructuredArray.meta.ts …
    input/       PointerVelocitySplat.meta.ts  PointerRaycastForce.meta.ts  PointerGlassCollider.meta.ts …
    math/        TslNoise.meta.ts  TslGridSampling.meta.ts  TslColormapPalette.meta.ts  TslHsv.meta.ts …
    performance/ AdaptivePerformanceManager.meta.ts …
    physics/fluid/ …   physics/particles/ …
    rendering/postfx/ …  rendering/screenspace/ …  rendering/environments/ …
    shaders/     SingularityBlackHoleMaterial.meta.ts  TslVolumetricRaymarchShell.meta.ts …
    ui/          SingularityTrianglePreloader.meta.ts …
    <category>/
      <Feature>.ts(x) / .js       # self-contained runtime/component source (no .module infix)
      <Feature>.showcase.tsx       # bridge-driven live showcase (ADR-13)
      <Feature>.meta.ts            # ArtinosModule entry (id === schema.id)
    # legacy flat modules (audio-reactive/, gpu-particles/, crystal-knot/, …) remain supported
  labs/                            # faithful project replicas (Mode B compositions)
    fluid-sim/  tsl-fluid/  singularity/  ball-pool/  threejs-toys-swarm/  facecap/
      <PascalId>Lab.tsx  <PascalId>Lab.meta.ts  create<PascalId>Lab.js
      modules/                     # local copied snapshots of every canonical module the Lab needs
      local/  presets/ composition/ tuning/ interaction/
  registry/   registry.ts  module-to-node.ts  types.ts
  shell/      StudioViewport.tsx  PreviewStage  editor-dock  …   # automatic Showcase — no per-module page/router
```

Keep it **shallow and readable**; add nesting only when it improves clarity.

---

## 7. Visual identity

High-end creative-tool quality: cinematic dark base, glass depth, layered dock surfaces, subtle grain,
**teal accent (`#2dd4bf`)**, sharp typography, restrained glow, smooth interaction states. Avoid generic
dashboards, plain gray panels, placeholder smoke pages, random gradients, and unstyled library defaults.
For panel/control/canvas/3D work, **visual QA is mandatory** — a passing build is not enough. Never
replace recognizable product/demo UI with stripped placeholder pages.

---

## 8. Verification gates

Targeted checks only (run what the change touched):

```bash
npm run lint -w PANELFLOW          # PANELFLOW type/lint
npm run build:lib -w PANELFLOW     # PANELFLOW package build
npm run lint -w STUDIO             # tsc --noEmit
npm run check-registry -w STUDIO   # entry completeness, id === schema.id, sourcePath resolves, schema valid, no dup ids
npm run build -w STUDIO            # production build
```

For UI/panel/viewport work: verify the running dev URL in the browser, check the console for
warnings/errors, confirm the visible screen (not just build output), and confirm controls drive the live
viewport. For module changes: confirm the registry lists it, `schema.id === module.id`, source paths
resolve, and no duplicate ids. **Definition of Done** for any module/conversion is in
[`docs/converter-pipeline.md`](converter-pipeline.md#8-validation--definition-of-done) and
[`STUDIO/AGENTS.md`](../STUDIO/AGENTS.md).

---

## 9. Known risks / watch points

- Don't let STUDIO become a second PANELFLOW; don't let PANELFLOW become ARTINOS-specific.
- Keep package exports intentional; avoid leaking raw internals.
- Tweakpane/plugin chunks are large — keep lazy loading and intentional package build outputs.
- React store loops → check for duplicate React or selectors returning a fresh fallback object.
- GPU/WebGPU verification failures → distinguish environment limits from app failure; verify on
  GPU-capable hardware (the dev VM GPU is slow; hidden preview tabs pause rAF, so animated modules can
  look blank — pump manually).
