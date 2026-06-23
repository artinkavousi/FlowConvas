# artinos-module — contract & patterns

Reference for `/artinos-module`. Copy these shapes; mirror an existing module in
`STUDIO/src/modules/` rather than inventing structure.

## Module folder contract

```
STUDIO/src/modules/<id>/
  <PascalId>Preview.tsx   # default export; bridge-driven preview
  <id>.module.ts          # default export: ArtinosModule, id === schema.id
  engine.js               # 3D/shader only: untyped Three.js core (allowJs, no checkJs)
```

Scaffold the boilerplate first: `npm run new-module -w STUDIO -- <id> --category <cat>`.

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

## 3D / shader module — untyped engine.js + typed .tsx wrapper

`engine.js` (no types; Three.js owns the loop + dispose):

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

`<PascalId>Preview.tsx` (typed wrapper owns canvas + ResizeObserver + dispose):

```tsx
import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createThing } from './engine.js';
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

## The entry (`<id>.module.ts`) — fill everything

Match a seed (`gpu-particles`, `crystal-knot`, `gooey-slider`). Required, non-stub:
`id`(===`schema.id`), `name`, `category` (canonical set), `description`, `tags`, `schema.parameters`
(each `key/label/type/default`, `min/max/step` for numbers), `preview`, `sourcePath` (must resolve),
`dependencies`, real `usage`, `presets`, `related`, `agentNotes`, `version`, `updatedAt`.

## Verify (DoD)

```bash
npm run check-registry -w STUDIO     # must be green; reports N modules across M categories
npm run lint -w STUDIO               # tsc --noEmit
# then load it live: control drives the preview, zero console errors
```

## Good vs bad

| Good | Bad |
|------|-----|
| One compact module folder, ported source verbatim | Whole demo repo dumped into the module |
| `engine.js` (untyped) + `.tsx` wrapper | `@types/three` / `@ts-expect-error` on the engine import |
| `agentNotes` lets an agent reuse it blind | `description`/`agentNotes` left as TODO |
| `category` from the canonical set | invented category that breaks gallery filters |
| check-registry green + live control proof | "it renders" with no gate run |
