# PANELFLOW — Product Requirements Document

> **Package:** `@artinos/panelflow`
> **Version:** 0.1.0 (Initial Architecture)
> **Status:** Draft PRD — Awaiting Review
> **Parent System:** ARTINOS — Ultimate Modular Creative Studio
> **Date:** 2026-06-22

---

## 1. Executive Summary

PANELFLOW is a **self-contained, reusable, production-grade UI/UX package** responsible for all panel management, control panel generation, control surface creation, editor workspace orchestration, and design system governance within the ARTINOS ecosystem.

It is not a demo or a scaffold. It is the **single source of truth** for:
- Creating, managing, and orchestrating all control panels
- Building content-aware, self-contained control surfaces for any component
- Providing the interactive editor dock / workspace canvas
- Enforcing the premium design language across all UI/UX elements
- Auto-generating control panels for any registered component with full parameter access
- Integrating custom control widgets (Tweakpane Frost) for precision parameter editing

When a project renders in the ARTINOS viewport, PANELFLOW **intelligently discovers** all controllable components, generates their control panels, synchronizes state bi-directionally, and presents everything in a premium dock/float/canvas workspace — all without the consuming project writing any panel UI code.

---

## 2. Vision & Goals

### 2.1 Core Vision

> *Every component, modifier, and system parameter in any ARTINOS project should have an automatically generated, content-aware, fully self-contained control panel that works anywhere the component can be copy-pasted.*

### 2.2 Primary Goals

