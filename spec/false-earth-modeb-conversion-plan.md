# False Earth Mode B Conversion Proposal

Status: PROPOSAL ONLY - no implementation changes yet.

Input:
- Repository: https://github.com/momentchan/false-earth?ref=webgpu.com
- Source project: `momentchan/false-earth`
- Source commit inspected: `74cc91cb2764fbb75aee201d92752e4da37ad311`
- Source submodule inspected: `packages/three-core` at `61bde95d850c756e2a0d425b29fbd762e38a0c71`
- Live demo linked by source: https://false-earth.mingjyunhung.com/
- Article linked by source: https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/
- Source license observed: MIT

## Goal

Convert False Earth into an ARTINOS Mode B project: extract the reusable WebGPU/TSL systems into
canonical modules, then rebuild the original experience as a faithful `false-earth` Lab capsule.

The Lab must preserve the original identity: a playable astronaut on an endless false-Earth surface,
GPU-computed grass responding to the character, procedural terrain, VAT rose growth triggered by
cosmic beam impacts, starry/cosmic background, third-person and FPV camera modes, audio, loading UI,
and the high-contrast alien-earth visual mood.

This must not become a simplified terrain demo. The useful systems should strengthen ARTINOS as
reusable WebGPU/TSL modules, and the Lab should remain a faithful source-derived replica with local
module snapshots and provenance.

## Non-goals

- Do not replace the source with a generic Three.js terrain, a CPU grass field, or simple instanced
  planes.
- Do not downgrade the WebGPU/TSL compute path to WebGL or canvas fallbacks.
- Do not port the Leva debug UI directly; map useful controls into PANELFLOW schemas.
- Do not rewrite the character/terrain/grass behavior from memory. Port the source files directly
  first, then make minimum compatibility edits.
- Do not modify PANELFLOW unless implementation uncovers a real reusable control or bridge gap.
- Do not create deep helper sprawl. Extract modules only when they are independently reusable or
  clearly required by the Lab capsule.

## Source Files Inspected

Project root:
- `package.json` - React 19, Three `^0.182.0`, R3F 9, Drei 10, Rapier, TSL/WebGPU stack, Leva,
  Valtio/Zustand, GSAP, gl-noise, MUI, vite-plugin-glsl, HTTPS Vite.
- `vite.config.js` - HTTPS dev server, `@core` alias to `packages/three-core/src`, GLSL plugin.
- `readme.md` - project summary, feature list, structure, live demo/article links.
- `LICENSE` - MIT.

Source composition:
- `src/app/App.tsx` - WebGPU capability check, R3F `Canvas` with `WebGPURenderer`, DPR/performance
  scaling, asset preloads, beam scene context, audio manager, world controller, camera/effects.
- `src/components/WorldController.tsx` - source composition, Leva controls, global time/delta,
  terrain/wind/hue uniforms, feature toggles, async component readiness.
- `src/components/Terrain.tsx` - grid-snapped procedural TSL terrain plane.
- `src/components/DirectionalLight.tsx` - source lighting.

Grass:
- `src/components/grass/GrassWebGPU.tsx` - R3F grass root, grid snapping, character push uniforms,
  compute/material wiring.
- `src/components/grass/GrassLOD.tsx` - LOD draw buffers and indirect rendering.
- `src/components/grass/core/config.ts` - blade count, area size, LOD segment config, data structs,
  indirect draw structure.
- `src/components/grass/core/grassCompute.ts` - TSL compute: stable PCG seeded grid, terrain
  sampling, Voronoi clumping, wind, character push, frustum/circle culling, LOD routing.
- `src/components/grass/core/grassMaterial.ts` - TSL vertex/material: Bezier blade construction,
  wind/wave deformation, slope alignment, view-dependent tilt, PBR color/normal/roughness/emissive.
- `src/components/grass/core/shaderHelpers.ts`, hooks - uniforms, geometry and compute lifecycle.

Roses / VAT:
- `src/components/Rose/Rose.tsx` and `RoseLOD.tsx` - active rose system and LOD meshes.
- `src/components/Rose/core/vatCompute.ts` - TSL compute spawn/update/lifecycle/culling/LOD routing.
- `src/components/Rose/core/vatMaterial.ts` and `config.ts` - VAT rendering and asset config.
- `public/vat/*`, `public/textures/Rose/*` - VAT EXR/PNG/GLB/KTX2 assets and rose textures.

