# Ball Pool Mode B Conversion Proposal

Status: PROPOSAL ONLY - no implementation changes yet.

Input:
- CodePen: https://codepen.io/mrdoob/pen/dPpJMXB
- Title observed: "Ball Pool #2"
- Source author: mrdoob
- Source stack observed from the pen: Three.js WebGPU 0.184.0, TSL postprocessing, `@perplexdotgg/bounce` physics, pointer/touch interaction.

## Goal

Recreate the CodePen as an ARTINOS Mode B conversion: extract reusable canonical modules and rebuild the original as a faithful Lab capsule in `STUDIO/src/labs/ball-pool/`.

The result should preserve the original identity: black fullscreen stage, white room with red/green side walls, many colored bouncing spheres, a transparent glass sphere/light controlled by pointer motion, pointer ray impulse behavior, hold-to-respawn behavior, WebGPU SSGI/TRAA/Bloom look, responsive room width, and the original physics feel.

## Non-goals

- Do not replace the scene with a generic Three.js ball demo.
- Do not downgrade the primary implementation to WebGL/canvas unless WebGPU is unavailable only for a fallback notice.
- Do not split the source into deep helper taxonomy.
- Do not modify PANELFLOW unless a real public API gap is found.
- Do not invent source behavior beyond the inspected CodePen.

## Source Systems Found

1. WebGPU renderer and post stack
   - `THREE.WebGPURenderer`
   - `THREE.RenderPipeline`
   - TSL scene pass MRT: output, diffuse color, normal, velocity
   - SSGI, TRAA, and Bloom composition
   - ACES Filmic tone mapping and low exposure

2. Rigid-body ball-pool simulation
   - Bounce `World`
   - Static box walls, hidden front wall, red/green side walls
   - Dynamic sphere bodies
   - InstancedMesh sphere rendering
   - Responsive ball count based on room volume and fill ratio
   - Reusable particle-system concerns underneath the source: particle allocation, spawn bounds,
     per-particle color, transform sync, respawn/reset, renderer/material ownership, and physics-body
     adapter contracts.

3. Pointer and glass sphere interaction
   - Pointer ray eased toward target
   - Mouse/touch movement pushes nearby balls
   - Transparent physical glass sphere follows a spring toward the pointer plane
   - Point light follows the glass sphere
   - Pointer hold respawns several balls; two-finger touch triggers hold behavior on mobile

4. Lab composition and tuning
   - Camera fit-to-room
   - Source constants: ball radius, fill ratio, packing, room height/depth, wall thickness, camera FOV, ease speed, glass radius
   - Resize rebuilds scene and physics
   - Frame loop steps physics, syncs instances, syncs glass sphere/light, renders pipeline

## Reuse-First Check

Existing relevant ARTINOS modules include:
- `aurora-shader`: TSL/WebGPU fullscreen shader pattern.
- `gpu-particles`: WebGPU particle reference.
- `crystal-knot`: imperative Three.js engine plus React wrapper pattern.
- `webgpu-fluid-sim` and `fluid-sim`: WebGPU module/Lab precedent.

None of the inspected modules already provide the CodePen's specific rigid-body ball-pool room, Bounce physics, glass pointer collider, or SSGI room composition. The conversion should create new modules rather than extend an unrelated shader/fluid module.

Before implementation, run:

```bash
npm run check-registry -w STUDIO
```

Use the output to confirm there is no newer duplicate module before scaffolding.

## Proposed Mode B Outputs

This is a Mode B conversion with multiple reusable systems. The first proposal under-decomposed the
source by treating the renderer and adaptive room as ball-pool internals. The corrected decomposition
extracts the reusable rendering pipeline and the adaptive open-front room at minimum, then composes
them with a universal physics/WebGPU particle system, a Bounce adapter, and pointer interaction inside
the faithful Lab.

## Converter Decomposition Principle

For ARTINOS module conversion, the agent must analyze beyond the immediate demo and extract the
highest-value reusable systems that can grow the module library. The goal is not one module per demo;
the goal is properly categorized, generalized building blocks that can build many future modules and
Labs.

