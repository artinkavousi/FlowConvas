# Three.js r185 — Ported examples/jsm Modules

> Port of **the entire** `REF/three.js-r185/examples/jsm` tree into the ARTINOS library. All 35 jsm
> directories are present (~469 vendored `.js` files). The first pass covered WebGPU/TSL + complements;
> a follow-up pass added the remaining domains (animation, capabilities, curves, effects, exporters,
> generators, inspector, interaction, interactive, libs, lights, misc, offscreen, physics, textures,
> transpiler, webxr, full loaders) so coverage is complete.

## Where it lives

Everything was copied **directly under `STUDIO/src/modules/`** as sibling category folders next to the
hand-authored ARTINOS modules (no separate `lib/` tree). The jsm internal topology was preserved so
the files' relative imports (`../shaders/…`, `../utils/…`) resolve unchanged, and their bare
`three/addons/…` imports resolve to the installed `three@0.185.0` package (exact version match).

| Category dir | Files | Notes |
|---|---:|---|
| `modules/tsl/` (display, lighting, math, shadows, utils) | 61 | TSL node library — post FX, lighting, shadows, raymarching, etc. |
| `modules/postprocessing/` | 30 | EffectComposer passes (WebGL + WebGPU) |
| `modules/shaders/` (vendored) | 52 | GLSL shader chunks (deps of postprocessing/objects) — see `shaders/three.index.ts` |
| `modules/utils/` | 16 | BufferGeometryUtils, SkeletonUtils, texture utils, WorkerPool, … |
| `modules/objects/` | 14 | Water/WaterMesh, Sky/SkyMesh, Reflector, Refractor, Lensflare, MarchingCubes, … |
| `modules/helpers/` | 13 | ViewHelper, RectAreaLightHelper, Octree/Texture/LightProbe helpers (incl. GPU variants) |
| `modules/math/` (vendored) | 10 | SimplexNoise, ImprovedNoise, ConvexHull, Octree, OBB, Capsule, Lut, … — see `math/three.index.ts` |
| `modules/lines/` (incl. webgpu/) | 10 | Line2 / LineMaterial / Wireframe (WebGL + WebGPU) |
| `modules/controls/` | 9 | Orbit, Map, Trackball, Transform, Drag, Fly, FirstPerson, PointerLock, Arcball |
| `modules/geometries/` | 9 | TextGeometry, RoundedBox, Convex, Parametric, Teapot, Decal, … |
| `modules/csm/` | 5 | Cascaded shadow maps (+ CSMShadowNode for WebGPU) |
| `modules/modifiers/` | 5 | Curve (+GPU), Simplify, Tessellate, EdgeSplit |
| `modules/renderers/` | 4 | CSS2D/CSS3D/SVG/Projector |
| `modules/lighting/` | 3 | ClusteredLighting, DynamicLighting, LightProbeGrid |
| `modules/materials/` | 3 | Wood node material, LDraw conditional line materials |
| `modules/environments/` | 3 | RoomEnvironment, DebugEnvironment, ColorEnvironment |
| `modules/gpgpu/` | 1 | BitonicSort |
| `modules/loaders/` | 56 | GLTF, FBX, OBJ, KTX2, DRACO, USDZ, Collada, PLY, STL, 3DM/3MF, Font, … |
| `modules/misc/` | 14 | GPUComputationRenderer, MD2/MMD, ConvexObjectBreaker, Gyroscope, Timer, … |
| `modules/webxr/` | 13 | VR/AR buttons, controllers, hand models, OculusHandModel, XREstimatedLight, … |
| `modules/exporters/` | 8 | GLTF, USDZ, EXR, KTX2, PLY, STL, OBJ, Draco exporters |
| `modules/transpiler/` | 8 | TSL/WGSL transpiler (GLSL→TSL tooling) |
| `modules/generators/` | 6 | Terrain/Forest/Tree/City procedural generators |
| `modules/curves/` | 5 | NURBS + curve extras |
| `modules/effects/` | 5 | Anaglyph, Stereo, Parallax, Outline, Peppers-ghost (WebGL) |
| `modules/interactive/` | 4 | InteractiveGroup, HTMLMesh, SelectionBox/Helper |
| `modules/lights/` | 3 | LightProbeGenerator, RectAreaLightUniformsLib, … |
| `modules/offscreen/` | 3 | OffscreenCanvas worker scene |
| `modules/physics/` (vendored) | 3 | Ammo / Rapier / Jolt physics adapters — see `physics/three.index.ts` |
| `modules/animation/` | 2 | AnimationGLTFExtras, CCDIKSolver, MMDAnimationHelper helpers |
| `modules/capabilities/` | 2 | WebGL / WebGPU capability probes |
| `modules/interaction/` | 1 | InteractionManager |
| `modules/textures/` | 1 | FlakesTexture |
| `modules/inspector/` | 20 | three.js editor/inspector (vanilla) — PANELFLOW React-port target; **no barrel** |
| `modules/libs/` | 22 | vendored third-party (fflate, ktx-parse, draco, basis, opentype, …) — **no barrel** |

