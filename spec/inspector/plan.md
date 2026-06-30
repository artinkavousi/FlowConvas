# PanelFlow Inspector Integration — Plan

> **Goal:** Upgrade three.js to **0.185.0** and integrate the new r185 **Inspector**
> (renderer profiler / telemetry / viewer) into ARTINOS as **first-class PanelFlow
> panels** — reusing the Inspector's *data-collection engine* but replacing its
> vanilla floating-DOM UI with native PanelFlow React panels that match the
> existing Studio design + dock/layout system.
>
> Status: **IMPLEMENTED** (Phases 0–3 built & wired). Owner: ARTINOS. Branch: `v0.3`.
> Date: 2026-06-29.

---

## 0. Implementation status (built 2026-06-29)

All phases implemented and wired into both PANELFLOW and STUDIO. Verified:
`tsc --noEmit` clean in PANELFLOW + STUDIO; `build:lib` succeeds (three externalized,
not bundled); STUDIO dev runs with no console errors; Telemetry + Scene panels in the
rail/dock; inspector **auto-attaches to module-owned WebGPU renderers** (observed
`Live · WebGPU · 32 FPS` on a WebGPU module, real Memory rows — textures 2 / 24 MB);
pause detection correct (hidden tab → `Paused`).

**Shipped**
- Engine: `PANELFLOW/src/inspector/` — `ArtinosInspector` (extends `RendererInspector`,
  ports the stats math from `Inspector.js`, **no DOM**), `inspector-store` (Zustand),
  ring buffers, console bridge, attach (`inspectRenderer` + `installInspectorHook`).
- Panels: `PANELFLOW/src/panels/inspector/` — `TelemetryPanel` (Performance / Memory /
  Timeline / Console / Viewer sub-tabs) + `StatsHud`, `LiveGraph`, `StatTree`.
- Scene panel refactored to settings-only (+ Overdraw / Stack-trace / Stats-HUD toggles).
- three `0.184 → 0.185` across PANELFLOW + STUDIO; r185 `ssr()` signature fix in
  `viewport.tsx`; `three` now a peer dep, externalized in the lib build.
- STUDIO: `installInspectorHook()` + Telemetry in the dock layout.

**Key runtime finding (drove a design addition).** three's frame hooks
(`begin()`/`finish()`) fire **only inside the renderer's internal `setAnimationLoop`**
(see `Animation.start` in `three.webgpu.js`). Modules that drive their own
`requestAnimationFrame` + `renderAsync()` (14 of ~46) never trigger them, so the
per-pass tree stays empty. Added a **fallback path**: `ArtinosInspector.beginRender`
counts top-level renders on that path (`getFrame() === null`), and the watchdog
synthesizes FPS + publishes Memory for own-rAF renderers, with a Performance-view hint
that per-pass CPU/GPU timing needs `setAnimationLoop()`. `@types/three@0.185.0` already
ships the Inspector types, so no ambient `.d.ts` was needed (§5.2 obviated).

---

## 1. TL;DR

The three.js r185 Inspector is two layers stacked in one package:

1. A **headless data engine** — `InspectorBase` (ships inside `three/webgpu`) and
   `RendererInspector` (ships at `three/addons/inspector/RendererInspector.js`).
   The `WebGPURenderer` calls its hooks every frame
   (`begin/finish/beginRender/finishRender/beginCompute/finishCompute/inspect`).
   It produces a per-frame timing tree, GPU-timestamp CPU/GPU/total stats, FPS,
   memory counters, and an overdraw render mode. **No DOM.**
2. A **vanilla-DOM UI** — `Inspector.js` → `Profiler` (2,117-line floating panel),
   `Style` (2,054-line CSS-in-JS), and seven DOM `Tab`s (Performance, Memory,
   Timeline, Console, Parameters, Settings, Viewer). This is what we **do not**
   want — it is a separate floating widget that ignores our dock, theme, and
   layout system.

**Strategy:** keep layer 1, drop layer 2. Subclass `RendererInspector` into a
headless `ArtinosInspector` that normalizes frame data into a Zustand
`inspector-store`, and build PanelFlow panels that subscribe to that store. The
seven DOM tabs become the *spec* for what each React view computes — not code we
port.

Two user-facing layout outcomes:

- A **dedicated Telemetry / Performance panel** (new) that owns all monitoring:
  Performance, Memory, Timeline, Console, and Viewer as internal sub-tabs, and
  absorbs the standalone Stats overlay + the old Scene panel's "Telemetry"/
  "Health" sections.
