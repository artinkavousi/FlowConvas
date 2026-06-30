# Conversion Plan - sphere-packing

> Step 7 artifact. Save as `docs/conversions/sphere-packing-conversion-plan.md`.
> Spec: [`blueprinting.md`](../blueprinting.md). Pipeline:
> [`converter-pipeline.md`](../converter-pipeline.md). Contract:
> [`module-and-lab-standards.md`](../module-and-lab-standards.md).
>
> Conversion id: `sphere-packing` - Mode: B - Author/model: Codex - Date (UTC): 2026-06-30

---

## 0. Overview (at a glance)

**What:** `REF/sphere-packing` is a CodePen-style fullscreen "Sphere Packing" hero: a fixed WebGL canvas
renders colliding translucent spheres behind centered uppercase text, with bottom controls for gravity
toggle and random colors. Mode B. Status: blueprint only, ready for implementation.

**Decomposed modules (canonical library):**

| Kind | Module (clean name, no `.module` infix) | Category | Status |
|---|---|---|---|
| universal | `SpherePackingPhysics` | `physics/particles` | planned |
| universal | `TranslucentScatteringMaterial` | `shaders` | planned |
| domain | `SpherePackingBackground` | `physics/particles` | planned |

**Reuse (extend existing - do NOT duplicate):** `pointer-raycast-force` (canvas pointer -> camera ray ->
interaction-plane hit), `webgpu-bloom-composer` only as future optional upgrade, `universal-physics-particles`
as a conceptual reference only (rigid-body adapter based; does not cover this source's CPU O(n^2)
packing), `threejs-toys-swarm` as the closest CodePen/soju22 Lab shape to mirror.

**Direct copy (harvest near-verbatim from the source):** `SpherePackingPhysics` from
`npm:threejs-components@0.0.17/build/backgrounds/spheres1.cdn.min.js` class `W`; `TranslucentScatteringMaterial`
from class `Y`; `SpherePackingBackground` from class `Z` and exported factory `q`; Lab overlay copy from
`REF/sphere-packing/src/index.html`, `style.css`, and `script.js`.

**Lab (Mode B):** `STUDIO/src/labs/sphere-packing/` - faithful React Lab with centered "Sphere Packing"
overlay, gravity/random-color controls, canonical module snapshots, local presets/composition metadata,
and source-provenance notes.

---

## 1. Source & deep analysis (steps 1-2)

- **Input type / source paths:**
  - `REF/sphere-packing/src/index.html` - original DOM structure: `#app`, `.hero`, two headings, bottom
    buttons, Framer link, `#webgl-canvas`.
  - `REF/sphere-packing/src/style.css` - original radial white-to-gray background, fixed canvas,
    uppercase black headings with white glow, bottom button row.
  - `REF/sphere-packing/src/script.js` - original init and interactions.
  - `REF/sphere-packing/README.md` - CodePen origin URL: `https://codepen.io/soju22/pen/qBezBeo`.
  - `REF/sphere-packing/LICENSE.txt` - MIT license text for the copied CodePen folder.
  - `npm:threejs-components@0.0.17/build/backgrounds/spheres1.cdn.min.js` - shipped background engine
    imported by the source via CDN.
  - `npm:threejs-components@0.0.17/framer/Spheres1BackgroundApp.js` - unminified wrapper documenting
    the background's adjustable props and defaults.
- **Original pipeline:** Three.js WebGL (`three@0.170.0` CDN ESM), CPU sphere-packing physics, WebGL
  `InstancedMesh`, `MeshPhysicalMaterial` with `onBeforeCompile` shader injection, RoomEnvironment PMREM,
  requestAnimationFrame loop.
