# Singularity Mode B Conversion Plan

Status: PROPOSAL ONLY - no implementation changes yet.

Input:
- GitHub: https://github.com/MisterPrada/singularity
- Source commit inspected: `51313b398583a84c9347470ce4b575e05739e302`
- Commit date: 2026-02-11 13:06:17 +0300
- Source title/package: `Singularity`
- Source author in `package.json`: `Mister&Prada`
- Source stack observed: Vite app, Three.js WebGPU/TSL, custom `Experience` runtime, `tweakpane`, `stats.js`, `gsap`, Basis/DRACO loaders, equirectangular nebula texture, deep-noise texture.
- Upstream build proof from temp clone: `npm install` passed, `npm run build` passed. Vite reported only Rollup pure-annotation warnings in `TSL-utils.js` comments and a large chunk warning.

## Human Decision Before Implementation

The cloned repository does not include a root `LICENSE` file. Direct source and asset copying should not start until the user confirms one of:

- permission/license exists outside the repo;
- the user owns or has rights to port it into ARTINOS;
- implementation should be a clean-room inspired rebuild instead of a direct code/asset port.

This plan assumes permission is granted because the requested ARTINOS converter path requires direct source preservation. If permission is not granted, the implementation mode changes and fidelity must be reported as limited.

## Goal

Port Singularity into ARTINOS as a Mode B conversion: extract the genuinely reusable systems into registered canonical modules, then rebuild the original as a faithful Lab capsule at `STUDIO/src/labs/singularity/`.

The ARTINOS version must preserve the source identity: black fullscreen WebGPU stage, nebula/star environment, orange-gold accretion glow, black event-horizon core, volumetric raymarch feel, deep-noise turbulent disk, ACES tone mapping, Bloom glow, OrbitControls camera, and the triangular star preloader if included in the faithful Lab.

## Non-goals

- Do not replace the black hole with a generic sphere shader, fullscreen gradient, or stock particle field.
- Do not downgrade the main path to WebGL/canvas. WebGPU is required; fallback is a capability notice.
- Do not dump the whole Vite source tree into ARTINOS.
- Do not copy debug shell systems (`tweakpane`, `stats.js`, Google Tag Manager, global debug panel) into the module runtime.
- Do not modify PANELFLOW unless the port exposes a real public API gap.
- Do not create a reusable runtime framework that duplicates the STUDIO/PANELFLOW shell.

## Source Systems Found

1. App shell and lifecycle:
   - `src/script.js` creates `new Experience(document.querySelector('canvas.webgl'))`.
   - `Experience.js` owns singleton state, resource loading, `Renderer`, `Worlds`, `State`, `Sound`, `PostProcess`, `Time`, and `Debug`.
   - Uses global `window.experience`, `window.preloader`, custom events, and full-window lifecycle.

2. WebGPU renderer:
   - `Renderer.js` creates `THREE.WebGPURenderer({ canvas, antialias: true, alpha: false, depth: true, forceWebGL: false })`.
   - Uses `SRGBColorSpace`, `ACESFilmicToneMapping`, `toneMappingExposure = 1.2`, soft shadows, pixel ratio capped to 2.

3. Main world composition:
   - `MainWorld.js` creates a `THREE.Scene`, perspective camera, OrbitControls/TransformControls, input helper, `BlackHole`, environment, and debug helpers.
   - Camera defaults: `PerspectiveCamera(50, aspect, 0.1, 2000)`, position `(1, 0.5, 3)`, look at origin.

4. Black-hole shader/material:
   - `BlackHole.js` builds a `SphereGeometry(1, 16, 16)` with `MeshStandardNodeMaterial`.
   - `material.colorNode` is a TSL `Fn` with a loop over `iterations` default 128.
   - Core uniforms: `stepSize = 0.0071`, `noiseFactor = 0.01`, `power = 0.3`, `originRadius = 0.13`, `width = 0.03`, `rampEmission = 2.0`, plus three ramp colors/positions and test uniforms.
   - The shader computes object/camera ray coordinates, steers the ray around the center, samples `noise_deep.png`, shapes a disk band, evaluates B-spline color ramps, suppresses the event-horizon core, front-to-back composites alpha, then blends remaining transparency with the equirectangular stars/nebula environment.

