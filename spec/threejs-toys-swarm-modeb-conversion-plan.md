# ThreeJS Toys Swarm Mode B Conversion Proposal

Status: MODE B WEBGPU/TSL IMPLEMENTATION STARTED.

Input:
- CodePen: https://codepen.io/soju22/pen/GRQMzBa
- Title observed: "ThreeJS Toy - Swarm"
- Source author: Kevin Levron / soju22
- Upstream package inspected: `threejs-toys@0.0.8`
- Upstream repository: https://github.com/klevron/threejs-toys
- Source license observed from npm package: ISC

## Goal

Recreate the CodePen as an ARTINOS Mode B conversion: extract reusable canonical systems from the
real `threejs-toys` Swarm implementation, then rebuild the original pen as a faithful Lab capsule in
`STUDIO/src/labs/threejs-toys-swarm/`.

The Lab must preserve the original identity: fullscreen dark WebGL/GPGPU swarm background, luminous
bloom, random color palette behavior, centered white "SWARM BACKGROUND" editorial overlay, fixed
background canvas, OrbitControls-enabled camera, `gpgpuSize: 256`, custom/default triangular swarm
geometry, camera z position set to `200`, and click-to-randomize colors.

The conversion should not become a one-off demo. The useful systems in the source should strengthen
the ARTINOS module library and be reusable by future WebGL/GPGPU particle backgrounds.

## Non-goals

- Do not replace the source with the existing `gpu-particles` module; that module is a CPU-seeded
  additive Points field, not the source's texture-compute instanced-mesh swarm.
- Do not pretend the WebGPU/TSL module is a direct renderer copy. The source is WebGL plus
  `GPUComputationRenderer`; the WebGPU/TSL version is a requested translation that preserves the
  behavior and composition while changing the graphics pipeline.
- Do not modify PANELFLOW unless implementation uncovers a real bridge/control API gap.
- Do not add deep helper taxonomy. Extract only modules with clear standalone reuse value.
- Do not preserve CodePen's external CDN import at runtime; port source into owned ARTINOS files with
  provenance.

## Source Files Inspected

From the CodePen:
- HTML: `#app`, `#hero`, heading, GitHub link.
- CSS: fullscreen `#app`, fixed background canvas, centered Montserrat-style white text with shadow.
- JS: imports `swarmBackground` from the CDN build, creates the background with `gpgpuSize: 256`,
  `eventsEl: document.body`, `geometry: 'default'`, sets camera z to `200`, and randomizes colors on
  body click.

From `threejs-toys@0.0.8` npm tarball:
- `src/backgrounds/swarm/index.js` - Swarm implementation.
- `src/three.js` - shared Three.js stage, renderer, camera, scene, resize, clock, OrbitControls,
  light helpers, and pointer initialization.
- `src/pointer.js` - normalized pointer helper.
- `src/tools/color.js` - `colorScale` palette interpolation.
- `src/glsl/psrdnoise3.glsl` - derivative 3D simplex/flow-noise GLSL.
- `src/export.js` - confirms `swarmBackground` export.
- `package.json` - upstream Three version range (`^0.140.0`) and ISC license.

## Source Systems Found

1. WebGL stage/runtime
   - `WebGLRenderer`, `PerspectiveCamera`, `Scene`, resize, render loop, elapsed clock.
   - Optional `OrbitControls` with damping.
   - Light initialization from source config.
   - Canvas creation into `el` or use of passed `canvas`.

2. GPGPU texture simulation
   - `GPUComputationRenderer` with `texturePosition` and `textureVelocity` variables.
   - `gpgpuSize` controls texture width/height; the CodePen uses `256`, so instance count is
     `256 * 256 = 65,536`.
   - Velocity compute shader uses `psrdnoise3` derivative gradients, attraction toward origin,
     radius thresholds, and max-velocity clamping.
   - Position compute shader integrates velocity into position.
   - Fallback data type path uses `HalfFloatType` when WebGL2 is not available.

3. Instanced swarm renderer
   - Geometry options: `box`, `capsule`, `cone`, `octahedron`, `sphere`, and source custom geometry.
   - Per-instance `gpuUv` attribute maps each mesh instance to one compute texture pixel.
   - `MeshStandardMaterial.onBeforeCompile` injects texture uniforms and replaces vertex chunks.
   - Each instance orients by old-position -> new-position `lookAt`, scales by particle weight, and
     reads position/velocity from the compute textures.
   - Color ramp is assigned per instance through `setColorAt`.