- **What it does:** The page creates `Spheres1Background(canvas, { count: 300, minSize: 0.3, maxSize: 1,
  gravity: 0.5 })`. The engine scatters spheres in a bounded volume, applies gravity/friction/velocity
  clamp, resolves pairwise sphere overlaps, bounces against responsive bounds, and optionally treats the
  pointer-plane hit as a controlled lead sphere. An instanced sphere mesh updates every frame. The first
  sphere doubles as a point light carrier. The UI can toggle gravity between `0` and `1`, and randomize
  the three-color ramp.
- **Files read (the real source):**
  - `REF/sphere-packing/src/script.js` - `Spheres1Background` CDN import, options, button handlers.
  - `REF/sphere-packing/src/style.css` - exact layout, typography, color, fixed-canvas style.
  - `REF/sphere-packing/src/index.html` - source overlay and controls.
  - `REF/sphere-packing/README.md` - original CodePen provenance.
  - `REF/sphere-packing/LICENSE.txt` - local license text.
  - `threejs-components@0.0.17/package.json` - package provenance and dependency versions.
  - `threejs-components@0.0.17/framer/Spheres1BackgroundApp.js` - public prop surface.
  - `threejs-components@0.0.17/build/backgrounds/spheres1.cdn.min.js` - actual runtime logic.
- **All major systems found:** render lifecycle, camera/world-size fitting, CPU sphere packing physics,
  instanced sphere rendering, translucent material shader injection, RoomEnvironment PMREM lighting,
  pointer raycast to z-plane, color ramp, responsive bounds, hero overlay UI, two source controls,
  package/CDN scaffolding to discard.

### TSL-triage decision (step 2 Pipeline Rule)

- **Decision:** Port on the original Three.js WebGL pipeline for this conversion.
- **Reason:** The source's identity depends on WebGL `MeshPhysicalMaterial` plus `onBeforeCompile`
  scattering injection, RoomEnvironment PMREM, and a CPU O(n^2) collision solver whose behavior should be
  copied directly. A WebGPU/TSL rewrite would be a new rendering/physics interpretation rather than a
  direct port. Record this as a deliberate TSL deferral. A later module can translate the packing solver
  to a WebGPU compute field if performance reuse demands it.
- **Operator rewrites needed:** None in the planned source-fidelity port. If a future WebGPU/TSL port is
  added, rewrite arithmetic into method chains because STUDIO has no TSL operator plugin.

---

## 2. Decomposition & scope map (steps 3-6)

| System | Generalized form | Classification | Lands in | Reuse-first hit? | Harvest-by-copy? |
|---|---|---|---|---|---|
| CPU sphere overlap solver | Array-backed sphere position/velocity/size solver with bounds, gravity, friction, wall bounce, controlled lead sphere | Core Universal | `STUDIO/src/modules/physics/particles/SpherePackingPhysics.module.js` | New; `universal-physics-particles` is rigid-body/adapter based and not equivalent | Yes, from minified class `W` |
| Translucent physical material | Reusable `MeshPhysicalMaterial` subclass/injection for direct-light thickness scattering | Core Universal | `STUDIO/src/modules/shaders/TranslucentScatteringMaterial.module.js` | New | Yes, from minified class `Y` |
| WebGL sphere background | Scene/camera/renderer/instanced mesh composition using the physics and material | Domain reusable | `STUDIO/src/modules/physics/particles/SpherePackingBackground.module.js` | New; mirror `TslWebgpuSwarmParticles` entry style | Yes, from minified class `Z` and factory `q` |
| Pointer interaction | Canvas pointer -> NDC -> ray -> plane point; enables controlled first sphere | Reused universal input | Existing `STUDIO/src/modules/input/PointerRaycastForce.module.js`; snapshot in Lab | `pointer-raycast-force` covers this | No new canonical module |
| Color ramp | N-color interpolation across instanced colors; first color drives point light | Local helper inside `SpherePackingBackground.module.js` unless reused later | Same file as background | Existing TSL color modules are shader-side, not needed | Yes, from `setColors` helper |
| Hero overlay and buttons | Faithful source page identity | Project-specific Lab composition | `STUDIO/src/labs/sphere-packing/SpherePackingLab.tsx` | New Lab | Yes, from `index.html`, `style.css`, `script.js` |
| CDN/module import shell | Demo scaffolding | Discard | None | Not needed | No |