5. TSL utility library:
   - `Utils/TSL-utils.js` contains many reusable helpers: rotate axes, emission, hashes/noise/fbm, HSV conversion, color ramps, B-spline ramps, sRGB/linear conversion, white noise, `lengthSqrt`, and `smoothRange`.
   - ARTINOS already has `tsl-noise`, `tsl-hsv`, and `tsl-colormap-palette`; only missing helpers should be added or extracted.

6. Environment and postprocessing:
   - `Environment.js` maps `starsTexture` from `static/textures/hdr/nebula.png` as an equirectangular background node with `backgroundIntensity = 2`.
   - `PostProcess.js` builds `THREE.PostProcessing`, scene pass MRT with `output` and `emissive`, and Bloom from `three/addons/tsl/display/BloomNode.js`.
   - Bloom defaults from `State.js`: `strength = 0.217`, `radius = 0.0`, `threshold = 0`.

7. Input and preloader:
   - `Input.js` tracks normalized pointer position, 3D projected cursor, direction, and damped velocity. The black-hole scene currently does not appear to use this input for the shader.
   - `preloader.js` is a separate 2D canvas starfield plus animated triangular glyph. It is part of source identity, but it is not part of the black-hole rendering pipeline.

8. Assets:
   - Required for the black-hole Lab: `static/textures/hdr/nebula.png` and `static/textures/noise_deep.png`.
   - Likely discard for this Lab unless later proven used: `starmap_2020_4k.exr`, ground textures, GLB models, DRACO/Basis decoder copies, `grid.png`, `tileData.jpg`, `displacement.jpg`.

## Reuse-First Check

`npm run check-registry -w STUDIO` passed before planning and reported 34 valid entries across 16 categories.

Relevant existing modules:

- `aurora-shader`: TSL/WebGPU shader wrapper pattern.
- `neon-bloom`: WebGL Bloom example, not suitable for the WebGPU/TSL source composer.
- `webgpu-ssgi-room-renderer`: WebGPU/TSL render pipeline for room scenes, useful pattern but too SSGI/room-specific for this source.
- `adaptive-performance-manager`: reuse for quality/pixel-ratio control and telemetry concepts.
- `tsl-noise`: existing tri-noise helpers; does not cover the source's B-spline ramps and black-hole raymarch logic.
- `tsl-hsv`, `tsl-colormap-palette`: reuse/extend before creating overlapping color helpers.
- `pointer-raycast-force`: overlaps with 3D pointer/ray utilities if interaction is added later, but the source black-hole effect is not pointer-driven.
- `app-init-pipeline`: pattern for lifecycle/status; do not duplicate it in STUDIO.

Conclusion: Singularity is not a duplicate of an existing module. Reuse the existing wrapper, bridge, telemetry, TSL color/noise, and WebGPU patterns, but create new canonical modules for the black-hole material, equirectangular node environment, Bloom-only WebGPU composer, and optional triangular preloader.

## Proposed Mode B Outputs

Dependency direction:

```txt
math/tsl-spline-color-ramp        -> shaders/tsl-volumetric-raymarch-shell
math/tsl-noise / tsl-hsv reuse    -> shaders/singularity-black-hole-material
rendering/environments/equirectangular-node-environment -> labs/singularity
rendering/postfx/webgpu-bloom-composer                  -> labs/singularity
ui/singularity-triangle-preloader                        -> labs/singularity (optional in Lab)
shaders/singularity-black-hole-material                  -> labs/singularity
```

### Canonical Module 1: TSL Spline Color Ramp

Path:

```txt
STUDIO/src/modules/math/
  TslSplineColorRamp.module.js
  TslSplineColorRamp.showcase.tsx
  TslSplineColorRamp.meta.ts
```

Id: `tsl-spline-color-ramp`

Purpose:
- Extract only the missing reusable ramp/color helpers from `TSL-utils.js`: `ColorRamp3_BSpline`, `ColorRamp4_BSpline`, `ColorRamp2/3_Linear` if not already covered, `srgbToLinear`, `linearToSrgb`, `smoothRange`, and `lengthSqrt`.
- Prefer extending `tsl-colormap-palette` if the API fit is clean; create this module only if B-spline ramp functions would make that module less focused.
- Showcase must prove reuse outside Singularity by rendering several generic scalar ramps on a simple TSL surface.

Dependencies: `three`, `webgpu`, `react`.

### Canonical Module 2: TSL Volumetric Raymarch Shell

Path:

