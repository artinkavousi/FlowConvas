# TSL Fluid Mode B Conversion Proposal

Status: PROPOSAL ONLY — no implementation changes yet.

Input:
- CodePen: https://codepen.io/pashafd/pen/OPVGJav
- Title observed: "TSL_Fluid"
- Source author: Pasha Yakubovsky (pashafd / pashaydev)
- Source stack observed from the pen (read live via browser, Cloudflare blocks direct fetch):
  - `three/webgpu` (`WebGPURenderer`, `PostProcessing`, `OrthographicCamera`, `Scene`).
  - `three/tsl` TSL compute (`Fn`, `If`, `uniform`, `instancedArray`, `instanceIndex`, `pass`, plus
    `vec2/3/4`, `float`, `uint`, math nodes `abs/max/clamp/mix/length/normalize/floor/fract/exp`,
    `uv`, `time`).
  - `three/addons/libs/lil-gui.module.min.js` (control GUI — dropped for PANELFLOW).
  - `three/addons/tsl/display/BloomNode.js` (`bloom`).
- Source size: HTML 405 chars, CSS 210 chars, JS 18,184 chars (single-file pen).

## Goal

Recreate the CodePen as an ARTINOS Mode B conversion, **decomposed aggressively into generalized,
well-categorized reusable cores** so the conversion grows the library with universal building blocks —
then rebuild the original as a faithful Lab capsule in `STUDIO/src/labs/tsl-fluid/`.

The result must preserve the original identity: a fullscreen WebGPU **grid-based (Eulerian)
Navier–Stokes fluid** with **RGB dye**, **vorticity confinement**, a **Jacobi pressure solve**,
**pointer-driven force + colored dye splats**, **slow color cycling**, and a **bloom-lit glow** over a
dark background — all running as **native TSL compute kernels** (not fragment ping-pong passes).

## Non-goals

- Do not replace the solver with a generic fragment-shader fluid or a 2D-canvas approximation.
- Do not downgrade the primary implementation to WebGL/canvas (WebGPU is required; provide only a
  capability-notice fallback).
- Do not merge this into the existing `webgpu-fluid-sim` module — that is a **different algorithm**
  (fragment ping-pong passes). See Reuse-First Check.
- Do not fake-decompose into reflexive `index/types/utils/helpers` files. Every extracted module must
  be independently reusable and testable (see Decomposition Principle + Risk 5).
- Do not modify PANELFLOW unless a real public API gap is found.
- Do not invent solver behavior beyond the inspected pen (no extra debug render modes, no audio).

## Source Systems Found

Captured live from the pen DOM (CodeMirror editors). Verbatim file capture into `REF/` is
Implementation Milestone 0 — these are the structural facts the plan is built on.

### 1. TSL compute grid fluid solver (the reusable core)

- Grid config: `GRID_SIZE = isMobile ? 64 : 512`, `GRID_COUNT = GRID_SIZE * GRID_SIZE`.
- Storage fields, all `instancedArray(Float32Array(GRID_COUNT), "float")`:
  - velocity: `velocityX`, `velocityY`, `velocityXTemp`, `velocityYTemp`
  - dye: `densityR`, `densityG`, `densityB`, `densityRTemp`, `densityGTemp`, `densityBTemp`
  - solver scratch: `pressure`, `divergence`, `vorticity`
- Compute kernels (each `Fn(() => {...})().compute(GRID_COUNT)`), the pipeline:
  - `computeForces` — advection of velocity + dye, pointer force injection, dye injection
    (the kernel block contains the 4 advect/inject `.compute(GRID_COUNT)` dispatches).
  - `computeVorticityField` — curl of the velocity field.
  - `applyVorticityForce` — vorticity confinement back into velocity.
  - `computeDivergence` — divergence of velocity.
  - `computePressure` — Jacobi pressure iteration (run `jacobiIterations` times).
  - `computeProject` — subtract pressure gradient (make velocity divergence-free).
  - `computeBoundary` — edge/boundary conditions.
  - `copyVelocity`, `copyDensity` — ping-pong temp→main swaps between passes.
