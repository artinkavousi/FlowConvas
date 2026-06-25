# artinos-module — contract & patterns

Reference for `/artinos-module`. Copy these shapes; use the self-contained library module + Lab
capsule pipeline rather than inventing structure. The full conceptual model, the two
conversion modes, and the final report format live in the master guideline
`ARTINPRD MODULE CONVERTER.md` (repo root); the operational procedure is `spec/converter-workflow.md`.

## Module folder contract

```
STUDIO/src/modules/<category>/
  <Feature>.module.tsx    # self-contained runtime/component source
  <Feature>.showcase.tsx  # bridge-driven live showcase
  <Feature>.meta.ts       # default export: ArtinosModule, id === schema.id
```

Scaffold the boilerplate first: `npm run new-module -w STUDIO -- <id> --category <category/path>`.

## UI module — preview reads the bridge (ADR-13)

```tsx
import { useBridgeStore } from '@artinos/panelflow';
const BRIDGE_ID = 'magnetic-dock';

export default function MagneticDockPreview() {
  const v = useBridgeStore((s) => s.componentValues[BRIDGE_ID]); // raw slice
  const magnify = (v?.magnify as number) ?? 1.8;                 // default OUTSIDE the selector
  // ...render from values; pure react, no extra deps where possible
}
```

Never `useBridgeStore((s) => s.componentValues[id] || {})` — a fresh `{}` each render loops
`useSyncExternalStore` on getSnapshot.

## 3D / shader module — self-contained runtime + typed showcase

`AuroraShader.module.ts` (Three.js owns the loop + dispose):

```js
import * as THREE from 'three';            // or 'three/webgpu' + 'three/tsl' for WebGPU/TSL
export function createThing(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  // ...scene/camera/mesh...
  const resize = () => { /* renderer.setSize(w,h,false); camera.aspect=…; */ };
  let raf = 0; const tick = () => { /* update + render */ raf = requestAnimationFrame(tick); };
  resize(); tick();
  return {
    update(params) { /* apply bridge params: material.color.set(params.color), etc. */ },
    resize,
    dispose() { cancelAnimationFrame(raf); /* geometry/material/renderer .dispose() */ },
  };
}
```

`AuroraShader.showcase.tsx` (typed wrapper owns canvas + ResizeObserver + dispose):

```tsx
import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createThing } from './AuroraShader.module';
const BRIDGE_ID = 'thing';

export default function ThingPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(p: unknown): void; resize(): void; dispose(): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = createThing(canvasRef.current); engineRef.current = engine;
    const ro = new ResizeObserver(() => engine.resize()); ro.observe(canvasRef.current);
    return () => { ro.disconnect(); engine.dispose(); engineRef.current = null; };
  }, []);
  useEffect(() => { engineRef.current?.update(values ?? {}); }, [values]);

  return <div className="w-full h-full"><canvas ref={canvasRef} className="w-full h-full block" /></div>;
}
```

WebGPU/TSL: import from `three/webgpu` (`WebGPURenderer`, `MeshBasicNodeMaterial`) and `three/tsl`
(`uv`, `time`, `sin`, `mix`, `uniform`), use `renderer.setAnimationLoop(...)`, and set
`dependencies: ['three','webgpu','react']` so the WebGPU degrade notice fires.

## The entry (`<Feature>.meta.ts`) — fill everything

Match a seed (`gpu-particles`, `crystal-knot`, `gooey-slider`). Required, non-stub:
`id`(===`schema.id`), `name`, `category` (explicit path such as `webgpu`, `physics/fluid`, `shaders`, `lab`),
`description`, `tags`, `schema.parameters` (each `key/label/type/default`, `min/max/step` for
numbers), `preview`, `sourcePath` (must resolve), `dependencies`, real `usage`, `presets`, `related`,
`agentNotes`, `version`, `updatedAt`. For a conversion, record **provenance** in
`agentNotes`/`reuseNotes` — where it was ported from + what was dropped/changed (mirror the
Lab entries list the canonical module ids in `related` and record snapshot provenance.

## Mode B Lab capsule

```
STUDIO/src/labs/<id>/
  <PascalId>Lab.tsx
  <PascalId>Lab.meta.ts
  create<PascalId>Lab.js
  modules/
    webgpu/
    physics/
      fluid/
    input/
  local/
    presets/
    composition/
    tuning/
    interaction/
```

`modules/` contains local copied snapshots of required canonical modules so the Lab is portable.
`local/` contains project-specific modules only. Promote local code into `STUDIO/src/modules/` only
after it proves reusable across multiple Labs.

## Smart decomposition pattern — decompose aggressively, lift the universal primitives

Extract the **maximum set** of genuinely reusable cores before building the Lab, and **look under the
domain for the universal primitives** — the non-domain systems hiding inside a demo are usually the
bigger library win. For each system ask *"what is its generalized form, and what else could it build?"*

A physics/WebGPU CodePen should not become one `codepen-demo` module if it contains:

```
rendering/postfx/WebgpuSsgiRoomRenderer.module.js
rendering/environments/AdaptiveOpenFrontBoxRoom.module.js
physics/particles/UniversalPhysicsParticleSystem.module.js
physics/particles/BounceRigidSphereAdapter.module.js
input/PointerGlassCollider.module.js
labs/ball-pool/...
```

Likewise a single-file TSL fluid CodePen ("TSL_Fluid") decomposes into **two universal cores + two
domain cores + one universal input** — only one module is fluid-specific:

```
webgpu/TslComputeField2D.module.js              # universal GPGPU ping-pong substrate (any grid sim)
math/TslGridSampling.module.js                  # universal index/neighbor/bilinear sampling
physics/fluid/TslStableFluids2D.module.js       # the ONLY fluid-specific module (built on the cores)
rendering/screenspace/TslFieldColorDisplay.module.js  # colormap display of ANY field
input/PointerVelocitySplat.module.js            # universal 2D pointer-velocity splats
labs/tsl-fluid/...                              # faithful composition + bloom + presets
```

The Lab preserves the original composition; the canonical modules are named by general capability so
future scenes reuse the substrate, sampling, display, particles, or interaction without inheriting the
demo's one-off glue. **Prove it:** each core's showcase must run it **outside** the source's domain
(the compute-field runs a non-fluid kernel; the field-display visualizes an arbitrary field). If a
candidate can't stand alone, fold it back in — no fake `utils/index/types` files. Both under- and
over-decomposition are failures; aim high, but every module earns its place by standalone reuse.

## Verify (DoD)

```bash
npm run check-registry -w STUDIO     # must be green; reports N modules across M categories
npm run lint -w STUDIO               # tsc --noEmit
# then load it live: control drives the preview, zero console errors
```

## Good vs bad

| Good | Bad |
|------|-----|
| One compact module source, ported source verbatim | Whole demo repo dumped into the module |
| `*.module.ts(x)` runtime + `*.showcase.tsx` wrapper | Generic rewrite that only resembles the source |
| `agentNotes` lets an agent reuse it blind | `description`/`agentNotes` left as TODO |
| Explicit category path | vague category that hides the domain |
| check-registry green + live control proof | "it renders" with no gate run |
