# Conversion Plan — false-earth

> **Worked example for `/artinos-module`** — a full Mode B step-7 conversion plan (snapshot). Canonical
> live copy: `docs/conversions/false-earth-conversion-plan.md`. Spec / pipeline / contract:
> [`blueprinting.md`](../../../../docs/blueprinting.md) · [`converter-pipeline.md`](../../../../docs/converter-pipeline.md) ·
> [`module-and-lab-standards.md`](../../../../docs/module-and-lab-standards.md).
>
> Conversion id `false-earth` · Mode **B** · Author Opus 4.8 · Updated 2026-06-29.
> Status: **IN PROGRESS** — 4 cores built & gated (check-registry + lint green); 11 modules + Lab pending.

---

## 0. Overview (at a glance)

**What:** `REF/false-earth` ("False Earth" by Ming-Jyun Hung) — an endless, GPU-generated landscape on
**Three.js WebGPU/TSL** + R3F: compute-driven grass (Voronoi clumps, FBM terrain, wind, character push,
GPU cull + indirect-draw LOD), VAT roses, a walking character with 3 camera modes, cosmic beams that fire
radial shockwaves, and a TSL post stack (bloom/DoF/SMAA + FPV helmet). Already TSL → **no pipeline
conversion**; port faithfully. **Outputs: 15 canonical modules + 1 R3F Lab.** Legend: ✅ built · ⏳ pending.

**Decomposed modules (canonical library):**

| Kind | id | Clean file | Category | Status |
|---|---|---|---|---|
| universal | `tsl-pcg-hash` | `TslPcgHash.js` | `math` | ✅ |
| universal | `tsl-height-field` | `TslHeightField.js` | `math` | ✅ |
| universal | `tsl-voronoi-clump` | `TslVoronoiClump.js` | `math` | ✅ |
| universal | `tsl-spline-math` | `TslSplineMath.js` | `math` | ⏳ (harvest) |
| universal | `tsl-indirect-lod-culler` ★ grass+roses | `TslIndirectLodCuller.js` | `webgpu` | ⏳ |
| universal | `async-shader-compile` | `AsyncShaderCompile.js` | `webgpu` | ⏳ (harvest) |
| universal | `ktx2-upload-queue` | `Ktx2UploadQueue.tsx` | `webgpu` | ⏳ (harvest) |
| universal | `input-system` | `InputSystem.ts` | `input` | ⏳ (harvest) |
| universal | `touch-joystick` | `TouchJoystick.tsx` | `input` | ⏳ (needs `input-system`) |
| universal | `r3f-audio-manager` | `R3FAudioManager.tsx` | `core` | ⏳ (harvest) |
| domain | `tsl-wind-field` | `TslWindField.js` | `shaders` | ✅ |
| domain | `tsl-shockwave-field` | `TslShockwaveField.js` | `shaders` | ⏳ |
| domain | `tsl-gpu-grass` | `TslGpuGrass.js` | `rendering/grass` | ⏳ (built on cores) |
| domain | `tsl-vat-field` | `TslVatField.js` | `rendering` | ⏳ (built on cores) |
| domain | `tsl-dual-scene-post-stack` | `TslDualScenePostStack.js` | `rendering/postfx` | ⏳ |