- `computeStep` orchestrates the per-frame kernel sequence.
- Tunables (`settings` object, verbatim defaults):
  ```js
  const settings = {
    viscosity: 0.0001,
    vorticity: 0.8,
    dissipation: 0.995,
    velocityDissipationOffset: 0.005,
    forceRadius: 0.02,
    forceStrength: 2.0,
    colorStrength: 0.5,
    jacobiIterations: isMobile ? 10 : 20,
    colorCycleSpeed: 0.3,
    bloomStrength: 0.5,
    bloomRadius: 0.1,
    bloomThreshold: 0.1,
  };
  ```

### 2. Dye display + bloom post (composition)

- `camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)` — fullscreen quad.
- `renderer = new THREE.WebGPURenderer({ antialias: true })`, `renderer.setAnimationLoop(render)`.
- `postprocessing = new THREE.PostProcessing(renderer)`, `scenePass = pass(scene, camera)`,
  `bloomNode = bloom(scenePass, bloomStrength, bloomRadius, bloomThreshold)`, output = scene + bloom.
- A fullscreen node material maps `densityR/G/B` (+ `colorCycleSpeed` via `time`) to screen color.
  **bloom is a stock `three/addons` node — wired in the Lab composition, not re-extracted.**

### 3. Pointer velocity splat input

- `mouse`, `mouseVelocity`, `lastMouse` (`THREE.Vector2`).
- Pointer move updates normalized position and per-frame velocity; the solver injects a force
  (`forceRadius`, `forceStrength`) and colored dye (`colorStrength`, cycling hue) at the pointer.

### 4. Lab composition + GUI + mobile scaling (Lab-local)

- `init()` → `initFluidSimulation()` → `setupGUI()`; `render()` runs input → `computeStep` → post.
- `lil-gui` panel over `settings` — **dropped for the PANELFLOW control surface (ADR-5)**.
- Mobile detection drives `GRID_SIZE` (64 vs 512) and `jacobiIterations` (10 vs 20).

### Universal primitives hidden inside the demo (the real library win)

Underneath the fluid logic sit several **non-fluid, universal** systems worth extracting on their own:

- **A GPGPU substrate** — paired `instancedArray` storage fields with temp/ping-pong swap + the
  `Fn().compute(GRID_COUNT)` dispatch pattern. This is the base for *any* grid simulation
  (reaction-diffusion, smoke, heat, cellular automata, slime/erosion), not just fluids.
- **Grid/index math** — `instanceIndex → (x, y)` cell addressing, neighbor reads with boundary
  handling, and bilinear sampling for semi-Lagrangian advection. Every 2D GPGPU sim needs this.
- **Field visualization** — mapping a storage field to a fullscreen colored quad with a palette and
  time-based color cycling. Useful to visualize velocity / pressure / heat / density of *any* sim.
- **2D pointer velocity splat** — normalized pointer position + per-frame velocity as injectable
  splats; drives fluids, paint, ripples, particle fields.

## Reuse-First Check

Existing relevant ARTINOS modules (from the live registry):
- `webgpu-fluid-sim` + `fluid-sim` (Lab) — a WebGPU **fluid**, but implemented as **fragment ping-pong
  passes** (`FluidSimulation.js`, `passes.js`, `FullscreenPass.js`, `renderTargets.js`), the
  Pavel-Dobryakov lineage ported from `REF/WebGpu-Fluid-Simulation-master`.
- `webgpu-ssgi-room-renderer` — TSL/WebGPU MRT + Bloom render pipeline (engine/showcase pattern to
  mirror; 3D room-oriented).
- `aurora-shader`, `gpu-particles`, `crystal-knot` — TSL/WebGPU + imperative-engine/React-wrapper
  precedents.
- `audio-reactive` — exists, but the pen has no audio (out of scope).

Conclusion: **this is a genuinely new set of modules, not a duplicate.** The pen is a native TSL
*compute-shader* grid solver (`instancedArray` fields + `Fn().compute()` kernels), a fundamentally
different technique from the fragment-pass `webgpu-fluid-sim`. None of the existing modules provide a
reusable GPGPU compute-field substrate, grid sampling, field-color display, or 2D velocity splat. The
conversion creates new modules (`related` to `webgpu-fluid-sim`), not an extension of it.

Before implementation, run `npm run check-registry -w STUDIO` and confirm no newer duplicate exists.

## Converter Decomposition Principle