Character / camera / input:
- `src/components/character/Character.tsx` - astronaut model, world-position uniforms, animation,
  audio footsteps, store-published character ref.
- `src/components/character/hooks/*` - assets, physics, trail, animation/control behavior.
- `src/components/camera/*` - follow, FPV, detached camera modes.
- `src/core/input/controls.ts`, `packages/three-core/src/components/input/KeyboardMapper.tsx` -
  keyboard control mapping.

Effects / cosmic systems:
- `src/components/Effects/Effects.tsx` - WebGPU/TSL postprocessing: scene pass, beam pass, helmet
  distortion/aberration, DoF, bloom, SMAA, tone mapping.
- `src/components/cosmic/*` - cosmic beam spawning, wave buffers, beam scene/audio, hit events.
- `src/components/background/*` - starry sky and background composition.

Shared submodule:
- `packages/three-core/src/index.ts` - shared audio, async compile, WebGPU canvas, keyboard mapper,
  Leva wrapper, KTX2 preloader, device hooks, TSL helpers.
- `packages/three-core/src/utils/tsl/math.ts` - Bezier/easing TSL helpers.
- `packages/three-core/src/utils/tsl/color.ts` - HSV shift TSL helper.

## Source Systems Found

1. WebGPU/R3F application shell
   - React Three Fiber `Canvas` with `WebGPURenderer`.
   - Explicit `navigator.gpu` and adapter checks.
   - PerformanceMonitor-driven DPR scaling.
   - Asset preload and async compile readiness.
   - Separate beam scene context composed into final post.

2. Infinite procedural terrain
   - Grid-snapped terrain plane following camera movement.
   - TSL FBM height and normal helpers shared with grass compute.
   - Terrain color and height controls through global uniforms.

3. GPU-computed grass field
   - `1024 x 1024` blade grid over an `80` unit area.
   - Stable CPU grid snapping with blade-level seed offsets.
   - TSL compute stores four `vec4` records per blade.
   - Voronoi clumping, PCG hash jitter, wind response, terrain placement, character push, culling.
   - LOD routing with indirect draw buffers and visible-index lists.
   - TSL material builds Bezier grass blades from computed records.

4. VAT rose field
   - EXR/PNG/GLB/KTX2 asset set for high and low poly roses.
   - TSL compute spawn/update/lifecycle/culling.
   - LOD draw buffers, visible-index routing, and hit-triggered spawn bursts.
   - Event coupling from cosmic beam impacts.

5. Character controller and interaction
   - Astronaut GLB with animation clips and footstep audio.
   - Character world position/velocity propagated to grass and roses.
   - Follow / FPV / detached camera modes.
   - Keyboard/touch input and mobile detection.

6. Cosmic beam and wave system
   - Beam spawner with hit validation.
   - Wave state buffer used by grass material for emissive deformation.
   - Beam audio and one-shot hit events.

7. WebGPU/TSL post stack
   - Main scene pass plus separate beam scene pass.
   - Helmet FPV distortion and chromatic aberration.
   - Depth of field with character autofocus.
   - Bloom, SMAA, tone mapping, beam depth occlusion, vignette/helmet overlay.

8. UI/audio/loading layer
   - Loading screen keyed to component readiness.
   - Sidebar/audio controls.
   - Audio manager and step/ambient/beam sounds.

## Reuse-First Check

Current registry check passed before writing this plan:

```bash
npm run check-registry -w STUDIO
```

Result observed: 43 module entries, 43 ok, 0 failed.

Relevant existing ARTINOS modules:
- `tsl-structured-array` - useful pattern for typed TSL storage buffers. False Earth needs richer
  structured buffer and indirect-draw patterns, so it can be reused conceptually but does not replace
  grass or VAT compute.
- `tsl-compute-field-2d` and `tsl-grid-sampling` - useful for compute lifecycle and sampling
  precedents, but False Earth uses per-instance structured records and indirect draw routing, not a
  2D fluid field.
- `tsl-noise`, `tsl-hsv`, `tsl-spline-color-ramp`, `tsl-colormap-palette` - useful math/color
  precedents. The source's PCG hash, terrain FBM, Bezier helpers, wind helpers, and HSV shift should
  be ported directly where needed.
- `webgpu-bloom-composer` and `webgpu-ssgi-room-renderer` - useful postprocessing precedents, but
  False Earth needs a custom multi-pass TSL post stack with beam scene composition, DoF, SMAA, helmet
  distortion, tone mapping, and bloom.