```txt
STUDIO/src/modules/shaders/
  TslVolumetricRaymarchShell.module.js
  TslVolumetricRaymarchShell.showcase.tsx
  TslVolumetricRaymarchShell.meta.ts
```

Id: `tsl-volumetric-raymarch-shell`

Purpose:
- Generalize the source's reusable volume-ray setup: object-space camera point, front/backface start selection, ray direction, jitter, bounded loop, alpha accumulation, and environment transparency blend.
- Keep it source-derived but not black-hole-specific, so future clouds, nebulae, portals, fog volumes, and absorption materials can reuse the shell.
- Showcase must render a non-black-hole volume such as a simple smoky sphere to prove reuse.

Dependencies: `three`, `webgpu`, `react`.

### Canonical Module 3: Singularity Black Hole Material

Path:

```txt
STUDIO/src/modules/shaders/
  SingularityBlackHoleMaterial.module.js
  SingularityBlackHoleMaterial.showcase.tsx
  SingularityBlackHoleMaterial.meta.ts
```

Id: `singularity-black-hole-material`

Purpose:
- Directly port `BlackHole.js` shader/material behavior: sphere geometry, TSL ray steering, deep-noise disk band, B-spline ramp colors, event-horizon suppression, emission, and star-environment blend.
- Expose a compact engine API: `createSingularityBlackHole(scene, resources, options)` returning `{ group, mesh, uniforms, update(options), dispose() }`.
- Keep source defaults as the `Code Original` preset.

Controls:
- `iterations`, `stepSize`, `noiseFactor`, `power`, `originRadius`, `bandWidth`, `rampCol1`, `rampPos1`, `rampCol2`, `rampPos2`, `rampCol3`, `rampPos3`, `rampEmission`, `emissionColor`, `backgroundIntensity`.

Dependencies: `three`, `webgpu`, `react`.

### Canonical Module 4: Equirectangular Node Environment

Path:

```txt
STUDIO/src/modules/rendering/environments/
  EquirectangularNodeEnvironment.module.js
  EquirectangularNodeEnvironment.showcase.tsx
  EquirectangularNodeEnvironment.meta.ts
```

Id: `equirectangular-node-environment`

Purpose:
- Extract `Environment.js` into a reusable scene environment/background node: load/apply an equirectangular texture, set mapping/color space, apply `backgroundIntensity`, and dispose safely.
- Showcase must demonstrate the nebula texture or a generated fallback equirectangular gradient.

Dependencies: `three`, `webgpu`, `react`.

### Canonical Module 5: WebGPU Bloom Composer

Path:

```txt
STUDIO/src/modules/rendering/postfx/
  WebgpuBloomComposer.module.js
  WebgpuBloomComposer.showcase.tsx
  WebgpuBloomComposer.meta.ts
```

Id: `webgpu-bloom-composer`

Purpose:
- Extract the source's simpler WebGPU/TSL postprocess stack: `PostProcessing`, scene `pass`, MRT `output`/`emissive`, BloomNode, and `outputNode = scene + bloom`.
- This is not the existing `webgpu-ssgi-room-renderer`; it is a lighter scene-agnostic Bloom composer for emissive shader scenes.

Controls:
- `toneMappingExposure`, `bloomStrength`, `bloomRadius`, `bloomThreshold`, `pixelRatio`.

Dependencies: `three`, `webgpu`, `react`.

### Canonical Module 6: Singularity Triangle Preloader

Path:

```txt
STUDIO/src/modules/ui/
  SingularityTrianglePreloader.module.tsx
  SingularityTrianglePreloader.showcase.tsx
  SingularityTrianglePreloader.meta.ts
```

Id: `singularity-triangle-preloader`

Purpose:
- Port the source's 2D canvas starfield plus animated triangular glyph as a reusable loading overlay.
- Keep it optional in the Lab because STUDIO already owns app loading, but include it if preserving the original entry experience is required.
- Remove `window.preloader`; expose React lifecycle props and imperative handle instead.

Dependencies: `react`.

### Faithful Lab: Singularity

Path:

```txt
STUDIO/src/labs/singularity/
  SingularityLab.tsx
  SingularityLab.meta.ts
  createSingularityLab.js
  modules/
    math/
      TslSplineColorRamp.module.js
    shaders/
      TslVolumetricRaymarchShell.module.js
      SingularityBlackHoleMaterial.module.js
    rendering/
      environments/
        EquirectangularNodeEnvironment.module.js
      postfx/
        WebgpuBloomComposer.module.js
    ui/
      SingularityTrianglePreloader.module.tsx
  local/
    assets/
      nebula.png
      noise_deep.png
    presets/
      SingularityPresets.ts
    tuning/
      sourceTuning.ts
      provenance.ts
    composition/
      singularityComposition.ts
```

