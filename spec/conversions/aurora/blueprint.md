# Conversion Blueprint — aurora

> Step 7 artifact of the ARTINOS converter pipeline. A completely blind downstream agent must be able to
> execute this with no other context. Spec: [`docs/blueprinting.md`](../../../docs/blueprinting.md).
> Pipeline (SSOT): [`docs/converter-pipeline.md`](../../../docs/converter-pipeline.md). Contract:
> [`docs/module-and-lab-standards.md`](../../../docs/module-and-lab-standards.md).
>
> Conversion id: `aurora` · Mode: **B** (dual output: library modules + faithful Lab) · Model: Opus 4.8 ·
> Date (UTC): 2026-06-29 · Rev: 2 (full rewrite).
>
> **Status:** IN PROGRESS — 9 of ~19 canonical modules BUILT & gated (`check-registry` 52 modules / 0
> failed, `lint` 0 errors). Remaining: solver, boundaries, emitters, renderer, postfx, stage, glass, 3
> audio modules, + the Lab. Supersedes the draft in `spec/aurora/`.

---

## 0. Reuse-first gate (§5) — result

Searched the registry/categories before planning. **No existing module covers AURORA's systems:**
- `physics/fluid/tsl-stable-fluids-2d`, `webgpu/tsl-compute-field-2d` → 2D Eulerian grid fluid; AURORA is
  **3D MLS-MPM particle** sim. No overlap beyond "WebGPU fluid".
- `audio-reactive` (+ `labs/fluid-sim/modules/audio/*`) → worklet-based; AURORA's audio is a richer
  **superset** (AI genre/mood + beat + 21 viz modes). Port as distinct ids; re-confirm folding at T5.
- `gpu-particles`, `rendering/postfx/webgpu-ssgi-room-renderer`, `rendering/environments/adaptive-open-front-box-room`
  → different pipelines (simpler points / SSGI room) — not AURORA's solver/stage/postFX.
- `math/tsl-hsv` already exists (built in this conversion) → material/renderer color paths **reuse** it.

Conclusion: genuinely new across the board → proceed with full Mode B.

---

## 1. Source & deep analysis (steps 1–2)

- **Input:** Existing project — `ref/AURORA` (upstream "Flow" by holtsetio: realtime **3D MLS-MPM**
  particle-fluid, Refik-Anadol-styled, extended into a full creative tool).
- **Original pipeline:** **Three.js WebGPU + TSL** (`three/webgpu` + `three/tsl`), three `^0.176`, React 19
  + R3F (thin host), Vite, Tweakpane 4, zustand, is-mobile. **WebGPU-only** (hard-fails without `navigator.gpu`).
- **What it does (1 paragraph):** ~32k particles are advected by an MLS-MPM grid solver (FLIP/PIC blend,
  vorticity confinement, surface tension, sparse grid, adaptive-CFL timestep) inside a box/sphere boundary,
  pushed optionally by force fields, emitters, and a pointer ray; colored by velocity/density/material;
  rendered as instanced mesh / points / sprites / trails through an HDR-lit orbit stage with a multi-pass
  postFX chain (MRT bloom + radial focus + radial chromatic aberration + vignette + film grain + color
  grading + lens distortion) and an optional screen-fixed glass-lens overlay; everything is audio-reactive
  (mic/file → FFT perceptual bands + beat/tempo + AI genre/mood → 21 visualization modes) and
  adaptive-performance-governed; a glassmorphic Tweakpane UI drives a ~100-key config.