- **Reuse-first result (step 5):** `npm run check-registry -w STUDIO` passed with 73 registered modules.
  Existing modules provide adjacent patterns but not this exact CPU packed-sphere background. Reuse
  `pointer-raycast-force` for interaction. Do not duplicate `universal-physics-particles`; it remains a
  separate rigid-body adapter system. Use `threejs-toys-swarm` and `ball-pool` Lab metadata shapes as
  Mode B references.
- **Direct asset harvest (step 6):** The actual engine is a minified shipped bundle, not readable source.
  Implementation should de-minify into owned ARTINOS modules while preserving constants, method names
  where meaningful, and algorithm order. Keep provenance in `agentNotes`.
- **Out of scope (discarded scaffolding):** CDN imports, CodePen/Framer wrapper runtime, external Framer
  link as an interactive app dependency, global `document.getElementById` wiring, package install of
  `threejs-components`.
- **License risk:** `REF/sphere-packing/src/script.js` comments mention `CC BY-NC-SA 4.0`, the local
  `LICENSE.txt` is MIT, and `threejs-components@0.0.17` package metadata is ISC. Implementation must keep
  attribution and flag the conflict in `agentNotes`/deviations. If ARTINOS commercial distribution is in
  scope, this needs a human license decision before shipping beyond local/internal use.

---

## 3. Per-module build plan

### `STUDIO/src/modules/physics/particles/SpherePackingPhysics.module.js`

- **Ported from:** `threejs-components@0.0.17/build/backgrounds/spheres1.cdn.min.js` line 1, minified
  class `W` and constants around `MathUtils.randFloat`, `MathUtils.randFloatSpread`, and scratch
  `Vector3`s. Preserve the update order: controlled sphere handling -> gravity/friction/velocity clamp
  -> pairwise separation -> controlled-sphere collision -> wall/bottom bounds.
- **Public exports:**
  - `spherePackingPhysicsDefaults`
  - `class SpherePackingPhysics`
  - `createSpherePackingPhysics(config = {})`
- **Sections:** imports -> defaults -> scratch vectors -> class -> factory -> exports -> usage notes.
- **Functions (signature - params - returns - side effects):**
  - `constructor(config?: object): SpherePackingPhysics` - merges defaults, allocates
    `positionData: Float32Array`, `velocityData: Float32Array`, `sizeData: Float32Array`, `center:
    THREE.Vector3`; calls `resetPositions()` and `setSizes()`.
  - `resetPositions(): void` - ports `#R()`; writes sphere 0 at `center`, scatters remaining spheres in
    `[-2*maxX, 2*maxX]`, `[-2*maxY, 2*maxY]`, `[-2*maxZ, 2*maxZ]`; no return.
  - `setSizes(): void` - ports `setSizes()`; sets index 0 to `size0`; randomizes all other radii between
    `minSize` and `maxSize`; no return.
  - `setBounds(maxX: number, maxY: number, maxZ?: number): void` - updates responsive bounds; no return.
  - `setCenter(center: THREE.Vector3 | [number, number, number]): void` - copies pointer-controlled
    center; no return.
  - `setControlled(enabled: boolean): void` - mirrors `config.controlSphere0`; no return.
  - `update(frame: { delta: number; elapsed?: number }): void` - ports `update(e)`; mutates positions and
    velocities in place.
  - `resize(count: number): void` - reallocates arrays when count changes; preserves defaults and resets.
  - `getStats(): { count: number; activeCount: number; maxSpeed: number; bounds: { x: number; y: number; z: number } }`
    - derives lightweight telemetry for the showcase/Inspector.