Id: `singularity`

Purpose:
- Rebuild the source app as a Lab capsule, using local snapshots of the canonical modules so the Lab is portable.
- Compose: canvas-owned `WebGPURenderer` -> perspective camera + OrbitControls -> equirectangular environment -> black-hole material -> Bloom composer -> animation loop -> optional preloader overlay.
- Register as `category: 'lab'`, tags `['lab', 'replica', 'webgpu', 'tsl', 'black-hole', 'volumetric', 'bloom']`, and `related` to all canonical modules above plus relevant existing modules (`aurora-shader`, `tsl-noise`, `tsl-colormap-palette`).

Default preset:
- `Source Original`: exact source defaults from `BlackHole.js`, `State.js`, `Renderer.js`, and `Camera.js`.

Optional ARTINOS presets:
- `Accretion Gold`: source colors with slightly higher bloom.
- `Cold Singularity`: blue/white ramp colors, same raymarch physics.
- `Low Iteration`: lower `iterations` and pixel ratio for weak GPUs.
- `Event Horizon`: smaller `originRadius`, higher `rampEmission`.

## Implementation Milestones

### Milestone 0 - Permission, source staging, and asset minimization

Tasks:
- Resolve the license/permission decision above.
- If approved, stage a source snapshot under `REF/singularity/` with commit hash and provenance.
- Copy only required source files and required textures; do not copy unused GLB, DRACO, Basis, or analytics assets.
- Record upstream build proof and package versions.

Acceptance:
- Provenance is local and explicit.
- Permission status is recorded.
- Required asset list is minimal.

### Milestone 1 - Reuse and extension check

Tasks:
- Re-run `npm run check-registry -w STUDIO`.
- Inspect `tsl-noise`, `tsl-hsv`, `tsl-colormap-palette`, `aurora-shader`, `webgpu-ssgi-room-renderer`, and `adaptive-performance-manager` before scaffolding.
- Decide whether B-spline ramp helpers extend `tsl-colormap-palette` or become `tsl-spline-color-ramp`.

Acceptance:
- No duplicate ARTINOS module is created.
- Extension-vs-new decision is documented in the implementation notes.

### Milestone 2 - Math and shader cores

Tasks:
- Scaffold or extend the math ramp module.
- Scaffold `tsl-volumetric-raymarch-shell`.
- Scaffold `singularity-black-hole-material`.
- Port source shader logic directly with minimal compatibility edits for imports, texture access, bridge values, and lifecycle.

Acceptance:
- Standalone showcases render.
- `singularity-black-hole-material` uses source defaults and source textures.
- No fake helper sprawl; each module proves standalone reuse.

### Milestone 3 - Environment and postprocess modules

Tasks:
- Scaffold `equirectangular-node-environment`.
- Scaffold `webgpu-bloom-composer`.
- Port `Environment.js` and `PostProcess.js` behavior without copying the whole `Experience` singleton.
- Use `ResizeObserver`, canvas-owned renderer sizing, and honest WebGPU fallback.

Acceptance:
- Environment and Bloom modules render with a simple test scene.
- Controls drive intensity/bloom/exposure live.

### Milestone 4 - Optional preloader module

Tasks:
- Convert `preloader.js` to a React-owned 2D canvas component.
- Preserve the starfield and triangle animation; remove global `window.preloader`.
- Decide whether the Lab starts with the preloader or exposes it as a related standalone UI module only.

Acceptance:
- Preloader showcase runs independently.
- If omitted from the Lab, the deviation is documented.

### Milestone 5 - Faithful Lab capsule

Tasks:
- Create `STUDIO/src/labs/singularity/`.
- Copy module snapshots into `labs/singularity/modules/`.
- Add Lab-local assets, source tuning, presets, composition, and provenance.
- Build `createSingularityLab.js` as the faithful composition:
  `WebGPURenderer -> camera/OrbitControls -> environment -> black-hole sphere -> Bloom composer -> animation loop`.
- Add `SingularityLab.meta.ts` with complete `ArtinosModule` fields and bridge schema.