**Reuse (extend existing — do NOT duplicate):** `performance/adaptive-performance-manager` (adaptive DPR,
replaces drei `PerformanceMonitor`) · `math/tsl-hsv` (extend with `shiftHSV`, = harvest H2) · relate
`webgpu/tsl-structured-array` (struct'd `instancedArray`), `math/tsl-noise`, `math/tsl-grid-sampling`,
`input/pointer-*`.

**Direct copy (harvest near-verbatim from `REF/false-earth/packages/three-core`):** `utils/tsl/math.ts`
(→ `tsl-spline-math`) · `utils/tsl/color.ts shiftHSV` (→ extend `tsl-hsv`) · `components/audio/{AudioManager,Bgm}`
(→ `r3f-audio-manager`) · `input/InputSystem` + `components/input/KeyboardMapper` (→ `input-system`) ·
`components/canvas/AsyncCompile` (→ `async-shader-compile`) · `utils/KTX2Preloader` + `hooks/{useKTX2Texture,useUploadQueue}`
(→ `ktx2-upload-queue`).

**Lab (Mode B):** `STUDIO/src/labs/false-earth/` — **R3F** host (deps already in STUDIO:
`@react-three/fiber@9.6.1`, `drei@10.7.7`, `three@0.185`), snapshots of all modules + `local/` (character,
cosmic, camera, world, background, UI, gameStore, uniforms, presets) + re-staged assets from `REF/`.

**Naming:** runtime files drop the `.module` infix — `<Feature>.ts/.tsx/.js` (`.js` for untyped Three/TSL)
beside `<Feature>.showcase.tsx` + `<Feature>.meta.ts`.

---

## 1. Source & deep analysis (steps 1–2)

- **Input / source:** `REF/false-earth` — R3F v9, `@react-three/drei` v10, `three@^0.182`, TSL/WebGPU.
  Also depends on `@react-three/rapier` (character physics), `leva` (debug — dropped), `zustand`, `r3f-perf`.
- **Original pipeline:** Three.js WebGPU + TSL — compute + vertex/fragment in TSL; no raw GLSL for
  grass/effects. PCG hash for stable jitter (no sin/mod).
- **Files read (real source):** `src/app/App.tsx`; `src/core/shaders/{uniforms,windHelpers,terrainHelpers}.ts`;
  `src/components/grass/core/{shaderHelpers,config,grassCompute,grassMaterial,grassGeometry}.ts`;
  `src/components/Rose/core/{vatCompute,vatMaterial,config}.ts`; `src/components/cosmic/hooks/useCosmicWaves.ts`;
  `src/components/Effects/Effects.tsx`; `src/core/store/gameStore.ts`; `src/core/input/TouchJoystick.tsx`;
  `packages/three-core/src/{index.ts,utils/tsl/math.ts,utils/tsl/color.ts}`.
- **All major systems:** GPGPU compute (grass+VAT) · GPU cull + indirect-draw LOD (shared) · Voronoi clump ·
  FBM heightfield+normal · PCG hash · bezier blade math · wind field · radial shockwave ring buffer · VAT
  playback · TSL dual-scene post (bloom/dof/smaa/helmet) · character + 3 cameras · cosmic beams + audio ·
  starry background · adaptive DPR · KTX2/GLTF/audio preload · keyboard + touch input · async pipeline
  compile · Zustand state · Leva UI (dropped).

### TSL-triage decision (step 2 Pipeline Rule)
- **No pipeline conversion** — already on the TSL/WebGPU target pipeline; port faithfully.
- **No operator rewrites** — source already uses chained `.add()/.mul()/.sub()`.
- **Version:** source `three@^0.182`, STUDIO `three@0.185.0` — compatible TSL surface
  (`bloom`/`dof`/`smaa` under `three/addons/tsl/display/*`; MaterialX nodes `mx_fractal_noise_float`,
  `mx_rgbtohsv`/`mx_hsvtorgb` present). No struct-label issue like AURORA (these buffers are simpler), but
  keep buffer labels WGSL-safe (camelCase) by habit.

---

## 2. Decomposition & scope map (steps 3–6)

Aggressive decomposition (§6): the grass demo hides universal GPGPU/LOD/hash/heightfield/Voronoi/spline
cores; the headline "grass" is **one** domain module built on those cores. `U` Universal · `D` Domain ·
`L` Lab-local · `X` Dropped. **✅ = built+gated.**

| # | System | Generalized form | Class | Lands in (id) | Status |
|---|---|---|---|---|---|
| 1 | PCG hash | int→[0,1) hash, no sin/mod | U | `math/tsl-pcg-hash` | ✅ |
| 2 | FBM heightfield + normal | procedural height + finite-diff normal | U | `math/tsl-height-field` | ✅ |
| 3 | Voronoi clump | cellular F1/F2 + toCenter | U | `math/tsl-voronoi-clump` | ✅ |
| 4 | bezier + safeNormalize2D + easing | spline + vector math | U | `math/tsl-spline-math` | ⏳ harvest |
| 5 | shiftHSV | HSV color shift | U | extend `math/tsl-hsv` | ⏳ harvest |
| 6 | GPU cull + indirect-draw LOD | atomic LOD buckets | U | `webgpu/tsl-indirect-lod-culler` | ⏳ (grass+roses) |
| 7 | AsyncCompile | pre-compile WebGPU pipelines | U | `webgpu/async-shader-compile` | ⏳ harvest |
| 8 | KTX2 upload queue | KTX2 GPU upload | U | `webgpu/ktx2-upload-queue` | ⏳ harvest |
| 9 | InputSystem + KeyboardMapper | declarative axis/button input | U | `input/input-system` | ⏳ harvest |
| 10 | TouchJoystick | virtual joystick (binds InputSystem) | U | `input/touch-joystick` | ⏳ |
| 11 | AudioManager + Bgm | R3F positional audio + BGM | U | `core/r3f-audio-manager` | ⏳ harvest |
| 12 | wind field | foliage wind (field/facing/push/sway) | D | `shaders/tsl-wind-field` | ✅ |
| 13 | shockwave ring buffer | radial shockwave field (emissive+push) | D | `shaders/tsl-shockwave-field` | ⏳ |
| 14 | GPU grass | compute-driven instanced bezier grass | D | `rendering/grass/tsl-gpu-grass` | ⏳ |
| 15 | VAT playback | VAT instanced field | D | `rendering/tsl-vat-field` | ⏳ |
| 16 | dual-scene post stack | bloom/dof/smaa + beam composite + helmet | D | `rendering/postfx/tsl-dual-scene-post-stack` | ⏳ |
| L1 | character | mesh + Rapier physics + 3 camera solves + trail + audio | L | `labs/false-earth/local/character/` | ⏳ |
| L2 | cosmic | beams + spawner + beam audio + validator | L | `labs/false-earth/local/composition/cosmic/` | ⏳ |
| L3 | world/bg/camera | WorldController, Terrain mesh, DirectionalLight, StarrySky/Stars, CameraViewControl | L | `labs/false-earth/local/composition/` | ⏳ |
| L4 | state + wiring | gameStore, events, shared `uniforms`, createFalseEarthLab | L | `labs/false-earth/local/state/` + root | ⏳ |
| L5 | presets/tuning/UI | curated presets, PARAM_TO_CONFIG, LoadingScreen/SideBar/AudioButton | L | `labs/false-earth/local/{presets,tuning,ui}/` | ⏳ |
| X | Leva + `debug/*`, eruda, wouter, `index.jsx`/HTML shell | — | X | dropped (→ PANELFLOW schema) | n/a |

- **Reuse-first (step 5):** reuse `performance/adaptive-performance-manager` (don't re-derive App's DPR
  loop); extend `math/tsl-hsv` for `shiftHSV` (= module 5); consider `webgpu/tsl-structured-array` inside
  module 6/14/15 for struct'd `instancedArray`; relate `math/tsl-noise` (source uses built-in
  `mx_fractal_noise_float`), `math/tsl-grid-sampling`, `input/pointer-*`. None of modules 1–16 are covered.
