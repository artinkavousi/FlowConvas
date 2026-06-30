# Conversion Plan — aurora

> **Worked example for `/artinos-module`** — a full Mode B step-7 conversion plan (snapshot). Canonical
> live copy: `docs/conversions/aurora-conversion-plan.md`. Spec / pipeline / contract:
> [`blueprinting.md`](../../../../docs/blueprinting.md) · [`converter-pipeline.md`](../../../../docs/converter-pipeline.md) ·
> [`module-and-lab-standards.md`](../../../../docs/module-and-lab-standards.md).
>
> Conversion id `aurora` · Mode **B** · Author Opus 4.8 · Updated 2026-06-29.
> Status: **IN PROGRESS** — 11 modules built & gated (check-registry + lint green; solver + boundaries run
> live on r0.185, zero console errors); 8 modules + Lab pending.
> Fully recreated from source inspection; supersedes the earlier drafts under `spec/aurora/`.

---

## 0. Overview (at a glance)

**What:** `REF/AURORA` (upstream "Flow" by holtsetio) — a realtime **3D MLS-MPM** particle-fluid sim
(~32k particles, Refik-Anadol-styled) extended into a full creative tool: boundaries, force fields,
emitters, a 4-mode particle renderer, a multi-pass postFX chain, a screen-fixed glass-lens overlay, and an
audio-reactive stack (FFT + beat + AI genre/mood → 21 viz modes), on **Three.js WebGPU/TSL** with a thin
R3F host + Tweakpane UI (~100-key config). Already TSL → **no pipeline conversion**; port faithfully.
**Mode B.** **Outputs: 19 canonical modules + 1 Lab.** Legend: ✅ built+gated · ⏳ pending.

**Decomposed modules (canonical library):**

| Kind | id | Clean file | Category | Status |
|---|---|---|---|---|
| universal | `tsl-structured-array` | `TslStructuredArray.js` | `webgpu` | ✅ |
| universal | `tsl-noise` | `TslNoise.js` | `math` | ✅ |
| universal | `tsl-hsv` | `TslHsv.js` | `math` | ✅ |
| universal | `tsl-colormap-palette` | `TslColormapPalette.js` | `math` | ✅ |
| universal | `app-init-pipeline` | `AppInitPipeline.ts` | `core` | ✅ |
| universal | `adaptive-performance-manager` | `AdaptivePerformanceManager.ts` | `performance` | ✅ |
| universal | `pointer-raycast-force` | `PointerRaycastForce.ts` | `input` | ✅ |
| universal | `ai-music-analyzer` | `AiMusicAnalyzer.ts` | `audio-reactive` | ⏳ |
| domain | `mpm-material-manager` | `MpmMaterialManager.js` | `physics/fluid` | ✅ |
| domain | `particle-force-fields` | `ParticleForceFields.js` | `physics/particles` | ✅ |
| domain | `mls-mpm-solver` | `MlsMpmSolver.js` | `physics/fluid` | ✅ |
| domain | `particle-boundaries` | `ParticleBoundaries.js` | `physics/particles` | ✅ |
| domain | `particle-emitters` | `ParticleEmitters.js` | `physics/particles` | ⏳ |
| domain | `particle-renderer-system` | `ParticleRendererSystem.js` | `rendering/particles` | ⏳ |
| domain | `aurora-postfx` | `AuroraPostFX.js` | `rendering/postfx` | ⏳ |
| domain | `hdr-stage-scenery` | `HdrStageScenery.js` | `rendering/environments` | ⏳ |
| domain | `glass-lens-overlay` | `GlassLensOverlay.js` | `rendering/screenspace` | ⏳ |
| domain | `audio-analysis-engine` | `AudioAnalysisEngine.js` | `audio-reactive` | ⏳ |
| domain | `audio-visual-modulation` | `AudioVisualModulation.js` | `audio-reactive` | ⏳ |

**Reuse (extend existing — do NOT duplicate):** `math/tsl-hsv` (material/renderer color paths). Relate
but DON'T fold: `physics/fluid/tsl-stable-fluids-2d` + `webgpu/tsl-compute-field-2d` are **2D Eulerian**,
AURORA is **3D MLS-MPM** — different. AURORA's audio stack is a **superset** of the existing
`audio-reactive` module → port as distinct ids, re-confirm a fold at T5.