**~469 vendored source files across all 35 jsm domains.** Each category folder has an auto-generated
`index.ts` barrel of namespaced re-exports (e.g. `import { BloomNode } from '@/modules/tsl'`); merged
`math`/`shaders`/`physics` folders use `three.index.ts` so they don't clobber the ARTINOS modules there.
Barrels include only files whose imports are relative or `three`/`three/*` — files needing a CDN ESM
import (e.g. `TTFLoader`, `LottieLoader`) or an external engine are copied but omitted from the barrel
(import them directly by path). `libs/` (vendored/minified, some non-ESM) and `inspector/` (an app, and
the React-port target) are copied without barrels. The single repo-relative import in
`offscreen/scene.js` was repointed to `'three'`.

## Registry status

The vendored `.js` files are **importable building blocks**, not registry entries — the registry only
discovers `*.meta.ts`, so the gallery is unaffected by the bulk copy. A curated set of standout
WebGPU/TSL pieces was wrapped as full `ArtinosModule` entries (meta + showcase) so they appear in the
gallery/graph/MCP:

| Module id | Category | Wraps |
|---|---|---|
| `tsl-bloom-node` | `rendering/postfx` | `tsl/display/BloomNode.js` |
| `tsl-chromatic-aberration` | `rendering/postfx` | `tsl/display/ChromaticAberrationNode.js` |
| `tsl-film-grain` | `rendering/postfx` | `tsl/display/FilmNode.js` |
| `tsl-dot-screen` | `rendering/postfx` | `tsl/display/DotScreenNode.js` |
| `tsl-rgb-shift` | `rendering/postfx` | `tsl/display/RGBShiftNode.js` |
| `tsl-after-image` | `rendering/postfx` | `tsl/display/AfterImageNode.js` |
| `tsl-gtao` | `rendering/postfx` | `tsl/display/GTAONode.js` (MRT output+normal+depth) |
| `tsl-depth-of-field` | `rendering/postfx` | `tsl/display/DepthOfFieldNode.js` (scene viewZ) |
| `tsl-pixelation` | `rendering/postfx` | `tsl/display/PixelationPassNode.js` (owns its scene render) |
| `tsl-fxaa` | `rendering/postfx` | `tsl/display/FXAANode.js` |
| `tsl-smaa` | `rendering/postfx` | `tsl/display/SMAANode.js` |
| `tsl-sobel` | `rendering/postfx` | `tsl/display/SobelOperatorNode.js` |
| `tsl-sepia` | `rendering/postfx` | `tsl/display/Sepia.js` |
| `tsl-bleach-bypass` | `rendering/postfx` | `tsl/display/BleachBypass.js` |
| `tsl-sharpen` | `rendering/postfx` | `tsl/display/SharpenNode.js` |
| `tsl-fsr1` | `rendering/postfx` | `tsl/display/FSR1Node.js` |
| `tsl-hash-blur` | `rendering/postfx` | `tsl/display/hashBlur.js` |
| `tsl-ssaa` | `rendering/postfx` | `tsl/display/SSAAPassNode.js` (owns its scene render) |
| `tsl-retro` | `rendering/postfx` | `tsl/display/RetroPassNode.js` (owns its scene render) |
| `tsl-denoise` | `rendering/postfx` | `tsl/display/DenoiseNode.js` (MRT output+normal+depth) |
| `webgpu-sky-mesh` | `rendering/environments` | `objects/SkyMesh.js` |
| `webgpu-water-mesh` | `rendering/environments` | `objects/WaterMesh.js` (procedural normal map) |

**22 curated modules.** The post-FX nodes share `rendering/postfx/_tslPostHarness.js` (a non-registered
`.js` scene scaffold; its `buildOutput(scenePass, ctx)` callback sets MRT for GTAO/denoise, reads viewZ
for DoF, or builds its own pass for pixelation/SSAA/retro).

**Source-only (importable, not yet showcased)** — the multi-input / asset-dependent effects that need a
scene-specific composite or texture and so can't ship a build-verifiable WebGPU showcase from a generic
harness: `SSRNode`, `SSGINode`, `GodraysNode`, `SSSNode`, `TRAANode`/`TAAUNode`/`TemporalReprojectNode`
(motion-vector inputs), `MotionBlur`, `LensflareNode`, `Lut3DNode` (LUT asset), `TransitionNode`,
`AnaglyphPassNode`/`ParallaxBarrierPassNode`/`StereoPassNode` (stereo camera), `GaussianBlurNode`/
`BilateralBlurNode` (baked sigma + direction), `boxBlur`/`radialBlur`, `ImportanceSampledEnvironment`.
Promote any of these by copying a curated trio and pointing `sourcePath` at the vendored file. Likewise
the non-`tsl/display` domains (controls, geometries, math, utils, loaders, renderers, helpers, lines,
lighting, materials, modifiers, csm, gpgpu) are integrated as importable source via their barrels —
that is their integration; they are library primitives, not gallery showcases.

## Verification

- `npm run check-registry -w STUDIO` → 71 modules, 0 failed.
- `npm run build -w STUDIO` → built clean (3087 modules transformed; vendored source not in the app graph until imported).
- `npm run lint -w STUDIO` (`tsc --noEmit`) → 0 type errors across the full ported tree + all barrels.

WebGPU showcases were not visually confirmed (no reliable GPU on the build host); curated entries carry
`validation: { build:false, preview:false, console:false }` accordingly.