- The **Scene panel becomes settings-only** — viewport, environment,
  post-processing, canvas/render config (and the Inspector's render-mode
  Settings: forceWebGL, overdraw, captureStackTrace).

---

## 2. Goals & Non-Goals

### Goals
- G1. Bump three.js to `0.185.0` consistently across all workspaces, with the
  renderer Inspector API typed and importable.
- G2. Attach a **headless** inspector to the live renderer(s) without rendering
  the vanilla Profiler DOM.
- G3. Surface Performance, Memory, Timeline, Console, Viewer, Parameters, and
  Settings as PanelFlow-native panels/sub-tabs that match Studio styling.
- G4. A dedicated **Performance/Telemetry** panel as the single home for all
  monitoring + the stats HUD.
- G5. Refactor the **Scene** panel to be solely scene/environment/postfx/canvas
  settings.
- G6. Ship the inspector engine + panels as part of the `@artinos/panelflow`
  package surface (exported, reusable).

### Non-Goals
- N1. Porting `Profiler.js` / `Style.js` / `ui/*` DOM or its CSS. (Replaced.)
- N2. Pixel-replicating the vanilla Inspector look. (We match *our* design.)
- N3. Changing any module's render logic. Inspector is an observer.
- N4. WebGL-only fallbacks for GPU-timestamp features beyond what the engine
  already degrades to (timestamps are WebGPU-only; CPU stats always work).

---

## 3. Current State (verified)

| Fact | Detail |
|---|---|
| Root `three` installed | **0.185.0** (hoisted to repo-root `node_modules`, npm workspaces). |
| `PANELFLOW/package.json` | declares `three: ^0.184.0` (devDep) — satisfied by 0.185 but stale. |
| `STUDIO/package.json` | pins `three: 0.184.0` — **must bump** to `0.185.0`. |
| Inspector engine | `InspectorBase` + `setConsoleFunction` exported by `three/webgpu` build; `class Inspector` present. Addon ships at `three/addons/inspector/*` (so the `REF/three.js-r185/...` copy is redundant). |
| `renderer.inspector` | `WebGPURenderer` has a `set/get inspector`; default `new InspectorBase()`. Attach = `renderer.inspector = new ArtinosInspector()`. |
| Copied folder | `PANELFLOW/src/components/inspector/` referenced by the request is **empty / non-existent** — nothing was actually copied. We will create a proper subsystem folder instead. |
| TS types | `three.webgpu.d.ts` does **not** declare `InspectorBase`/`Inspector`/`renderer.inspector`. Needs a local ambient augmentation. |

### PanelFlow architecture (relevant pieces)
- **Panel contract:** `definePanel({ id, title, description, icon, defaultPlacement,
  defaultSize, minSize, maxSize, capabilities, component, tags })`
  (`panel-os/panel-types.ts`, `define-panel.ts`). `component` is a plain React
  component built from `PanelShell` + Tailwind + Zustand selectors.
- **Registry:** `PANEL_REGISTRY` keyed by id (`panel-os/panel-registry.ts`);
  `registerPanel(def)` adds at runtime and bumps `usePanelOSStore`.
- **Dock store:** `usePanelOSStore` — `openPanelIds`, `activePanelId`, dock modes
  (`left|right|bottom|float|min`), per-panel sizes, command palette, theme.
- **Launcher:** `shell/icon-rail.tsx` groups panels by `CORE_ORDER` / `STUDIO_ORDER`
  and rail-tagged auto panels; clicking opens via the store.
- **Shared data store:** `graph/graph-store.ts` → `useGraphStore` holds
  `scene: SceneSettings` and `stats: StatsState`. Telemetry bridge is
  `performance-telemetry.ts` (`publishPerformanceStats`).
- **Package surface:** `export.ts` re-exports panels, stores, shell, and the
  telemetry bridge. STUDIO consumes via `@artinos/panelflow` and
  `registerPanel(...)` in `ArtinosStudio.tsx`.

### The render seam — the central challenge
There is **no single shared renderer** in STUDIO. Each module owns and creates
its own `WebGPURenderer` inside its engine (`createAurora(canvas)`,
`createFluidSim(canvas)`, …). The `ArtinosModule` contract (`registry/types.ts`)
does **not** expose a renderer handle. The current `use-performance-monitor.ts`
is only a coarse rAF FPS/heap heuristic. So the inspector cannot simply read "the
renderer" — it must attach to whatever renderer the active module just created.