Analyze beyond the immediate demo and extract the **maximum set of genuinely reusable cores**,
prioritizing the **universal** primitives hidden under the domain logic. Apply every time:
- Pull universal cores out from under the domain (`core`, `webgpu`, `math`, `input`, `rendering/*`)
  so one extraction can build many future labs.
- Name and categorize by **capability**, not by the demo.
- Generalize each core only as far as the source justifies; keep source-specific composition/tuning in
  the Lab.
- Avoid fake abstraction: only extract systems with obvious reuse value and clean boundaries — no
  reflexive `utils/index/types` files. Each module must be independently reusable and testable.
- Preserve source fidelity in the Lab composition.

## Proposed Mode B Outputs

A smarter decomposition: **two universal cores + two domain cores + one universal input**, then the
Lab. The fluid demo becomes a stack where only one module (`tsl-stable-fluids-2d`) is fluid-specific;
the rest are general-purpose. Dependency direction:

```txt
input/pointer-velocity-splat ─┐
                              ├─► labs/tsl-fluid  (composition + bloom + presets)
rendering/screenspace/tsl-field-color-display ─┤
physics/fluid/tsl-stable-fluids-2d ─┐          │
   ├─ builds on ─► webgpu/tsl-compute-field-2d ┘
   └─ builds on ─► math/tsl-grid-sampling
```

### Canonical Module 1 (Core Universal): TSL Compute Field 2D

Path:

```txt
STUDIO/src/modules/webgpu/
  TslComputeField2D.module.js
  TslComputeField2D.showcase.tsx
  TslComputeField2D.meta.ts
```

Id: `tsl-compute-field-2d`

Purpose:
- A reusable WebGPU/TSL **GPGPU substrate**: a grid of `instancedArray` storage fields with a
  read/write ("ping-pong") temp pair and a compute-dispatch helper (`Fn().compute(count)` + swap).
- Extracts the pen's field-allocation + temp-swap + dispatch machinery, generalized away from fluids.
- Lets future modules build reaction-diffusion, smoke, heat, cellular-automata, slime, or erosion sims
  without re-deriving GPU field management.
- Proposed API: `createTslComputeField2D({ width, height, channels })` returning
  `{ fields, temp, read(name), write(name), swap(name), dispatch(fn), resize(w,h), reset(), dispose() }`.

Controls (showcase demo): `gridSize`, `decay` (a trivial demo kernel to prove the substrate).

Dependencies: `three`, `webgpu`, `react`.

### Canonical Module 2 (Core Universal): TSL Grid Sampling

Path:

```txt
STUDIO/src/modules/math/
  TslGridSampling.module.js
  TslGridSampling.showcase.tsx
  TslGridSampling.meta.ts
```

Id: `tsl-grid-sampling`

Purpose:
- Reusable TSL grid/index math: `instanceIndex ↔ (x, y)` cell coords, neighbor reads (L/R/U/D) with
  selectable boundary mode (clamp / wrap / zero), and **bilinear sampling** for semi-Lagrangian
  advection.
- Extracts the addressing + sampling helpers the pen's kernels share, as composable TSL functions.
- Used by every 2D GPGPU sim (fluids, RD, heat, CA), so it is genuinely cross-domain, not a `utils`
  dump. If it proves too thin in practice, fold into `tsl-compute-field-2d` (noted in Risk 5).
- Proposed exports (TSL `Fn`s): `cellCoord(index, size)`, `cellIndex(x, y, size)`,
  `sampleBilinear(field, uv, size, boundary)`, `neighbors(field, x, y, size, boundary)`.

Controls (showcase demo): `boundaryMode`, `sampleOffset` (visualize sampling).

Dependencies: `three`, `webgpu`, `react`.

### Canonical Module 3 (Domain Reusable): TSL Stable Fluids 2D

Path:

```txt
STUDIO/src/modules/physics/fluid/
  TslStableFluids2D.module.js
  TslStableFluids2D.showcase.tsx
  TslStableFluids2D.meta.ts
```

Id: `tsl-stable-fluids-2d`

Purpose:
- The reusable 2D Eulerian Navier–Stokes solver built **on** modules 1 + 2: the stable-fluids
  operators — semi-Lagrangian advection, divergence, Jacobi pressure solve, gradient projection,
  vorticity (curl) + confinement, boundary, and RGB dye advection/dissipation — ported verbatim from
  the pen, composed into one `step(dt)`.