- `adaptive-performance-manager` - relevant for DPR/quality adaptation; can inform the ARTINOS
  wrapper around source PerformanceMonitor behavior.
- `pointer-raycast-force`, `pointer-velocity-splat`, `pointer-glass-collider` - input precedents,
  but not a direct replacement for the character/camera control system.
- `universal-physics-particles`, `tsl-webgpu-swarm-particles` - particle precedents, but False Earth
  uses terrain-aware procedural vegetation and VAT lifecycle systems, not a generic particle swarm.

Conclusion: this source is new enough for Mode B. Reuse ARTINOS patterns and existing low-level
modules where compatible, but port the source systems directly.

## Proposed Mode B Outputs

False Earth is Mode B because it contains several reusable systems plus a distinct full experience:
WebGPU app shell, infinite terrain, TSL grass compute/rendering, VAT growth system, character/camera
interaction, cosmic beams/waves, audio, and a custom WebGPU post stack.

### Canonical Module 1: TSL Infinite Terrain Field

Path:

```txt
STUDIO/src/modules/rendering/environments/
  TslInfiniteTerrainField.module.js
  TslInfiniteTerrainField.showcase.tsx
  TslInfiniteTerrainField.meta.ts
```

Id: `tsl-infinite-terrain-field`

Purpose:
- Port `Terrain.tsx`, `terrainHelpers.ts`, `uniforms.ts` terrain subset, and `gridSnapping.ts`.
- Provide a WebGPU/TSL terrain surface that follows a camera or supplied focus point via stable grid
  snapping.
- Expose terrain height/normal TSL functions so grass and other systems sample the same terrain.

Controls:
- `areaSize`
- `segments`
- `amplitude`
- `frequency`
- `seed`
- `color`
- `snapEnabled`
- `focusX`
- `focusZ`

Dependencies:
- `three`
- `webgpu`
- `react`

### Canonical Module 2: TSL Vegetation Math Helpers

Path:

```txt
STUDIO/src/modules/math/
  TslVegetationMath.module.js
  TslVegetationMath.showcase.tsx
  TslVegetationMath.meta.ts
```

Id: `tsl-vegetation-math`

Purpose:
- Port source PCG hash, Bezier helpers, easing, wind helpers, HSV shift, terrain FBM helpers, and
  safe normalization into a compact TSL utility module.
- Keep this source-derived and reusable for grass, roses, foliage, wave deformation, and future
  vegetation/organic modules.

Controls:
- `previewMode`
- `seed`
- `windStrength`
- `hueShift`

Dependencies:
- `three`
- `webgpu`
- `react`

### Canonical Module 3: TSL Indirect Draw LOD Router

Path:

```txt
STUDIO/src/modules/webgpu/
  TslIndirectDrawLodRouter.module.js
  TslIndirectDrawLodRouter.showcase.tsx
  TslIndirectDrawLodRouter.meta.ts
```

Id: `tsl-indirect-draw-lod-router`

Purpose:
- Generalize the repeated source pattern from grass and VAT roses: storage `drawIndirectStructure`,
  atomic reset, visible-index buffer, frustum/circle culling, and LOD routing.
- Avoid duplicating the same atomic draw-buffer logic in every future WebGPU instancing module.

Controls:
- `lodCount`
- `debugColors`
- `noiseTransitions`
- `cullRadius`
- `maxInstances`

Dependencies:
- `three`
- `webgpu`
- `react`

### Canonical Module 4: TSL GPU Grass Field

Path:

```txt
STUDIO/src/modules/physics/particles/
  TslGpuGrassField.module.js
  TslGpuGrassField.showcase.tsx
  TslGpuGrassField.meta.ts
```

Id: `tsl-gpu-grass-field`

Purpose:
- Directly port `GrassWebGPU.tsx`, `GrassLOD.tsx`, `grassCompute.ts`, `grassMaterial.ts`,
  `grassGeometry.ts`, `grassControls.ts`, `useGrassCompute.ts`, and `useGrassUniforms.ts`.
- Use the terrain/math/LOD router modules where they reduce duplication without changing behavior.
- Preserve source behavior: stable snapped seed grid, Voronoi clumps, wind, slope alignment, character
  push, wave deformation, PBR blade material, LOD buffers, and culling.

