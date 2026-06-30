# Conversion Plan — tubes-cursor

> Step 7 artifact. A completely blind downstream agent must be able to execute this with no other
> context. Spec: [`blueprinting.md`](../blueprinting.md). Pipeline:
> [`converter-pipeline.md`](../converter-pipeline.md). Contract:
> [`module-and-lab-standards.md`](../module-and-lab-standards.md).
>
> Conversion id: `tubes-cursor` · Mode: **B** · Author/model: Claude Opus 4.8 · Date (UTC): 2026-06-30

---

## 0. Overview (at a glance)

**What:** CodePen [soju22/qEbdVjK "Tubes Cursor (WebGL, WebGPU)"](https://codepen.io/soju22/pen/qEbdVjK) —
a fullscreen field of ~16 neon tubes that snake toward the cursor (raycast onto a camera-facing plane),
lit by 4 colored point lights, bloomed, with an idle Lissajous wander when the pointer is away and
click-to-randomize colors. Three.js r180 + TSL node materials on `WebGPURenderer` (WebGL2 fallback).
Mode **B** · Status: **PLANNED** (no code yet).

**Decomposed modules (canonical library):**

| Kind | Module (clean name, no `.module`) | Category | Status |
|---|---|---|---|
| universal | `Psrdnoise3D` | `math` | ⬜ |
| universal | `TrailTubeGeometry` | `geometries` | ⬜ |
| domain | `TubesCursor` | `effects` | ⬜ |

**Reuse (extend existing — do NOT duplicate):**
- `pointer-raycast-force` (`input/PointerRaycastForce.module.js`) — gives the world-space pointer→plane
  intersection `point` the effect uses as the tube target. Replaces the source's bespoke
  `Raycaster`+`Plane`+pointer-tracker glue (`mn`/`ni`/`eB…nB`).
- `tsl/display/BloomNode.js` — the TSL `bloom()` node the effect already uses for postfx (the source's
  `CC`). Reuse the existing node; do not re-implement and do not use the WebGL `neon-bloom`/`UnrealBloomPass`.
- The **engine + showcase runtime pattern** (own renderer/camera/loop/`dispose`, like `neon-bloom/engine.js`
  and `TslWebgpuSwarmParticles`) — replaces porting the source's `BC` app-base class (camera/scene/
  resize/IntersectionObserver/visibility/loop). ARTINOS' showcase + `ResizeObserver` already cover this.

**Direct copy (harvest near-verbatim):** none. The only public source is a **minified bundle**
(`REF/tubes1_bundle.txt`, Three r180 + effect). Everything is a faithful **port** from the de-minified
tail (`REF/tubes1_effect.beautified.js`), not a file copy.

**Lab (Mode B):** `STUDIO/src/labs/tubes-cursor-lab/` — host runtime `createTubesCursorLab.js` wrapping the
canonical `TubesCursor` effect + presets + click-randomize; `TubesCursorLab.tsx` renders the branded
CodePen replica (hero "TUBES / CURSOR" + Framer credit). Snapshots of the 3 canonical modules under
`modules/`, project-specific files under `local/`.

---

## 1. Source & deep analysis (steps 1–2)

- **Input type / source path(s):** CodePen pen `soju22/qEbdVjK`. The pen JS (894 chars) only imports
  `TubesCursor` from `threejs-components@0.0.19/build/cursors/tubes1.min.js`. The real effect lives in that
  package. Authoritative source captured to disk:
  - `REF/tubes1_bundle.txt` — the full minified build (774,791 chars = Three r180 core + effect tail).
  - `REF/tubes1_effect.beautified.js` — de-minified **effect tail** (bundle bytes 760000→end, 413 lines).
    Line references below are into this file.
  - Pen HTML/CSS/JS captured inline in §1 of this plan (below).
- **Original pipeline:** **TSL on Three.js** (`three/webgpu` `WebGPURenderer` + `three/tsl`
  `MeshStandardNodeMaterial`, `PostProcessing`, `bloom()` node). WebGL2 fallback is the renderer's own
  backend choice. The unminified `threejs-components` repo is **sponsors-only** (private) — the minified
  bundle is the only public source; string literals (config, names) survive minification, and the
  algorithmic structure is fully recovered in the beautified tail.
- **What it does (1 paragraph):** A `WebGPURenderer` fills the canvas (`alpha:true`, `antialias:false`,
  pixelRatio pinned to 2, `cameraMaxAspect 1.5`, camera at z=5 looking at origin). A scene holds **16
  tubes** (each a `Mesh` of a custom updatable tube geometry, `MeshStandardNodeMaterial`, metalness 1 /
  roughness .25, random radius .005–.05 and 32–128 tubular segments) plus **4 `PointLight`s** at the
  corners (±5,±5,5), intensity 200, with the 4 configurable colors. Each frame, the cursor is raycast
  onto a camera-facing plane through the origin → a 3D `target`. Every tube runs `lerpTo(target)`: the
  head point lerps toward `target` plus a **curl-noise** jitter (psrdnoise, seeded by position+time), and
  each following point lerps toward the one ahead (a trailing snake). The geometry rebuilds along a
  CatmullRom curve using Frenet frames, radius tapered by `sin(h·π)` so each tube has rounded caps. Tube
  base colors are sampled from a gradient built from the configured colors. When the pointer isn't over
  the canvas, `target` follows an idle Lissajous path (`sleepRadiusX 300`, `sleepRadiusY 150`,
  `sleepTimeScale1 1`, `sleepTimeScale2 2`, scaled to world units). The whole scene is composited through
  a TSL `bloom()` node (`threshold 0`, `strength 1.5`, `radius .5`). Clicking the page randomizes the 3
  tube colors and 4 light colors.