- Owns the velocity + dye + scratch fields (via module 1) and accepts splat injections
  (`{ x, y, vx, vy, color }`) so any input source can drive it. Exposes the dye field for display.
- The only fluid-specific module in the stack.
- Proposed API: `createTslStableFluids2D(renderer, options)` returning
  `{ step(dt), splat(s), update(options), getDyeField(), resize(w,h), reset(), dispose() }`.

Controls (PANELFLOW schema, from `settings`): `viscosity`, `vorticity`, `dissipation`,
`velocityDissipationOffset`, `forceRadius`, `forceStrength`, `colorStrength`, `jacobiIterations`,
`colorCycleSpeed`, `gridSize` (enum 64/128/256/512).

Dependencies: `three`, `webgpu`, `react`.

### Canonical Module 4 (Domain Reusable): TSL Field Color Display

Path:

```txt
STUDIO/src/modules/rendering/screenspace/
  TslFieldColorDisplay.module.js
  TslFieldColorDisplay.showcase.tsx
  TslFieldColorDisplay.meta.ts
```

Id: `tsl-field-color-display`

Purpose:
- A reusable fullscreen node material that maps a GPU storage field (1–3 channels) to screen color via
  a palette/colormap with optional time-based color cycling — extracted from the pen's dye display.
- Visualizes *any* field: dye density, velocity magnitude, pressure, vorticity, heat — so it pairs with
  any GPGPU sim, not just this fluid.
- Proposed API: `createTslFieldColorDisplay({ field, channels, palette })` returning
  `{ scene, mesh, material, update(options), dispose() }` for an orthographic fullscreen quad.

Controls: `palette` (enum), `colorCycleSpeed`, `exposure`, `channels`.

Dependencies: `three`, `webgpu`, `react`.

### Canonical Module 5 (Core Universal): Pointer Velocity Splat

Path:

```txt
STUDIO/src/modules/input/
  PointerVelocitySplat.module.js
  PointerVelocitySplat.showcase.tsx
  PointerVelocitySplat.meta.ts
```

Id: `pointer-velocity-splat`

Purpose:
- A reusable 2D pointer interaction tracking normalized position + per-frame velocity and emitting
  splat events (`{ x, y, vx, vy }`), usable by fluids, paint systems, ripple/heat fields, and 2D
  particle fields.
- Extracts the pen's `mouse` / `mouseVelocity` / `lastMouse` tracking + normalization.
- Distinct from the existing 3D ray-based `pointer-glass-collider` (this is 2D normalized splat input).
- Proposed API: `createPointerVelocitySplat(canvas, options)` returning
  `{ onSplat(cb), read(), reset(), dispose() }`.

Controls: `splatRadius`, `velocityScale`, `enabled`.

Dependencies: `react` (DOM events only; no Three).

### Faithful Lab: TSL Fluid

Path:

```txt
STUDIO/src/labs/tsl-fluid/
  TslFluidLab.tsx
  TslFluidLab.meta.ts
  createTslFluidLab.js
  modules/
    webgpu/
      TslComputeField2D.module.js
    math/
      TslGridSampling.module.js
    physics/
      fluid/
        TslStableFluids2D.module.js
    rendering/
      screenspace/
        TslFieldColorDisplay.module.js
    input/
      PointerVelocitySplat.module.js
  local/
    presets/
      TslFluidPresets.ts
    tuning/
      sourceTuning.ts          # GRID_SIZE (64/512), jacobiIterations (10/20), dt, isMobile rule
    composition/
      tslFluidComposition.ts   # ortho cam + WebGPURenderer + PostProcessing(scenePass + bloom) wiring
```

Id: `tsl-fluid`

Purpose:
- The faithful replica of the CodePen, wired through ARTINOS/PANELFLOW bridge controls.
- Composes all five canonical modules + the stock `bloom` post exactly like the source
  (`PostProcessing` + `pass` + `bloom`).
- Uses local snapshots of the five modules so the Lab stays copy-pasteable (record provenance:
  `canonicalSource` / `copiedFor` / `syncStatus`).
- Carries only project-specific presets, source tuning (mobile grid/jacobi split), and composition glue.