- **Render/hardware details:** No renderer. CPU simulation, O(n^2) pairwise collision. The source count is
  300; schema max should cap at 800 or 1000 with clear performance warning. Uses `three` `Vector3` for
  fidelity and lower implementation risk.
- **`ArtinosModule` entry plan (`SpherePackingPhysics.meta.ts`):**
  - `id`: `sphere-packing-physics`; `schema.id`: `sphere-packing-physics`.
  - `name`: `Sphere Packing Physics`; `category`: `physics/particles`.
  - `description`: CPU packed-sphere solver extracted from threejs-components Spheres1.
  - `tags`: `['physics','particles','sphere-packing','collision','cpu','three','codepen']`.
  - `schema.parameters`: `count` number default 300 min 10 max 1000 step 10; `minSize` default 0.3
    min 0.1 max 1 step 0.05; `maxSize` default 1 min 0.2 max 2 step 0.05; `size0` default 1 min 0.1 max 2
    step 0.05; `gravity` default 0.5 min 0 max 2 step 0.01; `friction` default 0.9975 min 0.9 max 1
    step 0.0005; `wallBounce` default 0.95 min 0 max 1 step 0.01; `maxVelocity` default 0.15 min 0.01
    max 1 step 0.01.
  - `dependencies`: `['three','react']`.
  - `presets`: `CodePen Original`, `Zero Gravity`, `Dense Slow`.
  - `related`: `['sphere-packing-background','particle-boundaries','universal-physics-particles']`.
  - `agentNotes`: "CPU O(n^2) packed-sphere solver ported from threejs-components@0.0.17 Spheres1
    minified class W. It owns arrays only; rendering and pointer raycasts live outside. Use
    setBounds/setCenter/setControlled/update, then read positionData/sizeData."
- **Showcase (`SpherePackingPhysics.showcase.tsx`):** simple canvas/SVG or Three points view that runs the
  solver outside the CodePen hero: display circles or small spheres in a neutral ARTINOS stage, bridge
  values defaulted outside selector, `ResizeObserver`, `dispose()` for any animation loop.
- **Standalone-reuse proof:** The physics showcase must not render the source hero overlay. It proves the
  solver can drive any particle renderer.

### `STUDIO/src/modules/shaders/TranslucentScatteringMaterial.module.js`

- **Ported from:** `threejs-components@0.0.17/build/backgrounds/spheres1.cdn.min.js` line 1, minified
  class `Y extends MeshPhysicalMaterial`.
- **Public exports:**
  - `translucentScatteringDefaults`
  - `class TranslucentScatteringMaterial extends THREE.MeshPhysicalMaterial`
  - `createTranslucentScatteringMaterial(params = {})`
- **Sections:** imports -> defaults -> class -> factory -> exports -> shader notes.
- **Functions (signature - params - returns - side effects):**
  - `constructor(params?: object): TranslucentScatteringMaterial` - creates uniforms
    `thicknessDistortion`, `thicknessAmbient`, `thicknessAttenuation`, `thicknessPower`,
    `thicknessScale`; sets `defines.USE_UV = ''`; installs `onBeforeCompile`.
  - `applyScatteringShader(shader: THREE.Shader): void` - implemented as a named helper instead of a
    long anonymous callback; injects uniform declarations, `RE_Direct_Scattering`, and replacement for
    `#include <lights_fragment_begin>`; ports the source string replacement directly.
  - `updateScattering(params: object): void` - updates uniform values and material params; no return.
  - `dispose(): void` - calls parent dispose; no extra GPU resources.
- **Render/hardware details:** WebGL material injection only. Compatible with STUDIO `three@0.185.0` only
  after confirming `ShaderChunk.lights_fragment_begin` still contains the replaced direct-light call.
  If the exact string changed, implementation must adapt with the smallest equivalent replacement and
  document it as a deviation.