- PANELFLOW demo (`shell/viewport.tsx` via `ThreeRuntime.createRendererHost`) **is**
  a single shared renderer → trivial attach point.
- STUDIO modules → need an attach mechanism that catches module-created renderers.

This is solved in §6.

---

## 4. Architecture Decision — headless engine + PanelFlow UI

```
                       ┌──────────────────────────────────────────────┐
   three/webgpu        │  WebGPURenderer (per module or shared host)   │
   renderer loop  ───► │  renderer.inspector.begin()/beginRender()/... │
                       └───────────────┬──────────────────────────────┘
                                       │ frame hooks (no DOM)
                          ┌────────────▼─────────────┐
                          │ ArtinosInspector          │  extends RendererInspector
   ENGINE (headless)      │  - resolveFrame() override │  (three/addons, no Profiler)
                          │  - normalizes → store      │  + setConsoleFunction bridge
                          │  - throttled (text/graph)  │  + ring buffers (no React churn)
                          └────────────┬─────────────┘
                                       │ publish (zustand)
                          ┌────────────▼─────────────┐
   STATE                  │ useInspectorStore         │  frame, passes[], memory,
                          │ (+ ring buffers in module) │  console[], timeline, settings,
                          └────────────┬─────────────┘  viewer, hud
                                       │ selectors
        ┌──────────────────────────────┼───────────────────────────────┐
   UI   ▼                ▼              ▼              ▼                 ▼
   Telemetry panel   Scene panel   Viewer subtab   Stats HUD     Parameters →
   (Perf/Mem/        (settings-     (node/buffer    overlay      control bridge
    Timeline/Console)  only)         previews)
```

**Why subclass `RendererInspector` and not `Inspector`:**
`Inspector.js` imports `Profiler` → `Style` → DOM at module-eval time.
`RendererInspector.js` imports only from `three/webgpu` + `three/tsl` — pure data.
Subclassing it gives us the full timing/stats/overdraw engine with **zero DOM and
zero CSS injection**, and we own the publish step (`resolveFrame`, `updateTabs`).

**Why a separate `inspector-store` (not `graph-store.stats`):**
`graph-store.stats` stays the coarse, public, once-per-second HUD signal used by
the existing telemetry bridge. The inspector data is richer, higher-frequency,
and engine-coupled — it gets its own store so we don't bloat graph-store or
trigger graph re-renders. The HUD (`stats`) can be *derived from* the inspector
store when the inspector is attached (single source of truth), falling back to
`use-performance-monitor` when it is not.

---

## 5. Three.js 0.185.0 Upgrade

### 5.1 Version bumps
- `PANELFLOW/package.json`: `three` `^0.184.0` → `^0.185.0` (devDep). Keep
  `three-stdlib ^2.36.1` (verify OrbitControls import in `viewport.tsx` still
  resolves; bump if peer warns).
- `STUDIO/package.json`: `three` `0.184.0` → `0.185.0`.
- Audit `TSLGRAPH/` and `Website/` workspaces for `three` pins; align to
  `0.185.0` to avoid a second hoisted copy.
- Reinstall + dedupe: a single `three@0.185.0` must remain hoisted at repo root.
- Update `export.ts`/serializer `three_version` strings (e.g. `inspector.panel`
  `three_version: 'r184'` → `'r185'`).

### 5.2 Type augmentation (the only API friction)
`three.webgpu.d.ts` doesn't type the Inspector. Add an ambient declaration in
PANELFLOW (e.g. `src/inspector/three-inspector.d.ts`):

```ts
import 'three/webgpu';
declare module 'three/webgpu' {
  class InspectorBase {
    getRenderer(): any; setRenderer(r: any): this; fps: number;
    begin(): void; finish(): void;
    beginRender(uid: string, scene: any, camera: any, rt: any): void; finishRender(uid: string): void;
    beginCompute(uid: string, node: any): void; finishCompute(uid: string): void;
    inspect(node: any): void;
  }
  function setConsoleFunction(fn: ((type: string, msg: string, stack?: any) => void) | null): void;
  interface WebGPURenderer { inspector: InspectorBase; }
}
declare module 'three/addons/inspector/RendererInspector.js' {
  export class RendererInspector extends import('three/webgpu').InspectorBase {
    frames: any[]; maxFrames: number; overdraw: boolean;
    getStatsData(cid: string): any; getFrameById(id: number): any;
    resolveFrame(frame: any): void; updateTabs(): void;
  }
}
```
(Exact member list finalized against the installed `RendererInspector.js`.)