4. Bloom postprocessing
   - `EffectComposer`, `RenderPass`, and `UnrealBloomPass`.
   - Source defaults: strength `1.5`, radius `0.5`, threshold `0.25`.
   - Composer resizes with the stage.

5. Lab-specific CodePen composition
   - Fullscreen dark page with fixed z-behind canvas.
   - Center text and source link overlay.
   - Camera z set to `200` after background creation.
   - Click handler calls `bg.setColors([randomHex, randomHex])`.
   - Source quirk: CodePen passes `color: [...]`, while `threejs-toys@0.0.8` Swarm source expects
     `colors`. The faithful Lab should preserve the visible behavior by using `colors` internally and
     documenting `color` as an upstream pen/config mismatch.

## Reuse-First Check

Current registry check passed before writing this plan:

```bash
npm run check-registry -w STUDIO
```

Result observed: 41 module entries, 41 ok, 0 failed.

Relevant existing ARTINOS modules:
- `gpu-particles` - WebGL Points field. Useful as an engine/wrapper precedent, but not a duplicate.
- `universal-physics-particles` - instanced physics particles. Useful conceptually, but it is
  rigid-body/adapter based, not GPGPU texture simulation.
- `pointer-raycast-force`, `pointer-velocity-splat`, `pointer-glass-collider` - input precedents.
  Swarm does not use pointer force in the active CodePen, so do not force these into the Lab.
- `webgpu-bloom-composer`, `webgpu-ssgi-room-renderer` - postprocessing precedents, but WebGPU-only
  and not direct replacements for WebGL `EffectComposer` + `UnrealBloomPass`.
- `tsl-noise`, `tsl-spline-color-ramp`, `tsl-colormap-palette` - math/color precedents, but they are
  TSL/WebGPU; the source needs GLSL/Three Color utilities.

Conclusion: this is new enough to convert. Reuse the patterns and registry rules, not the existing
runtime code, unless implementation proves a small existing utility can be extended cleanly.

## Proposed Mode B Outputs

This is Mode B because the source contains several reusable systems beyond the CodePen page: a WebGL
stage, derivative-noise shader source, WebGL GPGPU texture compute, instanced velocity-aligned swarm
rendering, and a WebGL bloom composer. The Lab preserves the exact CodePen composition.

## Implemented User-Requested WebGPU/TSL Path

The user requested "method b" and to "replicate it in TSL webgpu." The first implemented slice is
therefore the WebGPU/TSL translation below, with the WebGL direct-port plan retained as provenance
and future fallback context.

Canonical module:

```txt
STUDIO/src/modules/physics/particles/
  TslWebgpuSwarmParticles.module.js
  TslWebgpuSwarmParticles.showcase.tsx
  TslWebgpuSwarmParticles.meta.ts
```

Id: `tsl-webgpu-swarm-particles`

Purpose:
- Recreate the CodePen Swarm as a GPU-resident WebGPU/TSL particle system.
- Preserve the source concepts: `gpgpuSize`, origin attraction, velocity clamping, noise-driven
  drift, velocity-aligned instanced triangular geometry, random color ramp behavior, bloom, and
  camera depth.
- Use Three WebGPU storage buffers and TSL compute kernels instead of WebGL
  `GPUComputationRenderer` textures and GLSL shader chunks.

Faithful Lab capsule:

```txt
STUDIO/src/labs/threejs-toys-swarm/
  ThreejsToysSwarmLab.tsx
  ThreejsToysSwarmLab.meta.ts
  createThreejsToysSwarmLab.js
  modules/physics/particles/TslWebgpuSwarmParticles.module.js
  local/presets/ThreejsToysSwarmPresets.ts
  local/tuning/provenance.ts
```

Id: `threejs-toys-swarm`

Purpose:
- Rebuild the CodePen composition using the WebGPU/TSL canonical module snapshot.
- Preserve the centered `SWARM BACKGROUND` overlay, `github/threejs-toys` attribution text,
  `gpgpuSize: 256`, `cameraZ: 200`, full-bleed black canvas, bloom, and click-to-randomize colors.

Intentional deviations from the upstream source:
- Renderer changed from WebGL to WebGPU.
- Compute changed from `GPUComputationRenderer` texture variables to TSL storage-buffer compute.
- Noise changed from copied `psrdnoise3.glsl` to a compact TSL analytic flow field, because GLSL
  shader chunks cannot be directly reused inside TSL compute nodes.
- Bloom changed from `EffectComposer`/`UnrealBloomPass` to the Three WebGPU TSL bloom node.