**Direct copy (harvested near-verbatim from `ref/AURORA/src`):** `structuredarray`, `noise`, `hsv`,
`colorpalette`, `materials`, `forcefields` (TS stripped → the 6 built modules above). Scenery-referenced
HDR/OBJ/texture assets → Lab capsule only.

**Lab (Mode B):** `STUDIO/src/labs/aurora/` — composition mirrors `FlowApp` (init order + update loop,
verified from `APP.ts`); snapshots of all 19 modules + `local/` (21 viz modes + sequencer, `FlowApp`
wiring, presets/tuning) + Scenery assets.

**Naming:** runtime files use clean `<Feature>.js`/`.ts` (no `.module` infix; `.js` for untyped Three/TSL,
`.ts` for pure logic) beside `<Feature>.showcase.tsx` + `<Feature>.meta.ts`.

---

## 1. Source & deep analysis (steps 1–2)

- **Input / source:** `REF/AURORA` — Three.js WebGPU/TSL, `three@^0.176`, thin R3F host, Tweakpane 4,
  zustand, is-mobile. ~32k LOC; `src/PANEL/**` (Tweakpane glassmorphic UI) is the bulk and is **dropped**.
- **Original pipeline:** Three.js WebGPU + TSL — all GPU compute/material code is TSL. `package.json` lists
  `vite-plugin-tsl-operator`, **but `src/**` TSL is written method-chained** (`.add()/.mul()/.sub()`).
- **What it does:** ~32k particles advected by an MLS-MPM grid solver (FLIP/PIC blend, vorticity, surface
  tension, sparse grid, adaptive CFL dt) in a box/sphere boundary, pushed by force fields / emitters / a
  pointer ray, colored by velocity/density/material, rendered as instanced mesh/points/sprites/trails
  through an HDR-lit stage with a multi-pass postFX chain (MRT bloom + radial focus + radial CA + vignette
  + film grain + color grading + lens distortion) and an optional screen-fixed glass-lens overlay, all
  audio-reactive (mic/file → FFT + beat + AI genre/mood → 21 modes) and adaptive-performance-managed.
- **Files read (real source, this pass):**
  - `index.ts` (WebGPU bootstrap) · **`src/APP.ts` (921 L — `FlowApp`: verified init order + update loop +
    pointer raycast + render-mode-by-tier + dispose)** · **`src/config.ts` (667 L — `FlowConfig`: the ~100-key
    schema, all interfaces, `defaultConfig`, `updateParticleParams`)**.
  - `src/APP/{pipeline,performance}.ts` → built `app-init-pipeline`, `adaptive-performance-manager`.
  - `src/PARTICLESYSTEM/physic/{structuredarray,noise,hsv,materials,forcefields}.ts` → built modules.
  - `src/PARTICLESYSTEM/visuals/colorpalette.ts` → built `tsl-colormap-palette`.
  - `src/PARTICLESYSTEM/physic/mls-mpm.ts` (1536 L), `boundaries.ts` (1535 L), `emitters.ts` (545 L) — pending.
  - `src/PARTICLESYSTEM/RENDERER/{renderercore,meshrenderer,pointrenderer,spriterenderer,trailrenderer}.ts` — pending.
  - `src/POSTFX/postfx.ts` (853 L), `src/STAGE/scenery.ts` (529 L), `src/GLASS/glass-lens-panel.ts` (573 L) — pending.
  - `src/AUDIO/*` (audio-manager 323, soundreactivity 1022, beat-analyzer 351, ai-music-analyzer 403,
    color-modulation, audio-forces, visualization-modes 561, mode-sequencer 405) — pending.
  - `src/PANEL/**`, `src/DOC/**` — **scaffolding, dropped** (Tweakpane → PANELFLOW; status docs).