Apply this rule every time:
- Extract core reusable modules when the source contains clear reusable functionality.
- Keep modules universal where possible; make source-specific adapters local or smaller canonical
  adapters.
- Prefer functionality-first names and categories over demo-specific names when the system can support
  multiple future compositions.
- Preserve source fidelity in the Lab composition.
- Avoid fake abstraction: only extract systems with obvious reuse value and clean boundaries.
- Categorize by capability (`rendering/postfx`, `rendering/environments`, `physics/particles`,
  `input`, `webgpu`, `math`) rather than by the original demo name.

### Canonical Module 1: WebGPU SSGI Room Renderer

Path:

```txt
STUDIO/src/modules/rendering/postfx/
  WebgpuSsgiRoomRenderer.module.js
  WebgpuSsgiRoomRenderer.showcase.tsx
  WebgpuSsgiRoomRenderer.meta.ts
```

Id:

```txt
webgpu-ssgi-room-renderer
```

Purpose:
- A reusable Three.js WebGPU/TSL render pipeline for room/object scenes.
- Directly ports the CodePen's WebGPU renderer, MRT scene pass, SSGI, TRAA, Bloom composition, ACES tone mapping, and exposure behavior.
- Exposes `createWebgpuSsgiRoomRenderer(canvas, options)` returning `{ renderer, render(scene, camera), resize(width, height), update(options), dispose() }`.
- Lets future Labs reuse the same high-end room GI pipeline without copying the ball-pool simulation.

Controls:
- `toneMappingExposure`
- `giIntensity`
- `aoIntensity`
- `ssgiSliceCount`
- `ssgiStepCount`
- `bloomThreshold`
- `bloomStrength`
- `bloomRadius`
- `shadowMapSize`

Dependencies:
- `three`
- `webgpu`
- `react`

### Canonical Module 2: Adaptive Open-Front Box Room

Path:

```txt
STUDIO/src/modules/rendering/environments/
  AdaptiveOpenFrontBoxRoom.module.js
  AdaptiveOpenFrontBoxRoom.showcase.tsx
  AdaptiveOpenFrontBoxRoom.meta.ts
```

Id:

```txt
adaptive-open-front-box-room
```

Purpose:
- A reusable Cornell-box-like room/environment module with an open visual front and optional collision front.
- Directly extracts the source room model: white floor/ceiling/back, red left wall, green right wall, hidden front wall, wall thickness, responsive width from camera FOV/aspect, and camera fit-to-box logic.
- Avoids hard-binding to Bounce by returning wall descriptors and accepting optional adapters:
  - `createVisualWall(descriptor, material)`
  - `createCollisionWall(descriptor)`
- Exposes `createAdaptiveOpenFrontBoxRoom(scene, options)` returning `{ boxSize, wallMeshes, descriptors, fitCamera(camera), rebuild(size), dispose() }`.

Controls:
- `boxHeight`
- `boxDepth`
- `wallThickness`
- `cameraFov`
- `sideWallColors`
- `showCeiling`
- `showBackWall`
- `collisionFront`

Dependencies:
- `three`
- `react`

### Canonical Module 3: Universal Physics Particle System

Path:

```txt
STUDIO/src/modules/physics/particles/
  UniversalPhysicsParticleSystem.module.js
  UniversalPhysicsParticleSystem.showcase.tsx
  UniversalPhysicsParticleSystem.meta.ts
```

Id:

```txt
universal-physics-particles
```

Purpose:
- A reusable particle system for physics-driven visual particles, usable by WebGPU/Three scenes and
  multiple physics backends.
- Extracts the generic systems underneath the CodePen's balls: particle allocation, spawn bounds,
  color palettes, transform buffers, instanced sphere rendering, reset/respawn, resize/rebuild,
  per-frame sync, and lifecycle cleanup.
- Does not hard-code Bounce. It accepts a physics adapter that provides body creation, body reads,
  body reset, and impulse/force hooks.