- **Direct asset harvest (step 6):** the `packages/three-core` files in the Overview are self-contained →
  near-verbatim copies (strip TS for `.js` runtimes). VAT roses, GLBs, HDR, KTX2, audio under
  `REF/false-earth/public/` are harvested into the Lab capsule only.
- **Out of scope (dropped):** Leva (`LevaWrapper`, `debug/*`), eruda console, `wouter` routing, the
  template `index.jsx`/HTML shell, r3f-perf HUD (replaced by `adaptive-performance-manager` + telemetry).

---

## 3. Per-module build plan

> Each module: `<Feature>.js` (TSL/Three runtime, untyped, ported verbatim) or `<Feature>.tsx`/`.ts`
> (React/typed) + `<Feature>.showcase.tsx` (bridge-driven, default OUTSIDE the selector, ADR-13) +
> `<Feature>.meta.ts` (`ArtinosModule`, `id === schema.id`, full schema/usage/agentNotes/provenance).
> GPU modules: `dependencies: ['three','webgpu','react']`. Three stays untyped (no `@types/three`).

### Built (✅) — verbatim ports, gated green
- **`math/tsl-pcg-hash`** (`TslPcgHash.js`) — `pcgHash`, `hash2to1`, `hash2to2` (no sin/mod). From
  `grass/core/shaderHelpers.ts:34–57`.
- **`math/tsl-height-field`** (`TslHeightField.js`) — `getTerrainHeight(amp,freq,seed)→Fn([xz])→float`,
  `getTerrainNormal(hFn)→Fn([xz])→vec3`, `rotateAxis(v,axis,angle)`. From `core/shaders/terrainHelpers.ts`.