- **Verified architecture (`APP.ts`):** init pipeline order = **config → scenery → postfx → glass →
  boundaries → physics(solver, `setBoundaries`) → renderers(`RendererManager` + `AdaptivePerformanceManager`)
  → [panels — dropped] → audio(`AudioManager` + `ColorModulation`) → interaction(raycaster + plane + resize)**.
  Update loop = **scenery.update → audio reactivity (audioManager.update → colorModulation.update →
  solver.updateAudioUniforms/setAudioMode + postFX.applyAudioDynamics) → renderer state (size + appearance
  reactivity) → glass.update → solver.update(params, dt, elapsed, audio) → postFX.render →
  performance.update (→ render mode MESH/SPRITE/POINT by tier)**. Pointer: raycast onto `Plane((0,0,-1),0.2)`
  → `solver.setMouseRay(origin, dir, hit)`.

### TSL-triage decision (step 2 Pipeline Rule)
- **No pipeline conversion** — already on the TSL/WebGPU target pipeline; port faithfully.
- **No operator rewrites** — `src/**` TSL is already method-chained (verified across mls-mpm, boundaries,
  materials, forcefields, noise, hsv, colorpalette). The `vite-plugin-tsl-operator` listing is unused at
  runtime. (This overturned the earliest draft's assumption that the operator rewrite was the biggest cost.)
- **Version r0.176 → r0.185 struct compat (ADR-A10):** every ported TSL **struct** buffer needs (1) a clean
  `{name:'type'}` map passed to `struct()` (not the parsed layout) and (2) WGSL-safe buffer **labels**
  (`[A-Za-z0-9_]`, no hyphens/spaces — labels become WGSL struct type names). Both are handled inside the
  built `tsl-structured-array`; downstream just passes camelCase labels (e.g. `'particleData'`, `'cellData'`).

---

## 2. Decomposition & scope map (steps 3–6)

Aggressive decomposition (§6): AURORA is a domain demo (Anadol MLS-MPM art) sitting on **universal
primitives** — GPGPU buffer, math, init pipeline, perf governor, pointer model, multi-mode renderer, HDR
stage, postFX chain, glass overlay, audio analysis. Those cores are the bigger library win; only the
solver/boundaries/fields/emitters/materials/21-modes are AURORA-specific. `U` Universal · `D` Domain ·
`L` Lab-local · `X` Dropped. **✅ = built+gated.**

| # | System (source) | Generalized form | Class | Lands in (id) | Status |
|---|---|---|---|---|---|
| 1 | `structuredarray.ts` | aligned struct-of-arrays GPGPU buffer + atomics | U | `webgpu/tsl-structured-array` | ✅ |
| 2 | `noise.ts` | fractal triangle-wave 3D noise | U | `math/tsl-noise` | ✅ |
| 3 | `hsv.ts` | GPU HSV↔RGB + shift | U | `math/tsl-hsv` | ✅ |
| 4 | `colorpalette.ts` | 17-gradient colormap (CPU+GPU samplers) | U | `math/tsl-colormap-palette` | ✅ |
| 5 | `APP/pipeline.ts` | weighted async init + progress | U | `core/app-init-pipeline` | ✅ |
| 6 | `APP/performance.ts` | FPS-tier hysteresis governor | U | `performance/adaptive-performance-manager` | ✅ |
| 7 | pointer ray (`APP.ts`) | pointer→ray→plane hit + drag force | U | `input/pointer-raycast-force` | ✅ |
| 8 | `materials.ts` | MPM material model (8 types + TSL lookups) | D | `physics/fluid/mpm-material-manager` | ✅ |
| 9 | `forcefields.ts` | 8 field types + manager + evaluator | D | `physics/particles/particle-force-fields` | ✅ |
| 10 | `mls-mpm.ts` | MLS-MPM/MPM grid+particle solver | D | `physics/fluid/mls-mpm-solver` | ✅ |
| 11 | `boundaries.ts` | boundary shapes + collision (+ glass viz) | D | `physics/particles/particle-boundaries` | ✅ |
| 12 | `emitters.ts` | particle emitters | D | `physics/particles/particle-emitters` | ⏳ |
| 13 | `RENDERER/*` | multi-mode instanced renderer (mesh/point/sprite/trail) + manager | D | `rendering/particles/particle-renderer-system` | ⏳ |
| 14 | `postfx.ts` | MRT bloom + focus + CA + vignette + grain + grade + distortion | D | `rendering/postfx/aurora-postfx` | ⏳ |
| 15 | `scenery.ts` | HDR-lit stage + camera/orbit + tone map + shadows | D | `rendering/environments/hdr-stage-scenery` | ⏳ |
| 16 | `glass-lens-panel.ts` | screen-fixed glass refraction overlay | D | `rendering/screenspace/glass-lens-overlay` | ⏳ |
| 17 | `audio-manager` + `soundreactivity` + `beat-analyzer` | mic/file → spectral features + beat | D | `audio-reactive/audio-analysis-engine` | ⏳ |
| 18 | `ai-music-analyzer.ts` | genre/mood/tempo classifier (pure logic) | U | `audio-reactive/ai-music-analyzer` | ⏳ |
| 19 | `color-modulation` + `audio-forces` | audio→color/force mappers | D | `audio-reactive/audio-visual-modulation` | ⏳ |
| L1 | `visualization-modes` + `mode-sequencer` + `mode-parameters` | 21 AURORA viz modes (couples audio↔scene) | L | `labs/aurora/local/modes/` | ⏳ |
| L2 | `FlowApp` wiring (`APP.ts`) | init order + update loop | L | `labs/aurora/local/composition/` + `createAuroraLab.js` | ⏳ |
| L3 | `config.ts defaultConfig` | curated presets, `PARAM_TO_CONFIG`, provenance | L | `labs/aurora/local/{presets,tuning}/` | ⏳ |
| X | `PANEL/**` Tweakpane UI, R3F host, Vite/Babel harness, `DOC/**`, unused assets, legacy disabled config | — | X | dropped (→ PANELFLOW schema) | n/a |

- **Reuse-first (step 5):** no existing module covers AURORA's 3D MLS-MPM solver / 3D particle renderer /
  Anadol postFX / glass overlay / AI-audio stack. The 2D Eulerian fluids (`tsl-stable-fluids-2d`,
  `tsl-compute-field-2d`) are different. Reuse `math/tsl-hsv` in material/renderer color. Audio = superset of
  `audio-reactive` → distinct ids, re-confirm fold at T5.
- **Direct asset harvest (step 6):** modules 1–4, 8, 9 were near-verbatim copies (TS stripped). Only
  Scenery-referenced HDR/OBJ/textures from `src/assets/` are harvested (into the Lab capsule; drop alternates).
- **Out of scope (dropped):** entire `PANEL/**` Tweakpane framework + tabs + CSS, the R3F host +
  `index.html` loading screen, Vite/Babel harness, `DOC/**`, and legacy disabled config blocks
  (`chromaticAberration`, `radialLensAberration`, `depthOfField`, `lensDistortion`, `colorGrade`).

---

## 3. Per-module build plan

> Each module: `<Feature>.js` (TSL/Three runtime, untyped, verbatim) or `<Feature>.ts` (pure logic) +
> `<Feature>.showcase.tsx` (`// @ts-nocheck`, bridge-driven, default OUTSIDE the selector, ADR-13) +
> `<Feature>.meta.ts` (`ArtinosModule`, `id === schema.id`, full schema/usage/agentNotes/provenance).
> GPU modules: `dependencies: ['three','webgpu','react']`. Three stays untyped (no `@types/three`).

### Built (✅) — verbatim ports, gated green
`webgpu/tsl-structured-array` (`StructuredArray` SoA GPGPU buffer + atomics + r185 struct/label fix),
`math/tsl-noise` (`triNoise3Dvec/triNoise3D`), `math/tsl-hsv` (`hsvtorgb` + `shiftHSV`),
`math/tsl-colormap-palette` (17 gradients + CPU/GPU samplers), `core/app-init-pipeline` (weighted async
init + progress), `performance/adaptive-performance-manager` (FPS-tier governor),
`input/pointer-raycast-force` (pointer→ray→plane hit + drag force), `physics/fluid/mpm-material-manager`
(8 material types + TSL lookups), `physics/particles/particle-force-fields` (8 field types + evaluator).
Provenance recorded in each `agentNotes`.

### ⏳ `physics/fluid/mls-mpm-solver` — `MlsMpmSolver.js`
- **From:** `mls-mpm.ts` (1536 L) — copy kernels VERBATIM.
- **Exports:** `class MlsMpmSolver` (rename of `MlsMpmSimulator`) + `TransferMode` (frozen `{PIC:0,FLIP:1,HYBRID:2}`).
  Constructor `(renderer, { maxParticles, gridSize?, fixedPointMultiplier? })`; `async init()`,
  `setMouseRay(origin, direction, point)`, `setBoundaries(b)`, `setColorMode(int)`, `setAudioEnabled(bool)`,
  `setAudioMode(int)`, `updateAudioUniforms(obj)`, `updateForceFields(mgr)`, `updateBoundaryUniforms()`,
  `async update(params, deltaTime, elapsed, audioData?)`; public `particleBuffer`, `numParticles`, `gridSize`.
- **Imports → rewire:** `StructuredArray` ← `../../webgpu/TslStructuredArray`; `triNoise3Dvec,triNoise3D` ←
  `../../math/TslNoise`; `hsvtorgb` ← `../../math/TslHsv`; `calculateForceFieldForce` ←
  `../../physics/particles/ParticleForceFields`; `MaterialType,getMaterialColor,calculateMaterialStress` ←
  `./MpmMaterialManager`. Drop TS `import type`s + interfaces (untyped `.js`).
- **Struct labels (ADR-A10):** keep WGSL-safe labels `'particleData','cellData','cellDataF','vorticityData',
  'neighborDensity','activeCells'` (all hyphen-free; `StructuredArray` also sanitizes defensively).
- **Kernels (preserve order + math exactly):** `clearGrid` → `p2g1` (atomic momentum scatter, mark active
  cells) → `p2g2` (stress/pressure scatter) → `updateGrid` (sparse-skip + velocity normalize) →
  `calculateVorticity` (central-difference curl) → `g2p` (gravity/noise + 21 audio-mode force branches +
  force-field accumulation + boundary collision + advection; FLIP/PIC via `transferMode`/`flipRatio`).
  `encodeFixedPoint/decodeFixedPoint` use `fixedPointMultiplier` (1e7) for atomic int accumulation.
- **`update()` JS:** sets uniforms from `params` (the full set verified in `APP.ts:789–815`: numParticles,
  dt, noise, stiffness, restDensity, dynamicViscosity, gravityType, gravity, mouseRay*, transferMode,
  flipRatio, vorticity*, surfaceTension*, sparseGrid, adaptiveTimestep, cflTarget), dispatches
  `renderer.computeAsync(kernel)` in order each step (guard `numParticles`); adaptive substepping if enabled.
- **meta:** id `mls-mpm-solver`, category `physics/fluid`. schema: particleCount, speed(dt), noise,
  stiffness, dynamicViscosity, gravityType(enum 0–3), transferMode(enum 0–2), flipRatio, vorticityEnabled+
  epsilon, surfaceTensionEnabled+coeff, sparseGrid. presets: Anadol default, Splashy, Viscous. `agentNotes`:
  kernel order + StructuredArray label rule + needs `particle-renderer-system` to be seen.
- **Showcase (`// @ts-nocheck`):** WebGPURenderer + perspective camera + `new MlsMpmSolver(renderer,
  {maxParticles: 16384})`; `await init()`; render `particleBuffer` via the proven **`THREE.Points` +
  `InstancedBufferGeometry` + `PointsNodeMaterial`, `positionNode = Fn(()=> solver.particleBuffer.element(
  instanceIndex).get('position'))()`** pattern (object scaled `1/gridSize`). Loop: `solver.update({...},dt,t)`
  → `renderAsync`. Keep ≤16k for the VM GPU. **Standalone proof:** solver + minimal point render, no
  boundaries/postfx/audio.

### ⏳ `physics/particles/particle-boundaries` — `ParticleBoundaries.js`
- **From:** `boundaries.ts` (1535 L) verbatim. Exports `class ParticleBoundaries` + `BoundaryShape`
  (frozen `{NONE,BOX,SPHERE,CYLINDER,...}`). Constructor `{ gridSize, wallThickness, wallStiffness,
  restitution, friction, visualize, audioReactive, ... }`; `async init()`, `setShape(shape)`, `setEnabled/
  Visible(bool)`, `updateBoundaryUniforms()`, `object` (glass-container `THREE.Object3D`), and the TSL
  collision helper the solver's `g2p` calls via `setBoundaries`.
- **meta:** id `particle-boundaries`, category `physics/particles`. schema: shape(enum), restitution,
  friction, wallStiffness, visualize. **Showcase:** box/sphere container deflecting a basic GPU point cloud
  (no MLS-MPM) — proves reuse.

### ⏳ `physics/particles/particle-emitters` — `ParticleEmitters.js`
- **From:** `emitters.ts` (545 L). Exports `class ParticleEmitterManager` + emitter types; `update(dt)`,
  add/remove/configure emitters, feeds spawn into the solver's particle buffer. **meta:** id
  `particle-emitters`. **Showcase:** emit a stream into a trivial point buffer.

### ⏳ `rendering/particles/particle-renderer-system` — `ParticleRendererSystem.js`
- **From:** `RENDERER/{renderercore,meshrenderer,pointrenderer,spriterenderer,trailrenderer}.ts` +
  `visuals/colormodes.ts` (fold texture/material visuals unless a 2nd consumer appears). Exports
  `class ParticleRendererSystem` (rename `RendererManager`), `ParticleRenderMode` (frozen
  `{MESH,POINT,SPRITE,TRAIL}`), `IParticleRenderer` shape. Takes a solver-like `{ particleBuffer,
  numParticles }`; `getRenderer().object`, `switchMode(mode)`, `update(count,size)`, `setColorMode`,
  `updateAudioReactivity(...)`. **New category** `rendering/particles` (world-space instanced renderers).
- **meta:** id `particle-renderer-system`. schema: renderMode(enum), colorMode(enum), size, metalness,
  roughness. **Showcase:** an arbitrary instanced point buffer in all 4 modes (trivial buffer, not MLS-MPM).

### ⏳ `rendering/postfx/aurora-postfx` — `AuroraPostFX.js`
- **From:** `postfx.ts` (853 L). Exports `class AuroraPostFX` (rename `PostFX`). Constructor `(renderer,
  scene, camera, { bloom, radialFocus, radialCA, vignette, filmGrain, colorGrading, lensDistortionFX })`;
  `async init()`, `updateBloom/RadialFocus/RadialCA/Vignette/FilmGrain/ColorGrading/LensDistortion(cfg)`,
  `applyAudioDynamics(audioData, influence, dt)`, `async render()`, `dispose()`. MRT (per-object bloom
  intensity + custom screen blend). Drop the legacy disabled effects.
- **meta:** id `aurora-postfx`, category `rendering/postfx`. schema: bloom (threshold/strength/radius) +
  vignette + filmGrain + colorGrading groups. **Showcase:** a spinning emissive mesh through the chain.

### ⏳ `rendering/environments/hdr-stage-scenery` — `HdrStageScenery.js`
- **From:** `scenery.ts` (529 L). Exports `class HdrStageScenery` (rename `Scenery`). Owns/accepts the
  WebGPURenderer, scene, HDR env, lights, PerspectiveCamera + OrbitControls, tone mapping, shadows;
  `init()`, `add/remove(obj)`, `update(dt,t)`, `resize(w,h)`, `createRaycaster()`,
  `disableToneMappingForPostFX()`. Ship only default-referenced HDR/texture assets into the Lab capsule.
- **meta:** id `hdr-stage-scenery`, category `rendering/environments`. schema: environmentIntensity,
  exposure, toneMapping(enum). **Showcase:** HDR-lit stage + orbit + a PBR mesh.

### ⏳ `rendering/screenspace/glass-lens-overlay` — `GlassLensOverlay.js`
- **From:** `glass-lens-panel.ts` (573 L) + `GLASS/{presets,types}.ts`. Exports `class GlassLensOverlay`
  (rename `GlassLensPanel`) + `GlassPresetType`/`DisplacementPattern` frozen objects. Screen-fixed
  `MeshPhysicalNodeMaterial` mesh parented to an OrthographicCamera; `mesh`, `setEnabled`, `applyPreset`,
  `updateMaterial/Geometry/Displacement`, `resize`, `update(dt)`, `dispose()`.
- **meta:** id `glass-lens-overlay`, category `rendering/screenspace`. schema: enabled, preset(enum),
  transmission, ior, iridescence, dispersion, displacement. **Showcase:** glass overlay refracting a scene.

### ⏳ `audio-reactive/audio-analysis-engine` — `AudioAnalysisEngine.js`
- **From:** `audio-manager.ts` + `soundreactivity.ts` + `core/enhanced-audio-analyzer.ts` + `beat-analyzer.ts`.
  Exports `class AudioAnalysisEngine` (mic/file capture + FFT + perceptual bands + beat/tempo). `async init()`,
  `update(dt) → AudioData`, `getUniforms()`, `loadAudioFile(url)`, `togglePlayback()`, `setVolume`,
  `dispose()`. Needs a user gesture (mic) — showcase overlays a mic button.
- **meta:** id `audio-analysis-engine`, category `audio-reactive`. **Showcase:** mic/file → live
  bass/mid/treble/beat meters.

### ⏳ `audio-reactive/ai-music-analyzer` — `AiMusicAnalyzer.ts`  (pure logic)
- **From:** `ai-music-analyzer.ts` (403 L). No three → name `AiMusicAnalyzer.ts`. Exports
  `class AiMusicAnalyzer` + `MusicAnalysis` shape; feed feature frames → genre/mood/tempo. **Showcase:**
  feed synthetic frames → readout.

### ⏳ `audio-reactive/audio-visual-modulation` — `AudioVisualModulation.js`
- **From:** `color-modulation.ts` + `audio-forces.ts`. Exports `class ColorModulation`,
  `calculateSizeModulation`, `calculateGlowIntensity`, `class AudioForces`. **Showcase:** audio frame →
  modulated color/force on a demo mesh.

> Every `.meta.ts`: `id===schema.id`, explicit category, full `schema.parameters`, `dependencies`,
> `presets`, `related`, `agentNotes` + provenance (`canonicalSource: ref/AURORA/src/...`), `version`,
> `updatedAt` ISO-UTC.

---

## 4. Mode B — Lab capsule plan

- **Path:** `STUDIO/src/labs/aurora/`
- **Files:** `AuroraLab.tsx` (typed wrapper: canvas ref + ResizeObserver + dispose + bridge + mic-toggle
  overlay) · `AuroraLab.meta.ts` (category `lab`; tags `lab,replica,composition`; `related` = all 19 module
  ids; `AURORA_PARAMS` PANELFLOW schema) · `createAuroraLab.js` (untyped composition).
- **Composition (`createAuroraLab.js`) — mirror `FlowApp` exactly (verified `APP.ts`):** init via
  `core/app-init-pipeline` in order **config → `hdr-stage-scenery` → `aurora-postfx`
  (+ `scenery.disableToneMappingForPostFX()`) → `glass-lens-overlay` (ortho-camera screen-fixed) →
  `particle-boundaries` (BOX default, enabled) → `mls-mpm-solver` (`setBoundaries`) →
  `particle-renderer-system` (+ `adaptive-performance-manager`) → audio(`audio-analysis-engine` +
  `audio-visual-modulation`) → interaction(`pointer-raycast-force` onto `Plane((0,0,-1),0.2)`)**. Update
  loop: scenery.update → audio.update → renderer state (size + appearance reactivity) → glass.update →
  solver.update(forcefields, audio) → postfx.render → performance.update (downgrade render mode
  MESH→SPRITE→POINT by tier).
- **Snapshots → `labs/aurora/modules/<category>/`:** copy all 19 modules used (provenance: `canonicalSource`
  = `STUDIO/src/modules/...`, `copiedFor:'aurora'`, `syncStatus:'snapshot'`). `modules/assets/` = only
  Scenery-referenced HDR/OBJ/textures.
- **`local/`:** `modes/` (visualization-modes + mode-sequencer + mode-parameters — the 21 modes) ·
  `composition/` (createAuroraLab helpers) · `presets/AuroraPresets.ts` (from `config.ts defaultConfig`) ·
  `tuning/` (config defaults + `PARAM_TO_CONFIG` + `provenance.ts`) · `interaction/` (pointer + gravity-sensor glue).
- **Dashboard (`AURORA_PARAMS`):** curated ~20 of ~100 keys — particle count/size, sim speed/noise/
  gravityType, bloom strength/threshold, glass preset, vizMode(0–20), renderMode, audio source + gain, +
  a `preset` enum. Map to `config.*` via `PARAM_TO_CONFIG` (mirror the `fluid-sim` Lab).

---

## 5. Ordered task checklist (steps 8–11)

Modules first, Lab last. Common acceptance: `npm run check-registry -w STUDIO` green + `npm run lint -w STUDIO`
green + showcase loads, a control drives it, **zero console errors** (fresh dev session — a prior module's
WebGPU error can poison the device).

- [x] **Phase 1** — 7 universal cores (1–7). DONE + gated.
- [x] **T2.0a** `physics/fluid/mpm-material-manager`. DONE + gated.
- [x] **T2.0b** `physics/particles/particle-force-fields`. DONE + gated.
- [x] **T2.1** `physics/fluid/mls-mpm-solver` — DONE. Transpiled `mls-mpm.ts` via esbuild (kernels
  verbatim), rewired imports to the built modules, exported as `MlsMpmSolver`. Renders live on r0.185
  (sprite billboards — instanced-point rendering doesn't display in this Studio preview; sprites/mesh do),
  center-gravity particle blob, **0 console errors**. Glow awaits `aurora-postfx` (T4.2).
- [x] **T2.2** `physics/particles/particle-boundaries` — DONE. esbuild-transpiled `boundaries.ts`
  (collision verbatim), co-located the box OBJ asset, rewired its import. Gravity-fed point cloud settles
  into box/sphere/cylinder via generateCollisionTSL; loads + canvas renders, **0 console errors** (WebGPU
  screenshot readback times out on this VM — heavy collision kernel; gated on zero-errors + canvas-active).
- [ ] **T2.3** `rendering/particles/particle-renderer-system` · acceptance: a buffer renders in all 4 modes.
- [ ] **T2.4** integration — solver + boundaries + renderer compose (MLS-MPM in a box, MESH mode): first real
  AURORA frame (no new module; prove composition).
- [ ] **T3.2** `physics/particles/particle-emitters`.
- [ ] **T4.1** `rendering/environments/hdr-stage-scenery` · **T4.2** `rendering/postfx/aurora-postfx` ·
  **T4.3** `rendering/screenspace/glass-lens-overlay`.
- [ ] **T5.1** `audio-reactive/audio-analysis-engine` · **T5.2** `ai-music-analyzer` ·
  **T5.3** `audio-visual-modulation` (re-confirm vs existing `audio-reactive` first).
- [ ] **T6** Lab `labs/aurora/` — composition + snapshots + local modes/presets/tuning + `AURORA_PARAMS`
  schema + fidelity pass vs `ref/AURORA` (`npm run dev` there) + final report (§10 pipeline format) +
  refresh the skill's `examples/aurora-conversion-plan.md`.

---

## 6. Fidelity, deviations & validation

- **Preserved verbatim:** MLS-MPM kernels + math + kernel order, FLIP/PIC/vorticity/surface-tension/
  sparse-grid/adaptive-dt, 21 audio force branches, boundary collision, force-field/material models,
  renderer look (look-at + density scale + AO), postFX chain math, glass material, audio analysis, exact
  source naming where ported.
- **Deviations (recorded; carry into each module's deviation report):**
  1. **r0.176 → r0.185 struct compat** (ADR-A10) — handled inside `tsl-structured-array`; callers pass
     camelCase labels.
  2. **Tweakpane glassmorphic UI dropped** → the Lab's PANELFLOW `AURORA_PARAMS` schema (mirrors `fluid-sim`).
  3. **R3F host, Vite/Babel harness, `DOC/**`, legacy disabled config, unused assets** dropped as scaffolding.
  4. **AURORA audio stack ported as distinct `audio-reactive/*` ids** (superset of the existing module) —
     re-evaluate folding at T5.
  5. **Clean naming** — runtime files use `<Feature>.js`/`.ts` (no `.module` infix); pure-logic cores `.ts`;
     TSL showcases carry `// @ts-nocheck`.
  6. **No TSL operator rewrite** — source is already method-chained.
- **Validation (DoD):** per task above; the Lab additionally needs the snapshot capsule with provenance +
  a side-by-side fidelity note vs `ref/AURORA`. "It builds" is not done.
- **VM caveat:** this dev VM's WebGPU is slow for heavy compute (large point-cloud screenshots may time
  out); gate on zero-console-error + WebGPU-active + control-present, with a hardware visual check on the
  heaviest modules (solver, renderer, postfx, Lab).