- Provides a default Three/WebGPU renderer path using `InstancedMesh` under `WebGPURenderer`, plus an
  adapter boundary that can later support GPU-compute particles, Rapier, Cannon, custom WebGPU
  kernels, or non-sphere instancing.
- Exposes `createUniversalPhysicsParticles(scene, adapter, options)` returning `{ mesh, particles,
  rebuild(bounds), respawn(count), sync(), update(options), dispose() }`.

Controls:
- `particleCount`
- `particleRadius`
- `fillRatio`
- `packing`
- `colorPalette`
- `materialRoughness`
- `materialMetalness`
- `rendererMode`
- `respawnCount`

Dependencies:
- `three`
- `webgpu`
- `react`

### Canonical Module 4: Bounce Rigid Sphere Adapter

Path:

```txt
STUDIO/src/modules/physics/particles/
  BounceRigidSphereAdapter.module.js
  BounceRigidSphereAdapter.showcase.tsx
  BounceRigidSphereAdapter.meta.ts
```

Id:

```txt
bounce-rigid-sphere-adapter
```

Purpose:
- A reusable adapter between `@perplexdotgg/bounce` rigid bodies and the universal particle system.
- Directly ports the CodePen's Bounce world settings, sphere body creation, restitution/friction,
  damping, static wall collision creation, body reset, velocity reset, and orientation/position reads.
- Keeps the dependency on Bounce isolated so future particle modules can reuse
  `universal-physics-particles` without adopting Bounce.
- Exposes `createBounceRigidSphereAdapter(worldOptions)` returning `{ world, createSphereParticle,
  createBoxCollider, readTransform, resetBody, applyImpulse, applyForce, step, dispose }`.

Controls:
- `gravity`
- `restitution`
- `friction`
- `linearDamping`
- `angularDamping`
- `solveVelocityIterations`
- `solvePositionIterations`

Dependencies:
- `@perplexdotgg/bounce`
- `react`

### Canonical Module 5: Pointer Glass Collider

Path:

```txt
STUDIO/src/modules/input/
  PointerGlassCollider.module.js
  PointerGlassCollider.showcase.tsx
  PointerGlassCollider.meta.ts
```

Id:

```txt
pointer-glass-collider
```

Purpose:
- A reusable 3D pointer interaction module for ray-driven physics scenes.
- Directly extracts the source pointer ray easing, center-plane target hit, spring force to a physical glass sphere, linked point light, ray-near-body impulse, pointer hold state, and two-finger touch rule.
- Uses the physics adapter contract rather than reaching directly into Bounce, so it can push any
  compatible physics-particle backend.
- Exposes `createPointerGlassCollider(canvas, camera, physicsAdapter, options)` returning `{ glassMesh,
  light, update(dt, particles), resize(boxSize), dispose(), isPointerHeld() }`.

Controls:
- `glassRadius`
- `glassMass`
- `springStiffness`
- `springDamping`
- `pushRadius`
- `pushStrength`
- `lightIntensity`
- `easeSpeed`

Dependencies:
- `three`
- `react`

### Faithful Lab: Ball Pool

Path:

```txt
STUDIO/src/labs/ball-pool/
  BallPoolLab.tsx
  BallPoolLab.meta.ts
  createBallPoolLab.js
  modules/
    rendering/
      postfx/
        WebgpuSsgiRoomRenderer.module.js
      environments/
        AdaptiveOpenFrontBoxRoom.module.js
    physics/
      particles/
        UniversalPhysicsParticleSystem.module.js
        BounceRigidSphereAdapter.module.js
    input/
      PointerGlassCollider.module.js
  local/
    presets/
      BallPoolPresets.ts
    tuning/
      sourceTuning.ts
    composition/
      ballPoolComposition.ts
```

Id:

```txt
ball-pool
```

Purpose:
- The faithful replica of the CodePen, wired through ARTINOS/PANELFLOW bridge controls.
- Composes the canonical render pipeline, adaptive room, universal particle system, Bounce adapter,
  and pointer/glass interaction.