- **`math/tsl-voronoi-clump`** (`TslVoronoiClump.js`) — `createVoronoiClump(hash2to2,cellSize,smoothness,
  toCenterScale)→clump(gx,gz)→{bestID,secondBestID,centerFactor,toCenter}`. From `grassCompute.ts:189–225`.
- **`shaders/tsl-wind-field`** (`TslWindField.js`) — `calculateWindStrength`, `applyWindFacingAndNormalize`,
  `getWindDirection`, `applyWindPush`, `applyWindSway`, `applyVertexSway`, `safeNormalize`, `normalizeAngle`.
  From `core/shaders/windHelpers.ts` + grass wind helpers. Deviation: local `safeNormalize` for self-containment.

### ⏳ `math/tsl-spline-math` — `TslSplineMath.js`  (harvest)
- **From:** `packages/three-core/src/utils/tsl/math.ts` (verbatim, strip TS).
- **Exports:** `safeNormalize2D(v)`, `bezier3(p0,p1,p2,p3,t)`, `bezier3Tangent(p0,p1,p2,p3,t)`,
  `easeInOutCubic(t)`, `easeOutCubic(t)`, `easeOutExpo(t)`. Plain TSL helper fns (not `Fn`-wrapped).
- **Used by:** `tsl-gpu-grass` (bezier blade spine/tangent), `tsl-shockwave-field` (easeOutCubic/Expo ring
  progress). **Showcase:** draw a cubic-bezier ribbon whose control points a slider moves; tangent as color.
- **agentNotes:** pure math, no uniforms; `bezier3`/`bezier3Tangent` take 4 vec3 control points + float t.

### ⏳ extend `math/tsl-hsv` with `shiftHSV`  (harvest H2 — reuse, do NOT make a new module)
- **From:** `packages/three-core/src/utils/tsl/color.ts` — `shiftHSV = Fn(([color, shift]) => …)`
  (`mx_rgbtohsv` → add shift, `fract` hue, clamp s/v → `mx_hsvtorgb`).
- **Action:** add `export const shiftHSV` to the existing `TslHsv.js`; update its `.meta.ts` `description`/
  `agentNotes`/`usage`/`updatedAt` to mention it. Do not create `tsl-color-shift`.
- **Used by:** `tsl-gpu-grass` + `tsl-vat-field` (global hue shift + per-instance variation).

### ⏳ `webgpu/tsl-indirect-lod-culler` — `TslIndirectLodCuller.js`  ★ shared by grass + roses
- **From:** `grass/core/config.ts:60–66` (`drawIndirectStructure`) + `grassCompute.ts:52–131,298–311`
  (LOD chain builder, `performCulling`, `createResetDrawBufferCompute`) + the **identical** pattern in
  `Rose/core/vatCompute.ts:20–76,157–162`. Unify the two copies into one core.
- **`drawIndirectStructure`** = `struct({ vertexCount:'uint', instanceCount:{type:'uint',atomic:true},
  firstVertex:'uint', firstInstance:'uint', offset:'uint' })` (WebGPU drawIndexedIndirect layout).
- **Exports:**
  - `createLodBuffers(lodSegmentsConfig[], vertexCountFor(seg))` → `LODBufferConfig[]` (each: `indices`
    `instancedArray('uint')`, `drawBuffer` `IndirectStorageBufferAttribute`, `drawStorage` `storage(...)`,
    `segments/minDistance/maxDistance/vertexCount/debugColor`).
  - `createLodRouter(configs)` → `(distToCamera, instanceIndex) => void` — recursive `If/Else` chain:
    `atomicAdd(config.drawStorage.get('instanceCount'), uint(1))` → `config.indices.element(lodIndex).assign(uint(instanceIndex))`,
    with optional LOD-transition noise (`fract(idx*0.12345)*2-1` × `uLODNoiseScale`).
  - `frustumCull(worldPos, viewProj, radius=1.5)` → bool: `clip = viewProj.mul(vec4(worldPos,1))`;
    `inFront = clip.w > -radius`; `|clip.x|<clip.w+radius` (& y) & `clip.z<clip.w+radius`.
  - `createResetDrawBuffers(configs)` → compute node (sets `vertexCount`, `atomicStore(instanceCount,0)`,
    zeros firstVertex/firstInstance/offset).