- **`ArtinosModule` entry plan (`TranslucentScatteringMaterial.meta.ts`):**
  - `id`: `translucent-scattering-material`; `schema.id`: same.
  - `category`: `shaders`.
  - `schema.parameters`: `thicknessDistortion` default 0.1 min 0 max 1 step 0.01;
    `thicknessAmbient` default 0 min 0 max 2 step 0.01; `thicknessAttenuation` default 0.1 min 0 max 2
    step 0.01; `thicknessPower` default 2 min 0.25 max 8 step 0.05; `thicknessScale` default 10 min 0
    max 30 step 0.1; `metalness`, `roughness`, `clearcoat`, `clearcoatRoughness`.
  - `dependencies`: `['three','react']`.
  - `related`: `['sphere-packing-background']`.
  - `agentNotes`: record source class `Y`, shader injection, WebGL-only status, and `three@0.185.0`
    string-replacement caveat.
- **Showcase (`TranslucentScatteringMaterial.showcase.tsx`):** one rotating sphere and one point light,
  no sphere-packing physics. Controls update uniforms live. Zero source hero overlay.
- **Standalone-reuse proof:** Demonstrates the material on a single primitive with direct lighting, usable
  for glassy blobs, bubbles, or translucent UI objects.

### `STUDIO/src/modules/physics/particles/SpherePackingBackground.module.js`

- **Ported from:** `threejs-components@0.0.17/build/backgrounds/spheres1.cdn.min.js` line 1, minified
  class `Z extends InstancedMesh`, factory `q`, color-ramp helper inside `setColors`, and source
  `REF/sphere-packing/src/script.js` initial options.
- **Public exports:**
  - `spherePackingBackgroundDefaults`
  - `createSpherePackingBackground(canvas: HTMLCanvasElement, options?: object): SpherePackingBackgroundHandle`
  - `randomSpherePackingColors(): [string, string, string]`
  - Type-like JSDoc typedef `SpherePackingBackgroundHandle`
- **Sections:** imports -> defaults -> helpers (`normalizeColor`, `createColorRamp`,
  `randomSpherePackingColors`) -> `SpherePackingSpheres extends THREE.InstancedMesh` -> factory -> exports.
- **Functions (signature - params - returns - side effects):**
  - `createColorRamp(colors: Array<string | number>): { getColorAt(t: number, target?: THREE.Color): THREE.Color }`
    - ports source color interpolation; effects: none except target mutation.
  - `randomSpherePackingColors(): [string, string, string]` - returns three random hex strings; mirrors
    source `0xffffff * Math.random()` with valid color strings.
  - `class SpherePackingSpheres extends THREE.InstancedMesh` constructor
    `(renderer: THREE.WebGLRenderer, config?: object)` - creates `SphereGeometry`, PMREM
    `RoomEnvironment`, `TranslucentScatteringMaterial`, `SpherePackingPhysics`, ambient light, point
    light, and initial colors.
  - `SpherePackingSpheres.setColors(colors: Array<string | number>): void` - ports source; updates
    `instanceColor.needsUpdate`; first ramp color drives point light.
  - `SpherePackingSpheres.update(frame: { delta: number; elapsed?: number }): void` - updates physics,
    instance matrices, point light position; no return.
  - `SpherePackingSpheres.dispose(): void` - disposes geometry, material, PMREM texture/environment
    texture, lights via parent clear path if needed.
  - `createSpherePackingBackground(canvas, options): SpherePackingBackgroundHandle` - creates
    `WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })`,
    `Scene`, `PerspectiveCamera` at `(0,0,20)`, `ACESFilmicToneMapping`, `SpherePackingSpheres`, and
    `PointerRaycastForce` on a z-plane. Starts rAF loop. On resize, derives `maxX = worldWidth / 2`,
    `maxY = worldHeight / 2`, `maxZ` from options/default 2, matching source factory `q`.
  - Handle methods:
    - `update(params: object): void` - applies bridge values; if `count` changes, rebuilds spheres;
      updates material, gravity/friction/bounds/colors, pause state.
    - `setCount(count: number): void` - rebuilds mesh like source `setCount(e)`.
    - `setColors(colors: Array<string | number>): void`.
    - `randomizeColors(): [string, string, string]` - sets and returns colors.
    - `toggleGravity(): number` - switches gravity between `0` and `1`, matching the source button.
    - `togglePause(): boolean`.
    - `resize(): void`.
    - `getStats(): { fps?: number; count: number; pixelRatio: number; gravity: number; maxSpeed: number }`.
    - `dispose(): void` - cancels rAF, disposes pointer, mesh, scene resources, renderer.