- **Files read (the real source):**
  - `REF/tubes1_effect.beautified.js` — de-minified effect (the port target). Map:
    - L1–77 `BC` app-base class (renderer/scene/camera/resize/IntersectionObserver/visibility/loop/clear/
      dispose) — **NOT ported** (reuse runtime pattern).
    - **L78–181** `PC` + helpers `LC,IC,OC,VC,DC,UC,zC,kC,GC,WC,FC` + `UC.add` + scratch
      `HC,$C,jC` → **psrdnoise** (curl noise). → `Psrdnoise3D`.
    - **L182–196** `qC extends Mesh` (`timeDelta`, ctor, `lerpTo`) → trail tube mesh + chain follow.
    - **L197–234** `XC extends <BufferGeometry>` (CatmullRom curve of N+1 points, `update()` Frenet-frame
      tube rebuild with `sin(h·π)` taper) → trail tube geometry. → `TrailTubeGeometry` (qC+XC together).
    - **L235–241** `YC` tube-system defaults.
    - **L242–311** `QC extends Scene` (`initLights` L254–261, `initTubes` L262–272, `setColors` gradient
      L273–295, `setLightsColors` L296–300, `setLightsIntensity` L301–305, `update` L306–310) → the
      `TubesCursor` effect scene.
    - L312–364 `eB,tB,sB,rB,iB,nB` global pointer manager — **NOT ported** (reuse `pointer-raycast-force`).
    - **L365–371** `aB` top-level defaults (bloom + sleep params).
    - **L372–409** `oB` factory (renderer/camera setup, bloom wiring L385–389, raycast→target L390–394,
      `onBeforeRender` idle motion L395–401, return handle L402–408) → `TubesCursor` factory + Lab compose.
  - `REF/tubes1_bundle.txt` — minified bundle; only used to confirm Three version (r180) and that the
    effect tail above is complete.
- **Pen source (captured verbatim):**
  - HTML: `<div id="app"><canvas id="canvas"></canvas><div class="hero"><h1>Tubes</h1><h2>Cursor</h2>
    <a target="_blank" href="https://www.framer.com/@kevin-levron/">Framer Component</a></div></div>`
  - CSS: full-bleed fixed `#canvas`; centered `.hero` flex column; `h1` 80px/700 uppercase, `h2` 60px/500
    uppercase, white text with `text-shadow: 0 0 20px rgba(0,0,0,1)`; font `Montserrat`; `body{touch-action:none}`.
  - JS (the pen): `TubesCursor(canvas, { tubes: { colors:["#f967fb","#53bc28","#6958d5"], lights:{
    intensity:200, colors:["#83f36e","#fe8a2e","#ff008a","#60aed5"] } } })`; on `document` click →
    `app.tubes.setColors(randomColors(3))`, `app.tubes.setLightsColors(randomColors(4))`.
- **All major systems found:** render (WebGPU/TSL) · math/noise (psrdnoise curl) · geometry (updatable
  Frenet tube) · motion (trail lerp-chain) · lights (4 point lights) · input (pointer raycast→plane) ·
  postfx (TSL bloom) · color (CPU gradient ramp) · app-base/runtime (`BC`, scaffolding to discard) · idle
  animation (Lissajous) · UI overlay (hero text).

### TSL-triage decision (step 2 Pipeline Rule)
- **Decision:** **Port on the original (TSL) pipeline** — it is already `three/webgpu` + `three/tsl`. No
  rebuild of a foreign pipeline is needed. `Psrdnoise3D` and `TrailTubeGeometry` are plain-JS/CPU
  (BufferGeometry + Float32Array math) and run on any renderer; only `TubesCursor` needs `three/webgpu`
  (node material + `PostProcessing`/`bloom`).
- **Reason:** Source is native TSL/WebGPU; the highest-fidelity port preserves that. The repo's `three` is
  r185 with `three/webgpu` + `three/tsl` available (used by `TslWebgpuSwarmParticles`, `tsl/display/BloomNode.js`).
- **Operator rewrites needed:** **None in the effect itself** — it uses `MeshStandardNodeMaterial` with
  default nodes and sets colors via `.color.set()`; bloom is the prebuilt `bloom()` node. No
  operator-overloaded TSL math (`a+b*c`) is introduced. (If any custom node math is added later, rewrite
  to `.add().mul()` — STUDIO has no TSL operator plugin.)

---

## 2. Decomposition & scope map (steps 3–6)