- **Hardware:** atomic `instanceCount`; **reset compute must run each frame before the cull/route compute**;
  one indirect draw per LOD bucket; uses `webgpu/tsl-structured-array` for the buffer if convenient.
- **Showcase:** 50k instanced cubes GPU-culled into 3 distance LOD buckets; `lodBias` slider + tint-by-LOD
  toggle. **Standalone proof:** generic instanced LOD, no grass/VAT.

### ⏳ `webgpu/async-shader-compile` — `AsyncShaderCompile.js`  (harvest)
- **From:** `packages/three-core/src/components/canvas/AsyncCompile` (read at exec). Pre-compiles node
  materials/pipelines so the first animated frame doesn't hitch. **Showcase:** compile a heavy node
  material, show "ready" vs first-frame timing.

### ⏳ `webgpu/ktx2-upload-queue` — `Ktx2UploadQueue.tsx`  (harvest)
- **From:** `packages/three-core/src/utils/KTX2Preloader` + `hooks/{useKTX2Texture,useUploadQueue}`.
  Exports `<KTX2Preloader paths={…}/>` + the upload-queue hook (throttles GPU uploads to avoid frame
  spikes). **Showcase:** preload a KTX2 set with a progress readout.

### ⏳ `input/input-system` — `InputSystem.ts`  (harvest)
- **From:** `packages/three-core/src/input/InputSystem` + `components/input/KeyboardMapper`. Exports
  `class InputSystem<T extends string>` (`setAxis`, `setButton`, `getAxis`, `isDown`, key-binding map) +
  `<KeyboardMapper input keyMap/>`. Pure logic + a React binding. **Showcase:** WASD/arrows drive
  axis/button readouts. **agentNotes:** the declarative action layer that `touch-joystick` and the Lab
  character consume.

### ⏳ `input/touch-joystick` — `TouchJoystick.tsx`  (needs `input-system`)
- **From:** `src/core/input/TouchJoystick.tsx` verbatim. Props `{ input: InputSystem<T>, actions:{forward,
  backward,left,right,run} }`; pointer-capture joystick → `input.setAxis('horizontal'/'vertical')` +
  digital buttons (threshold 0.5) + run (pull > 0.8); `MAX_RADIUS=50, DEAD_ZONE=10`. Inverts screen-Y →
  world-forward. **Showcase:** mount with a demo `InputSystem`, drive a dot + axis/button readout.
  **Standalone proof:** mobile input with no 3D.

### ⏳ `core/r3f-audio-manager` — `R3FAudioManager.tsx`  (harvest)
- **From:** `packages/three-core/src/components/audio/{AudioManager,Bgm}` (read at exec). `<AudioManager
  onListenerCreated={(l)=>…}/>` creates a `THREE.AudioListener` on the active camera; `<Bgm>` + one-shot
  helpers. **Showcase:** a play button → positional beep, listener readout.

### ⏳ `shaders/tsl-shockwave-field` — `TslShockwaveField.js`
- **From:** `grass/core/shaderHelpers.ts:455–531` (`WaveResult` struct + `createWaveLogic`) +
  `cosmic/hooks/useCosmicWaves.ts` (ring buffer, `waveStructure`, `triggerShockwave`). Uses `tsl-spline-math`
  `easeOutCubic`/`easeOutExpo` for ring progress.
- **`waveStructure`** = `struct({ x:'float', z:'float', startTime:'float', maxRadius:'float', lifetime:'float' })`.
  `WaveResult` = `struct({ strength:'float', force:'vec3' })`. `MAX_WAVES=16`, `DATA_PER_WAVE=5`.
- **Exports:** `createShockwaveField({ maxWaves=16 })` → `{ buffer (StorageBufferAttribute),
  triggerShockwave(posVec3, maxRadius=15, lifetime=5), updateStep(time) (CPU ring upload + sets
  `uActiveWaveCount`), waveLogic(activeCountU, timeU) }` where `waveLogic(worldXZ)` → `Fn`→`WaveResult`
  (Loop active waves; progress = mix(easeOutCubic, easeOutExpo, seed); ring shape `smoothstep(ringWidth,0,
  |dist-radius|)` × fade; force = normalize(toWave3D)×strength×0.7).
- **Showcase:** click a plane → expanding rings (strength as brightness). **Standalone proof:** ripples,
  no grass.