Acceptance:
- Lab runs from its snapshot capsule.
- Original visual identity is preserved.
- Project-specific glue stays under `local/`; canonical modules stay reusable.

### Milestone 6 - Fidelity and controls pass

Tasks:
- Compare against the source dev/build route in a WebGPU-capable browser.
- Tune only to preserve source feel: accretion disk color, core radius, noise band thickness, bloom glow, nebula intensity, camera framing.
- Map source uniforms to PANELFLOW controls from one parameter source.
- Publish performance telemetry through the existing ARTINOS performance path where applicable.

Acceptance:
- Side-by-side visual note exists.
- Controls mutate the live shader without remount loops.
- Deviations are listed in `agentNotes`/`reuseNotes`.

### Milestone 7 - Verification

Commands:

```bash
npm run check-registry -w STUDIO
npm run lint -w STUDIO
npm run build -w STUDIO
```

Runtime checks:
- Start STUDIO dev server.
- Open the Studio route in a WebGPU-capable browser.
- Select each new canonical module and then the `singularity` Lab.
- Confirm each preview renders.
- Confirm controls affect live rendering.
- Confirm zero console errors.
- Capture at least one desktop screenshot and one narrower viewport screenshot.

If the in-app browser cannot acquire a GPU adapter, report the environment limit and verify in a GPU-capable browser instead.

## Planned Deviations From Source

- Vite app shell -> ARTINOS Lab component and module registry.
- `document.querySelector`, `window.experience`, `window.preloader`, global events -> React lifecycle and local engine handles.
- Tweakpane debug controls -> PANELFLOW schema and Inspector controls.
- `stats.js` debug HUD -> ARTINOS performance telemetry.
- Google Tag Manager -> omitted.
- Source full-window sizing -> container sizing via `ResizeObserver`.
- `three@0.180.0` source -> ARTINOS `three@0.184.0`; do not downgrade ARTINOS unless a verified API break forces a decision.
- Unused source assets -> omitted from Lab snapshot.
- `gsap` timeline -> omit unless a source-visible animation requires it; current black-hole effect can run on Three `Timer`/RAF.

Avoided deviations:
- No generic black-hole rewrite.
- No WebGL replacement for the main path.
- No replacement of source shader logic with a stock noise shader.
- No loss of nebula/deep-noise texture identity if permission allows asset copying.

## Risk Register

1. License/permission:
   - Risk: no root license in upstream repo.
   - Mitigation: require user confirmation before direct copy.

2. WebGPU support:
   - Risk: browser adapter unavailable.
   - Mitigation: metadata includes `webgpu`; show capability notice; verify in GPU-capable browser.

3. Three/TSL API drift:
   - Risk: source uses `three@0.180.0`; ARTINOS uses `three@0.184.0`.
   - Mitigation: keep ARTINOS version, port incrementally, verify TSL nodes (`Loop`, `faceDirection`, `equirectUV`, BloomNode) during Milestones 2 and 3.

4. Shader fidelity:
   - Risk: small math/import changes can flatten the volumetric effect.
   - Mitigation: port `BlackHole.js` material directly, keep source defaults, compare visually before tuning.

5. Asset size:
   - Risk: upstream includes large unused assets.
   - Mitigation: copy only `nebula.png` and `noise_deep.png` unless a later source inspection proves more are required.

6. Over-decomposition:
   - Risk: extracting too many thin helpers from `TSL-utils.js`.
   - Mitigation: only extract modules with standalone reuse proof; otherwise keep helpers local to `singularity-black-hole-material`.

7. Runtime duplication:
   - Risk: copying `Experience` creates a second app shell inside STUDIO.
   - Mitigation: keep lifecycle/composition Lab-local and use existing STUDIO/PANELFLOW infrastructure.

## Completion Gate For Implementation

The conversion is PASS only when:

- Permission/license decision is resolved.
- New or extended canonical modules are registered and discoverable.
- `singularity` Lab is registered and discoverable.
- `npm run check-registry -w STUDIO` passes.
- `npm run lint -w STUDIO` passes.
- `npm run build -w STUDIO` passes.
- Live WebGPU preview renders with zero console errors.
- At least one control changes the black-hole material live.
- The Lab visually preserves source identity: nebula environment, orange/gold accretion glow, black core, volumetric/noise band, Bloom, and camera framing.
- Fidelity deviations are documented clearly.

Until those are proven, report BLOCKED or incomplete, not PASS.