| # | Goal | Description |
|---|------|-------------|
| G1 | **Universal Panel OS** | A runtime that discovers, creates, and manages panels for any registered component |
| G2 | **Zero-Config Control Panels** | Components declare their parameters via a schema; PANELFLOW generates the full control UI |
| G3 | **Self-Contained Portability** | Every panel, component, and control surface is copy-pasteable with zero dependency pain |
| G4 | **Premium Design Language** | Frosted glass, teal accent (#2dd4bf), grain texture, elastic motion, dark cinematic identity |
| G5 | **Editor Dock Workspace** | The primary control canvas — dockable, floatable, resizable — housing all panels and graph tools |
| G6 | **Bi-Directional State Sync** | Parameter changes in panels propagate instantly to rendering; viewport changes reflect in panels |
| G7 | **Tweakpane Frost Integration** | Custom-themed Tweakpane as the primary control widget engine for precision parameter editing |
| G8 | **Intelligent Adaptation** | Panels auto-adjust to the active project's component tree when it loads |

### 2.3 Non-Goals (for v0.1)

- PANELFLOW does **not** own the rendering viewport (that's the host project's responsibility)
- PANELFLOW does **not** define business logic for 3D scenes, shaders, or TSL pipelines
- PANELFLOW does **not** include a code editor (code panel shows read-only generated output)
- PANELFLOW does **not** handle file I/O, cloud storage, or project persistence

---

## 3. Architecture Overview

### 3.1 Package Boundary

```
┌──────────────────────────────────────────────────────────────┐
│                        HOST PROJECT                          │
│  (ARTINOS Studio, standalone web app, or any React project)  │
│                                                              │
│   ┌──── Viewport (host-owned) ─────────────────────────┐    │
│   │  Renders: 3D scene, web components, shaders, etc.  │    │
│   └────────────────────────────────────────────────────-┘    │
│                          ▲ state sync ▼                      │
│   ┌─────────────────────────────────────────────────────┐    │
│   │              @artinos/panelflow                      │    │
│   │                                                      │    │
│   │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │    │
│   │  │  Panel OS    │  │ Editor Dock  │  │  Control   │ │    │
│   │  │  (Registry,  │  │ (Workspace,  │  │  Panel     │ │    │
│   │  │   Store,     │  │  Canvas,     │  │  Engine    │ │    │
│   │  │   Types)     │  │  Rail, Dock) │  │  (Auto-gen)│ │    │
│   │  └─────────────┘  └──────────────┘  └────────────┘ │    │
│   │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │    │
│   │  │  Design      │  │ Graph Canvas │  │ Tweakpane  │ │    │
│   │  │  System      │  │ (XYFlow,     │  │ Frost      │ │    │
│   │  │  (Tokens,    │  │  Nodes,      │  │ (Custom    │ │    │
│   │  │   Glass,CSS) │  │  Physics)    │  │  Widgets)  │ │    │
│   │  └─────────────┘  └──────────────┘  └────────────┘ │    │
│   │  ┌─────────────────────────────────────────────────┐│    │
│   │  │  Component Library (Reusable UI Primitives)     ││    │
│   │  └─────────────────────────────────────────────────┘│    │
│   └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Compact Module Philosophy

Following AGENTS.md §3: **prefer one strong file over many weak files.**

| Module | Files | Purpose |
|--------|-------|---------|
| **Panel OS** | `panel-store.ts`, `panel-types.ts`, `panel-registry.ts`, `define-panel.ts`, `panel-shell.tsx` | Panel runtime: registry, state, types, shell |
| **Editor Dock** | `editor-dock.tsx` | The main workspace container with dock/float/resize logic |
| **Shell** | `viewport.tsx`, `icon-rail.tsx`, `command-palette.tsx`, `panel-chrome.tsx`, `minimap.tsx` | Workspace chrome and navigation |
| **Graph Canvas** | `graph-canvas.tsx`, `graph-store.ts`, `universal-node.tsx`, `os-panel-node.tsx`, `dot-grid-background.tsx` | Node-based infinite canvas system |
| **Graph Support** | `node-registry.ts`, `NodeDefinitions.ts`, `editor-pipeline.ts`, `physics-bridge.ts` | Node definitions, graph compilation, physics |
| **Control Engine** | `control-panel-engine.ts` *(NEW)* | Auto-generates Tweakpane/React control panels from component schemas |
| **Tweakpane Frost** | `lib/tweakpane_frost/*` | Custom-themed Tweakpane with plugins, performance monitor, frost CSS |
| **Design System** | `tokens.css`, `globals.css`, `studio-theme.ts` | Design tokens, glass surfaces, animations, theme injection |
| **Component Library** | `components/GooeySlider.tsx`, `BubbleRatingSlider.tsx`, `ElasticMenu.tsx`, `ui/*` | Reusable interactive UI primitives |

---

## 4. Subsystem Specifications

### 4.1 Panel OS — The Panel Runtime

**Purpose:** The core orchestration layer that registers, creates, manages, and disposes of panels.

#### 4.1.1 Panel Definition Schema

Every panel in the system is declared via `definePanel()`:

```typescript
interface PanelDefinition {
  id: string;                    // Unique panel identifier
  title: string;                 // Display name
  description: string;           // Tooltip/search description
  icon: React.ComponentType;     // Lucide icon or custom SVG
  defaultPlacement: 'left' | 'right' | 'bottom' | 'center';
  defaultSize: number;           // Default width in pixels
  minSize?: number;
  maxSize?: number;
  capabilities: PanelCapabilities;
  component: React.ComponentType; // The panel's content
  tags?: string[];               // For search/filtering
}

interface PanelCapabilities {
  floatable?: boolean;   // Can be dragged to canvas as a node
  closable?: boolean;    // Can be dismissed
  resizable?: boolean;   // Supports resize handles
}
```

#### 4.1.2 Panel Store (Zustand)

Central state for the panel system:

```typescript
interface PanelOSStore {
  // Active docked panel
  dockedPanelId: string | null;
  setDockedPanelId: (id: string | null) => void;

  // Dock geometry
  dockMode: 'left' | 'right' | 'bottom' | 'float' | 'min';
  dockFloatRect: { x: number; y: number; w: number; h: number };

  // Float memory (remembers position when docking/undocking)
  floatMemory: Record<string, { position, viewport }>;

  // Command palette
  commandPaletteOpen: boolean;
  toggleCommandPalette: () => void;

  // Theme
  theme: 'dark' | 'light' | 'system';
}
```

#### 4.1.3 Panel Registry

A single `PANEL_REGISTRY` object maps panel IDs → definitions. All panels self-register.

**Current panels:**

| Panel | ID | Description | Status |
|-------|----|-------------|--------|
| Inspector | `inspector` | Inspects selected node properties, renders inputs with GooeySlider | ✅ Working |
| Scene Control | `scene` | Rendering pipeline, environment, post-FX, viewport config | ✅ Working |
| Engine & Diagnostics | `engine-status` | FPS, backend detection, system health | ✅ Working |
| Code | `code` | Read-only generated graph code output | ✅ Working |
| Component Library | `component-library` | Playground for GooeySlider, BubbleRating, ElasticMenu | ✅ Working |

---

### 4.2 Editor Dock — The Workspace Container

**Purpose:** The primary UI container — a glass-panel dock that holds the graph canvas, icon rail, docked panels, and toolbar controls.

#### 4.2.1 Dock Modes

| Mode | Behavior |
|------|----------|
| `bottom` | Fixed to bottom edge, height as % of viewport, resizable via drag |
| `left` | Fixed to left edge, width in px, resizable |
| `right` | Fixed to right edge, width in px, resizable |
| `float` | Free-floating window, draggable, custom rect |
| `min` | Minimized/collapsed *(planned)* |

#### 4.2.2 Dock Layout Structure

```
┌───────────────────────────────────────────────────────────┐
│  TOOLBAR: [Logo] [SceneControls] [center] [PerfMonitor] [WindowControls] │
├───────────────────────────────────────────────────────────┤
│ [IconRail(L)] │ [DockedPanel(L)] │ [GraphCanvas] │ [DockedPanel(R)] │ [IconRail(R)] │
│               │   (animated      │  (XYFlow +    │   (animated      │               │
│               │    slide-out)     │   DotGrid +   │    slide-out)    │               │
│               │                   │   MiniMap)    │                   │               │
│               │                   │               │                   │               │
│               │                   │  [BottomCtrls]│                   │               │
└───────────────────────────────────────────────────────────┘
```

#### 4.2.3 Toolbar Components

- **SceneControls**: 2D/3D toggle + geometry selector (collapsing on hover)
- **Performance Monitor**: Backend badge, FPS, compute time, memory (compact pill format)
- **WindowControls**: Dock mode switcher + min/default/max presets (collapsing on hover)
- **Resize Handle**: Edge-drag for bottom/left/right modes; Move button for float mode

#### 4.2.4 Key Interactions

- `Ctrl+K` → Command Palette
- `Ctrl+1/2/3/4` → Quick-open panels by rail position
- `Delete/Backspace` → Remove selected node
- Double-click resize grip → Reset to default size
- Icon rail click → Toggle docked panel (or pull from canvas node)
- Float button in panel chrome → Convert docked panel to canvas node

---

### 4.3 Control Panel Engine *(NEW — Core Feature)*

**Purpose:** Automatically generates control panels for any component/modifier that declares a parameter schema. This is the "intelligent" heart of PANELFLOW.

#### 4.3.1 Component Schema Declaration

Components register themselves with a parameter manifest:

```typescript
interface ComponentSchema {
  id: string;
  name: string;
  description?: string;
  category: string;
  icon?: React.ComponentType;
  parameters: ParameterDef[];
  modifiers?: ModifierDef[];
}

interface ParameterDef {
  key: string;
  label: string;
  type: 'number' | 'color' | 'boolean' | 'string' | 'vec2' | 'vec3' | 'enum' | 'range';
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
  group?: string;        // Section grouping
  ui?: 'slider' | 'knob' | 'toggle' | 'dropdown' | 'color-picker' | 'tweakpane';
}

interface ModifierDef {
  id: string;
  name: string;
  enabled: boolean;
  parameters: ParameterDef[];
}
```

#### 4.3.2 Auto-Generation Flow

```
Project Loads → Component Discovery → Schema Extraction → Panel Generation → State Binding
     │                │                     │                   │                │
     ▼                ▼                     ▼                   ▼                ▼
  Host mounts    Walks component      Reads parameter     Creates panel     Zustand store
  PANELFLOW      tree / registry      manifests from      definitions via   2-way sync with
  provider       looking for          each component      definePanel()     component props
                 @panelflow/schema
```

#### 4.3.3 Widget Mapping

| Parameter Type | Default Widget | Tweakpane View |
|----------------|---------------|----------------|
| `number` (with range) | GooeySlider | `binding` with min/max |
| `number` (no range) | Number input | `binding` |
| `color` | Color picker + hex input | `binding` (color type) |
| `boolean` | Toggle switch | `binding` (checkbox) |
| `string` | Text input | `binding` (text) |
| `vec2` | 2D point pad | `binding` (point2d picker) |
| `vec3` | 3-axis sliders | `binding` (point3d) |
| `enum` | Chip selector | `binding` (list options) |
| `range` | Dual-thumb slider | `binding` (interval) |

#### 4.3.4 Self-Contained Panel Contract

> **Critical Requirement:** Every auto-generated control panel must be fully self-contained and independently portable.

This means:
- The panel carries its own state subscription
- If the component is copy-pasted to another project, its control panel can follow
- No hard dependency on the host project's store structure
- Communication via a standardized `ControlBridge` interface
- Falls back gracefully if the component is not mounted

---

### 4.4 Graph Canvas System

**Purpose:** An infinite node-based canvas where panels, nodes, and components live as interactive graph entities.

#### 4.4.1 Node Types

| Type | React Flow Type | Purpose |
|------|----------------|---------|
| `universal` | Custom node | Standard graph nodes (UV, Wave, Gradient, Material, etc.) |
| `os-panel` | Custom node | Panel instances floating on the canvas |

#### 4.4.2 Features

- **DotGridBackground**: Custom SVG dot grid with radial gradient, not the default React Flow background
- **Physics Bridge**: Momentum, bounce, drag physics on node movement
- **Animated Edges**: Dashed stroke animation on connections
- **Spotlight Search**: Space-key triggered node picker
- **Auto Layout**: Dagre-based auto-arrangement
- **Drag & Drop**: Node creation via DnD from spotlight search
- **Mini Map**: Pannable/zoomable overview at bottom-right

#### 4.4.3 Graph Store (Zustand)

Manages nodes, edges, scene settings, stats, selection, and generated code. Persists to localStorage with debounced writes.

---

### 4.5 Design System

**Purpose:** Enforce the PANELFLOW visual identity across all elements.

#### 4.5.1 Design Tokens ([tokens.css](file:///g:/CODE2026/.PROJECTS/ARTINOS/PANELFLOW/src/tokens.css))

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#0a0a0a` | Root background |
| `--color-surface` | `#171717` | Panel backgrounds |
| `--color-surface-raised` | `#262626` | Elevated surfaces |
| `--color-accent` | `#2dd4bf` | Primary teal accent |
| `--color-accent-glow` | `rgba(20,184,166,0.60)` | Glow effects |
| `--radius-lg` | `18px` | Panel corners |
| `--blur-glass` | `20px` | Backdrop blur |
| `--shadow-panel` | Complex | Panel drop shadow |
| `--grid-cell` | `40px` | Graph grid alignment |

#### 4.5.2 Glass Surface System

The `.glass-panel` class provides the signature frosted glass appearance:
- Gradient background with transparency
- `backdrop-filter: blur(32px) saturate(130%)`
- Inset top highlight
- Inset border glow
- SVG fractal noise texture overlay (mix-blend-mode: overlay)

#### 4.5.3 Animation System

| Animation | Usage | Easing |
|-----------|-------|--------|
| `fluidity-dock-in` | Dock mount slide-up | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `fluidity-fade-in` | Panel content mount | `ease-out` |
| `fluidity-tooltip-in/out` | Tooltip entrance/exit | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `fluidity-flow` | Edge stroke animation | linear |
| Spring transitions | Node/panel mount, scale, position | `framer-motion spring` |

#### 4.5.4 Typography

- System font stack: `ui-sans-serif, system-ui, -apple-system, sans-serif`
- Monospace: System mono for numeric values
- Labels: `9-11px`, `uppercase`, `tracking-widest`, `font-bold`
- Body: `12-13px`, standard weight

---

### 4.6 Tweakpane Frost Integration

**Purpose:** Custom-themed Tweakpane instance as the primary control widget engine.

#### 4.6.1 Library Contents ([tweakpane_frost/](file:///g:/CODE2026/.PROJECTS/ARTINOS/PANELFLOW/src/lib/tweakpane_frost))

| File | Size | Purpose |
|------|------|---------|
| `tweakpane.js` | 278KB | Core Tweakpane v4 library |
| `tweakpane-plugins.js` | 1MB | Essentials, Camerakit, Waveform, Infodump plugins |
| `frost-tweakpane.js` | 28KB | `FrostTweakpane` class — orchestration, demo UI builder |
| `frost-tweakpane.css` | 29KB | Complete frost theme CSS |
| `frost-performance-plugin.js` | 18KB | Custom performance monitor plugin |

#### 4.6.2 Supported Control Types

From `FrostTweakpane._buildUI()`:

- **Primitives**: Text, Number, Boolean
- **Sliders**: Opacity, Intensity, Scale, Rotation
- **Colors**: Hex picker, RGB picker
- **Points**: 2D pad (inline), 3D axes
- **Lists/Dropdowns**: Theme selector, Quality selector
- **Buttons**: Action buttons, Button grid (3×2)
- **Radio Grid**: Size selector (XS/SM/MD/LG)
- **Range/Interval**: Dual-thumb range slider
- **Cubic Bezier**: Easing curve editor
- **Camera Controls**: Ring (focal/f-stop/ISO), Wheel (exposure/WB), Line (shutter)
- **Monitors**: FPS graph, Waveform, Value monitors, Multiline log
- **Performance**: Custom FPS/CPU/GPU/MEM monitor with live graphs
- **Infodump**: Markdown content display

#### 4.6.3 Integration Strategy for Control Panels

Tweakpane Frost will be used as the **widget renderer** inside auto-generated control panels:

```
ComponentSchema.parameters → ParameterDef[] → Tweakpane bindings
                                                    │
                                          ┌─────────┴─────────┐
                                          │ FrostTweakpane     │
                                          │ mounted in a       │
                                          │ PanelShell inside  │
                                          │ PanelChrome        │
                                          └────────────────────┘
```

---

### 4.7 Component Library

**Purpose:** Premium, reusable, copy-pasteable UI components.

#### 4.7.1 Current Components

| Component | File | Description |
|-----------|------|-------------|
| [GooeySlider](file:///g:/CODE2026/.PROJECTS/ARTINOS/PANELFLOW/src/components/GooeySlider.tsx) | `GooeySlider.tsx` (6.3KB) | SVG gooey filter slider with sticky liquid effect |
| [BubbleRatingSlider](file:///g:/CODE2026/.PROJECTS/ARTINOS/PANELFLOW/src/components/BubbleRatingSlider.tsx) | `BubbleRatingSlider.tsx` (6.8KB) | Emoticon satisfaction slider with bubble physics |
| [ElasticMenu](file:///g:/CODE2026/.PROJECTS/ARTINOS/PANELFLOW/src/components/ElasticMenu.tsx) | `ElasticMenu.tsx` (6.8KB) | Physics-driven liquid radial menu |
| [Tooltip](file:///g:/CODE2026/.PROJECTS/ARTINOS/PANELFLOW/src/components/ui/tooltip.tsx) | `ui/tooltip.tsx` (1.2KB) | Radix-based tooltip with frost animation |
| [IconButton](file:///g:/CODE2026/.PROJECTS/ARTINOS/PANELFLOW/src/components/ui/icon-button.tsx) | `ui/icon-button.tsx` (836B) | Styled icon button |

#### 4.7.2 Component Quality Bar

Every component must be:
- Self-contained (single file, minimal imports)
- Highly configurable (props-driven)
- Motion-rich (framer-motion / spring physics)
- Premium aesthetic (not generic)
- Copy-paste portable
- Integrated into the Component Library panel for preview

---

## 5. Integration Contract (Host ↔ PANELFLOW)

### 5.1 How a Host Project Uses PANELFLOW

```tsx
import { PanelFlowProvider, EditorDock, Viewport } from '@artinos/panelflow';
import { registerComponent } from '@artinos/panelflow/control-engine';

// 1. Register components with parameter schemas
registerComponent({
  id: 'my-sphere',
  name: 'Animated Sphere',
  parameters: [
    { key: 'radius', label: 'Radius', type: 'number', default: 1, min: 0.1, max: 5, step: 0.1 },
    { key: 'color', label: 'Color', type: 'color', default: '#2dd4bf' },
    { key: 'wireframe', label: 'Wireframe', type: 'boolean', default: false },
  ]
});

// 2. Mount the workspace
function App() {
  return (
    <PanelFlowProvider>
      <Viewport>{/* host rendering content */}</Viewport>
      <EditorDock />
    </PanelFlowProvider>
  );
}
```

### 5.2 State Bridge API

```typescript
interface ControlBridge {
  /** Subscribe to parameter changes from the control panel */
  onParameterChange: (componentId: string, key: string, value: any) => void;
  
