# PANELFLOW — Implementation & Adjustments Guide

> **Purpose:** All changes required to make PANELFLOW a fully standalone, reusable package ready for integration into ARTINOS or any other React project.
> **Date:** 2026-06-22
> **Status:** Draft — Awaiting PRD approval before execution

---

## 1. Current State Audit

### 1.1 What Works Today

| System | Status | Notes |
|--------|--------|-------|
| Panel OS (registry, store, types) | ✅ Functional | Clean architecture, Zustand-based |
| Editor Dock (dock modes, resize, float) | ✅ Functional | Bottom/left/right/float all work |
| Icon Rail (panel navigation) | ✅ Functional | Active/selected/open states |
| Panel Chrome (header, close, float toggle) | ✅ Functional | Glass styling, drag handle |
| Command Palette (Ctrl+K) | ✅ Functional | cmdk-based, panel opening |
| Graph Canvas (XYFlow, nodes, edges) | ✅ Functional | Custom nodes, physics bridge |
| Dot Grid Background | ✅ Functional | Custom SVG, radial gradient |
| Inspector Panel | ✅ Functional | Node property editing with GooeySlider |
| Scene Panel | ✅ Functional | Full rendering pipeline controls |
| Engine Status Panel | ✅ Functional | FPS, backend, diagnostics |
| Code Panel | ✅ Functional | Read-only graph serialization |
| Component Library Panel | ✅ Functional | GooeySlider, BubbleRating, ElasticMenu demos |
| Design Tokens (CSS + JS) | ✅ Functional | Dual-format, glass surfaces |
| Tweakpane Frost Library | ✅ Present | Full library with plugins and CSS |
| OS Panel Node (float panels on canvas) | ✅ Functional | Dock ↔ float transition |

### 1.2 What's Missing / Broken

| Gap | Severity | Description |
|-----|----------|-------------|
| **No package export surface** | 🔴 Critical | `export.ts` is a stub: `export const exportCapsule = ...` — no real public API |
| **No package.json identity** | 🔴 Critical | Package name is `react-example`, not `@artinos/panelflow` |
| **No build config for library mode** | 🔴 Critical | Vite only configured for dev server, not library bundling |
| **Viewport tightly coupled** | 🟡 Major | `viewport.tsx` imports Three.js directly — should be host-provided |
| **No Control Panel Engine** | 🟡 Major | The "intelligent auto-generation" feature doesn't exist yet |
| **Tweakpane not integrated into panels** | 🟡 Major | Frost Tweakpane exists as files but isn't wired into any panel |
| **No ControlBridge API** | 🟡 Major | No standardized state sync interface for host projects |
| **Graph nodes tightly coupled to demo data** | 🟠 Moderate | SEED_NODES reference specific TSL types |
| **No PanelFlowProvider** | 🟠 Moderate | No top-level context provider for consumers |
| **Demo dependencies in main deps** | 🟠 Moderate | Three.js, R3F, express, dotenv in production deps |
| **Archive.html** | 🟢 Minor | 122KB archive file — should be removed or moved to docs |
| **Dockview deps unused** | 🟢 Minor | `dockview` + `dockview-core` installed but not used |

---

## 2. Required Adjustments — By Subsystem

---

### 2.1 Package Configuration

#### 2.1.1 Update `package.json`

```diff
- "name": "react-example",
+ "name": "@artinos/panelflow",
  "private": true,
  "version": "0.1.0",
+ "description": "High-end reusable panel system for building interactive visual tools and editor workspaces",
  "type": "module",
+ "main": "dist/panelflow.cjs.js",
+ "module": "dist/panelflow.es.js",
+ "types": "dist/index.d.ts",
+ "exports": {
+   ".": {
+     "import": "./dist/panelflow.es.js",
+     "require": "./dist/panelflow.cjs.js",
+     "types": "./dist/index.d.ts"
+   },
+   "./styles": "./dist/panelflow.css",
+   "./frost": "./src/lib/tweakpane_frost/frost-tweakpane.js"
+ },
+ "files": ["dist", "src/lib/tweakpane_frost"],
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
-   "build": "vite build",
+   "build": "vite build && npm run build:lib",
+   "build:lib": "vite build --config vite.lib.config.ts",
    "preview": "vite preview",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit"
  },
```