### 5.3 Upgrade acceptance
- `npm run lint` (`tsc --noEmit`) passes in PANELFLOW + STUDIO.
- PANELFLOW demo + at least one WebGPU Studio module (e.g. `aurora-shader`) load,
  render, and report a backend in the console with no new runtime errors.
- `git grep r184` shows no stale version assertions in shipped code paths.

---

## 6. Attaching the headless inspector to live renderers

The inspector must attach to renderers the shell does **not** create. Provide one
small module `src/inspector/attach.ts` with **two complementary mechanisms**:

### 6.1 Direct attach (preferred, where the shell owns the renderer)
For `ThreeRuntime.createRendererHost` (PANELFLOW demo) and any future shared host:

```ts
export function inspectRenderer(renderer: WebGPURenderer): () => void {
  const insp = getOrCreateArtinosInspector();      // singleton engine
  renderer.inspector = insp;
  insp.setRenderer(renderer);                       // wires timestamps + console
  setInspectorActiveRenderer(renderer);
  return () => detachInspector(renderer);
}
```
Wire it inside `createRendererHost` (gated by an `inspect?: boolean` option) so the
demo viewport is inspected out of the box.

### 6.2 Auto-attach hook (for module-owned renderers in STUDIO)
Mirror the existing `forceWebGL` prototype-patch pattern already used by the
vanilla `Settings.js`: wrap `WebGPURenderer.prototype.init` once so every renderer
created **while inspection is enabled** gets the shared inspector and is marked
the "current" target. Install/uninstall around the active module lifecycle.

```ts
export function installInspectorHook(): () => void {
  const original = WebGPURenderer.prototype.init;
  WebGPURenderer.prototype.init = async function (...args) {
    if (isInspectionEnabled() && !this.inspector?.isRendererInspector) {
      inspectRenderer(this);
    }
    return original.apply(this, args);
  };
  return () => { WebGPURenderer.prototype.init = original; };
}
```

- Install in `ArtinosStudio` mount; track the active module so switching modules
  detaches the previous renderer's data (clear `frames`, reset store) and the new
  module's renderer is auto-picked as current.
- "Current renderer" = the most-recently-initialized renderer that has a non-zero
  drawing-buffer size (filters out offscreen compute-only renderers). Expose
  `setInspectorActiveRenderer()` for modules that own several renderers.

### 6.3 Opt-in module cooperation (clean long-term path — optional)
Extend `ArtinosModule`/preview contract so a module can hand its renderer to the
shell (`onRenderer?(renderer)` or a ref). Where present, prefer §6.1 over §6.2.
Documented as a follow-up; **not required** for v1 because §6.2 covers all
existing modules transparently.

### 6.4 Lifecycle & disposal
- On module unmount / panel close with no consumers: `renderer.inspector` reset to
  a default `InspectorBase`, `setConsoleFunction(null)`, ring buffers cleared,
  prototype hook left installed but inert (`isInspectionEnabled()===false`).
- Respect the known **"rAF paused when hidden"** gotcha: the inspector samples in
  the renderer loop, so when the preview tab is hidden it naturally stops — panels
  must show a "paused / no frames" state rather than spin.

---

## 7. Data model — `useInspectorStore`