  /** Push current parameter values to the control panel */
  setParameterValues: (componentId: string, values: Record<string, any>) => void;
  
  /** Notify PANELFLOW that the component tree has changed */
  notifyComponentTreeChange: (components: ComponentSchema[]) => void;
  
  /** Get the current panel layout state for persistence */
  getLayoutState: () => LayoutState;
  
  /** Restore a previously saved layout */
  restoreLayout: (state: LayoutState) => void;
}
```

---

## 6. File Structure (Target)

```
src/
├── main.tsx                    # Entry point (demo app only)
├── App.tsx                     # Demo app wrapper
├── workspace.tsx               # Demo workspace layout
├── export.ts                   # Package public API exports
│
├── panel-os/                   # Panel Runtime (5 files)
│   ├── panel-types.ts          # Core type definitions
│   ├── panel-store.ts          # Zustand store for panel state
│   ├── panel-registry.ts       # Panel registration + lookup
│   ├── define-panel.ts         # definePanel() factory
│   ├── panel-shell.tsx         # Generic panel content wrapper
│   └── dockview-theme.css      # Dockview skin (glass language)
│
├── shell/                      # Editor Chrome (7 files)
│   ├── editor-dock.tsx         # Main dock container
│   ├── viewport.tsx            # Rendering viewport
│   ├── icon-rail.tsx           # Vertical panel tab rail
│   ├── panel-chrome.tsx        # Panel header/close/float chrome
│   ├── command-palette.tsx     # Ctrl+K command palette
│   ├── minimap.tsx             # Bottom controls
│   └── ThreeRuntime.ts         # WebGPU/GL renderer host
│
├── graph/                      # Node Canvas (14 files)
│   ├── graph-canvas.tsx        # ReactFlow host
│   ├── graph-store.ts          # Graph state (Zustand)
│   ├── universal-node.tsx      # Standard graph node component
│   ├── os-panel-node.tsx       # Panel-as-node component
│   ├── dot-grid-background.tsx # Custom dot grid
│   ├── animated-edge.tsx       # Dashed animated edge
│   ├── spotlight-search.tsx    # Space-key node picker
│   ├── node-registry.ts        # Node definition registry
│   ├── NodeDefinitions.ts      # Runtime node type catalog
│   ├── editor-pipeline.ts      # Graph ↔ Runtime translation
│   ├── GraphRuntime.ts         # Graph serialization
│   ├── physics-bridge.ts       # Node momentum/bounce
│   ├── physics-events.ts       # Physics event bus
│   └── layout.ts              # Dagre auto-layout
│
├── panels/                     # Built-in Panels (5 files)
│   ├── inspector.panel.tsx
│   ├── scene.panel.tsx
│   ├── engine-status.panel.tsx
│   ├── code.panel.tsx
│   └── gooey-slider.panel.tsx  # Component library demo panel
│
├── components/                 # Reusable UI Primitives (5 files)
│   ├── GooeySlider.tsx
│   ├── BubbleRatingSlider.tsx
│   ├── ElasticMenu.tsx
│   └── ui/
│       ├── tooltip.tsx
│       └── icon-button.tsx
│
├── lib/                        # Shared Utilities & Integrations
│   ├── cn.ts                   # clsx + tailwind-merge
│   ├── motion.ts               # Spring presets
│   ├── physics.ts              # Physics constants
│   └── tweakpane_frost/        # Custom Tweakpane (5 files)
│       ├── tweakpane.js
│       ├── tweakpane-plugins.js
│       ├── frost-tweakpane.js
│       ├── frost-tweakpane.css
│       └── frost-performance-plugin.js
│
├── tokens.css                  # Design tokens (CSS custom properties)
├── globals.css                 # Global styles, animations, glass
├── studio-theme.ts             # Theme tokens as JS + injector
├── capsule-preview.ts          # Preview store (component preview sync)
├── WebGPUCapabilities.ts       # Browser capability detection
└── nodes/
    └── tsl-material.ts         # TSL material node registration