#### 2.1.2 Create `vite.lib.config.ts` (library build)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  'react/jsx-runtime',
];

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/export.ts'),
      name: 'PanelFlow',
      formats: ['es', 'cjs'],
      fileName: (format) => `panelflow.${format}.js`,
    },
    rollupOptions: {
      external,
      output: { globals: { react: 'React', 'react-dom': 'ReactDOM' } },
    },
    cssCodeSplit: false,
    outDir: 'dist',
  },
});
```

#### 2.1.3 Move Demo-Only Dependencies to `devDependencies`

Move these from `dependencies` → `devDependencies`:
- `three`, `three-stdlib`, `@react-three/fiber`, `@react-three/drei`
- `express`, `dotenv`, `@google/genai`
- `dockview`, `dockview-core`

Add to `peerDependencies`:
- `react: "^18.0.0 || ^19.0.0"`
- `react-dom: "^18.0.0 || ^19.0.0"`

---

### 2.2 Export Surface — `src/export.ts`

**Current state:** Stub placeholder.

**Required:** Full public API surface.

```typescript
// ── Core Provider ─────────────────────────────────────────────
export { PanelFlowProvider } from './panel-os/PanelFlowProvider';

// ── Panel OS ──────────────────────────────────────────────────
export { definePanel } from './panel-os/define-panel';
export { usePanelOSStore } from './panel-os/panel-store';
export { PANEL_REGISTRY, PANEL_DEFINITIONS, getPanelDefinition } from './panel-os/panel-registry';
export { PanelShell } from './panel-os/panel-shell';
export type { PanelDefinition, PanelCapabilities } from './panel-os/panel-types';
export type { DockMode, DockFloatRect } from './panel-os/panel-store';

// ── Shell Components ──────────────────────────────────────────
export { EditorDock } from './shell/editor-dock';
export { IconRail } from './shell/icon-rail';
export { PanelChrome } from './shell/panel-chrome';
export { CommandPalette, openPanelById } from './shell/command-palette';

// ── Graph Canvas ──────────────────────────────────────────────
export { GraphCanvas } from './graph/graph-canvas';
export { useGraphStore, hydrateGraph, resetWorkspace } from './graph/graph-store';
export { UniversalNode } from './graph/universal-node';
export { OSPanelNode } from './graph/os-panel-node';
export { DotGridBackground } from './graph/dot-grid-background';
export type { FluidityNode, FluidityNodeData, FluidityEdge } from './graph/graph-store';

// ── Control Panel Engine (NEW) ────────────────────────────────
export { registerComponent, unregisterComponent, generatePanelFromSchema } from './control-engine';
export type { ComponentSchema, ParameterDef, ModifierDef, ControlBridge } from './control-engine';

// ── Design System ─────────────────────────────────────────────
export { THEME, token, injectTheme } from './studio-theme';

// ── Component Library ─────────────────────────────────────────
export { GooeySlider } from './components/GooeySlider';
export { BubbleRatingSlider } from './components/BubbleRatingSlider';
export { ElasticMenu } from './components/ElasticMenu';
export { Tooltip } from './components/ui/tooltip';
export { IconButton } from './components/ui/icon-button';

// ── Workspace (Demo/Example) ─────────────────────────────────
export { Workspace } from './workspace';
```

---

### 2.3 Viewport Decoupling

**Problem:** [viewport.tsx](file:///g:/CODE2026/.PROJECTS/ARTINOS/PANELFLOW/src/shell/viewport.tsx) imports `three/webgpu`, `three/tsl`, `three-stdlib` directly. This creates a hard dependency on Three.js for all consumers.

**Solution:** Make the viewport a **slot-based** component.

#### 2.3.1 Create Viewport Slot Interface

```typescript
// shell/viewport-slot.tsx (NEW)
interface ViewportSlotProps {
  children?: React.ReactNode;  // Host renders their content here
  className?: string;
  style?: React.CSSProperties;
}

export function ViewportSlot({ children, className, style }: ViewportSlotProps) {
  return (
    <div className={className} style={{ position: 'absolute', inset: 0, ...style }}>
      {children}
    </div>
  );
}
```

#### 2.3.2 Move Current Viewport to Demo

```
src/shell/viewport.tsx → src/demo/viewport-demo.tsx
```

The demo app imports and renders the Three.js viewport; the package exports only the `ViewportSlot`.

#### 2.3.3 Update Workspace Component

```tsx
// workspace.tsx — package version
export function Workspace({ viewport }: { viewport?: React.ReactNode }) {
  return (
    <main>
      <ViewportSlot>{viewport}</ViewportSlot>
      <EditorDock />
      <CommandPalette />
    </main>
  );
}
```

---

### 2.4 Control Panel Engine — New Implementation

**This is the major new feature.** A system that auto-generates control panels from component schemas.

#### 2.4.1 File: `src/control-engine.ts` (NEW)

```typescript
// Core schema types
export interface ParameterDef {
  key: string;
  label: string;
  type: 'number' | 'color' | 'boolean' | 'string' | 'vec2' | 'vec3' | 'enum' | 'range';
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
  group?: string;
  ui?: 'slider' | 'knob' | 'toggle' | 'dropdown' | 'color-picker' | 'tweakpane';
}