Controls:
- `bladesPerAxis`
- `areaSize`
- `lodNearSegments`
- `lodMidSegments`
- `lodFarSegments`
- `bladeHeightMin`
- `bladeHeightMax`
- `bladeWidthMin`
- `bladeWidthMax`
- `bendAmount`
- `clumpSize`
- `clumpBlendSmoothness`
- `windDirection`
- `windSpeed`
- `windStrength`
- `characterPushRadius`
- `characterPushAmount`
- `baseColor`
- `tipColor`
- `globalHue`
- `debugLod`

Dependencies:
- `three`
- `webgpu`
- `react`

### Canonical Module 5: TSL VAT Lifecycle Instances

Path:

```txt
STUDIO/src/modules/physics/particles/
  TslVatLifecycleInstances.module.js
  TslVatLifecycleInstances.showcase.tsx
  TslVatLifecycleInstances.meta.ts
```

Id: `tsl-vat-lifecycle-instances`

Purpose:
- Generalize the rose system's VAT spawn/update/lifecycle/culling/LOD routing.
- Port `Rose/core/vatCompute.ts`, `Rose/core/vatMaterial.ts`, `RoseLOD.tsx`, and the asset loader
  hooks as directly as possible.
- Keep rose-specific asset paths and presets out of the canonical module; expose a generic VAT asset
  contract plus lifecycle timings.

Controls:
- `count`
- `spawnCount`
- `spawnRadius`
- `delayMin`
- `delayMax`
- `growMin`
- `growMax`
- `keepMin`
- `keepMax`
- `dieMin`
- `dieMax`
- `lodEnabled`
- `debugLod`

Dependencies:
- `three`
- `webgpu`
- `react`

### Canonical Module 6: Third-Person Character Navigation

Path:

```txt
STUDIO/src/modules/input/
  ThirdPersonCharacterNavigation.module.js
  ThirdPersonCharacterNavigation.showcase.tsx
  ThirdPersonCharacterNavigation.meta.ts
```

Id: `third-person-character-navigation`

Purpose:
- Port the reusable camera/input/controller parts from `character/`, `camera/`, `core/input/`, and
  `three-core` keyboard utilities.
- Provide a generic character world-position/velocity publisher used by grass push, rose spawn
  focus, camera follow, and audio.
- Keep astronaut model specifics and False Earth audio/tuning in the Lab.

Controls:
- `cameraMode`
- `moveSpeed`
- `runMultiplier`
- `turnSpeed`
- `cameraLag`
- `fpvEnabled`
- `touchEnabled`

Dependencies:
- `three`
- `react`
- `@react-three/fiber`

### Canonical Module 7: TSL Cosmic Beam Waves

Path:

```txt
STUDIO/src/modules/shaders/
  TslCosmicBeamWaves.module.js
  TslCosmicBeamWaves.showcase.tsx
  TslCosmicBeamWaves.meta.ts
```

Id: `tsl-cosmic-beam-waves`

Purpose:
- Port `components/cosmic/*`, source wave buffer structure, beam spawning, hit validation, and wave
  deformation contract.
- Expose beam hit events and wave buffers so any TSL material can react to localized impacts.

Controls:
- `autoSpawn`
- `minSpawnInterval`
- `maxSpawnInterval`
- `radiusMin`
- `radiusMax`
- `lifetimeMin`
- `lifetimeMax`
- `speedThreshold`
- `beamColor`
- `beamIntensity`

Dependencies:
- `three`
- `webgpu`
- `react`

### Canonical Module 8: False-Earth WebGPU Post Stack

Path:

```txt
STUDIO/src/modules/rendering/postfx/
  FalseEarthWebgpuPostStack.module.js
  FalseEarthWebgpuPostStack.showcase.tsx
  FalseEarthWebgpuPostStack.meta.ts
```

Id: `false-earth-webgpu-post-stack`

Purpose:
- Port `Effects.tsx` into a reusable WebGPU/TSL post stack: scene pass, optional secondary beam
  scene pass, DoF, bloom, SMAA, tone mapping, beam depth occlusion, helmet distortion, chromatic
  aberration, vignette.
- This is more specialized than `webgpu-bloom-composer`, but still useful for other cinematic
  WebGPU scenes.

Controls:
- `quality`
- `bloomEnabled`
- `bloomStrength`
- `bloomRadius`
- `bloomThreshold`
- `dofEnabled`
- `autofocus`
- `focusDistance`
- `focalLength`
- `bokehScale`
- `smaaEnabled`
- `toneMappingEnabled`
- `exposure`
- `helmetStrength`