- **Render/hardware details:** WebGLRenderer, not WebGPU. Use rAF and `THREE.Clock` like source. Pixel ratio
  capped by schema (`pixelRatio` default 1.5) to keep 300-1000 CPU pair collisions usable. Use
  container sizing with `ResizeObserver`, not `window.innerWidth`, inside the showcase/Lab.
- **`ArtinosModule` entry plan (`SpherePackingBackground.meta.ts`):**
  - `id`: `sphere-packing-background`; `schema.id`: same.
  - `name`: `Sphere Packing Background`; `category`: `physics/particles`.
  - `description`: WebGL packed translucent sphere background ported from Kevin Levron/soju22 CodePen
    and threejs-components Spheres1.
  - `tags`: `['three','webgl','particles','sphere-packing','instancing','hero','background','codepen']`.
  - `schema.parameters`: `preset` enum (`codepen-original`, `zero-gravity`, `dense-glass`,
    `performance`); `count` default 300; `minSize` 0.3; `maxSize` 1; `size0` 1; `gravity` 0.5;
    `friction` 0.9975; `wallBounce` 0.95; `maxVelocity` 0.15; `colorA`, `colorB`, `colorC`;
    `ambientIntensity` 1; `lightIntensity` 200; material scattering params; `pixelRatio` 1.5; `paused`.
  - `dependencies`: `['three','react','@artinos/panelflow']`.
  - `presets`: `CodePen Original` `{ count: 300, minSize: 0.3, maxSize: 1, gravity: 0.5 }`,
    `Zero Gravity`, `Dense Glass`, `Performance`.
  - `related`: `['sphere-packing-physics','translucent-scattering-material','pointer-raycast-force']`.
  - `agentNotes`: include handle API, WebGL status, provenance, source constants, and license caveat.
- **Showcase (`SpherePackingBackground.showcase.tsx`):** bridge id `sphere-packing-background`; canvas ref;
  `ResizeObserver`; defaults outside selector; update engine on value changes; overlay minimal telemetry
  only if existing showcase pattern allows. The showcase demonstrates it as a reusable background without
  the CodePen "Sphere Packing" text.
- **Standalone-reuse proof:** A blank ARTINOS preview with bridge controls proves the background can be
  used behind any hero/layout, not only this source page.

---

## 4. Mode B - Lab capsule plan

- **Lab id / path:** `STUDIO/src/labs/sphere-packing/`
- **Files:**
  - `SpherePackingLab.tsx` - React Lab preserving the source overlay and bottom controls.
  - `SpherePackingLab.meta.ts` - `ArtinosModule` entry for the faithful Lab.
  - `createSpherePackingLab.js` - composition wrapper around the canonical/snapshot background module.
  - `local/presets/SpherePackingPresets.ts` - CodePen, Zero Gravity, Dense Glass, Performance presets.
  - `local/composition/spherePackingComposition.ts` - related module ids and provenance strings.
  - `modules/physics/particles/SpherePackingPhysics.module.js` - snapshot.
  - `modules/physics/particles/SpherePackingBackground.module.js` - snapshot.
  - `modules/shaders/TranslucentScatteringMaterial.module.js` - snapshot.
  - `modules/input/PointerRaycastForce.module.js` - snapshot of existing input module for portability.