export interface ModifierDef {
  id: string;
  name: string;
  enabled: boolean;
  parameters: ParameterDef[];
}

export interface ComponentSchema {
  id: string;
  name: string;
  description?: string;
  category: string;
  icon?: React.ComponentType;
  parameters: ParameterDef[];
  modifiers?: ModifierDef[];
}

export interface ControlBridge {
  onParameterChange: (componentId: string, key: string, value: any) => void;
  setParameterValues: (componentId: string, values: Record<string, any>) => void;
  notifyComponentTreeChange: (components: ComponentSchema[]) => void;
  getLayoutState: () => any;
  restoreLayout: (state: any) => void;
}

// Registry
const componentRegistry = new Map<string, ComponentSchema>();
const listeners = new Set<() => void>();

export function registerComponent(schema: ComponentSchema): void {
  componentRegistry.set(schema.id, schema);
  listeners.forEach(fn => fn());
}

export function unregisterComponent(id: string): void {
  componentRegistry.delete(id);
  listeners.forEach(fn => fn());
}

export function getRegisteredComponents(): ComponentSchema[] {
  return Array.from(componentRegistry.values());
}

export function onRegistryChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Panel generation from schema
export function generatePanelFromSchema(schema: ComponentSchema): PanelDefinition {
  return definePanel({
    id: `auto-${schema.id}`,
    title: schema.name,
    description: schema.description || `Control panel for ${schema.name}`,
    icon: schema.icon || SlidersHorizontal,
    defaultPlacement: 'right',
    defaultSize: 320,
    capabilities: { floatable: true, closable: true, resizable: true },
    component: () => <AutoGeneratedPanel schema={schema} />,
    tags: ['auto', schema.category],
  });
}
```

#### 2.4.2 File: `src/panels/auto-panel.tsx` (NEW)

A React component that renders a control panel from a `ComponentSchema`, using either Tweakpane Frost or native React controls depending on parameter type and `ui` hint.

**Key behaviors:**
- Groups parameters by `group` field
- Uses GooeySlider for ranged numbers
- Uses Tweakpane Frost for complex types (vec2, vec3, bezier curves, camera rings)
- Maintains its own local state store synchronized via ControlBridge
- Falls back gracefully if the target component unmounts
- Self-contained: carries all subscriptions, no external store dependency

---

### 2.5 Tweakpane Frost React Wrapper

**Problem:** Tweakpane Frost is a vanilla JS class (`FrostTweakpane`) that manipulates the DOM directly. It needs a React wrapper for clean integration.

#### 2.5.1 File: `src/lib/tweakpane_frost/useFrostPane.ts` (NEW)

```typescript
import { useRef, useEffect, useCallback } from 'react';
import { FrostTweakpane } from './frost-tweakpane.js';