### ⏳ `rendering/grass/tsl-gpu-grass` — `TslGpuGrass.js`
- **From:** `grass/core/{config,grassCompute,grassMaterial,grassGeometry}.ts` + the remaining
  blade/slope/tilt/char-push helpers in `shaderHelpers.ts`. Owns only grass-specific logic; imports the
  cores (1,2,3,4,12,13 + spline math + shiftHSV).
- **`grassStructure`** (64 B) = `struct({ data0:'vec4' /*pos.xyz + type*/, data1:'vec4' /*width,height,bend,
  windStrength*/, data2:'vec4' /*rotSin,rotCos,clumpSeed,bladeSeed*/, data3:'vec4' /*normal.xz + push.xy*/ })`.
  Defaults: `BLADES_PER_AXIS=1024`, `AREA_SIZE=80`, LOD `[{15,0–5},{5,5–20},{2,20–∞}]`.
- **Exports:** `createGpuGrass(renderer, { bladesPerAxis, areaSize, lodConfig, uniforms })` →
  `{ group, computeStep(dt), resize(), dispose() }`. Internals:
  - **compute** (`createGrassCompute`): world pos from grid index + `hash2to2` jitter (C1); terrain height/
    normal (C2); Voronoi clump (C3) → blend nearest/second clump params (height/width/bend/type) by
    `centerFactor`; base yaw from `toCenter` + per-blade/clump hash; wind strength + facing (D1); character
    push (smoothstep radius); pack `data0..3`; GPU frustum-cull + LOD route (C4). Reset compute first.
  - **material** (`createGrassMaterial`, `MeshStandardNodeMaterial`, DoubleSide): read struct via
    `visibleIndicesBuffer.element(instanceIndex)`; bezier blade from `getBezierControlPoints` + `bezier3`/
    `bezier3Tangent` (spline math); wind push/sway + vertex sway (D1); wave push + emissive (D5
    `waveLogic`); slope alignment to terrain normal (`rotateAxis`); view-dependent thickness tilt; PBR
    `colorNode` (height gradient × clump/blade seed × AO, dist fade, `shiftHSV` global hue), `normalNode`
    (rim+midrib), `roughnessNode`, `envNode`, `emissiveNode` (wave heat glow ×5 for bloom).
  - **geometry** (`createBladeGeometry(segments)` = `PlaneGeometry(1,1,1,segments)` translated +Y/2;
    `createGrassData`, `createVisibleIndicesBuffer`).
- **meta:** id `tsl-gpu-grass`, category `rendering/grass`. schema: blade height/width/bend min-max, clump
  size/blend, wind (scale/speed/strength/facing/sway), char push radius/amount/flatten, base/tip color,
  LOD noise, AO power. presets: Meadow, Dry, Alien. **Showcase:** grass patch over C2 terrain; side-by-side
  vs source `Screenshot.png`.

### ⏳ `rendering/tsl-vat-field` — `TslVatField.js`
- **From:** `Rose/core/{vatCompute,vatMaterial,config}.ts`. Imports C2 (terrain), C4 (same LOD culler),
  D1 (wind), `tsl-hsv` `shiftHSV`.
- **`vatStructure`** = `struct({ position:'vec3', isActive:'float', frame:'float', age:'float',
  seed:'float', progress:'float' })`. `VATMeta` = `{ frameCount, textureWidth, textureHeight,
  textures{position,normal}, padding?, compressNormal?, fps?, storeDelta? }`.
- **Exports:** `createVatField(renderer, { posTex, nrmTex, colorTex, normalMapTex, meta:VATMeta, maxCount,
  lodConfig, uniforms })` → `{ group, spawn(posVec3, count, radius), updateStep(dt), dispose() }`.
  - **compute:** `createSpawnCompute` (ring-buffer `atomicAdd` head, random pos in radius, seed),
    `createUpdateCompute` (lifecycle delay/grow/keep/die → `frame` 0→1→0; frustum-cull + LOD route via C4),
    reset computes.
  - **material** (`MeshStandardNodeMaterial`, DoubleSide): sample VAT pos/normal by `uv(1)` + frame column;
    `decodeVatNormal` (octahedral if `compressNormal`); `applyRotation` (per-seed yaw blended toward
    character + terrain slope via `rotateAxis`); wind sway (D1); character push; PBR color (petal/stem/leaf
    masks, `shiftHSV` per-seed hue + global hue), normal-mapped, fresnel emissive.