| System | Generalized form | Classification | Lands in | Reuse-first hit? | Harvest-by-copy? |
|---|---|---|---|---|---|
| Curl noise (`PC`+helpers) | Periodic simplex rotating-derivative (curl) noise, CPU `(seed,period,alpha,out)→out`+scalar | Core Universal | `modules/math/Psrdnoise3D.js` | new (`SimplexNoise.js` is classic simplex, different) | no (port from minified) |
| Updatable tube + chain (`XC`+`qC`) | Tube mesh that follows a moving target via a lerp point-chain + injected noise; CatmullRom + Frenet + `sin(h·π)` caps | Core Universal | `modules/geometries/TrailTubeGeometry.js` | new (`curves/` NURBS, `lines/` fat-lines don't cover) | no |
| Tubes cursor scene (`QC`+`oB`) | N neon trail-tubes + point lights + gradient + bloom + pointer target + idle motion | Domain | `modules/effects/TubesCursor.js` | new | no |
| Pointer → plane target (`mn`/`ni`/`eB…nB`) | World-space pointer ray ∩ interaction plane → point | Project glue → **reuse** | `input/PointerRaycastForce.module.js` (`.read().point`) | **yes** `pointer-raycast-force` | no |
| Bloom postfx (`CC`) | TSL `bloom()` node | **reuse** | `tsl/display/BloomNode.js` | **yes** | no |
| Color gradient (`setColors`/`getColorAt`) | CPU multi-stop `THREE.Color` ramp sampler | Domain (fold-in) | inside `TubesCursor.js` (its `setColors` API) | partial (`math/Lut.js` exists; too small to split) | no |
| App base (`BC`) | renderer/scene/camera/resize/visibility/loop/dispose | Scaffolding → **reuse pattern** | engine + showcase runtime pattern | **yes** (pattern) | no |
| Idle Lissajous + hero overlay + click-randomize | branded replica glue | Project-specific | `labs/tubes-cursor-lab/` (`local/`) | n/a | no |

- **Reuse-first result (step 5):** Reuse `pointer-raycast-force` (world target), `tsl/display/BloomNode.js`
  (bloom), and the engine/showcase runtime pattern (no `BC` port). Genuinely new: `Psrdnoise3D`,
  `TrailTubeGeometry`, `TubesCursor`. (Mirrors the `threejs-toys-swarm` precedent: same author, one
  canonical system module + one branded Lab.)
- **Direct asset harvest (step 6):** none — source is a minified bundle; all three new modules are ports.
- **Out of scope (discarded scaffolding):** `BC` app-base, the global pointer manager `eB…nB`, the pen's
  `randomColors` helper (re-implemented in the Lab), Three.js core itself.

---

## 3. Per-module build plan (one block per canonical module)

> Scaffold each first: `npm run new-module -w STUDIO -- <id> --category <category>`, then replace the
> generated runtime with the port and fill the `.meta.ts`. Registry types import from a `modules/<cat>/`
> file is `../../registry/types` (one folder under `modules/`).

### 3.1 `STUDIO/src/modules/math/Psrdnoise3D.js`  (untyped)
- **Ported from:** `REF/tubes1_effect.beautified.js` L78–181 (`PC`,`LC`,`IC`,`OC`,`VC`,`DC`,`UC`,`zC`,
  `kC`,`GC`,`WC`,`FC`,`UC.add`, scratch `HC`,`$C`,`jC`). Preserve the math **verbatim** (it is Stefan
  Gustavson's psrdnoise3 — periodic simplex noise with rotating gradients; the magic constants
  `3.883222077`, `0.996539792`, `0.006920415`, `0.108705628`, `39.5`, `0.3333333`, `0.16666666`, mod-289
  permute, `0.5 - dot` falloff must be copied exactly).
- **Public exports:**
  - `export function psrdnoise3(seed, period, alpha, out): number` — fills `out` (length-3) with the
    analytic **gradient** and returns the scalar noise value. `seed`=`[x,y,z]`, `period`=`[px,py,pz]`
    (0 ⇒ non-periodic axis), `alpha`=rotation angle of the gradients (drives the curl-like flow).
  - `export function curlOffset(seed, alpha, scale, out): out` — convenience wrapper matching the
    effect's use: `out = psrdnoise gradient` then scaled; equals the source's `PC(jC, HC, 2*r, $C)`
    pattern. (Optional; the effect can call `psrdnoise3` directly.)
  - Named helper functions stay **module-private** (not exported) unless trivially reusable.
- **Sections:** imports (none) → constants (the scratch `Float32Array(3)` and magic numbers) → private
  vector helpers (`dot`,`floor`,`fract`,`step`,`max`,`mod`,`mod289permute`,`sin`,`cos`,`sqrt`, the
  `vec4`/`add` shims) → `psrdnoise3` → `curlOffset` → exports.
- **Functions (signature · params · returns · side effects):**
  - `psrdnoise3(seed:number[3], period:number[3], alpha:number, out:number[3]): number` — params: seed=
    sample point, period=lattice periods, alpha=gradient rotation; returns scalar noise; side effect:
    writes gradient into `out`. Ports `PC` (L78–128).
  - private `dot(a,b)`,`floorv(a)`,`fractv(a)`,`stepv(a,b)`,`maxv(a,b)`,`modv(a,b)`,`permute(a)`,
    `sinv/cosv/sqrtv`,`vec4(a,b,c,d)`,`vec4.add(out,a,b)` — element-wise vector ops on plain arrays.
    Port `LC,IC,OC,VC,DC,FC,WC,kC,zC,GC,UC,UC.add` (L129–181) **verbatim** (rename to readable names but
    keep the math identical).
- **Render/hardware details:** pure CPU JS, no Three import, no GPU. No loop, no dispose needed.
- **`ArtinosModule` entry plan (`Psrdnoise3D.meta.ts`):**
  - `id: 'psrdnoise-3d'` (`=== schema.id`), `name: 'Psrdnoise 3D (Curl Noise)'`, `category: 'math'`.
  - `description`: "Periodic simplex noise with rotating gradients (Gustavson psrdnoise3) — returns the
    analytic gradient so you get cheap curl-style flow. CPU, plain-array API, renderer-agnostic. Use to
    animate trails, jitter particles, or drive any field that needs divergence-light noise."
  - `tags: ['math','noise','simplex','curl','psrdnoise','procedural','cpu']`.
  - `schema.parameters` (drive the **showcase**, not the core): `alpha` (number, 'Gradient Rotation',
    default 0, min 0, max 6.2832, step 0.01, group 'Noise'), `scale` (number, 'Sample Scale', default
    0.01, min 0.001, max 0.1, step 0.001, group 'Noise'), `speed` (number, 'Flow Speed', default 0.5,
    min 0, max 3, step 0.05, group 'Motion'), `amplitude` (number, 'Amplitude', default 1, min 0, max 4,
    step 0.05, group 'Display').
  - `dependencies: ['three']` (showcase only, for the visualization; the **core** has no deps — note this
    in `agentNotes`). `presets`: Calm `{alpha:0,scale:0.01,speed:0.3,amplitude:1}`, Turbulent
    `{alpha:3.14,scale:0.04,speed:1.5,amplitude:2}`. `related: ['trail-tube-geometry','tubes-cursor','tsl-noise']`.
  - `agentNotes`: "CPU psrdnoise3 (periodic simplex, rotating gradients). `psrdnoise3(seed[3],period[3],
    alpha,out[3]) → scalar` and writes the gradient into `out`; pass `period=[0,0,0]` for non-periodic.
    Core has **zero dependencies** (plain arrays). Ported verbatim from the minified
    `threejs-components@0.0.19/cursors/tubes1` bundle (de-minified `REF/tubes1_effect.beautified.js`
    L78–181), originally Stefan Gustavson psrdnoise. Bridge id 'psrdnoise-3d'."
  - `version: '0.1.0'`, `updatedAt: '2026-06-30'`.
- **Showcase (`Psrdnoise3D.showcase.tsx`):** bridge id `'psrdnoise-3d'`; a small Three (WebGL is fine)
  scene that displaces a plane's vertices (or animates a points grid) by `amplitude * psrdnoise3` with
  `alpha`/`scale`/`speed` from the bridge — proving the core **outside** the tubes domain. Canvas ref +
  `ResizeObserver` + `dispose()`; default OUTSIDE the selector (ADR-13).
- **Standalone-reuse proof:** the showcase animates a heightfield with no tubes/cursor — pure noise field.

### 3.2 `STUDIO/src/modules/geometries/TrailTubeGeometry.js`  (untyped)
- **Ported from:** `REF/tubes1_effect.beautified.js` L182–234 (`qC` mesh + `XC` geometry). Preserve the
  Frenet-frame rebuild and `sin(h·π)·radius` taper **verbatim**.
- **Public exports:**
  - `export class TrailTubeGeometry extends THREE.BufferGeometry` — ctor `(tubularSegments=64, radius=1,
    radialSegments=8)`; builds a CatmullRom curve (`THREE.CatmullRomCurve3`) of `tubularSegments+1`
    points laid along −z (`p.z = -i/seg*2`); allocates position+normal attributes; `update()` recomputes
    vertices via `curve.computeFrenetFrames` (ports `XC`).
  - `export class TrailTube extends THREE.Mesh` — ctor `({tubularSegments,radius,radialSegments,capSegments},
    material)`; holds `curve`, `points`, scratch `to`; `followTo(target, lerp=0.1, noiseAmount=0.05,
    time=0, noiseFn=psrdnoise3)` advances the head toward `target`+curl jitter then chains each point to
    the previous, and calls geometry `update()` (ports `qC`/`lerpTo`). `noiseFn` is **injected** (default
    imports `psrdnoise3` from `../math/Psrdnoise3D.js`) so the geometry module stays decoupled.
  - `export function createTrailTube(opts, material) → TrailTube` — convenience factory.
- **Sections:** imports (`three`, `psrdnoise3`) → constants (scratch `Float32Array(3)` `seed`,`grad`;
  scratch `THREE.Vector3`) → `TrailTubeGeometry` → `TrailTube` → `createTrailTube` → exports.
- **Functions (signature · params · returns · side effects):**
  - `TrailTubeGeometry#update(): void` — rebuilds position/normal from `curve` points using Frenet frames;
    radius at param `h=i/seg` is `sin(h·π)·radius` (rounded caps); sets `needsUpdate`. Ports L206–233.
  - `TrailTube#followTo(target: Vector3, lerp=0.1, noiseAmount=0.05, time=0, noiseFn=psrdnoise3): void` —
    seeds `seed=[0.01·target.x+0.04·time+timeDelta, 0.01·y+0.048·time+…, 0.01·z+0.06·time+…]`, calls
    `noiseFn(seed,[0,0,0], 2·time, grad)`, sets `to = target + noiseAmount·grad`, `points[0].lerp(to,lerp)`,
    then `points[i].lerp(points[i-1], lerp)`, then `geometry.update()`. Ports L189–195 (note the source
    `r` arg is `elapsed` time and `2*r` is the alpha; preserve those exact coefficients).