interface UseFrostPaneOptions {
  params: Record<string, any>;
  onChange?: (key: string, value: any) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function useFrostPane({ params, onChange, containerRef }: UseFrostPaneOptions) {
  const paneRef = useRef<FrostTweakpane | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const pane = new FrostTweakpane(containerRef.current);
    paneRef.current = pane;

    // Wire up change listeners
    // ... parameter binding logic

    return () => {
      pane.dispose();
      paneRef.current = null;
    };
  }, [containerRef]);

  return paneRef;
}
```

#### 2.5.2 File: `src/lib/tweakpane_frost/FrostPanePanel.tsx` (NEW)

A React component that mounts a Tweakpane Frost instance inside a PanelShell:

```tsx
export function FrostPanePanel({ 
  schema, 
  values, 
  onChange 
}: {
  schema: ComponentSchema;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mount Tweakpane Frost, build bindings from schema.parameters
  // Sync values bi-directionally
  
  return (
    <PanelShell noPadding>
      <div ref={containerRef} className="frost-tweakpane w-full h-full" />
    </PanelShell>
  );
}
```

---

### 2.6 PanelFlowProvider — Top-Level Context

**File:** `src/panel-os/PanelFlowProvider.tsx` (NEW)

```tsx
import React, { useEffect } from 'react';
import { injectTheme } from '@/studio-theme';
import { onRegistryChange, getRegisteredComponents, generatePanelFromSchema } from '@/control-engine';
import { PANEL_REGISTRY } from './panel-registry';

interface PanelFlowProviderProps {
  children: React.ReactNode;
  theme?: 'dark' | 'light' | 'system';
  injectStyles?: boolean;
}

export function PanelFlowProvider({ 
  children, 
  theme = 'dark',
  injectStyles = true 
}: PanelFlowProviderProps) {
  // Inject design tokens
  useEffect(() => {
    if (injectStyles) injectTheme();
  }, [injectStyles]);

  // Watch for component registrations and auto-generate panels
  useEffect(() => {
    const sync = () => {
      const schemas = getRegisteredComponents();
      for (const schema of schemas) {
        const panelId = `auto-${schema.id}`;
        if (!PANEL_REGISTRY[panelId]) {
          PANEL_REGISTRY[panelId] = generatePanelFromSchema(schema);
        }
      }
    };
    sync();
    return onRegistryChange(sync);
  }, []);

  return <>{children}</>;
}
```

---

### 2.7 Graph Canvas Cleanup

#### 2.7.1 Decouple Seed Data

Move `SEED_NODES` and `SEED_EDGES` from [graph-store.ts](file:///g:/CODE2026/.PROJECTS/ARTINOS/PANELFLOW/src/graph/graph-store.ts) to a separate demo file:

```
src/graph/graph-store.ts  →  Remove SEED_NODES/SEED_EDGES
src/demo/seed-graph.ts    →  Export SEED_NODES, SEED_EDGES (demo only)
```

The store should start empty; the host project (or demo) hydrates it.

#### 2.7.2 Make SceneSettings Optional

`SceneSettings` and `StatsState` are Three.js-specific. For the core package:
- Keep them as optional extensions
- The graph store should work without scene/stats
- Scene-related state moves to a separate `useSceneStore` (or stays but is ignored by non-3D hosts)

#### 2.7.3 Capsule Preview Cleanup

[capsule-preview.ts](file:///g:/CODE2026/.PROJECTS/ARTINOS/PANELFLOW/src/capsule-preview.ts) is a demo artifact. Move to `src/demo/` or remove.

---

### 2.8 Design System Isolation

#### 2.8.1 CSS Import Strategy

The package should export its CSS as a single file:
```
dist/panelflow.css  →  Contains tokens.css + globals.css + dockview-theme.css + frost-tweakpane.css
```

Consumers import one line:
```typescript
import '@artinos/panelflow/styles';
```

#### 2.8.2 Tailwind Decoupling

**Problem:** The current code uses Tailwind v4 utility classes extensively. Package consumers may not use Tailwind.

**Solution options:**

1. **Bundle Tailwind output** — Run Tailwind during library build, output static CSS. Consumers get pre-built styles.
2. **Keep Tailwind as peer dependency** — Document that consumers need Tailwind v4+.
3. **Hybrid** — Use CSS modules + vanilla CSS for core components, Tailwind for demo only.

**Recommendation:** Option 1 (Bundle Tailwind output) for maximum portability. The library build step runs Tailwind and produces a single CSS file with all utility classes resolved.

---

### 2.9 State Bridge Implementation

#### 2.9.1 File: `src/control-engine/bridge.ts` (NEW)

```typescript
import { create } from 'zustand';

interface BridgeState {
  // Component ID → { paramKey → value }
  componentValues: Record<string, Record<string, any>>;
  
  // Set a single parameter value
  setParam: (componentId: string, key: string, value: any) => void;
  
  // Set all values for a component
  setAllParams: (componentId: string, values: Record<string, any>) => void;
  
  // Subscribe to changes for a specific component
  // (Zustand's subscribe with selector handles this)
}

export const useBridgeStore = create<BridgeState>((set, get) => ({
  componentValues: {},
  setParam: (componentId, key, value) => set(state => ({
    componentValues: {
      ...state.componentValues,
      [componentId]: {
        ...state.componentValues[componentId],
        [key]: value,
      }
    }
  })),
  setAllParams: (componentId, values) => set(state => ({
    componentValues: {
      ...state.componentValues,
      [componentId]: values,
    }
  })),
}));
```

Host projects subscribe to changes:

```typescript
// In the host project
useBridgeStore.subscribe(
  state => state.componentValues['my-sphere'],
  (sphereValues) => {
    // Apply to the rendered component
    mesh.material.color.set(sphereValues.color);
    mesh.scale.setScalar(sphereValues.radius);
  }
);
```

---

## 3. Dependency Cleanup

### 3.1 Move to `devDependencies`

```json
{
  "devDependencies": {
    "three": "^0.184.0",
    "three-stdlib": "^2.36.1",
    "@react-three/drei": "^10.7.7",
    "@react-three/fiber": "^9.6.1",
    "@google/genai": "^2.4.0",
    "express": "^4.21.2",
    "dotenv": "^17.2.3",
    "dockview": "^6.6.1",
    "dockview-core": "^6.6.1"
  }
}
```

### 3.2 Add to `peerDependencies`

```json
{
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  }
}
```

### 3.3 Keep in `dependencies` (shipped with package)

```json
{
  "dependencies": {
    "@xyflow/react": "^12.11.0",
    "zustand": "^5.0.14",
    "framer-motion": "^12.40.0",
    "lucide-react": "^0.546.0",
    "cmdk": "^1.1.1",
    "@radix-ui/react-tooltip": "^1.2.10",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.6.0",
    "dagre": "^0.8.5",
    "tweakpane": "^4.0.5"
  }
}
```

---

## 4. File Changes Summary

### 4.1 New Files

| File | Purpose |
|------|---------|
| `vite.lib.config.ts` | Library build configuration |
| `src/panel-os/PanelFlowProvider.tsx` | Top-level provider component |
| `src/control-engine.ts` | Component schema registry + auto-panel generation |
| `src/control-engine/bridge.ts` | Bi-directional state sync store |
| `src/panels/auto-panel.tsx` | Auto-generated panel renderer |
| `src/lib/tweakpane_frost/useFrostPane.ts` | React hook for Tweakpane Frost |
| `src/lib/tweakpane_frost/FrostPanePanel.tsx` | React component wrapping Frost pane |
| `src/shell/viewport-slot.tsx` | Host-provided viewport slot |
| `src/demo/viewport-demo.tsx` | Three.js viewport (demo only) |
| `src/demo/seed-graph.ts` | Seed nodes/edges (demo only) |

### 4.2 Modified Files

| File | Changes |
|------|---------|
| `package.json` | Name, exports, dep reorganization |
| `src/export.ts` | Complete rewrite — full public API |
| `src/workspace.tsx` | Accept viewport as prop/slot |
| `src/graph/graph-store.ts` | Remove seed data, make scene optional |
| `src/panel-os/panel-registry.ts` | Support dynamic registration from control engine |
| `src/App.tsx` | Import from demo viewport |

### 4.3 Moved Files

| From | To | Reason |
|------|----|--------|
| `src/shell/viewport.tsx` | `src/demo/viewport-demo.tsx` | Decouple Three.js |
| `src/capsule-preview.ts` | `src/demo/capsule-preview.ts` | Demo-only concern |

### 4.4 Deleted Files

| File | Reason |
|------|--------|
| `archive.html` | Legacy artifact (122KB), should be in DOCS or removed |

---

## 5. Implementation Phases

### Phase 1: Package Foundation (Priority: 🔴 Critical)

1. Update `package.json` identity and structure
2. Create `vite.lib.config.ts` for library builds
3. Rewrite `src/export.ts` with full public API
4. Create `PanelFlowProvider` component
5. Move demo-only dependencies to devDependencies
6. Verify library build produces clean output

### Phase 2: Viewport Decoupling (Priority: 🔴 Critical)

1. Create `ViewportSlot` component
2. Move current viewport to `src/demo/`
3. Update `Workspace` to accept viewport as prop
4. Remove Three.js from core import paths
5. Verify demo still works with moved viewport

### Phase 3: Control Panel Engine (Priority: 🟡 Major)

1. Implement `ComponentSchema` types and registry
2. Build `registerComponent()` / `unregisterComponent()`
3. Create `AutoGeneratedPanel` renderer
4. Implement widget mapping (parameter type → UI control)
5. Wire up `ControlBridge` state sync
6. Auto-register panels in `PanelFlowProvider`
7. Test with a sample component schema

### Phase 4: Tweakpane Frost Integration (Priority: 🟡 Major)

1. Create `useFrostPane` React hook
2. Build `FrostPanePanel` component
3. Integrate Frost controls into `AutoGeneratedPanel` for complex parameter types
4. Ensure frost CSS loads correctly in library build
5. Test all Tweakpane control types (sliders, colors, points, camera rings)

### Phase 5: Graph Canvas Cleanup (Priority: 🟠 Moderate)

1. Move seed data to demo
2. Make `SceneSettings` optional in graph store
3. Move `capsule-preview.ts` to demo
4. Clean up `WebGPUCapabilities.ts` import path (demo only)
5. Ensure graph canvas works standalone without scene store

### Phase 6: Design System & CSS (Priority: 🟠 Moderate)

1. Consolidate all CSS into a single library output
2. Resolve Tailwind bundling strategy
3. Ensure `import '@artinos/panelflow/styles'` works
4. Test glass-panel rendering without Tailwind in consumer
5. Document CSS custom property API

### Phase 7: Polish & Documentation (Priority: 🟢 Final)

1. Write integration guide for host projects
2. Create minimal example: "Add PANELFLOW to a Vite React app"
3. Create component documentation (storybook-like in Component Library panel)
4. Performance audit: 50-node graph canvas benchmark
5. Accessibility audit: keyboard navigation, screen reader labels
6. Update README.md with real content

---

## 6. Migration Guide for Host Projects

### 6.1 Minimal Integration (5 minutes)

```bash
npm install @artinos/panelflow
```

```tsx
// App.tsx
import { PanelFlowProvider, EditorDock } from '@artinos/panelflow';
import '@artinos/panelflow/styles';