```

**Total: ~48 source files** — compact, coherent, no file sprawl.

---

## 7. Dependency Inventory

### 7.1 Runtime Dependencies

| Dependency | Version | Why |
|-----------|---------|-----|
| `react` | ^19 | Core UI framework |
| `react-dom` | ^19 | DOM renderer |
| `zustand` | ^5.0 | Lightweight state management |
| `@xyflow/react` | ^12 | Node graph canvas (React Flow v12) |
| `framer-motion` / `motion` | ^12 | Spring animations, layout transitions |
| `lucide-react` | ^0.546 | Icon library |
| `cmdk` | ^1.1 | Command palette |
| `@radix-ui/react-tooltip` | ^1.2 | Accessible tooltips |
| `clsx` + `tailwind-merge` | Latest | Conditional class merging |
| `dagre` | ^0.8 | Auto-layout for graph nodes |
| `tweakpane` | ^4.0 | Control widgets (via frost wrapper) |

### 7.2 Dev / Build Dependencies

| Dependency | Why |
|-----------|-----|
| `vite` | Bundler |
| `@vitejs/plugin-react` | React JSX transform |
| `tailwindcss` v4 + `@tailwindcss/vite` | Utility CSS |
| `typescript` | Type safety |

### 7.3 Optional / Demo-Only Dependencies

| Dependency | Why | Removable for consumers? |
|-----------|-----|--------------------------|
| `three` + `three-stdlib` | Demo viewport rendering | ✅ Yes |
| `@react-three/fiber` + `drei` | Demo viewport (R3F) | ✅ Yes |
| `@google/genai` | Demo AI features | ✅ Yes |
| `dockview` / `dockview-core` | Tab system (currently replaced by custom) | ✅ Yes |
| `express` / `dotenv` | Server-side demo | ✅ Yes |

---

## 8. Key User Flows

### 8.1 Opening & Using the Editor

1. Project loads → Viewport renders → EditorDock mounts at bottom
2. User sees the graph canvas with seed nodes (UV → Wave → Gradient → Material)
3. Icon rail on right shows available panels (Inspector, Scene, Engine, Code, Components)
4. Click panel icon → Panel slides out as docked sidebar
5. Click float button → Panel detaches and becomes a canvas node
6. `Ctrl+K` → Command palette for quick panel/action access
7. `Space` → Spotlight search for adding new graph nodes

### 8.2 Auto-Generated Control Panels (Target Flow)

1. Host project registers components via `registerComponent(schema)`
2. PANELFLOW discovers all registered schemas on mount
3. For each component, a `PanelDefinition` is generated with Tweakpane Frost bindings
4. Generated panels appear in the icon rail and command palette
5. User opens panel → sees all component parameters as precision controls
6. Parameter changes propagate via `ControlBridge.onParameterChange`
7. If the component is removed, its panel is gracefully disposed

### 8.3 Panel Dock/Float Toggle

1. Panel is docked (sidebar) → User clicks float button
2. Panel remembers its docked position and viewport state
3. Panel appears as an `os-panel` node on the graph canvas
4. User can drag it, resize it, connect it to other nodes
5. User clicks dock button → Panel returns to sidebar
6. Canvas viewport restores to the remembered state (no zoom jump)

---

## 9. Quality Requirements

### 9.1 Performance

| Metric | Target |
|--------|--------|
| Panel open/close animation | < 300ms |
| Control parameter latency | < 16ms (single frame) |
| Graph canvas with 50 nodes | 60fps |
| Panel state serialization | < 50ms |
| Initial mount (no viewport) | < 500ms |

### 9.2 Accessibility

- All interactive elements have `aria-label`
- Keyboard navigation: `Tab`, `Escape`, `Enter`
- Focus indicators on all controls
- Command palette fully keyboard-navigable
- Tooltips on all icon-only buttons

### 9.3 Portability

- Package exports ESM and CJS
- No server-side dependencies for core package
- CSS can be imported standalone
- Components work in React 18+ and 19
- No dependency on Tailwind in the package output (Tailwind is build-only)

---

## 10. Open Questions

> [!IMPORTANT]
> **Q1: Package Manager Strategy** — Should PANELFLOW be published as a proper npm package (`@artinos/panelflow`) or consumed as a workspace package via pnpm/yarn workspaces within the ARTINOS monorepo?

> [!IMPORTANT]
> **Q2: Tweakpane vs React Controls** — For auto-generated control panels, should we use Tweakpane Frost exclusively (DOM-based, imperative) or provide a React-native widget set that mirrors Tweakpane aesthetics? Hybrid approach possible (Tweakpane for complex controls, React for simple ones)?

> [!WARNING]
> **Q3: Three.js Decoupling** — The current `viewport.tsx` and `ThreeRuntime.ts` are tightly coupled to Three.js/WebGPU. For PANELFLOW as a standalone package, the viewport rendering should be host-provided. Should we extract the existing viewport as a **demo/example** rather than a core export?

> [!NOTE]
> **Q4: Component Discovery** — Should component schemas be declared via decorators (`@panelflow({ ... })`), a registration function (`registerComponent()`), or a static manifest file per component?

---

## 11. Success Criteria

- [ ] Any component with a declared schema gets a working control panel with zero UI code
- [ ] Every control panel is self-contained and portable
- [ ] The editor dock works in bottom/left/right/float modes without layout breaks
- [ ] Panels can seamlessly transition between docked and canvas-node modes
- [ ] Tweakpane Frost renders all supported parameter types correctly
- [ ] The design system produces consistent premium glass aesthetics
- [ ] The package can be imported into a fresh React project and work
- [ ] The graph canvas runs at 60fps with 50+ nodes
- [ ] All state is synchronized bi-directionally between panels and viewport
- [ ] No placeholder UI, fake demos, or suppressed errors

---

*This PRD defines the product requirements for PANELFLOW v0.1. Implementation details and task breakdown will be defined in the Implementation Plan upon PRD approval.*