- Uses local snapshots of those canonical modules so the Lab stays copy-pasteable.
- Carries only project-specific presets, source tuning, and composition glue.

Default preset:
- Match CodePen defaults as closely as possible.

Optional ARTINOS presets:
- `CodePen Original`: exact source constants.
- `Dense Gallery`: higher fill ratio, same radius.
- `Slow Glass`: heavier glass sphere, slower response.
- `Low GI`: lower SSGI/Bloom cost for weaker GPUs.

Related modules:
- `webgpu-ssgi-room-renderer`
- `adaptive-open-front-box-room`
- `universal-physics-particles`
- `bounce-rigid-sphere-adapter`
- `pointer-glass-collider`

## Implementation Milestones

### Milestone 1 - Source capture and dependency proof

Tasks:
- Save the inspected CodePen source into a local reference note or cite it in provenance.
- Confirm `STUDIO` currently uses `three@0.184.0`.
- Add `@perplexdotgg/bounce` to `STUDIO/package.json` only during implementation.
- Confirm Vite can resolve `three/webgpu`, `three/tsl`, and the required Three addons.

Acceptance:
- Source provenance recorded.
- Dependency plan is explicit.

### Milestone 2 - Canonical rendering and room modules

Tasks:
- Scaffold `webgpu-ssgi-room-renderer` under `rendering/postfx`.
- Port the CodePen `RenderPipeline`, MRT, SSGI, TRAA, Bloom, tone mapping, and resize lifecycle into it.
- Scaffold `adaptive-open-front-box-room` under `rendering/environments`.
- Port the open-front room dimensions, wall descriptors, materials, camera fit, responsive width, visual walls, and optional collision-wall adapter into it.
- Keep Three.js source in untyped `.js` module files.
- Add a thin typed React showcase that owns canvas ref, `ResizeObserver`, bridge reads, and cleanup.
- Apply bridge defaults outside the `useBridgeStore` selector.

Acceptance:
- Both entries have complete metadata, usage, dependencies, presets, related modules, provenance, and agent notes.
- `schema.id === id` for both modules.
- The room showcase demonstrates the room without ball-pool physics.
- The renderer showcase demonstrates GI/Bloom controls against a simple room/object composition.

### Milestone 3 - Canonical universal particle, physics adapter, and interaction modules

Tasks:
- Scaffold `universal-physics-particles` under `physics/particles`.
- Extract generic particle allocation, spawn bounds, per-instance material/color, instanced rendering,
  respawn, resize/rebuild, sync, and cleanup from the CodePen balls.
- Scaffold `bounce-rigid-sphere-adapter` under `physics/particles`.
- Port the Bounce world/body/collider logic as an adapter used by the universal particle system.
- Scaffold `pointer-glass-collider` under `input`.
- Port the pointer events, eased ray target, glass sphere material/body, linked point light, spring force, ray impulse, pointer hold, and two-finger touch behavior.
- Keep the APIs compact and scene-agnostic enough to reuse outside this Lab.

Acceptance:
- All three entries have complete metadata and provenance.
- The universal particle system can run with the Bounce adapter in the adaptive room.
- The pointer collider can push an arbitrary list of compatible particles through the adapter, not only ball-pool bodies.

### Milestone 4 - Faithful Lab capsule

Tasks:
- Create `STUDIO/src/labs/ball-pool/`.
- Copy all five canonical modules into `labs/ball-pool/modules/` as snapshots.
- Add Lab-local presets/tuning/composition files only if they earn their place.
- Build `createBallPoolLab.js` as the exact source composition:
  renderer -> room -> Bounce adapter/world -> wall collisions -> universal particles -> pointer glass collider -> frame loop -> render pipeline.
- Register `BallPoolLab.meta.ts` with `category: 'lab'`, `tags: ['lab', 'replica', ...]`, and `related` pointing to all canonical modules.