- **meta:** id `tsl-vat-field`, category `rendering`. schema: scale min/max, lifetime (delay/grow/keep/die),
  spawn count/radius, hue randomness, fresnel power/intensity, emissive. **Showcase:** spawn/die VAT field
  on a button (use the Rose VAT assets in the showcase, or a placeholder VAT). **Standalone proof:** any VAT mesh.

### ⏳ `rendering/postfx/tsl-dual-scene-post-stack` — `TslDualScenePostStack.js`
- **From:** `Effects/Effects.tsx` + `Effects/useEffectsControls.ts` (read controls at exec).
- **Exports:** `createDualScenePostStack(renderer, mainScene, beamScene, camera, opts)` →
  `{ setParams(p), render(), dispose() }`. Builds `THREE.PostProcessing`: `pass(mainScene,camera)` +
  `pass(beamScene,camera)`; FPV **helmet** distortion (`pow(dist,3)` toward center) + chromatic aberration
  (rgb offset) + vignette when `helmetStr>0`; DoF (`dof(node, viewZ, focusDist, focalLen, bokeh)`,
  autofocus = `camera.distanceTo(character)`); **beam composite** `finalNode.add(beamColor.mul(smoothstep(0,
  10, beamDepth-sceneDepth)))`; `bloom(node)` (threshold/strength/radius); `smaa(node)`. `ReinhardToneMapping`,
  `toneMappingExposure = pow(exposure,4)`. `bloom/dof/smaa` from `three/addons/tsl/display/*`.
- **meta:** id `tsl-dual-scene-post-stack`, category `rendering/postfx`. schema: bloom (threshold/strength/
  radius), dof (focusDistance/focalLength/bokeh/autofocus), helmet strength, vignette, smaa toggle,
  exposure. **Showcase:** two scenes (lit mesh + glow mesh) composited with all effects toggleable.
  **Standalone proof:** generic dual-scene post, no grass.

> Every `.meta.ts`: `id===schema.id`, explicit category, full `schema.parameters` (key/label/type/default;
> min/max/step), `dependencies`, `presets`, `related`, `agentNotes` + provenance
> (`canonicalSource: REF/false-earth/<path>`), `version '0.1.0'`, `updatedAt` ISO-UTC.

---

## 4. Mode B — Lab capsule plan

- **Path:** `STUDIO/src/labs/false-earth/` · **host = R3F** (deps already present).
- **Files:** `FalseEarthLab.tsx` (bridge-driven preview: an R3F `<Canvas gl={WebGPURenderer}>` mounting the
  world; mic-toggle overlay) · `FalseEarthLab.meta.ts` (category `lab`; tags `lab,replica,composition`;
  `related` = all 15 module ids; `FALSE_EARTH_PARAMS` PANELFLOW schema) · `createFalseEarthLab.tsx`
  (composition mirroring `App.tsx`).
- **Composition (`createFalseEarthLab`):** mirror `App.tsx` — WebGPURenderer init + WebGPU capability
  guard; `core/app-init-pipeline`? (no — false-earth uses Suspense/preload, keep that); two scenes via a
  `BeamSceneContext`; `Environment` HDR; `DirectionalLight`; adaptive DPR via
  `performance/adaptive-performance-manager` (replacing drei `PerformanceMonitor`); `WorldController`
  composing `tsl-gpu-grass` + `tsl-vat-field` + Terrain + character + cosmic; `tsl-dual-scene-post-stack`
  as the final pass; `tsl-shockwave-field` buffer shared into grass/VAT via the `uniforms` module.
- **Snapshots → `labs/false-earth/modules/<category>/`** (provenance per file: `canonicalSource` = the
  `STUDIO/src/modules/...` path, `copiedFor:'false-earth'`, `syncStatus:'snapshot'`): all 15 modules + the
  reused `performance/adaptive-performance-manager` + `math/tsl-hsv`. `modules/assets/` gets only
  Scenery-referenced VAT roses/GLBs/HDR/KTX2/audio from `REF/false-earth/public/`.