Dependencies:
- `three`
- `webgpu`
- `react`

## Faithful Lab Replica: False Earth

Path:

```txt
STUDIO/src/labs/false-earth/
  FalseEarthLab.tsx
  FalseEarthLab.meta.ts
  createFalseEarthLab.js
  modules/
    math/
    webgpu/
    input/
    physics/
      particles/
    rendering/
      environments/
      postfx/
    shaders/
  local/
    assets/
    audio/
    composition/
    interaction/
    presets/
    tuning/
```

Id: `false-earth`

Purpose:
- Rebuild the full source experience inside ARTINOS using the canonical modules and local snapshots.
- Preserve source composition from `App.tsx` and `WorldController.tsx`: WebGPU renderer, terrain,
  starry sky, cosmic beams, grass, roses, astronaut, camera modes, audio, loading UI, and post stack.
- Replace source Leva controls with PANELFLOW schema groups.
- Keep project-specific asset paths, source-ready/loading behavior, rose presets, astronaut tuning,
  keyboard bindings, audio choices, and narrative visual composition under `local/`.

Dependencies:
- `three`
- `webgpu`
- `react`
- `@react-three/fiber`
- `@react-three/drei`
- `@react-three/rapier`
- `zustand`

Related modules:
- `tsl-infinite-terrain-field`
- `tsl-vegetation-math`
- `tsl-indirect-draw-lod-router`
- `tsl-gpu-grass-field`
- `tsl-vat-lifecycle-instances`
- `third-person-character-navigation`
- `tsl-cosmic-beam-waves`
- `false-earth-webgpu-post-stack`

## Asset Plan

Source assets required for Lab fidelity:
- `public/models/*.glb` - astronaut and animation clips.
- `public/vat/*` - rose metadata, EXR/PNG normal/position textures, GLB meshes.
- `public/textures/Rose/*` - rose materials.
- `public/textures/Body/*` and `public/textures/Details/*` - astronaut KTX2 materials.
- `public/textures/starmap_2020_4k.ktx2` and `potsdamer_platz_1k_nb.hdr`.
- `public/audio/*` - grass field, footsteps, waves/noise.
- `public/fonts/Cousine-Regular.ttf`.

Proposed ARTINOS placement:

```txt
STUDIO/public/labs/false-earth/
  models/
  vat/
  textures/
  audio/
  fonts/
```

Record all copied assets in `local/tuning/provenance.ts` with source paths, source commit, license,
and whether each asset is required for core Lab fidelity or optional audio/UI polish.

## Implementation Milestones

1. Stage provenance input
   - Copy source repo subset under `REF/false-earth/` or record exact temp clone provenance.
   - Include source commit, `three-core` submodule commit, license, live demo/article links, and asset
     manifest.

2. Run source baseline
   - Install the source in an isolated reference folder.
   - Run `npm run build`.
   - If WebGPU browser support is available, load the source live demo/local source and capture visual
     reference notes for grass density, camera modes, rose growth, beams, and post effects.

3. Scaffold canonical modules
   - Use `npm run new-module -w STUDIO -- <id> --category <category/path>` for each accepted module.
   - Keep heavy Three/WebGPU runtime code in `.module.js` where practical, with thin typed
     `.showcase.tsx` wrappers.

4. Port utility and substrate modules first
   - `tsl-vegetation-math`
   - `tsl-infinite-terrain-field`
   - `tsl-indirect-draw-lod-router`
   - Verify each standalone before layering grass/roses.

5. Port major visual systems
   - `tsl-gpu-grass-field`
   - `tsl-vat-lifecycle-instances`
   - `tsl-cosmic-beam-waves`
   - `false-earth-webgpu-post-stack`

6. Port navigation and Lab composition
   - `third-person-character-navigation`
   - `FalseEarthLab.tsx`
   - `createFalseEarthLab.js`
   - Local presets/tuning/interaction/audio/loading.

7. Copy Lab snapshots
   - Mirror canonical modules into `STUDIO/src/labs/false-earth/modules/`.
   - Add `local/tuning/provenance.ts` with `canonicalSource`, `copiedFor`, version, and
     `syncStatus: 'snapshot'`.

8. Register and verify
   - Fill all `ArtinosModule` entries.
   - Run registry, lint, build, and visual/runtime gates.