- **Composition (`createSpherePackingLab.js`):**
  - Import the Lab snapshot `createSpherePackingBackground`.
  - `createSpherePackingLab(canvas, options = {})` applies `SPHERE_PACKING_PRESETS[options.preset]`,
    creates the background, exposes `update`, `resize`, `toggleGravity`, `randomizeColors`, `dispose`,
    and `getStats`.
  - Preserve source button semantics: gravity button toggles `bg.spheres.config.gravity` between `0` and
    `1`; random colors button calls `setColors` with three random colors.
- **Snapshots into `labs/sphere-packing/modules/`:**
  - `physics/particles/SpherePackingPhysics.module.js` - canonical source
    `STUDIO/src/modules/physics/particles/SpherePackingPhysics.module.js`, copied for Lab portability,
    `syncStatus: 'snapshot'`.
  - `physics/particles/SpherePackingBackground.module.js` - canonical source
    `STUDIO/src/modules/physics/particles/SpherePackingBackground.module.js`, copied for Lab portability.
  - `shaders/TranslucentScatteringMaterial.module.js` - canonical source
    `STUDIO/src/modules/shaders/TranslucentScatteringMaterial.module.js`, copied for Lab portability.
  - `input/PointerRaycastForce.module.js` - existing canonical source
    `STUDIO/src/modules/input/PointerRaycastForce.module.js`, copied for Lab portability.
- **`local/` project-specific files:** Presets and provenance only. Keep overlay styling inside
  `SpherePackingLab.tsx` with scoped inline style objects to avoid extra CSS file sprawl unless the TSX
  becomes hard to read.
- **Showcase dashboard controls/presets:** Lab schema exposes `preset`, `paused`, `showSourceControls`,
  `titleScale`, `count`, size/gravity/friction controls, color controls, material controls, and
  performance pixel-ratio cap. Default preset must match source: `count: 300`, `minSize: 0.3`,
  `maxSize: 1`, `gravity: 0.5`.
- **Faithful overlay details:** Full-height relative container; canvas absolutely/fixed fills the Lab
  viewport behind content; centered `h1 Sphere` and `h2 Packing`; uppercase black text; white glow; bottom
  centered glass-light buttons; optional Framer attribution link opens original URL.

---

## 5. Ordered task checklist (steps 8-11)

- [ ] T-1 - Scaffold canonical modules.
  - Files: run `npm run new-module -w STUDIO -- sphere-packing-physics --category physics/particles`,
    `npm run new-module -w STUDIO -- translucent-scattering-material --category shaders`, and
    `npm run new-module -w STUDIO -- sphere-packing-background --category physics/particles`.
  - Mirror: modern clean module naming, no `.module` infix except scaffold compatibility if the script
    generates legacy names; rename to clean names if needed and update meta imports.
  - Out of scope: Lab implementation.
  - Acceptance: files exist with clean source/showcase/meta shape.
- [ ] T-2 - Implement `SpherePackingPhysics.module.js`.
  - Files: `STUDIO/src/modules/physics/particles/SpherePackingPhysics.module.js`.
  - Mirror: minified class `W` update order and source defaults.
  - Out of scope: rendering and React.
  - Acceptance: showcase can run solver with moving packed circles/spheres; no allocation per particle
    per frame except unavoidable scratch reuse.
- [ ] T-3 - Implement `TranslucentScatteringMaterial.module.js`.
  - Files: `STUDIO/src/modules/shaders/TranslucentScatteringMaterial.module.js`.
  - Mirror: minified class `Y`; verify `ShaderChunk.lights_fragment_begin` replacement against
    installed `three@0.185.0`.
  - Out of scope: postprocessing/bloom.
  - Acceptance: material showcase displays a lit translucent sphere and controls update shader uniforms.
- [ ] T-4 - Implement `SpherePackingBackground.module.js`.
  - Files: `STUDIO/src/modules/physics/particles/SpherePackingBackground.module.js`.
  - Mirror: minified class `Z`, factory `q`, source init options from `REF/sphere-packing/src/script.js`.
  - Out of scope: source hero text.
  - Acceptance: background showcase renders packed spheres, pointer controls lead sphere, controls update
    count/gravity/colors live, dispose leaves no running rAF.