### Canonical Module 1: WebGL Three Stage

Path:

```txt
STUDIO/src/modules/rendering/stage/
  WebglThreeStage.module.js
  WebglThreeStage.showcase.tsx
  WebglThreeStage.meta.ts
```

Id: `webgl-three-stage`

Purpose:
- Directly port the reusable parts of `src/three.js`: canvas ownership, renderer, scene, camera,
  resize, clock, render loop, optional OrbitControls, optional pointer callbacks, and light helpers.
- Keep it WebGL-specific and scene-agnostic.
- Expose `createWebglThreeStage(canvasOrElement, options)` returning renderer, scene, camera, clock,
  resize, start/stop, render hook registration, and dispose.

Controls:
- `cameraZ`
- `cameraFov`
- `orbitControls`
- `damping`
- `antialias`
- `alpha`
- `pixelRatio`

Dependencies:
- `three`
- `react`

### Canonical Module 2: GLSL PSRD Noise 3D

Path:

```txt
STUDIO/src/modules/math/
  GlslPsrdNoise3D.module.js
  GlslPsrdNoise3D.showcase.tsx
  GlslPsrdNoise3D.meta.ts
```

Id: `glsl-psrd-noise-3d`

Purpose:
- Preserve `src/glsl/psrdnoise3.glsl` as a reusable GLSL string/module with attribution and MIT
  notice retained from the source file.
- Use it for Swarm velocity gradients and future WebGL flow/noise shaders.
- Showcase should render a simple non-Swarm shader field to prove the noise is reusable outside the
  Swarm Lab.

Controls:
- `scale`
- `timeScale`
- `period`
- `gradientMode`

Dependencies:
- `three`
- `react`

### Canonical Module 3: WebGL Unreal Bloom Composer

Path:

```txt
STUDIO/src/modules/rendering/postfx/
  WebglUnrealBloomComposer.module.js
  WebglUnrealBloomComposer.showcase.tsx
  WebglUnrealBloomComposer.meta.ts
```

Id: `webgl-unreal-bloom-composer`

Purpose:
- Directly port the source's `EffectComposer` + `RenderPass` + `UnrealBloomPass` composition.
- Stay WebGL-focused, separate from existing WebGPU/TSL bloom modules.
- Expose `createWebglUnrealBloomComposer(renderer, scene, camera, options)` returning render, resize,
  update, and dispose.

Controls:
- `bloomStrength`
- `bloomRadius`
- `bloomThreshold`

Dependencies:
- `three`
- `react`

### Canonical Module 4: WebGL GPGPU Swarm Particles

Path:

```txt
STUDIO/src/modules/physics/particles/
  WebglGpgpuSwarmParticles.module.js
  WebglGpgpuSwarmParticles.showcase.tsx
  WebglGpgpuSwarmParticles.meta.ts
```

Id: `webgl-gpgpu-swarm-particles`

Purpose:
- Directly port the reusable core of `src/backgrounds/swarm/index.js`: texture compute, position and
  velocity shaders, instance geometry, `gpuUv`, material shader patch, color ramp assignment, geometry
  choices, and cleanup.
- Depend on `webgl-three-stage`, `webgl-unreal-bloom-composer`, and `glsl-psrd-noise-3d` conceptually
  but stay usable as a direct engine factory when composed manually.
- Expose `createWebglGpgpuSwarmParticles(stage, options)` returning uniforms, mesh, setColors,
  update, resize, and dispose.

Controls:
- `gpgpuSize`
- `geometry`
- `geometryScaleX`
- `geometryScaleY`
- `geometryScaleZ`
- `noiseCoordScale`
- `noiseIntensity`
- `noiseTimeCoef`
- `attractionRadius1`
- `attractionRadius2`
- `maxVelocity`
- `colorA`
- `colorB`
- `colorC`
- `metalness`
- `roughness`

Dependencies:
- `three`
- `react`

### Faithful Lab Replica: ThreeJS Toys Swarm

Path:

```txt
STUDIO/src/labs/threejs-toys-swarm/
  ThreejsToysSwarmLab.tsx
  ThreejsToysSwarmLab.meta.ts
  createThreejsToysSwarmLab.js
  modules/
    rendering/
      stage/
      postfx/
    physics/
      particles/
    math/
  local/
    composition/
      ThreejsToysSwarmHero.tsx
    presets/
      ThreejsToysSwarmPresets.ts
    tuning/
      provenance.ts
```

Id: `threejs-toys-swarm`