## Key Compatibility Risks

- Three version drift: source uses `three ^0.182.0`; STUDIO currently uses `three 0.184.0`.
  TSL imports, WebGPU postprocessing APIs, storage/indirect-draw behavior, and R3F WebGPU renderer
  initialization need direct verification.
- Dependency footprint: source uses R3F, Drei, Rapier, Leva, MUI, GSAP, Valtio/Zustand, gl-noise,
  r3f-perf, and custom `three-core`. ARTINOS already uses React/Three/Zustand, but not every source
  dependency is present. Prefer direct source code plus minimum dependency additions only when they
  are needed for fidelity.
- Source alias/submodule: `@core` points to `packages/three-core/src`. Required pieces should be
  ported or locally copied; do not leave unresolved aliases.
- Heavy instance counts: default grass is `1024 x 1024` blades plus roses and postprocessing. Add
  performance presets and ARTINOS quality controls while preserving a faithful high preset.
- Assets: VAT EXR, KTX2, HDR, GLB, and audio files must load from ARTINOS public paths. KTX2/EXR
  loader setup needs verification under Vite/Studio.
- WebGPU environment: in-app browser may not provide a GPU adapter. If so, build verification can
  pass but visual QA must be completed in a GPU-capable browser.
- R3F versus existing ARTINOS engine pattern: direct R3F port is the most faithful path, but many
  current modules use canvas-owned engine factories. Keep the Lab faithful first; only convert to a
  non-R3F engine if source compatibility forces it.
- Audio permissions: source audio starts through UI/user gesture paths. Preserve that interaction and
  avoid autoplay failures.

## Proposed PANELFLOW Controls

Lab schema groups:
- `Preset`: `source-original`, `performance`, `cinematic`, `grass-study`, `rose-field`.
- `Content`: environment, character, grass, roses, beams, audio.
- `Camera`: mode, follow lag, FPV helmet strength, camera FOV.
- `Terrain`: amplitude, frequency, seed, terrain color.
- `Grass`: blades per axis, area size, LOD segment counts, blade height/width/bend, clump size,
  character push.
- `Wind`: direction, scale, speed, strength, facing.
- `Roses`: count, spawn count, spawn radius, lifecycle durations.
- `Cosmic`: auto spawn, intervals, wave radii, lifetimes, beam intensity.
- `Post FX`: quality, bloom, DoF, SMAA, exposure, tone mapping.
- `Performance`: DPR cap, quality tier, debug LOD, pause.

## Verification Plan

After implementation, run:

```bash
npm run check-registry -w STUDIO
npm run lint -w STUDIO
npm run build -w STUDIO
```

Visual/runtime gate:
- Start STUDIO dev server.
- Load the `false-earth` Lab in the Lab panel.
- Confirm WebGPU renderer activates and no WebGPU error overlay appears.
- Confirm terrain and grass fill the viewport with source-like density and movement.
- Confirm character movement pushes grass and camera modes switch.
- Confirm cosmic beams spawn waves and trigger rose growth.
- Confirm post stack renders bloom/DoF/helmet effects without console errors.
- Confirm PANELFLOW controls drive visible changes.
- Compare side-by-side against source screenshot/live demo for terrain mood, grass density, camera
  scale, rose behavior, beam effects, and overall cinematic tone.

## Acceptance Criteria

- Source files were ported directly, not approximated from memory.
- Canonical modules are registered, showcased, and reusable outside the Lab.
- The faithful `false-earth` Lab is registered with tag `lab`, complete controls, and related module
  ids.
- Lab carries local `modules/` snapshots and provenance.
- Source assets are copied or referenced with clear license/provenance.
- Registry, lint, build, and live preview gates pass.
- Visual QA confirms the Lab preserves False Earth's identity.

## Expected Deviations To Report If Implemented

- Leva debug controls replaced by PANELFLOW schema controls.
- Source `@core` submodule code copied into ARTINOS modules/local Lab code rather than kept as an
  unresolved alias.
- Asset paths rewritten from `/models`, `/textures`, `/vat`, `/audio`, `/fonts` to ARTINOS Lab public
  paths.
- Source PerformanceMonitor/DPR behavior mapped to ARTINOS performance/telemetry controls.
- If required, Three `0.184.0` compatibility edits to TSL imports, WebGPU post APIs, and loaders.
- Any reduced default instance count must be a performance preset only; the source-scale preset must
  remain available.