- **Files read (the real source):**
  | path | purpose | port target / status |
  |---|---|---|
  | `index.ts` | WebGPU bootstrap + animate loop | host scaffolding — drop |
  | `src/APP.ts` (920) | `FlowApp` orchestrator: init order, update loop, pointer raycast, resize, dispose | → Lab `createAuroraLab.js` (L2) + `input/pointer-raycast-force` ✅ |
  | `src/config.ts` (668) | `FlowConfig` (~100 keys) + defaults + helpers | → Lab `local/tuning/` (L3) |
  | `src/APP/pipeline.ts` | weighted async init + progress | → `core/app-init-pipeline` ✅ |
  | `src/APP/performance.ts` | FPS-tier governor | → `performance/adaptive-performance-manager` ✅ |
  | `src/PARTICLESYSTEM/physic/structuredarray.ts` (192) | aligned struct GPGPU buffer + atomics | → `webgpu/tsl-structured-array` ✅ |
  | `src/PARTICLESYSTEM/physic/noise.ts` (104) | fractal triangle-wave 3D noise | → `math/tsl-noise` ✅ |
  | `src/PARTICLESYSTEM/physic/hsv.ts` (57) | GPU HSV→RGB | → `math/tsl-hsv` ✅ |
  | `src/PARTICLESYSTEM/visuals/colorpalette.ts` (383) | 17 gradients + CPU/GPU samplers | → `math/tsl-colormap-palette` ✅ |
  | `src/PARTICLESYSTEM/physic/materials.ts` (511) | 8 MPM materials + GPU lookups | → `physics/fluid/mpm-material-manager` ✅ |
  | `src/PARTICLESYSTEM/physic/forcefields.ts` (484) | 8 field types + manager + evaluator | → `physics/particles/particle-force-fields` ✅ |
  | `src/PARTICLESYSTEM/physic/mls-mpm.ts` (1537) | MLS-MPM solver (6 kernels + 21 audio force branches) | → `physics/fluid/mls-mpm-solver` ⏳ |
  | `src/PARTICLESYSTEM/physic/boundaries.ts` (1535) | boundary shapes + collision + glass viz | → `physics/particles/particle-boundaries` ⏳ |
  | `src/PARTICLESYSTEM/physic/emitters.ts` (545) | particle emitters | → `physics/particles/particle-emitters` ⏳ |
  | `src/PARTICLESYSTEM/RENDERER/{renderercore,mesh,point,sprite,trail}renderer.ts` (~1287) | 4-mode renderer + manager | → `rendering/particles/particle-renderer-system` ⏳ |
  | `src/POSTFX/postfx.ts` (853) | MRT bloom + focus + CA + vignette + grain + grade + distortion | → `rendering/postfx/aurora-postfx` ⏳ |
  | `src/STAGE/scenery.ts` (529) | HDR stage + camera/orbit + tone map + shadows + raycaster | → `rendering/environments/hdr-stage-scenery` ⏳ |
  | `src/GLASS/{glass-lens-panel,presets,types}.ts` (~700) | screen-fixed glass overlay | → `rendering/screenspace/glass-lens-overlay` ⏳ |
  | `src/AUDIO/{audio-manager,soundreactivity,core/enhanced-audio-analyzer,beat-analyzer}.ts` (~1970) | capture+FFT+features+beat | → `audio-reactive/audio-analysis-engine` ⏳ |
  | `src/AUDIO/ai-music-analyzer.ts` (403) | genre/mood/tempo classifier | → `audio-reactive/ai-music-analyzer` ⏳ |
  | `src/AUDIO/{color-modulation,audio-forces}.ts` (561) | audio→color/force mappers | → `audio-reactive/audio-visual-modulation` ⏳ |
  | `src/AUDIO/{visualization-modes,mode-sequencer,mode-parameters,preset-manager}.ts` (~1370) | 21 viz modes + sequencer | → Lab `local/modes/` (L1) |
  | `src/PANEL/**`, `src/DOC/**`, assets alternates | Tweakpane UI, status docs, unused HDR | **dropped** (scaffolding) |

### TSL-triage decision (step 2 Pipeline Rule)
- **Decision:** **No pipeline conversion.** The source is already on the Three.js **TSL/WebGPU** target
  pipeline — port faithfully, do not rebuild what is already TSL.
- **Operator rewrites:** **None needed.** Although `package.json` lists `vite-plugin-tsl-operator`, every
  inspected `src/**` TSL file (mls-mpm, boundaries, materials, forcefields, noise, hsv, colorpalette) uses
  chained `.add()/.mul()/.sub()/.div()` — already compatible with STUDIO's no-operator-plugin constraint.