Default preset:
- `CodePen Original` — exact source `settings` defaults.

Optional ARTINOS presets (additive; default stays faithful):
- `Thick Ink` — higher `colorStrength`, lower `dissipation`.
- `Wispy Smoke` — lower `forceStrength`, higher `dissipation`, softer bloom.
- `High Vorticity` — raised `vorticity` for more swirl.
- `Performance` — `gridSize: 128`, `jacobiIterations: 10` for weaker GPUs.

Related modules:
- `tsl-compute-field-2d`, `tsl-grid-sampling`, `tsl-stable-fluids-2d`, `tsl-field-color-display`,
  `pointer-velocity-splat`; `webgpu-fluid-sim` (sibling technique).

## Implementation Milestones

### Milestone 0 — Source capture and dependency proof

Tasks:
- Capture the verbatim pen source into `REF/tsl-fluid/` (HTML/CSS/JS). The browser-extraction method
  is proven (read live from CodeMirror; the editor exposes `__PEN_SRC`); the only blocker was the
  programmatic download being suppressed — re-capture via chunked read or a user-confirmed download.
- (Optional) review the existing Cursor plan `~/.cursor/plans/tsl_fluid_renderer_rebuild_*.plan.md`
  for any prior decisions/dead-ends.
- Confirm `STUDIO` uses `three@0.184.0` (verified — matches the pen's TSL API surface).
- Confirm Vite resolves `three/webgpu`, `three/tsl`, `three/addons/tsl/display/BloomNode.js`.
- No new package needed (lil-gui dropped for PANELFLOW; bloom ships with `three`).

Acceptance: verbatim source recorded under `REF/`; provenance captured; dependency plan explicit.

### Milestone 1 — Core universal modules (`tsl-compute-field-2d`, `tsl-grid-sampling`)

Tasks:
- Scaffold both (`npm run new-module -w STUDIO -- <id> --category <webgpu|math>`).
- Port the field-allocation/temp-swap/dispatch machinery and the index/neighbor/bilinear helpers,
  generalized away from fluid specifics. TSL stays in untyped `.js` engines (no `@types/three`).
- Thin typed `.showcase.tsx` each (canvas ref, `ResizeObserver`, bridge read outside selector, dispose),
  with a trivial demo kernel proving the substrate/sampling in isolation.
- Fill both `.meta.ts` completely with provenance.

Acceptance: `schema.id === id`; both showcases render a non-fluid demo with a control driving it.

### Milestone 2 — Domain modules (`tsl-stable-fluids-2d`, `tsl-field-color-display`)

Tasks:
- Scaffold the solver under `physics/fluid` and the display under `rendering/screenspace`.
- Port the stable-fluids operators (built on the two cores) and the colormap display node verbatim.
- Solver accepts splat injections and exposes the dye field; display renders any field channel set.
- Showcases prove the solver + display work together (and the display works against a non-fluid field).

Acceptance: both entries complete with provenance; solver runs on the cores; display visualizes an
arbitrary field; at least one control drives each.

### Milestone 3 — Universal input module (`pointer-velocity-splat`)

Tasks:
- Scaffold under `input`; extract pointer position/velocity tracking + normalization + splat emission,
  scene-agnostic (DOM-only).
- Showcase: a minimal canvas visualizing splats (and able to drive the solver).

Acceptance: entry complete with provenance; splat output drives the solver and a non-fluid demo.

### Milestone 4 — Faithful Lab capsule

Tasks:
- Create `STUDIO/src/labs/tsl-fluid/`; copy all five canonical modules into `labs/tsl-fluid/modules/`
  as snapshots (record provenance per snapshot).
- Build `createTslFluidLab.js` as the exact source composition:
  `WebGPURenderer → ortho cam + fullscreen scene → TslStableFluids2D (on field + sampling) →
  PointerVelocitySplat → TslFieldColorDisplay → PostProcessing(pass + bloom) → setAnimationLoop`.
- Add `local/presets`, `local/tuning` (mobile grid/jacobi split), `local/composition`.
- Register `TslFluidLab.meta.ts` (`category: 'lab'`, `tags: ['lab','replica','composition','webgpu','tsl','fluid']`,
  `related` → all five canonical modules + `webgpu-fluid-sim`).

Acceptance: Lab runs independently from its snapshots; metadata states what was copied/changed/dropped.

### Milestone 5 — Fidelity pass and ARTINOS controls

Tasks:
- Compare against the pen: dye color cycling, swirl/vorticity feel, pointer splat force + color,
  dissipation rate, bloom glow, dark background, fullscreen framing.
- Map `settings` → bridge controls via a single `PARAM_TO_CONFIG` source of truth (schema + engine).
- Ensure controls drive live parameters without remount loops.

Acceptance: visual behavior close to source; deviations documented in `agentNotes` + final report.

### Milestone 6 — Verification

```bash
npm run check-registry -w STUDIO
npm run lint -w STUDIO
npm run build -w STUDIO
```

Runtime checks (WebGPU-capable browser):
- Open the Studio; select each canonical module (`tsl-compute-field-2d`, `tsl-grid-sampling`,
  `tsl-stable-fluids-2d`, `tsl-field-color-display`, `pointer-velocity-splat`), then `tsl-fluid`.
- Each preview renders; controls affect the live sim; pointer drag injects force + colored dye.
- Zero console errors; capture at least one desktop screenshot.
- If the in-app browser cannot get a GPU adapter, report that environment limit and verify elsewhere.

## Planned Deviations From Source

- CodePen import map → normal package imports (`three/webgpu`, `three/tsl`, `three/addons/...`).
- `document.body.appendChild` / `window.innerWidth/Height` → canvas-owned React lifecycle + container size.
- Global pointer listeners → canvas-scoped listeners with cleanup.
- `lil-gui` → PANELFLOW control surface (ADR-5); `settings` constants → bridge controls + presets.
- Monolithic single-file pen → five generalized modules + a Lab (the demo's universal primitives are
  lifted into reusable cores; behavior preserved, structure generalized).
- Mobile `GRID_SIZE`/`jacobiIterations` branch → a `gridSize` control + `sourceTuning.ts` default rule.

Avoided deviations:
- No fragment-pass or WebGL rewrite; no generic fluid substitute; no loss of pointer/dye behavior;
  no invented render modes.

## Risk Register

1. WebGPU support — adapter may be unavailable. Mitigation: keep `webgpu` in metadata, show capability
   notice, verify in a GPU-capable browser.
2. TSL compute API drift — `instancedArray` / `Fn().compute()` / `BloomNode` are version-sensitive.
   Mitigation: `STUDIO` is on `three@0.184.0` matching the pen; do not upgrade Three during the port.
3. Performance — 512² grid × `jacobiIterations` per frame is heavy. Mitigation: expose `gridSize` +
   `jacobiIterations`, default to the source's mobile branch on weak GPUs, publish honest telemetry
   via `usePerformanceTelemetry`.
4. Ping-pong correctness — temp/copy swaps must preserve the exact kernel order or the sim
   destabilizes. Mitigation: port `computeStep` verbatim; verify against the live pen side-by-side.
5. Over- vs under-decomposition — the richer 5-module split must stay honest. Each module is justified
   by cross-domain reuse (GPGPU substrate, grid math, solver, field display, pointer splat). If
   `tsl-grid-sampling` proves too thin during the port, fold it into `tsl-compute-field-2d` rather
   than ship a `utils`-shaped module; record the decision in `decisions.md`.
6. Coupling between cores — the solver depends on the field + sampling modules. Mitigation: keep their
   public APIs explicit (no deep internal imports) so the solver composes them, and each core stands
   alone in its own showcase.

## Completion Gate For Implementation

PASS only when:
- `tsl-compute-field-2d`, `tsl-grid-sampling`, `tsl-stable-fluids-2d`, `tsl-field-color-display`,
  `pointer-velocity-splat`, and the `tsl-fluid` Lab are all registered and discoverable.
- `npm run check-registry -w STUDIO`, `npm run lint -w STUDIO`, `npm run build -w STUDIO` all pass.
- Live preview renders with zero console errors in a WebGPU-capable browser.
- At least one control drives the sim; pointer drag injects force + colored dye like the source.
- Each core module's showcase demonstrates it working **outside** the fluid context (proving reuse).
- Fidelity deviations are reported clearly.

Until those are proven, report BLOCKED or incomplete — not PASS.