Acceptance:
- Lab runs independently from its snapshot copies.
- Metadata describes what was copied, what changed, and what was dropped.

### Milestone 5 - Fidelity pass and ARTINOS controls

Tasks:
- Compare against the CodePen behavior:
  - room framing and aspect-dependent width
  - ball count density
  - wall colors and black background
  - glass sphere refraction/transmission look
  - pointer push behavior
  - hold/touch respawn behavior
  - SSGI/Bloom tone
- Tune only where integration requires it.
- Ensure controls drive live parameters without remount loops.

Acceptance:
- Visual behavior is close to the source.
- Any unavoidable deviations are documented in `agentNotes` / `reuseNotes` and final report.

### Milestone 6 - Verification

Commands:

```bash
npm run check-registry -w STUDIO
npm run lint -w STUDIO
npm run build -w STUDIO
```

Runtime checks:
- Start STUDIO dev server.
- Open the Studio route.
- Select each canonical module, then `ball-pool`.
- Confirm each preview renders.
- Confirm controls affect the live scene.
- Confirm pointer movement pushes balls and moves the glass sphere/light.
- Confirm pointer hold respawns balls.
- Confirm zero console errors.
- Capture at least one desktop screenshot.

WebGPU note:
- If the in-app browser cannot get a GPU adapter, report that environment limitation and verify in a GPU-capable browser instead.

## Planned Deviations From Source

Expected minimum deviations:
- CodePen import map becomes normal package imports.
- `document.body.appendChild(renderer.domElement)` becomes canvas-owned React lifecycle.
- `window.innerWidth/window.innerHeight` becomes container/canvas dimensions.
- Global event listeners become canvas-scoped listeners where possible, with cleanup.
- Source constants become bridge-driven controls and presets.
- CodePen editor scaffolding is discarded.

Avoided deviations:
- No generic material/physics rewrite.
- No WebGL replacement for the main path.
- No simplified cube/ball sample.
- No loss of source interaction behavior.

## Risk Register

1. WebGPU support
   - Risk: Browser or adapter unavailable.
   - Mitigation: Keep dependency `webgpu` in metadata, show capability notice, verify in GPU-capable browser when needed.

2. Three.js addon API drift
   - Risk: SSGI/TRAA/Bloom node APIs are version-sensitive.
   - Mitigation: `STUDIO` already declares `three@0.184.0`, matching the CodePen. Do not upgrade Three during the port.

3. Bounce package API
   - Risk: `@perplexdotgg/bounce` must be installed and bundled by Vite.
   - Mitigation: Add the exact package used by the source, `@perplexdotgg/bounce@1.8.0`, then smoke test import/build before deeper changes.

4. Performance
   - Risk: Ball count scales with room volume and can become heavy.
   - Mitigation: Expose density/quality controls, cap count when needed, and publish honest telemetry if the module uses the performance monitor.

5. Module sprawl
   - Risk: Over-decomposing a single CodePen into many weak modules.
   - Mitigation: Extract only systems with obvious reuse: render pipeline, adaptive room, universal
     particle system, Bounce adapter, pointer/glass interaction. Keep project-specific composition and
     presets in the Lab.

## Completion Gate For Implementation

The conversion is only PASS when:
- `webgpu-ssgi-room-renderer` is registered and discoverable.
- `adaptive-open-front-box-room` is registered and discoverable.
- `universal-physics-particles` is registered and discoverable.
- `bounce-rigid-sphere-adapter` is registered and discoverable.
- `pointer-glass-collider` is registered and discoverable.
- `ball-pool` Lab is registered and discoverable.
- `npm run check-registry -w STUDIO` passes.
- `npm run lint -w STUDIO` passes.
- `npm run build -w STUDIO` passes.
- Live preview renders with zero console errors in a WebGPU-capable browser.
- At least one control drives the scene.
- Pointer interaction matches the source.
- Fidelity deviations are reported clearly.

Until those are proven, the implementation must be reported as BLOCKED or incomplete, not PASS.