Purpose:
- Rebuild the exact CodePen using the canonical modules and local snapshots.
- Preserve the centered overlay, click color randomizer, camera z `200`, `gpgpuSize: 256`, and
  geometry `'default'` behavior.
- Use `local/composition` for the editorial hero overlay and click-to-randomize behavior.
- Keep Lab snapshots under `modules/` with provenance back to the canonical module paths.

Dependencies:
- `three`
- `react`

Related modules:
- `webgl-three-stage`
- `glsl-psrd-noise-3d`
- `webgl-unreal-bloom-composer`
- `webgl-gpgpu-swarm-particles`

## Implementation Milestones

1. Stage provenance input
   - Save the CodePen HTML/CSS/JS and the inspected `threejs-toys@0.0.8` source subset under
     `REF/threejs-toys-swarm/`.
   - Record source URL, npm tarball version, package integrity, and license.

2. Scaffold canonical modules
   - Use `npm run new-module -w STUDIO -- <id> --category <category/path>` for each module.
   - Keep Three.js runtime code in `.module.js` files and typed React wrappers in `.showcase.tsx`.

3. Port the source directly
   - Copy source logic first, then perform minimum edits for ESM imports, current Three `0.184.0`,
     lifecycle cleanup, canvas ownership, and PANELFLOW bridge controls.
   - Preserve shader chunks and GLSL noise before refactoring.

4. Build the Lab capsule
   - Copy canonical module snapshots into `STUDIO/src/labs/threejs-toys-swarm/modules/`.
   - Put only CodePen-specific overlay, random color click behavior, and source tuning under
     `local/`.

5. Fill registry metadata
   - Every module and the Lab need complete `ArtinosModule` entries.
   - `schema.id` must equal `id`.
   - `agentNotes` must record provenance and usage clearly enough for another agent to reuse the
     module without opening the source.

6. Verify and fix
   - Run registry and lint gates.
   - Load Studio, select the Swarm Lab, verify the preview renders, click randomizes colors, controls
     drive the stage, and console has zero errors.
   - Capture visual notes against the CodePen.

## Risks And Compatibility Notes

- Three version drift: upstream was authored around Three `^0.140.0`; Studio currently uses
  `three@0.184.0`. `GPUComputationRenderer`, `EffectComposer`, `RenderPass`, `UnrealBloomPass`, and
  shader chunk names must be verified against the installed version before claiming the port works.
- Source uses `MeshStandardMaterial.onBeforeCompile` string replacement. If Three shader chunks changed
  incompatibly, preserve behavior with the smallest local patch and report the deviation.
- `GPUComputationRenderer` is WebGL, not WebGPU. Do not mark the module dependency as `webgpu`.
- A 256x256 instanced mesh means 65,536 instances. Add a performance preset and a lower `gpgpuSize`
  option, but keep 256 as the faithful CodePen preset.
- The CodePen's initial `color` option appears mismatched with the source's `colors` option. Treat
  visible behavior as source of truth: initial colors may be source defaults, while click randomization
  must call `setColors`.

## Verification Plan

After implementation, run:

```bash
npm run check-registry -w STUDIO
npm run lint -w STUDIO
npm run build -w STUDIO
```

Visual/runtime gate:
- Start Studio dev server.
- Open the local Studio URL.
- Select `threejs-toys-swarm` in the Library/Lab Capsules surface.
- Confirm the fullscreen swarm renders behind the overlay.
- Confirm changing controls updates the live preview.
- Confirm clicking the Lab randomizes colors.
- Confirm resize keeps the canvas full-bleed and composer sized correctly.
- Confirm browser console has zero errors.
- Note fidelity against the CodePen: camera depth, density, swarm motion, bloom strength, color
  behavior, overlay placement, and interaction.

## Acceptance Criteria

- Canonical modules are registered, showcased, and reusable outside the Lab.
- Faithful Lab is registered with tag `lab` and related canonical module ids.
- Lab contains snapshot copies with provenance.
- Source behavior is ported directly, not visually approximated.
- `check-registry`, `lint`, and build pass.
- Live preview renders with zero console errors.
- Visual QA confirms the result preserves the CodePen identity.

## Expected Deviations To Report If Implemented

- CDN import removed and replaced by owned ARTINOS source files.
- CodePen `color` option normalized to source-correct `colors` in the ARTINOS controls.
- Any Three `0.184.0` compatibility edits to shader chunks, add-on import paths, or composer lifecycle.
- PANELFLOW controls replace implicit hardcoded values, while the "CodePen Original" preset preserves
  the source settings.