function App() {
  return (
    <PanelFlowProvider>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        {/* Your rendering content */}
        <MyViewport />
        
        {/* PANELFLOW editor dock */}
        <EditorDock />
      </div>
    </PanelFlowProvider>
  );
}
```

### 6.2 With Auto-Generated Control Panels

```tsx
import { registerComponent } from '@artinos/panelflow';

// Register your components
registerComponent({
  id: 'particle-system',
  name: 'Particle System',
  category: 'effects',
  parameters: [
    { key: 'count', label: 'Particle Count', type: 'number', default: 1000, min: 100, max: 10000, step: 100 },
    { key: 'speed', label: 'Speed', type: 'number', default: 1, min: 0, max: 5, step: 0.1, ui: 'slider' },
    { key: 'color', label: 'Color', type: 'color', default: '#2dd4bf' },
    { key: 'gravity', label: 'Gravity', type: 'boolean', default: true },
    { key: 'shape', label: 'Shape', type: 'enum', options: [
      { label: 'Sphere', value: 'sphere' },
      { label: 'Cone', value: 'cone' },
      { label: 'Box', value: 'box' },
    ], default: 'sphere' },
  ]
});
```

### 6.3 For ARTINOS Studio (Full Integration)

```tsx
import { 
  PanelFlowProvider, 
  Workspace, 
  registerComponent,
  useBridgeStore 
} from '@artinos/panelflow';
import '@artinos/panelflow/styles';