A new Zustand store in `src/inspector/inspector-store.ts`. High-frequency series
(graph lines) live in **ring buffers held in the engine module** (drawn to canvas
in the panels via the panel's own rAF) — **not** in React state — so 60 fps
sampling never re-renders React. The store holds throttled snapshots only
(text ≈ every 0.25 s, structural ≈ every 0.1 s), matching the engine's existing
`displayCycle` cadence.

```ts
interface InspectorState {
  attached: boolean;
  backend: 'WebGPU' | 'WebGL2' | null;
  paused: boolean;                 // no frames recently (hidden tab)

  fps: number;
  frame: { cpu: number; gpu: number; total: number; miscellaneous: number };
  gpuTimestamps: boolean;          // timestamp-query available?

  passes: PassNode[];              // hierarchical render/compute timing tree
  memory: MemoryStats;             // renderer.info.memory snapshot (counts+sizes)

  console: ConsoleMessage[];       // ring-trimmed; {level, text, count, stack?}
  unread: { warn: number; error: number };

  timeline: { recording: boolean; frameCount: number; selectedFrame: number | null };

  settings: {                      // mirrors vanilla Settings tab
    forceWebGL: boolean; overdraw: boolean; captureStackTrace: boolean;
    storage: 'url' | 'origin';
  };

  viewer: { nodes: ViewerNode[] }; // inspectable node/texture/RT previews

  // actions (engine → store)
  publishFrame(s: FrameSnapshot): void;
  publishMemory(m: MemoryStats): void;
  pushConsole(m: ConsoleMessage): void;
  setSettings(p: Partial<InspectorState['settings']>): void;
  setViewerNodes(n: ViewerNode[]): void;
  reset(): void;
}

interface PassNode {
  cid: string; name: string; kind: 'render' | 'compute';
  cpu: number; gpu: number; total: number; gpuAvailable: boolean;
  children: PassNode[];
}
```

Selectors are narrow (`useInspectorStore(s => s.frame)`) so each view subscribes
only to its slice.

---

## 8. Panel decomposition

### 8.1 New — **Performance / Telemetry panel** (`telemetry.panel.tsx`)
The single home for all monitoring. Internal sub-tabs via Radix Tabs
(`@radix-ui/react-tabs`, already a dependency):

| Sub-tab | Source tab | What it shows |
|---|---|---|
| **Performance** | `tabs/Performance.js` | FPS counter, live fps/cpu/gpu graph (canvas), per-pass CPU/GPU/Total timing **tree** (render + compute), frame totals, miscellaneous/idle. |
| **Memory** | `tabs/Memory.js` | `renderer.info.memory` rows (geometries, textures, programs, attributes, render targets, uniform/storage buffers …) with count + formatted size, live total graph. |
| **Timeline** | `tabs/Timeline.js` | Record toggle, per-frame draw-call / compute / triangle stream, scrub slider, hierarchical call list. *(Phase 2 — heaviest; needs backend method interception.)* |
| **Console** | `tabs/Console.js` | Captured three console (info/warn/error) with filters, search, copy-all, unread badges, optional stack traces. |
| **Viewer** | `tabs/Viewer.js` | Node/texture/render-target previews (MRT buffers, intermediate node outputs). *(Phase 3 — needs offscreen QuadMesh render.)* |

- Panel id `telemetry` (or `performance`). `defaultPlacement: 'bottom'` (a
  profiler reads best as a wide bottom dock; user can float/dock-right). Tags
  `['core','telemetry','performance','diagnostics','rail']`.
- Absorbs the in-viewport **Stats HUD** (FPS/calls/tris/mem) as a compact header
  strip, and the old Scene "Telemetry" + "Health" sections.
- Sub-tab views are **lazy-mounted** — Timeline interception and Viewer render
  targets only spin up when their tab is active (cost-gated).

### 8.2 Refactor — **Scene panel** → settings only (`scene.panel.tsx`)
Strip the `Telemetry` + `Health` sections (they move to §8.1). Keep/expand:
- **Viewport:** view mode (2D/3D), auto-orbit, grid, gizmos, wireframe.
- **Environment:** env preset, background, volumetrics/fog.
- **Render / Canvas:** backend (WebGPU/WebGL2), tone mapping, material, AA.
- **Post-processing:** shadows, bloom, AO, SSGI, SSR, DOF.
- **Debug / Render modes:** normals/depth/uv debug **+ the Inspector Settings**
  that are really render config: `forceWebGL`, `overdraw`, `captureStackTrace`
  (wired to `useInspectorStore.settings` and the renderer). Note: `forceWebGL`
  and `captureStackTrace` require a renderer re-init (the vanilla tab reloads the
  page) — we re-mount the viewport/module instead of a full reload.

### 8.3 Parameters → existing control bridge
The vanilla **Parameters** tab is a generic property editor that modules populate
via `inspector.createParameters(name)`. ARTINOS already has this concept: the
PanelFlow **control engine** + the Studio **Inspector** panel (auto-generated
control panels from `ComponentSchema`). **Decision:** route any
`createParameters` groups into the existing control bridge rather than build a
parallel editor. (Most ARTINOS modules drive controls through the bridge already;
the Inspector Parameters path is a thin adapter, Phase 2.)

### 8.4 Stats HUD overlay (optional, viewport corner)
A small always-on FPS/calls/tris/mem pill in the viewport, reading
`useInspectorStore` when attached (else `graph-store.stats`). Gated by
`scene.showStats`. Replaces the ad-hoc per-module HUDs with one shared component.

---

## 9. Tab → data-source mapping (implementation spec)

| Tab | Engine data source (read in `ArtinosInspector`) | Publish | Panel view | Phase | Complexity |
|---|---|---|---|---|---|
| Performance | `frame` tree (`children`), `getStatsData(cid)`, `fps`, `frame.cpu/gpu/total/miscellaneous` | `publishFrame` (throttled) + ring buffer for graph | `PerformanceView` | 1 | Med |
| Memory | `renderer.info.memory.*` | `publishMemory` (0.25 s) + ring | `MemoryView` | 1 | Low |
| Console | `setConsoleFunction(resolveConsole)` callback | `pushConsole` immediate | `ConsoleView` | 1 | Low |
| Settings | local store + `renderer`/`Node.captureStackTrace`/`inspector.overdraw` | `setSettings` | Scene panel "Debug/Render" | 1 | Low |
| Stats HUD | derived from Performance + Memory snapshots | reuse | `StatsHud` | 1 | Low |
| Timeline | wraps `renderer.backend[*]` draw/compute methods; records per-frame call list | `timeline.*` + frames buffer | `TimelineView` | 2 | **High** |
| Parameters | `inspector.createParameters(name)` groups | → control bridge adapter | (control panel) | 2 | Med |
| Viewer | `inspect(node)` collection; offscreen `QuadMesh`+`renderOutput` to mini canvases | `setViewerNodes` | `ViewerView` | 3 | **High** |

---

## 10. File / folder structure

### New — engine subsystem (sibling to `graph/`, `panel-os/`, `shell/`)
```
PANELFLOW/src/inspector/
  core/
    ArtinosInspector.ts        # extends RendererInspector; headless; publishes to store
    frame-normalizer.ts        # frame tree → PassNode[]
    console-bridge.ts          # setConsoleFunction wiring + dedupe/once
    ring-buffer.ts             # fixed-length numeric series for graphs
    timeline-recorder.ts       # (Phase 2) backend method interception
    viewer-renderer.ts         # (Phase 3) offscreen QuadMesh previews
  inspector-store.ts           # useInspectorStore (zustand)
  attach.ts                    # inspectRenderer / installInspectorHook / lifecycle
  three-inspector.d.ts         # ambient types for three/webgpu Inspector API
  types.ts                     # PassNode, MemoryStats, ConsoleMessage, ViewerNode …
  index.ts                     # subsystem barrel

PANELFLOW/src/panels/inspector/
  telemetry.panel.tsx          # dedicated panel; Radix sub-tabs
  views/
    PerformanceView.tsx
    MemoryView.tsx
    TimelineView.tsx           # Phase 2
    ConsoleView.tsx
    ViewerView.tsx             # Phase 3
  widgets/
    LiveGraph.tsx              # canvas line graph reading a ring buffer (own rAF)
    StatTree.tsx               # collapsible pass-timing tree
    StatRow.tsx                # name | count | size / cpu | gpu | total row
    StatsHud.tsx               # viewport-corner overlay
```

### Modified
```
PANELFLOW/src/panels/scene.panel.tsx     # strip Telemetry/Health → add Debug/Render Settings
PANELFLOW/src/panel-os/panel-registry.ts # register TelemetryPanel
PANELFLOW/src/shell/icon-rail.tsx        # add telemetry to CORE/STUDIO order
PANELFLOW/src/shell/ThreeRuntime.ts      # createRendererHost({ inspect }) → inspectRenderer
PANELFLOW/src/shell/viewport.tsx         # enable inspect on the demo host; optional StatsHud
PANELFLOW/src/export.ts                  # export inspector store/attach/panel + types
PANELFLOW/package.json                   # three ^0.185.0
STUDIO/src/ArtinosStudio.tsx             # installInspectorHook(); registerPanel(TelemetryPanel)
STUDIO/package.json                      # three 0.185.0
```

### Removed
```
PANELFLOW/src/components/inspector/       # the empty/placeholder copy target (migrate → src/inspector/)
```
(We do **not** vendor `Profiler.js` / `Style.js` / `ui/*` / DOM tabs. The engine
imports `RendererInspector` from `three/addons/inspector/RendererInspector.js`.
If we ever need to pin it, vendor only that one file + `InspectorBase` — never the
DOM modules.)

---

## 11. Phased, dependency-ordered tasks

Each task is self-contained with an acceptance check. **Phase 1 ships a usable
inspector**; Phases 2–3 add the heavy tabs.

### Phase 0 — Upgrade & scaffolding
- **T0.1** Bump `three` to `0.185.0` in PANELFLOW + STUDIO (+ TSLGRAPH/Website if
  pinned); reinstall; confirm single hoisted copy.
  *Accept:* `npm ls three` shows one `0.185.0`; both `tsc --noEmit` pass.
- **T0.2** Add `three-inspector.d.ts` ambient types.
  *Accept:* `renderer.inspector = new InspectorBase()` typechecks; no `any` casts
  needed at attach sites.
- **T0.3** Create `src/inspector/` skeleton (`types.ts`, `inspector-store.ts`,
  `ring-buffer.ts`, `index.ts`) and barrel export.
  *Accept:* `useInspectorStore` importable; lint clean.

### Phase 1 — Headless engine + core panels (MVP)
- **T1.1** `ArtinosInspector extends RendererInspector`: override `resolveFrame`
  to compute the normalized snapshot + push to ring buffers; throttle via the
  `displayCycle` cadence.
  *Accept:* attached to the PANELFLOW demo host, store `fps`/`frame` update; FPS
  matches the existing HUD within ±2.
- **T1.2** `attach.ts` — `inspectRenderer` + `installInspectorHook` + active-
  renderer tracking + dispose/reset.
  *Accept:* demo host inspected via direct attach; a WebGPU Studio module
  (`aurora-shader`) auto-attaches via the prototype hook; switching modules resets
  frames.
- **T1.3** `console-bridge.ts` via `setConsoleFunction`; dedupe + once.
  *Accept:* a deliberate `console.warn` from three appears in the store with level
  + count; `setConsoleFunction(null)` on detach.
- **T1.4** Telemetry panel shell + Radix sub-tabs + `PerformanceView` (FPS,
  `LiveGraph`, `StatTree`) + `MemoryView` + `ConsoleView`.
  *Accept:* panel registers, opens from the rail, renders live data for the demo
  and a module; hidden-tab shows "paused" not a spinner.
- **T1.5** Scene panel refactor: remove Telemetry/Health; add Debug/Render
  Settings (`forceWebGL`, `overdraw`, `captureStackTrace`, debug modes) wired to
  store + renderer (re-mount instead of page reload).
  *Accept:* toggling `overdraw` changes the viewport; `forceWebGL` re-inits to
  WebGL2 (Memory/Console reflect backend); Scene panel shows no perf metrics.
- **T1.6** `StatsHud` overlay reading the inspector store, gated by
  `scene.showStats`; export everything from `export.ts`; register panel in STUDIO.
  *Accept:* HUD shows live FPS/calls/tris/mem; package builds (`build:lib`);
  STUDIO consumes the new panel.

### Phase 2 — Timeline + Parameters
- **T2.1** `timeline-recorder.ts`: intercept `renderer.backend` draw/compute
  methods (record per-frame call list, triangles), record toggle, frame ring.
  *Accept:* recording a few seconds yields a scrubbable frame list with
  call/triangle counts; uninstall restores original backend methods cleanly.
- **T2.2** `TimelineView` (record button, slider, call list, triangles/calls/fps
  graph), lazy-mounted with the sub-tab.
  *Accept:* scrub selects a frame; inactive sub-tab does no interception (verified
  by no perf delta when closed).
- **T2.3** Parameters → control-bridge adapter for `createParameters` groups.
  *Accept:* a module that registers an inspector parameter group surfaces it in
  the control panel.

### Phase 3 — Viewer
- **T3.1** `viewer-renderer.ts`: collect `inspect(node)` nodes; render each to a
  small offscreen target via `QuadMesh` + `renderOutput` (port the *logic* of
  `tabs/Viewer.js`, not its DOM).
  *Accept:* an inspected node/texture shows a correct live thumbnail.
- **T3.2** `ViewerView`: grid of previews, select-to-enlarge, MRT buffer list.
  *Accept:* MRT outputs (e.g. normal/depth from a postfx module) preview live;
  disposed on tab close.

---

## 12. Performance & correctness

- **No React churn at 60 fps.** The engine samples every frame but only writes
  *throttled snapshots* to the store; graph lines are drawn on a `<canvas>` by the
  panel's own rAF reading a shared ring buffer. Verified by React DevTools render
  counts staying flat while FPS graph animates.
- **Cost-gated heavy tabs.** Timeline interception and Viewer render targets only
  run while their sub-tab is active and the panel is open.
- **Hidden-tab pause** (memory: *preview rAF paused when hidden*). When the
  preview stops, the inspector stops receiving frames → store `paused=true` →
  panels show a calm paused state. To verify animated views in headless QA, pump
  frames manually.
- **GPU timestamps are WebGPU-only.** On WebGL2, GPU columns show `-`; CPU stats
  + memory + console still work. The engine already degrades (`gpuNotAvailable`).
- **Disposal.** Detaching resets `frames`, clears ring buffers, nulls
  `setConsoleFunction`, restores backend methods (Timeline), and disposes Viewer
  targets — no leaks across module switches.
- **TSL operator caveat** (memory: *STUDIO has no TSL operator plugin*). Any TSL
  in `viewer-renderer.ts` (e.g. overdraw/preview nodes) must use `.add()/.mul()`
  chaining, not `+`/`*`.

---

## 13. Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Inspector API unstable across three minors | Med | Pin `0.185.0`; isolate all engine coupling in `src/inspector/core/`; types in one `.d.ts`. |
| Prototype-`init` hook conflicts with module renderer setup | Med | Idempotent guard (`isRendererInspector`); install once; provide explicit `inspectRenderer` opt-out path (§6.3). |
| Timeline backend interception breaks a module's render | Med | Off by default; only patch on record; always restore originals; wrap in try/finally. |
| `forceWebGL` needs full re-init | Low | Re-mount viewport/module instead of `location.reload()`. |
| Viewer offscreen renders cost frames | Med | Lazy; small targets; only visible previews; throttle preview render. |
| Package bloat (engine ships in `@artinos/panelflow`) | Low | Tree-shakeable barrel; heavy bits (timeline/viewer) dynamically imported. |
| Two `three` copies after upgrade | Low | Align all workspace pins to `0.185.0`; `npm dedupe`; assert single copy in CI check. |

---

## 14. Verification plan

1. **Build/types:** `tsc --noEmit` (PANELFLOW + STUDIO); `npm run build:lib`.
2. **Demo viewport:** inspector attaches; Performance/Memory/Console live; FPS
   matches HUD; toggling `overdraw`/`forceWebGL` behaves.
3. **Studio module:** load `aurora-shader` (WebGPU) → auto-attach; load a WebGL
   module (`neon-bloom`) → GPU columns `-`, CPU/memory/console still live; switch
   modules → frames reset, no leak.
4. **Hidden tab:** background the preview → panels show paused; foreground →
   resumes.
5. **Regression:** Scene panel no longer shows perf; rail launches Telemetry;
   command palette finds it.
6. Use `preview_*` tools (start dev server, snapshot, console-logs) to capture
   evidence per task; never hand verification to the user.

---

## 15. Decisions needing sign-off

- **D1. Panel id & default dock.** `telemetry` panel, default `bottom`. (Alt:
  dock-right to match Scene/Inspector.) → *Recommend bottom* (profiler ergonomics).
- **D2. Stats HUD ownership.** Single shared `StatsHud` in viewport vs per-module.
  → *Recommend shared*, reading the inspector store.
- **D3. Parameters routing.** Reuse control bridge (recommended) vs a dedicated
  Parameters view.
- **D4. Phase 2/3 scope for v1.** Ship Phase 1 as v1; Timeline + Viewer as fast
  follow? → *Recommend yes.*
- **D5. Module renderer contract (§6.3).** Add `onRenderer` to `ArtinosModule`
  now, or rely on the prototype hook for v1? → *Recommend hook for v1, contract
  later.*

---

## 16. Appendix — engine API quick reference (r185)

- Attach: `renderer.inspector = new ArtinosInspector(); renderer.inspector.setRenderer(renderer)`.
- Renderer-driven hooks (do not call manually): `begin/finish`,
  `beginRender/finishRender`, `beginCompute/finishCompute`, `inspect(node)`.
- Per-frame data: `inspector.frames[]`, `frame.children` (render/compute tree),
  `frame.cpu/gpu/total/miscellaneous`, `inspector.fps`,
  `inspector.getStatsData(cid)` → `{cpu,gpu,total}`.
- Memory: `renderer.info.memory.{geometries,textures,programs,attributes,
  renderTargets,uniformBuffers,storageAttributes,...}` (+ matching `*Size`).
- Console: `setConsoleFunction((type,msg,stack)=>…)` from `three/webgpu`.
- Render modes: `inspector.overdraw = true` (additive shaded-fragment count);
  `Node.captureStackTrace = true` (stack traces in console).
- GPU timing requires `renderer.backend.trackTimestamp = true` and
  `hasFeature('timestamp-query')` (WebGPU).
```