- **Render/hardware details:** plain `THREE.BufferGeometry`/`Mesh`; renderer-agnostic (WebGL or WebGPU).
  No own loop; the caller updates per frame. `dispose()` = standard `geometry.dispose()` (document that
  the mesh's material is owned by the caller).
- **`ArtinosModule` entry plan (`TrailTubeGeometry.meta.ts`):**
  - `id: 'trail-tube-geometry'`, `name: 'Trail Tube Geometry'`, `category: 'geometries'`.
  - `description`: "An updatable tube mesh that snakes toward a moving target: a CatmullRom spine of N
    points where the head lerps to the target (+ optional curl-noise jitter) and each point trails the
    one ahead, rebuilt every frame with Frenet frames and `sin`-tapered rounded caps. Renderer-agnostic
    (WebGL/WebGPU). Use for cursor trails, comet tails, worm/snake bodies, flow ribbons."
  - `tags: ['geometries','tube','trail','catmull-rom','frenet','curve','mesh','cursor']`.
  - `schema.parameters` (showcase): `radius` (num, default 0.5, min 0.02, max 2, step 0.01, 'Tube'),
    `tubularSegments` (num, default 64, min 8, max 256, step 1, 'Tube'), `radialSegments` (num, default 8,
    min 3, max 24, step 1, 'Tube'), `lerp` (num, default 0.4, min 0.02, max 1, step 0.01, 'Follow'),
    `noiseAmount` (num, default 0.2, min 0, max 2, step 0.01, 'Follow'), `color` (color, default '#53bc28',
    'Material').
  - `dependencies: ['three']`. `presets`: Whip `{radius:0.2,tubularSegments:96,lerp:0.5,noiseAmount:0.3}`,
    Fat `{radius:1.2,tubularSegments:48,lerp:0.25,noiseAmount:0.1}`. `related: ['psrdnoise-3d','tubes-cursor']`.
  - `agentNotes`: "`new TrailTube({tubularSegments,radius,radialSegments}, material)` → a `THREE.Mesh`;
    call `mesh.followTo(targetVec3, lerp, noiseAmount, timeSeconds)` each frame, then render. Curl jitter
    uses an injected `noiseFn` (defaults to `psrdnoise-3d`); pass your own to decouple. Geometry is a
    standalone `TrailTubeGeometry extends BufferGeometry` if you only want the tube. Caller owns the
    material. Ported verbatim from the de-minified `threejs-components` tubes1 bundle
    (`REF/tubes1_effect.beautified.js` L182–234). Bridge id 'trail-tube-geometry'."
  - `version: '0.1.0'`, `updatedAt: '2026-06-30'`.
- **Showcase (`TrailTubeGeometry.showcase.tsx`):** bridge id `'trail-tube-geometry'`; a single tube
  (WebGL `MeshStandardMaterial`) following an animated Lissajous target — **no cursor, no bloom, no
  pointer** — proving reuse outside the tubes-cursor domain. Standard canvas/RO/dispose.
- **Standalone-reuse proof:** one tube chasing a scripted target on a plain WebGL renderer.

### 3.3 `STUDIO/src/modules/effects/TubesCursor.js`  (untyped, WebGPU)
- **Ported from:** `REF/tubes1_effect.beautified.js` L235–311 (`YC` defaults + `QC` scene) and L365–409
  (`aB` defaults + `oB` factory). Preserve constants (count 16, radius .005–.05, segs 32–128, metalness 1
  / roughness .25, light intensity 200, light positions ±5/±5/5, lerp .5, noise .05, bloom 0/1.5/.5,
  sleep 300/150/1/2, camera z 5, pixelRatio 2, cameraMaxAspect 1.5) **verbatim**.
- **Public exports:**
  - `export function createTubesCursor(canvas, options) → handle`, where `handle = { update(params),
    resize(), setColors(colors[]), setLightsColors(colors[]), setLightsIntensity(n), randomizeColors(),
    dispose(), scene, renderer }`. Mirrors the source `oB` return (`{three, options, tubes, bloomPass,
    dispose}`) adapted to ARTINOS' handle shape.
- **Sections:** imports (`three/webgpu`, `bloom` from `tsl/display/BloomNode.js`, `pass`/`mrt`/`output`
  as needed from `three/tsl`, `createTrailTube`, the reused `createPointerRaycastForce`) → constants
  (`DEFAULTS` = merged `aB`+`YC`) → helpers (`buildColorGradient(colors) → getColorAt`, ports L273–295) →
  `createTubesCursor` (renderer/camera/scene, `initLights`, `initTubes`, bloom `PostProcessing` wiring,
  pointer target via `pointer-raycast-force`, `setAnimationLoop` with idle Lissajous + per-tube
  `followTo`) → return handle → exports.
- **Functions (signature · params · returns · side effects):**
  - `createTubesCursor(canvas: HTMLCanvasElement, options?: object): handle` — builds the full effect;
    side effects: creates a `WebGPURenderer` (`alpha:true, antialias:false`), 16 `TrailTube`s, 4
    `PointLight`s, a `PostProcessing` with `outputNode = scenePass.add(bloom(scenePass, strength, radius,
    threshold))`, a `pointer-raycast-force` on a camera-facing plane through origin, and starts
    `renderer.setAnimationLoop`. Ports `oB` (L372–408).
  - `initLights()` — 4 `PointLight`(color_i, intensity) at (±5,±5,5). Ports L254–261.
  - `initTubes()` — 16 `TrailTube`s with random radius/segments, `MeshStandardNodeMaterial({metalness:1,
    roughness:.25})`, then `setColors`. Ports L262–272.
  - `setColors(colors)` — build gradient, assign `tube.material.color` along it. Ports L273–295.
  - `setLightsColors(colors)` / `setLightsIntensity(n)` — ports L296–305.
  - `update(params)` — live-apply bridge params (colors, light intensity, bloom strength/radius/threshold,
    lerp, noise, paused). Maps bridge keys → setters.
  - `onBeforeRender(elapsed)` — if pointer active use its `.point` as `target`, else idle Lissajous
    (`target.x = sleepRadiusX·worldScale·cos(elapsed·ts1)`, `target.y = sleepRadiusY·worldScale·sin(
    elapsed·ts2)`), then each `tube.followTo(target, lerp, noise, elapsed)`. Ports L395–401 + `QC.update`.
  - `resize()` / `dispose()` — renderer setSize/pixelRatio; dispose tubes/lights/material/renderer +
    `pointer.dispose()`.
- **Render/hardware details:** `WebGPURenderer` from `three/webgpu`; `MeshStandardNodeMaterial`; TSL
  `PostProcessing` + reused `bloom()` node; `renderer.setAnimationLoop` (NOT rAF) so WebGPU async render
  is awaited; pixelRatio pinned to 2 (cap to `min(devicePixelRatio,2)` for safety on the showcase);
  camera z=5, `cameraMaxAspect 1.5`. Capability: if WebGPU unavailable, `WebGPURenderer` falls back to its
  WebGL2 backend; the `'webgpu'` dependency makes the Studio degrade notice fire.
- **`ArtinosModule` entry plan (`TubesCursor.meta.ts`):**
  - `id: 'tubes-cursor'`, `name: 'Tubes Cursor'`, `category: 'effects'`.
  - `description`: "A fullscreen field of neon tubes that snake toward the cursor, lit by colored point
    lights and bloomed — a drop-in animated background (WebGPU/TSL, WebGL2 fallback). Faithful port of
    Kevin Levron / soju22's 'Tubes Cursor'. Click-randomizable colors; idle Lissajous wander when the
    pointer is away."
  - `tags: ['effects','webgpu','tsl','bloom','cursor','tubes','background','neon','pointer']`.
  - `schema.parameters` (grouped): `tubeColorA/B/C` (color, defaults '#f967fb','#53bc28','#6958d5',
    'Tubes'); `lightColor1..4` (color, defaults '#83f36e','#fe8a2e','#ff008a','#60aed5', 'Lights');
    `lightIntensity` (num, default 200, min 0, max 600, step 5, 'Lights'); `lerp` (num, default 0.5, min
    0.05, max 1, step 0.01, 'Motion'); `noise` (num, default 0.05, min 0, max 0.5, step 0.01, 'Motion');
    `bloomStrength` (num, default 1.5, min 0, max 4, step 0.05, 'Post FX'); `bloomRadius` (num, default
    0.5, min 0, max 1, step 0.01, 'Post FX'); `bloomThreshold` (num, default 0, min 0, max 1, step 0.01,
    'Post FX'); `paused` (boolean, default false, 'Motion').
  - `dependencies: ['three','webgpu']`. `presets`: `CodePen Original` (the pen's exact colors/bloom),
    `Acid` (greens), `Synthwave` (magenta/cyan). `related: ['trail-tube-geometry','psrdnoise-3d',
    'pointer-raycast-force','tubes-cursor-lab']`.
  - `agentNotes`: "`createTubesCursor(canvas, options) → { update, resize, setColors, setLightsColors,
    setLightsIntensity, randomizeColors, dispose }`. Composes `trail-tube-geometry` (16 tubes) +
    `psrdnoise-3d` (curl jitter) + 4 `PointLight`s + a CPU color gradient + reused `pointer-raycast-force`
    (cursor→plane target) + reused `tsl/display/BloomNode` (`bloom()`), on a `WebGPURenderer`
    (`setAnimationLoop`). Needs `'webgpu'`. Faithful port of `threejs-components@0.0.19/cursors/tubes1`
    (de-minified `REF/tubes1_effect.beautified.js` L235–409); the source `BC` app-base and bespoke pointer
    tracker were replaced by the ARTINOS runtime pattern and `pointer-raycast-force`. Bridge id 'tubes-cursor'."
  - `version: '0.1.0'`, `updatedAt: '2026-06-30'`.
- **Showcase (`TubesCursor.showcase.tsx`):** bridge id `'tubes-cursor'`; mounts `createTubesCursor`,
  drives colors/bloom/lerp/noise/paused from the bridge; canvas/RO/dispose; default OUTSIDE the selector.
- **Standalone-reuse proof:** it IS the reusable effect; the showcase runs it bare (no hero overlay),
  proving it stands apart from the branded Lab.

---

## 4. Mode B — Lab capsule plan

- **Lab id / path:** `STUDIO/src/labs/tubes-cursor-lab/` (id `tubes-cursor-lab`, distinct from the
  `tubes-cursor` module id).
- **Files:**
  - `TubesCursorLab.tsx` — branded replica: full-bleed `<canvas>` + centered hero (`<h1>TUBES</h1>
    <h2>CURSOR</h2>` uppercase, white, `text-shadow:0 0 20px #000`, Montserrat) + Framer credit link;
    `onClick` → `engine.randomizeColors()` and reflect swatches; bridge id `'tubes-cursor-lab'`. Mirror
    `ThreejsToysSwarmLab.tsx` exactly (canvas ref, `ResizeObserver`, `update(values)` effect).
  - `TubesCursorLab.meta.ts` — `ArtinosModule`, `category: 'lab'`, tags include `['lab','replica',
    'composition','webgpu','tsl','tubes','cursor','threejs-components','codepen']`; schema = the effect
    params + a `preset` enum (`CodePen Original`/`Acid`/`Synthwave`); `related: ['tubes-cursor',
    'trail-tube-geometry','psrdnoise-3d','pointer-raycast-force']`; `sourcePath` →
    `STUDIO/src/labs/tubes-cursor-lab/createTubesCursorLab.js`; full provenance `agentNotes` (cite the pen
    URL + the sponsors-only/minified-source situation). Mirror `ThreejsToysSwarmLab.meta.ts`.
  - `createTubesCursorLab.js` — composition: import the **snapshot** `createTubesCursor` from
    `./modules/effects/TubesCursor.js`, merge `DEFAULTS` + resolved preset + options, expose `update`,
    `resize`, `randomizeColors` (random 3 tube + 4 light colors, like the pen's `randomColors`), `dispose`.
    Mirror `createThreejsToysSwarmLab.js`.
- **Composition wiring:** reproduce the pen's init exactly — `createTubesCursor(canvas, { tubes:{ colors:[
  '#f967fb','#53bc28','#6958d5'], lights:{ intensity:200, colors:['#83f36e','#fe8a2e','#ff008a',
  '#60aed5'] } } })`; click → `setColors(random3)` + `setLightsColors(random4)`; idle Lissajous + bloom
  come from the effect defaults.
- **Snapshots into `labs/tubes-cursor-lab/modules/`** (so the Lab is portable; record provenance const in
  each):
  - `modules/math/Psrdnoise3D.js` ← `STUDIO/src/modules/math/Psrdnoise3D.js`.
  - `modules/geometries/TrailTubeGeometry.js` ← canonical.
  - `modules/effects/TubesCursor.js` ← canonical (its imports rewritten to the snapshot-relative paths +
    the reused `pointer-raycast-force`/`BloomNode` snapshots).
  - `modules/input/PointerRaycastForce.module.js` ← `STUDIO/src/modules/input/PointerRaycastForce.module.js`.
  - `modules/tsl/display/BloomNode.js` ← `STUDIO/src/modules/tsl/display/BloomNode.js` (+ any node deps it
    imports — copy transitively or import from `three/addons` if that path resolves; prefer the snapshot).
  - Each snapshot exports `moduleProvenance = { canonicalSource, copiedFor:'STUDIO/src/labs/tubes-cursor-lab',
    version:'0.1.0', syncStatus:'snapshot' }`.
- **`local/` project-specific files:**
  - `local/presets/TubesCursorPresets.ts` — `CodePen Original` / `Acid` / `Synthwave` → param maps;
    `resolveTubesCursorPreset(name)`.
  - `local/composition/TubesCursorComposition.ts` — the exact pen init options (the documented original
    tuning) as a constant.
  - `local/interaction/TubesCursorInteraction.ts` — `randomColors(count)` + the click handler contract.
  - `local/tuning/provenance.ts` — pen URL, package `threejs-components@0.0.19`, license note
    (CC BY-NC-SA 4.0 from the pen header — **non-commercial**; record it), the deviations list.
- **Showcase dashboard controls/presets:** the effect's params (tube/light colors, intensity, lerp,
  noise, bloom 3, paused) + the `preset` enum; named presets above.

> **License note (must surface in the report):** the pen header declares **CC BY-NC-SA 4.0**
> (attribution, non-commercial, share-alike). Record attribution to Kevin Levron / soju22 in the Lab
> provenance and `agentNotes`; flag the non-commercial restriction for any downstream use.

---

## 5. Ordered task checklist (steps 8–11)

- [ ] **T-1 — `Psrdnoise3D` core.** files: `modules/math/Psrdnoise3D.js`. mirror: plain-JS math module
  (no Three). out-of-scope: showcase/meta. acceptance: `node -e "const {psrdnoise3}=require('...')"`-style
  smoke (or a temporary import) returns a finite number and writes a 3-vector; values match a few sampled
  points from the source `PC`.
- [ ] **T-2 — `Psrdnoise3D` showcase + meta.** files: `Psrdnoise3D.showcase.tsx`, `Psrdnoise3D.meta.ts`.
  mirror: `TslGridSampling.showcase.tsx`/`.meta.ts` shape. acceptance: appears in
  `npm run check-registry -w STUDIO`; preview animates a noise heightfield, zero console errors.
- [ ] **T-3 — `TrailTubeGeometry` core.** files: `modules/geometries/TrailTubeGeometry.js`. mirror: source
  L182–234; inject `psrdnoise3`. out-of-scope: effect/lights/bloom. acceptance: a temporary scene shows
  one tube following a moving target without errors.
- [ ] **T-4 — `TrailTubeGeometry` showcase + meta.** files: `.showcase.tsx`, `.meta.ts`. acceptance:
  check-registry green; preview shows one tube chasing a Lissajous target (WebGL), zero console errors.
- [ ] **T-5 — `TubesCursor` effect core.** files: `modules/effects/TubesCursor.js`. mirror: source
  L235–409; reuse `createPointerRaycastForce` + `bloom` (`BloomNode.js`). depends-on: T-1,T-3. acceptance:
  preview (T-6) renders 16 bloomed tubes following the cursor on `WebGPURenderer`, zero console errors.
- [ ] **T-6 — `TubesCursor` showcase + meta.** files: `.showcase.tsx`, `.meta.ts` (deps incl. `'webgpu'`).
  acceptance: check-registry green; bridge controls drive colors/bloom/lerp/noise live; click-randomize
  works; zero console errors; side-by-side matches the pen.
- [ ] **T-7 — Lab capsule.** files: `labs/tubes-cursor-lab/{TubesCursorLab.tsx,TubesCursorLab.meta.ts,
  createTubesCursorLab.js}` + `local/{presets,composition,interaction,tuning}/…`. mirror: `threejs-toys-swarm`.
  depends-on: T-5. acceptance: Lab preview shows the branded replica (hero text + click-randomize), zero
  console errors.
- [ ] **T-8 — Isolation snapshots.** files: `labs/tubes-cursor-lab/modules/{math,geometries,effects,input,
  tsl/display}/…` + `moduleProvenance` in each; rewrite the Lab composition to import the snapshots.
  acceptance: removing/renaming the canonical `modules/` copies does not break the Lab build (snapshots
  are self-sufficient); check-registry green.
- [ ] **T-9 — Gate + report.** acceptance: `npm run check-registry -w STUDIO` green (reports the 3 new
  modules + 1 Lab), `npm run lint -w STUDIO` clean, all 4 previews live with zero console errors, fidelity
  note written, conversion report (PASS/BLOCKED/NEEDS HUMAN DECISION) delivered with the license flag.

---

## 6. Fidelity, deviations & validation

- **Preserved verbatim:** the psrdnoise math + magic constants; the Frenet-frame tube rebuild + `sin(h·π)`
  taper; the trail lerp-chain coefficients (`0.01/0.04/0.048/0.06`, `2·elapsed` alpha, `timeDelta`
  per-tube random offset); tube count 16, radius .005–.05, segs 32–128, material metalness 1 / roughness
  .25; 4 point lights at ±5/±5/5 intensity 200; gradient color assignment; bloom 0/1.5/.5; idle Lissajous
  300/150/1/2; camera z 5, cameraMaxAspect 1.5, pixelRatio 2; pen colors; click-randomize; hero overlay
  text/typography/credit link.
- **Planned deviations (with reason):**
  1. **App-base `BC` not ported** → replaced by the ARTINOS engine/showcase runtime pattern (camera/loop/
     resize/dispose). Reason: reuse-first; the runtime + `ResizeObserver` already provide this. Behavior
     preserved (pause-when-hidden is provided by the showcase lifecycle, not a per-module
     IntersectionObserver).
  2. **Bespoke pointer tracker (`eB…nB`) + raycaster not ported** → replaced by reused
     `pointer-raycast-force` (`.read().point`). Reason: reuse-first; identical pointer→plane→world-point
     contract.
  3. **Bloom** uses the existing `tsl/display/BloomNode.js` rather than a re-bundled copy. Reason: it is
     the same TSL `bloom()` node the source uses.
  4. **CPU color-gradient** kept inline in `TubesCursor` (not a separate module). Reason: ~15 lines, tightly
     coupled to the effect's `setColors` public API; splitting would be over-decomposition (step 8).
- **Validation (DoD):** `npm run check-registry -w STUDIO` (green; 3 modules + 1 Lab) · `npm run lint -w
  STUDIO` (tsc clean) · live preview for each of the 4 entries with a control driving it · zero console
  errors · side-by-side fidelity vs the pen (tube count, snake-to-cursor, bloom glow, idle wander,
  click-randomize). Report must surface the **CC BY-NC-SA 4.0 / non-commercial** license.
```