// Register all ARTINOS components
import { registerAllComponents } from './artinos-components';
registerAllComponents();

function ArtinosStudio() {
  return (
    <PanelFlowProvider theme="dark">
      <Workspace viewport={<ArtinosViewport />} />
    </PanelFlowProvider>
  );
}
```

---

## 7. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tailwind CSS bundling complexity | Medium | Test library output CSS independently |
| Tweakpane DOM manipulation conflicts with React | High | useEffect cleanup, portal isolation |
| XYFlow license requirements | Low | Already using pro options, verify license |
| Large bundle size (tweakpane-plugins 1MB) | Medium | Tree-shake unused plugins, lazy load |
| React 18 ↔ 19 compatibility | Low | Use compatible API surface only |
| State sync race conditions | Medium | Debounce bridge updates, transactional sets |

---

## 8. Acceptance Criteria

Before declaring PANELFLOW "ready for other projects":

- [ ] `npm run build:lib` produces clean ES + CJS output
- [ ] A fresh Vite React project can `npm install` and use PANELFLOW
- [ ] No Three.js imports in the library output
- [ ] `registerComponent()` generates a working control panel
- [ ] Tweakpane Frost renders inside panels without errors
- [ ] All 5 dock modes work (bottom, left, right, float, min)
- [ ] Panel dock ↔ float transition preserves state and zoom
- [ ] Design system renders correctly without host Tailwind
- [ ] Library bundle < 500KB gzipped (excluding tweakpane plugins)
- [ ] All current panels still work after refactoring
- [ ] Command palette lists auto-generated panels
- [ ] State bridge propagates changes within 16ms

---

*This document will be refined into a task checklist once the PRD is approved. Each phase will be tracked via `task.md` during implementation.*