- **`local/`:** `character/` (Character mesh, `useCharacterPhysics` (Rapier), `useFollowCamera`/`useFPVCamera`,
  `solveCam`/`solveTank`, `useCharacterTrail`, `CharacterAudio`, `config`) · `composition/` (WorldController,
  Terrain, DirectionalLight, Background/StarrySky/Stars, `cosmic/` beams+spawner+audio+validator) ·
  `camera/` (CameraViewControl) · `state/` (gameStore, events, shared `uniforms`) · `presets/`
  (Dawn Field / Storm / Cosmic) · `tuning/` (PARAM_TO_CONFIG) · `ui/` (LoadingScreen, SideBar, AudioButton).
- **Caveats:** character physics needs `@react-three/rapier` — add the dep (preferred, preserves identity)
  or port a minimal kinematic solver; `@react-three/postprocessing` is NOT needed (post is the D-module).
- **Dashboard (`FALSE_EARTH_PARAMS`):** curated subset — grass density/height/wind, terrain amp/freq, rose
  spawn, postfx bloom/dof/helmet, hue shift, camera mode, quality + a `preset` enum.

---

## 5. Ordered task checklist (steps 8–11)

Common acceptance per task: `npm run check-registry -w STUDIO` green + `npm run lint -w STUDIO` green +
showcase loads with a control driving it, **zero console errors** (fresh dev session — a prior module's
WebGPU error can poison the device).

- [x] T1 — `math/tsl-pcg-hash`. **DONE + gated.**
- [x] T2 — `math/tsl-height-field`. **DONE + gated.**
- [x] T3 — `math/tsl-voronoi-clump`. **DONE + gated.**
- [x] T4 — `shaders/tsl-wind-field`. **DONE + gated** (local `safeNormalize` deviation).
- [ ] T5 — harvest `math/tsl-spline-math` (bezier/easing/safeNormalize2D).
- [ ] T6 — extend `math/tsl-hsv` with `shiftHSV` (reuse, not a new module).
- [ ] T7 — `webgpu/tsl-indirect-lod-culler` (unify grass+VAT). **Gate before T11/T12.**
- [ ] T8 — harvest `input/input-system`, then `input/touch-joystick` (depends on it).
- [ ] T9 — harvest `webgpu/async-shader-compile`, `webgpu/ktx2-upload-queue`, `core/r3f-audio-manager`.
- [ ] T10 — `shaders/tsl-shockwave-field` (uses spline-math easing).
- [ ] T11 — `rendering/grass/tsl-gpu-grass` (imports C1–C4, D1, D5, spline-math, hsv). Side-by-side vs source.
- [ ] T12 — `rendering/tsl-vat-field` (imports C2, C4, D1, hsv). Side-by-side.
- [ ] T13 — `rendering/postfx/tsl-dual-scene-post-stack`.
- [ ] T14 — Lab `labs/false-earth/` R3F replica + snapshots + `local/*` + re-staged assets + `@react-three/rapier`.
  Fidelity pass vs `REF/false-earth` (`npm run dev` there + `Screenshot.png`). 0 console errors.
- [ ] T15 — Final report (§10 pipeline format) + add `example-false-earth.md` to the skill.

---

## 6. Fidelity, deviations & validation

- **Preserved verbatim:** all TSL compute/material math (grass struct packing `data0..3`, Voronoi, FBM,
  wind push/sway, bezier blade, VAT octahedral decode, shockwave ring), exact naming (`hash2to1`,
  `getTerrainNormal`, `grassStructure`, `waveStructure`, `vatStructure`), the GPU cull + indirect-draw LOD
  scheme, the postfx node graph, camera modes, Rapier physics.
- **Planned deviations (record in the final report):** Leva → PANELFLOW schema; drei `PerformanceMonitor` →
  `adaptive-performance-manager`; drop eruda + `wouter` + r3f-perf HUD; **unify the two LOD routers**
  (grass + VAT) into one `tsl-indirect-lod-culler` (intentional de-dup, identical behavior); `safeNormalize`
  swap in `tsl-wind-field`; runtime files use clean names (no `.module` infix).
- **Validation (DoD):** per task above; the Lab additionally needs the snapshot capsule with provenance +
  a side-by-side fidelity note vs `REF/false-earth`. "It builds" is not done.
- **VM caveat:** dev VM WebGPU is slow and hidden preview tabs pause rAF — gate on zero-console-error +
  WebGPU-active + control-present; do a hardware visual check on the heaviest modules (grass, VAT, postfx,
  Lab). three is already 0.185 (no upgrade needed).