- [ ] T-5 - Fill all canonical `.meta.ts` entries and showcases.
  - Files: all three `.meta.ts` and `.showcase.tsx`.
  - Mirror: `TslWebgpuSwarmParticles.meta.ts` and `ThreejsToysSwarmLab.meta.ts` completeness.
  - Out of scope: broad registry refactors.
  - Acceptance: `npm run check-registry -w STUDIO` passes.
- [ ] T-6 - Build the faithful Mode B Lab.
  - Files: `STUDIO/src/labs/sphere-packing/SpherePackingLab.tsx`,
    `SpherePackingLab.meta.ts`, `createSpherePackingLab.js`, `local/presets/SpherePackingPresets.ts`,
    `local/composition/spherePackingComposition.ts`.
  - Mirror: `REF/sphere-packing/src/index.html`, `style.css`, `script.js` and existing
    `threejs-toys-swarm` Lab architecture.
  - Out of scope: redesigning the hero into ARTINOS branding.
  - Acceptance: Lab card appears in registry; selecting it shows the source-style hero and buttons.
- [ ] T-7 - Add Lab snapshot modules.
  - Files: `STUDIO/src/labs/sphere-packing/modules/...`.
  - Mirror: `ball-pool` and `threejs-toys-swarm` snapshot/provenance pattern.
  - Out of scope: package promotion.
  - Acceptance: Lab imports from its snapshots; provenance strings list canonical sources.
- [ ] T-8 - Verification and fidelity pass.
  - Commands: `npm run check-registry -w STUDIO`, `npm run lint -w STUDIO`, `npm run build -w STUDIO`
    if lint passes.
  - Visual: run dev server, open Studio, select `sphere-packing-background` and `sphere-packing`; check
    console zero errors, controls drive preview, and compare against `REF/sphere-packing` source
    composition.
  - Acceptance: report PASS only with command results and visual notes.

---

## 6. Fidelity, deviations & validation

- **Preserved verbatim:** source defaults (`count: 300`, `minSize: 0.3`, `maxSize: 1`, `gravity: 0.5`),
  gravity toggle behavior (`0` <-> `1`), random three-color ramp, uppercase centered text, fixed/full
  canvas layering, RoomEnvironment PMREM look, translucent physical material scattering, point light on
  the first sphere, pointer-controlled first sphere, responsive world bounds, CPU pairwise packing order.
- **Planned deviations (with reason):**
  - CDN import becomes owned local ARTINOS source so the module is portable/offline and inspectable.
  - Global DOM query/button wiring becomes React lifecycle and bridge controls.
  - Source window/fixed canvas sizing becomes container-aware sizing inside STUDIO.
  - `three@0.170.0` imports become repo `three@0.185.0`; shader replacement must be verified.
  - The package's private `Three` lifecycle class is not copied as a generic module; only the needed
    renderer/camera/resize/dispose behavior is folded into `SpherePackingBackground` to avoid fake
    infrastructure.
  - TSL/WebGPU rewrite is deferred to preserve source fidelity.
  - License signals conflict (`CC BY-NC-SA` comment, local MIT license, npm ISC package); keep
    attribution and require human decision for non-local commercial distribution.
- **Validation (DoD):**
  - Blueprint exists and implementation matches it.
  - `npm run check-registry -w STUDIO` passes.
  - `npm run lint -w STUDIO` passes.
  - Live preview: controls update gravity/count/colors/material live.
  - Console: zero runtime errors/warnings attributable to the module.
  - Visual QA: source-style hero composition matches `REF/sphere-packing` and does not degrade into a
    generic particle demo.
  - Performance note: source default 300 spheres is acceptable; high counts documented as CPU O(n^2).