- **three r0.176 → r0.185:** the only real compat hazard, isolated to **TSL `struct()` buffers** (ADR-A10):
  (1) `struct()` must be given a clean `{ name: 'type' }` map, not the source's fully-parsed layout;
  (2) buffer **labels become the WGSL struct type name**, so they must be `[A-Za-z0-9_]` (no hyphens).
  Both fixes already live inside the ported `tsl-structured-array`; downstream just passes camelCase labels.

---

## 2. Decomposition & scope map (steps 3–6)

Aggressive decomposition (§6): AURORA is a domain demo riding on **universal primitives** — a GPGPU buffer,
TSL math, an init pipeline, a perf governor, a pointer model, a multi-mode renderer, an HDR stage, a postFX
chain, a glass overlay, and an audio-analysis stack. Those cores are the bigger library win; only the
solver/boundaries/fields/emitters/materials and the 21 viz-modes are AURORA-specific.

`U` Core Universal · `D` Domain Reusable · `L` Lab-local · `X` Dropped · ✅ built+gated · ⏳ pending.

| # | System (source) | Generalized capability | Class | Lands in (id) | Reuse/Harvest | Status |
|---|---|---|---|---|---|---|
| 1 | structuredarray | aligned struct-of-arrays GPGPU buffer + atomics | U | `webgpu/tsl-structured-array` | harvest | ✅ |
| 2 | noise | fractal triangle-wave 3D noise | U | `math/tsl-noise` | harvest | ✅ |
| 3 | hsv | GPU HSV→RGB | U | `math/tsl-hsv` | harvest | ✅ |
| 4 | colorpalette | 17-gradient colormap (CPU+GPU) | U | `math/tsl-colormap-palette` | harvest | ✅ |
| 5 | pipeline | weighted async init + progress | U | `core/app-init-pipeline` | harvest | ✅ |
| 6 | performance | FPS-tier hysteresis governor | U | `performance/adaptive-performance-manager` | harvest | ✅ |
| 7 | APP mouse model | pointer→ray→plane hit + drag force | U | `input/pointer-raycast-force` | new | ✅ |
| 8 | materials | MPM material model (8 types + lookups) | D | `physics/fluid/mpm-material-manager` | harvest | ✅ |
| 9 | forcefields | 8 field types + manager + evaluator | D | `physics/particles/particle-force-fields` | harvest | ✅ |
| 10 | mls-mpm | MLS-MPM grid+particle solver | D | `physics/fluid/mls-mpm-solver` | new | ⏳ |
| 11 | boundaries | boundary shapes + collision (+glass viz) | D | `physics/particles/particle-boundaries` | new | ⏳ |
| 12 | emitters | particle emitters | D | `physics/particles/particle-emitters` | new | ⏳ |
| 13 | renderer×4 + manager | multi-mode instanced particle renderer | D | `rendering/particles/particle-renderer-system` | new | ⏳ |
| 14 | postfx | bloom+focus+CA+vignette+grain+grade+distortion | D | `rendering/postfx/aurora-postfx` | new | ⏳ |
| 15 | scenery | HDR stage + camera/orbit + tone map + shadows | D | `rendering/environments/hdr-stage-scenery` | new | ⏳ |
| 16 | glass-lens | screen-fixed glass refraction overlay | D | `rendering/screenspace/glass-lens-overlay` | new | ⏳ |
| 17 | audio capture+FFT+beat | mic/file → spectral features + beat | D | `audio-reactive/audio-analysis-engine` | new | ⏳ |
| 18 | ai-music-analyzer | genre/mood/tempo classifier | U | `audio-reactive/ai-music-analyzer` | new | ⏳ |
| 19 | color-mod + audio-forces | audio→color/force mappers | D | `audio-reactive/audio-visual-modulation` | new | ⏳ |
| L1 | viz-modes + sequencer + params | 21 AURORA viz modes (couples audio↔scene) | L | `labs/aurora/local/modes/` | — | ⏳ |
| L2 | FlowApp wiring | init order + update loop | L | `labs/aurora/local/composition/` + `createAuroraLab.js` | — | ⏳ |
| L3 | config + presets | defaults, PARAM_TO_CONFIG, presets, provenance | L | `labs/aurora/local/{tuning,presets}/` | — | ⏳ |
| X | PANEL/** Tweakpane UI · R3F host · Vite/Babel · DOC/** · unused HDR/textures · legacy disabled config blocks | scaffolding | X | dropped → PANELFLOW schema | — | n/a |

- **Direct asset harvest (step 6):** modules 1–6, 8, 9 were near-verbatim copies (TS stripped). Lab capsule
  harvests only Scenery-referenced HDR/OBJ/textures from `src/assets/`.
- **Out of scope (scaffolding):** whole `PANEL/**` glassmorphic Tweakpane framework + all `PANEL*.ts` +
  CSS; React/R3F host + loading screen; Vite/Babel harness; `DOC/**`; legacy disabled postFX config blocks
  (`chromaticAberration`, `radialLensAberration`, `depthOfField`, `lensDistortion`, `colorGrade`).

---

## 3. Per-module build plan

### ✅ Built (verbatim ports, gated green)
`webgpu/tsl-structured-array` · `math/tsl-noise` · `math/tsl-hsv` · `math/tsl-colormap-palette` ·
`core/app-init-pipeline` · `performance/adaptive-performance-manager` · `input/pointer-raycast-force` ·
`physics/fluid/mpm-material-manager` · `physics/particles/particle-force-fields`. Each is
`.module.{js,ts}` + `.showcase.tsx` (TSL showcases carry `// @ts-nocheck`) + `.meta.ts` with full
`agentNotes`/provenance. Pure-logic cores use `<Name>.ts` (NOT `*.module.ts` — that two-segment depth
collides with the registry's legacy-entry glob `modules/*/*.module.{ts,tsx}`).

### ⏳ `physics/fluid/mls-mpm-solver` → `MlsMpmSolver.module.js`
- **Ported from:** `mls-mpm.ts` (1537) — kernels VERBATIM, kernel order preserved.
- **Exports:** `class MlsMpmSolver` (rename of `MlsMpmSimulator`); `TransferMode` frozen object {PIC:0,
  FLIP:1,HYBRID:2}. Ctor `(renderer, { maxParticles, gridSize=Vector3(64,64,64), fixedPointMultiplier=1e7 })`.
  Methods: `async init()`; `setMouseRay(origin,direction,point)`; `setBoundaries(b)`; `setColorMode(int)`;
  `setAudioEnabled(bool)`/`setAudioMode(int)`/`updateAudioUniforms(obj)`; `updateForceFields(mgr)`;
  `updateBoundaryUniforms()`; `async update(params, deltaTime, elapsed, audioData?)`. Public:
  `particleBuffer` (StructuredArray), `numParticles`, `gridSize`.
- **Import rewiring:** `StructuredArray` ← `../../webgpu/TslStructuredArray.module`; `triNoise3Dvec,
  triNoise3D` ← `../../math/TslNoise.module`; `hsvtorgb` ← `../../math/TslHsv.module`;
  `calculateForceFieldForce` ← `../../physics/particles/ParticleForceFields.module`; `MaterialType,
  getMaterialColor, calculateMaterialStress` ← `./MpmMaterialManager.module`. Drop all `import type` +
  `MlsMpmConfig`/`SimulationParams` interfaces (untyped `.module.js`).
- **Kernels (preserve math + order exactly):** `clearGrid` → `p2g1` (atomic fixed-point momentum scatter +
  mark active cells) → `p2g2` (stress/pressure scatter; MPM eq.16) → `updateGrid` (sparse-skip inactive,
  normalize velocity by mass) → `calculateVorticity` (central-difference curl) → `g2p` (gravity + noise +
  21 `audioMode` force branches + force-field accumulation + boundary collision + advection; FLIP/PIC blend
  by `transferMode`/`flipRatio`). `encode/decodeFixedPoint` use `fixedPointMultiplier`.
- **Struct labels (ADR-A10):** keep source labels `particleData`,`cellData`,`cellDataF`,`vorticityData`,
  `neighborDensity`,`activeCells` (all hyphen-free; StructuredArray also sanitizes).
- **Showcase (`.showcase.tsx`, `// @ts-nocheck`):** WebGPURenderer + perspective camera; `new
  MlsMpmSolver(renderer,{maxParticles:8192*2})`; `await solver.init()`; render `solver.particleBuffer` with
  the **proven** `THREE.Points`+`InstancedBufferGeometry`+`PointsNodeMaterial`, `positionNode = Fn(()=>
  solver.particleBuffer.element(instanceIndex).get('position'))()` (object scaled `1/gridSize`, per AURORA
  pointrenderer L37–63); loop = `solver.update({…},dt,t)` then `renderer.renderAsync`. Cap ≤16k for the VM.
- **meta:** id `mls-mpm-solver`, cat `physics/fluid`, deps `['three','webgpu','react']`. schema:
  particleCount, speed(dt), noise, stiffness, dynamicViscosity, gravityType(enum 0–3), transferMode(enum),
  flipRatio, vorticityEnabled+epsilon, surfaceTensionEnabled+coeff, sparseGrid. presets: Anadol/Splashy/Viscous.
- **Reuse proof:** runs the solver with a built-in minimal point render (no boundaries/postfx/audio).

### ⏳ `physics/particles/particle-boundaries` → `ParticleBoundaries.module.js`
- **From:** `boundaries.ts` (1535) verbatim. Exports `class ParticleBoundaries`, `BoundaryShape` frozen
  object. Ctor `{ gridSize, wallThickness, wallStiffness, restitution, friction, visualize, audioReactive,
  ... }`; `async init()`, `setShape`, `setEnabled/Visible`, `object` (glass-container THREE.Object3D), and
  the TSL collision helper the solver's g2p uses via `setBoundaries`.
- **meta:** id `particle-boundaries`, cat `physics/particles`. schema: shape(enum), restitution, friction,
  wallStiffness, visualize. Showcase: box/sphere deflecting a plain GPU point cloud (no MLS-MPM).

### ⏳ `rendering/particles/particle-renderer-system` → `ParticleRendererSystem.module.js`
- **From:** `renderercore.ts` + 4 renderers + `visuals/colormodes.ts` (fold texture managers /
  materialvisuals unless a 2nd consumer appears). Exports `class ParticleRendererSystem` (rename
  `RendererManager`), `ParticleRenderMode` frozen {MESH,POINT,SPRITE,TRAIL}, `IParticleRenderer` shape.
  Source = `{ particleBuffer, numParticles }`; API `getRenderer().object`, `switchMode`, `update(count,size)`,
  `setColorMode`, `updateAudioReactivity(...)`. **New category** `rendering/particles`.
- **meta:** id `particle-renderer-system`. schema: renderMode(enum), colorMode(enum), size, metalness,
  roughness. Showcase: render an arbitrary instanced buffer in all 4 modes (trivial buffer, not MLS-MPM).

### ⏳ `physics/particles/particle-emitters` → `ParticleEmitters.module.js`
- **From:** `emitters.ts` (545). Exports `class ParticleEmitterManager` + emitter type enum. Showcase:
  emit into a basic GPU buffer; control = rate + shape.

### ⏳ `rendering/postfx/aurora-postfx` → `AuroraPostFX.module.js`
- **From:** `postfx.ts` (853). Exports `class AuroraPostFX` (rename `PostFX`). Ctor `(renderer, scene,
  camera, { bloom, radialFocus, radialCA, vignette, filmGrain, colorGrading, lensDistortionFX })`;
  `async init()`, `update*` per effect, `applyAudioDynamics(audioData,influence,dt)`, `async render()`,
  `dispose()`. MRT bloom (per-object intensity + custom screen blend). Drop legacy disabled effects.
- **meta:** id `aurora-postfx`, cat `rendering/postfx`. schema: bloom/vignette/grain/grade groups.
  Showcase: spinning emissive mesh through the chain.

### ⏳ `rendering/environments/hdr-stage-scenery` → `HdrStageScenery.module.js`
- **From:** `scenery.ts` (529). Exports `class HdrStageScenery` (rename `Scenery`): WebGPURenderer + scene
  + HDR env + lights + PerspectiveCamera + OrbitControls + tone mapping + shadows; `init`, `add/remove`,
  `update(dt,t)`, `resize`, `createRaycaster`, `disableToneMappingForPostFX`. Ship only default-referenced
  HDR/texture assets to the Lab capsule.
- **meta:** id `hdr-stage-scenery`, cat `rendering/environments`. schema: environmentIntensity, exposure,
  toneMapping(enum). Showcase: HDR-lit stage + orbit + PBR mesh.

### ⏳ `rendering/screenspace/glass-lens-overlay` → `GlassLensOverlay.module.js`
- **From:** `glass-lens-panel.ts` + `GLASS/presets.ts` + `GLASS/types.ts`. Exports `class GlassLensOverlay`
  (rename `GlassLensPanel`) + `GlassPresetType`/`DisplacementPattern` frozen objects. Screen-fixed
  `MeshPhysicalNodeMaterial` mesh on an OrthographicCamera; `mesh`, `setEnabled`, `applyPreset`,
  `updateMaterial/Geometry/Displacement`, `resize`, `update(dt)`, `dispose`.
- **meta:** id `glass-lens-overlay`, cat `rendering/screenspace`. schema: enabled, preset(enum),
  transmission, ior, iridescence, dispersion, displacement. Showcase: glass overlay refracting a scene.

### ⏳ `audio-reactive/audio-analysis-engine` → `AudioAnalysisEngine.module.js`
- **From:** `audio-manager.ts` + `soundreactivity.ts` + `core/enhanced-audio-analyzer.ts` +
  `beat-analyzer.ts`. Exports `class AudioAnalysisEngine`. `async init()`, `update(dt)→AudioData`,
  `getUniforms()`, `loadAudioFile`, `togglePlayback`, `setVolume`, `dispose`. Mic needs a user gesture →
  showcase overlays a mic button (mirror `fluid-sim`). Showcase: live bass/mid/treble/beat meters.

### ⏳ `audio-reactive/ai-music-analyzer` → `AiMusicAnalyzer.ts` (pure logic, no `.module`)
- **From:** `ai-music-analyzer.ts` (403). Exports `class AiMusicAnalyzer` + `MusicAnalysis` shape; feature
  frames → genre/mood/tempo. Showcase: feed synthetic frames → readout.

### ⏳ `audio-reactive/audio-visual-modulation` → `AudioVisualModulation.module.js`
- **From:** `color-modulation.ts` + `audio-forces.ts`. Exports `class ColorModulation`,
  `calculateSizeModulation`, `calculateGlowIntensity`, `class AudioForces`. Showcase: audio frame →
  modulated color/force on a demo mesh.

---

## 4. Mode B — Lab capsule plan (`STUDIO/src/labs/aurora/`)

- **Files:** `AuroraLab.tsx` (typed wrapper: canvas ref + ResizeObserver + dispose + bridge + mic-toggle
  overlay) · `AuroraLab.meta.ts` (cat `lab`, `AURORA_PARAMS` schema) · `createAuroraLab.js` (untyped
  composition).
- **Composition (`createAuroraLab.js`):** mirror `FlowApp` exactly via `core/app-init-pipeline`:
  config → `hdr-stage-scenery` → `aurora-postfx` → `glass-lens-overlay` → `particle-boundaries` →
  `mls-mpm-solver`(`setBoundaries`) → `particle-renderer-system` → `particle-force-fields` +
  `particle-emitters` + `audio-*` → `input/pointer-raycast-force`. Update loop: scenery.update → audio.update
  → renderer state → glass.update → solver.update(forcefields, audio) → postfx.render →
  `adaptive-performance-manager`.update (tier downgrades renderer mode).
- **Snapshots → `labs/aurora/modules/<category>/`:** copy all 19 used canonical modules in, each with
  provenance (`canonicalSource`, `copiedFor:'aurora'`, `syncStatus:'in-sync'`). `modules/assets/` = only
  Scenery-referenced HDR/OBJ/textures.
- **`local/`:** `modes/` (the 21 viz modes + sequencer + mode-params) · `composition/` · `presets/AuroraPresets.ts`
  (from `config.ts defaultConfig`) · `tuning/` (defaults + `PARAM_TO_CONFIG` + `provenance.ts`) ·
  `interaction/` (pointer + gravity sensor glue).
- **`AURORA_PARAMS` (~20 of ~100 keys):** preset enum · particle count/size · sim speed/noise/gravityType ·
  bloom strength/threshold · glass preset · vizMode(0–20) · renderMode · audio binding/gain. Map via
  `PARAM_TO_CONFIG` (mirror the `fluid-sim` Lab).

---

## 5. Ordered task checklist (steps 8–11)

Modules first, Lab last. Every task's acceptance: `check-registry` green + `lint` green + showcase loads, a
control drives it, **zero console errors in a fresh dev session** (a prior module's GPU error poisons the
device; restart preview between heavy WebGPU modules).

- [x] Phase 1 — 7 universal cores (#1–7).
- [x] T2.0a `mpm-material-manager` · T2.0b `particle-force-fields` (solver deps, pulled forward).
- [ ] **T2.1 `mls-mpm-solver`** — deps in place; next. acceptance: solver point cloud animates, center
  gravity forms a sphere, 0 console errors.
- [ ] **T2.2 `particle-boundaries`** — box/sphere deflects a point cloud.
- [ ] **T2.3 `particle-renderer-system`** — a buffer renders in all 4 modes.
- [ ] **T2.4 integration** — solver + boundaries + renderer compose (MLS-MPM in a box, MESH): first real
  AURORA frame (no new module).
- [ ] **T3.2 `particle-emitters`**.
- [ ] **T4.1 `hdr-stage-scenery`** · **T4.2 `aurora-postfx`** · **T4.3 `glass-lens-overlay`**.
- [ ] **T5.1 `audio-analysis-engine`** · **T5.2 `ai-music-analyzer`** · **T5.3 `audio-visual-modulation`**
  (re-confirm vs existing `audio-reactive` first).
- [ ] **T6 Lab `labs/aurora/`** — composition + snapshots + local modes/presets/tuning + `AURORA_PARAMS` +
  side-by-side fidelity vs `ref/AURORA` (`npm run dev` there) + final report (§10 pipeline format).

---

## 6. Fidelity, deviations & validation

- **Preserved verbatim:** MLS-MPM kernels + math + order; FLIP/PIC, vorticity, surface tension, sparse
  grid, adaptive dt; 21 audio force branches; boundary collision; force-field + material models; renderer
  look (look-at + density scale + AO); postFX chain; glass material; audio analysis; source naming.
- **Deviations (recorded; repeat in each module's end-of-file deviation report):**
  1. **three r0.176→r0.185 struct compat (ADR-A10):** `struct()` gets a clean `{name:'type'}` map (not the
     parsed layout); buffer labels sanitized to WGSL-safe identifiers. Inside `tsl-structured-array`.
  2. **Tweakpane glassmorphic UI dropped** → Lab PANELFLOW `AURORA_PARAMS` (mirrors `fluid-sim`). Glass
     aesthetic = possible future standalone `ui/` conversion.
  3. **React/R3F host, Vite/Babel harness, `DOC/**`, legacy disabled config blocks, unused HDR/textures**
     dropped as scaffolding.
  4. **AURORA audio ported as distinct `audio-reactive/*` ids** (superset of existing module); re-evaluate
     folding at T5.
  5. Pure-logic cores named `<Name>.ts` (not `*.module.ts`); TSL showcases carry `// @ts-nocheck`.
  6. **No TSL operator rewrite** — source is already method-chained (corrects the earlier draft's main risk).
- **Validation (DoD):** per task above; the Lab also needs the snapshot capsule + provenance + a
  side-by-side fidelity note vs `ref/AURORA`. "It builds" is not done.
- **VM caveat:** this dev VM's WebGPU is slow for heavy compute (large point-cloud screenshots may time
  out). Gating signal here = zero console errors + WebGPU active + control present; recommend a hardware
  visual check for the heaviest modules (solver, renderer, postfx, Lab).

---

### Supplementary (non-canonical)
`spec/aurora/{research,plan,tasks,decisions}.md` — earlier analysis + ADR log (ADR-A1…A10). This blueprint
is the canonical step-7 artifact and wins on any conflict.
