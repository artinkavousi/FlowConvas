# ARTINOS — Product Requirements Document

**A reusable creative block studio, registry, converter, and agent-operable build system**

---

## 1. Overview

ARTINOS is a master creative workspace for building, converting, and reusing interactive visual modules: React components, animated UI blocks, landing sections, Three.js/R3F scenes, TSL shader modules, WebGPU effects, and full interactive pages. It is not a conventional component library, not a static gallery, and not a one-shot code generator. It is a **studio + registry + converter + agent-operable system**, designed so that anything built inside it — a component, a shader, a scene, a page — becomes a permanent, reusable, documented asset rather than a disposable demo.

ARTINOS accepts almost any input — a rough idea, a full PRD, a visual reference, an existing local project, a GitHub repo, a Three.js demo, a single React component, a raw shader, or a WebGPU/TSL experiment — and turns it into a clean, decomposed, registered, showcased, agent-readable module inside one continuously growing library.

---

## 2. Vision

Build one synchronized master library where every reusable interactive visual component, page, 3D system, shader, and creative pattern lives together, stays in sync, and can be rediscovered and reused across all future projects — by a human or by an AI coding agent — without re-deriving the same work twice.

---

## 3. Problem Statement

Existing tools each solve one slice of this problem, but none solve the whole thing:

- Traditional component libraries (MUI, Chakra, etc.) provide UI primitives but are black-box dependencies, not owned source, and have no concept of 3D, shaders, or WebGPU.
- shadcn/ui solved code ownership for UI components, but stops at flat React/Tailwind components — no 3D, no shader system, no registry intelligence.
- ReactBits and 21st.dev provide polished, discoverable, copy-pasteable components, but are galleries, not workspaces — there's no in-place editing, conversion, or agent operability.
- Framer Marketplace solves discovery and monetizable reuse for templates and plugins, but is locked to Framer's own runtime.
- Spline solves browser-based interactive 3D authoring beautifully, but it isn't code-first, isn't copy-pasteable source, and isn't agent-operable.
- Three.js / TSL / WebGPU give the raw power for high-end visuals, but provide no studio, no registry, and no reuse discipline — every project starts from scratch.

ARTINOS exists to merge the strengths of all of these into one system: **owned source code** (shadcn) + **polished interactive components** (ReactBits) + **a discoverable registry** (21st.dev) + **a marketplace-style reuse flow** (Framer) + **browser-based 3D authoring** (Spline) + **high-end shader/WebGPU power** (Three.js/TSL), wrapped in a workflow that an AI agent can operate end-to-end.

---

## 4. Inspiration & Positioning

| Reference | What ARTINOS borrows from it |
|---|---|
| **shadcn/ui** | Owned, editable, copy-pasteable component source — no black-box package lock-in |
| **ReactBits** | Polished, animated, interactive React component quality bar |
| **21st.dev** | Discover → preview → copy → remix → install registry flow |
| **Framer Marketplace** | Premium templates, plugins, and community reuse/marketplace structure |
| **Spline** | Browser-based interactive 3D creation, live preview, animation, and export |
| **Three.js / TSL / WebGPU** | High-end interactive 3D, shaders, materials, particles, compute, and post-processing |

ARTINOS is the union of these, applied to a single, agent-operable, continuously growing library.

---

## 5. Core Principles

1. **Nothing is a one-off.** Every accepted idea, repo, or demo must resolve into a reusable library asset, never an isolated build.
2. **Studio first, packages later.** ARTINOS starts as one integrated Studio app with compact modules. Code is promoted to a standalone package only after proven reuse across multiple real projects.
3. **Ownership over abstraction.** Modules are real, readable, copy-pasteable source — not framework lock-in, not premature packages, not fake abstraction layers.
4. **Agent-operable by design.** Every module, registry entry, and showcase page must carry metadata an AI coding agent can read, discover, and act on.
5. **Continuous compounding growth.** The library should get measurably smarter and more capable with every module added — reuse, not duplication, is the growth engine.
6. **Premium visual bar.** Output quality should sit alongside ReactBits, 21st.dev, Framer, and Spline — never generic admin-dashboard or starter-template visuals.

---

## 6. System Architecture

### 6.1 Studio Interface

A single visual workspace containing:

- Main preview viewport (component/page level)
- 3D scene preview (Three.js/R3F/WebGPU viewport)
- Inspector / controls panel
- Module and component and assets  gallery
  Console / diagnostics panel
- Agent panel
- Module converter panel

### 6.2 Reusable Block Registry

A 21st.dev/Framer-Marketplace-style registry, but scoped beyond UI to every category of reusable creative asset: UI components, animated React blocks, 3D scenes, shader effects, TSL modules, WebGPU modules, materials, particles, panels, node definitions, interaction systems, layout templates, mini apps, and agent tools. Full field schema is defined in [Section 11](#11-registry-schema).

### 6.3 Ownership Model (Copy-Pasteable Components)

Following the shadcn/ui model: components are real source code the user owns and can modify directly, not dependencies behind a version-locked package.

**Prefer:** compact files, self-contained modules, clear imports, minimal dependencies, drop-in copy-paste portability into another project.

**Avoid:** excessive tiny files, deep nested folders, fake abstraction layers, premature packaging, dependency spaghetti, generic starter-template scaffolding.

### 6.4 3D / Shader / WebGPU Block System

Spline-style interactive 3D, but code-first and agent-operable. Supports:

- Three.js (r184+)
- TSL (Three.js Shading Language)
- WebGPU
- React Three Fiber (R3F), where it adds value
- Materials, particles, post-processing, and procedural shader effects
- Interaction systems and animation presets
- Self-contained "scene capsules" that bundle a scene with its controls and presets

Every 3D block must be previewable, editable in place, and reusable across projects — not a fixed Spline-style export, but live, owned source.

---

## 7. File & Folder Architecture Philosophy

Architecture starts as one clean Studio app, not a constellation of premature packages.

**Rules:**
- One integrated workspace first; promote to a package only after proven reuse across multiple apps/projects.
- Prefer one strong, compact file over many weak, fragmented ones.
- Use the minimum number of files needed to stay readable.
- Avoid deep nesting, fake abstractions, and dependency spaghetti.
- Shared files exist only for systems that are genuinely reused.
- Code should stay equally readable for humans and AI agents.
- When upgrading or converting existing work, preserve its visual identity, behavior, interactions, physics, animation, sound, and shader logic exactly.

**Preferred shape** — compact, self-contained modules:

```txt
src/artinos/
  ARTINOSStudio.tsx
  StudioRegistry.ts
  ModuleConverter.ts
  GraphRuntime.ts
  ThreeRuntime.ts
  ShowcaseRouter.tsx
  AgentTools.ts
  modules/
    FluidGlassModule.tsx
    MagneticDockModule.tsx
    ShaderCardModule.tsx
    ParticleFieldModule.tsx
```

**Avoid** unnecessary scattering:

```txt
components/
  fluid-glass/
    index.ts
    types.ts
    utils.ts
    constants.ts
    hooks.ts
    styles.ts
    controls.ts
    metadata.ts
    preview.tsx
    demo.tsx
```

Split a file only when it is genuinely too large, or when a piece of it is reused by more than one module.

A good module bundles, in one compact place wherever possible: component/module source, props/config, default presets, controls schema, a preview/demo wrapper, registry metadata, dependency list, usage notes, agent notes, and validation notes.

---

## 8. Core Workflow

ARTINOS supports movement in both directions — idea to library, and library back into new projects:

`idea → plan → reusable module → showcase → library → new project`
`external repo → converted ARTINOS module → component/page/app → extracted reusable pattern`

End-to-end agent workflow for any accepted input:

1. Analyze the input deeply (idea, PRD, reference, repo, or project).
2. Identify the real reusable systems inside it.
3. Decompose the work into proper, independent modules.
4. Decide what becomes a reusable component, what stays local, and what becomes a full showcase/demo.
5. Build the module, component, page, or app.
6. Add the reusable parts to the ARTINOS library.
7. Build a showcase page with full controls, previews, and real functionality.
8. Register everything in the module/component registry.
9. Document how to reuse it in other projects.
10. Verify build, preview, console, behavior, and visual quality.
11. Confirm the library stays fully synced with all demos, showcases, examples, and future projects.

---

## 9. Intelligent Decomposition Model

For every input, the agent must classify the work into the correct layer(s) — without over-splitting files, but with clear separation of concepts:

| Layer | Definition |
|---|---|
| **Reusable Component** | A small, self-contained React/UI/visual component |
| **Reusable Module** | A compact system with behavior, state, visuals, controls, and dependencies bundled together |
| **Showcase Page** | A polished page demonstrating a module with full controls and real, working functionality |
| **Full App/Page** | A complete interactive page or mini app composed from existing and new ARTINOS modules |
| **Runtime System** | A shared system intended to be reused across multiple modules (e.g. a graph engine or a Three.js runtime) |
| **Registry Entry** | Metadata that lets ARTINOS and AI agents discover, preview, install, and reuse the module |
| **Node Definition** | An optional graph-node exposure of the module, with typed inputs, outputs, and inspector controls |

---

## 10. Module Converter

ARTINOS includes a ability for ai Agent like an Skill to converter that turns any existing example, repo, project, or raw idea into a registered, reusable ARTINOS module.

**Accepted inputs:** rough idea, PRD, existing React component, Three.js example, R3F scene, ShaderToy shader, WebGPU demo, GitHub repo, CodePen, local project, UI block, full page, or mini app.

**Conversion process:**

1. Inspect the source or idea.
2. Identify the valuable reusable core.
3. Strip unrelated scaffolding.
4. Extract clean, reusable modules.
5. Preserve the original visuals and behavior exactly.
6. Add controls and presets.
7. Build a showcase page.
8. Add registry metadata.
9. Add dependency information.
10. Add usage and copy-paste instructions.
11. Add agent-readable instructions.
12. Validate the module inside ARTINOS (build, preview, console, behavior).

---

## 11. Registry Schema

Every reusable module must be registered with the following fields:

| Field | Purpose |
|---|---|
| `id` | Unique identifier |
| `name` | Display name |
| `category` / `type` | Classification (UI, 3D scene, shader, material, node, app, etc.) |
| `description` | What it does and when to use it |
| `source path` | Location of owned source code |
| `preview path` | Location/route of the live preview |
| `dependencies` | Required packages and runtime requirements |
| `controls` / `presets` | Inspector schema and default presets |
| `tags` | Searchable keywords |
| `related modules` | Cross-links to similar or composable modules |
| `usage instructions` | Copy-paste and install steps |
| `agent instructions` | Agent-readable notes on how to use/extend the module |
| `validation status` | Build/preview/console pass status |
| `version / date` | Versioning and freshness tracking |
| `reuse notes` | Known reuse patterns and prior usage |

The registry powers gallery browsing, search, showcase routing, copy/install actions, AI-agent discovery, module conversion, graph-node creation, and project generation.

---

## 12. Showcase Page Requirements

Every major reusable module needs a showcase page that demonstrates it working — not a fake static preview. Required elements:

- Live, interactive preview
- Full inspector controls
- Available presets
- Responsive behavior demonstration
- Code usage snippet
- Dependency list
- Copy/install instructions
- Plain-language visual explanation
- Example use cases
- Console/runtime status indicator
- Agent-readable notes
- Links to related modules
- Export/copy actions

---

## 13. Library Sync Rules

The ARTINOS library must always stay synchronized with showcase pages, examples, demos, templates, generated projects, converted repos, reusable modules, component metadata, documentation, dependency lists, and agent instructions.

- When a component changes, its showcase and registry entry update with it.
- When a showcase reveals a reusable pattern, that pattern is extracted into the library.
- When a project produces something useful, that part is captured as a reusable module.
- When an external repo is converted, its clean reusable core is added to the library with a showcase.
- No useful system is allowed to remain trapped inside a one-off demo.

---

## 14. Agent Behavior

The coding agent operates as a senior architect, product designer, visual systems engineer, and implementation engineer simultaneously.

**For every task, the agent must:**

1. Understand the intention behind the request.
2. Inspect the existing project structure.
3. Identify reusable opportunities before writing new code.
4. Plan decomposition before coding.
5. Reuse existing ARTINOS modules wherever possible.
6. Avoid duplicating systems already in the library.
7. Build the smallest strong version first.
8. Register new reusable modules.
9. Create or update the relevant showcase page.
10. Keep the library and examples in sync.
11. Verify build, preview, console output, and behavior.
12. Report what changed and what was tested.

**The agent must never:**

- Build isolated one-off demos.
- Ignore the existing component library.
- Create duplicate components.
- Replace custom systems with generic samples.
- Over-split files or create deep folder nesting.
- Introduce fake abstractions.
- Mark work "complete" without verification.
- Claim something is done without checking build, preview, and console.

---

## 15. Reuse Priority Checklist

Before building anything new, the agent must check, in order:

1. Is there already a similar module in ARTINOS?
2. Can an existing component be extended instead of duplicated?
3. Should this become a new reusable module?
4. Should this get its own showcase page?
5. Should this get a registry entry?
6. Should this expose inspector controls?
7. Should this become a graph node?
8. Is this likely to be reused in future projects?

ARTINOS grows through reuse, not duplication.

---

## 16. Visual & Interaction Quality Bar

Output must read as premium and intentional — closer to ReactBits, 21st.dev, Framer, Spline, and high-end creative-coding labs than to a generic admin dashboard or starter-app template. 
When converting or upgrading existing work, the original design language, interaction feel, and visual identity must be preserved and elevated, never flattened into something generic.

---

## 17. Worked Example: Converting an Existing Project into an ARTINOS Module

**Input:** `WebGpu-Fluid-Simulation-master folder  — an existing standalone interactive visual project.

This should never remain an isolated demo. ARTINOS analyzes it, extracts the reusable creative core, and folds it into the library.

**Agent process:**

1. Inspect project structure, dependencies, runtime logic, UI, shaders, interactions, presets, and controls.
2. Identify the real reusable systems inside it.
3. Separate project-specific scaffolding from reusable visual modules.
4. Preserve original visual behavior, interaction quality, animation, shader logic, physics, audio-reactivity, controls, and design identity exactly.
5. Decompose the project into compact, reusable ARTINOS modules.
6. Add the reusable module to the library.
7. Build a polished showcase page: live preview, full controls, presets, code usage, dependency list, reuse instructions.
8. Add registry metadata so it can be searched, previewed, copied, reused, extended, and discovered by agents.
9. Sync the new module with the library, gallery, showcase system, and future project workflows.
10. Verify with build, preview, console checks, and behavior testing.

**Resulting library entry:**

```txt
ARTINOS Library
  Visual Modules
    WebGPU Fluid Simulation
      - reusable module
      - live showcase page
      - presets
      - inspector controls
      - emitter controls
      - audio-reactive options
      - performance settings
      - code usage example
      - dependency list
      - registry metadata
      - agent-readable instructions
```

**The resulting module becomes usable as:** a full-screen interactive background, a hero-section visual, an audio-reactive visualizer, a shader/material showcase piece, a WebGPU/TSL creative module, a node-graph visual effect, a standalone interactive page, or a drop-in component inside another project.

**Example usage in another project:**

```tsx
<WebGPUFluidModule
  preset="aurora"
  interactive
  audioReactive={false}
  showParticles
  quality="high"
  className="absolute inset-0"
/>
```

---

## 18. Per-Conversion Deliverables Checklist

Every accepted idea, repo, example, or PRD must produce:

- Reusable source module
- Showcase/demo page
- Registry entry
- Component metadata
- Dependency list
- Preview configuration
- Inspector controls
- Usage documentation
- Copy-paste instructions
- Agent instructions
- Validation checklist
- Optional: graph/node definition
- Optional: app/page template
- Optional: export package

---

## 19. Non-Goals

ARTINOS explicitly is **not**:

- A conventional, UI-only component library.
- A static gallery of unreusable demos.
- A black-box package system with version-locked dependencies.
- A generic admin-dashboard or starter-template visual identity.
- A collection of deeply nested, over-abstracted files.
- A one-shot code generator that discards context after each build.

---

## 20. Success Metrics

Suggested measures of whether ARTINOS is working as intended:

- **Reuse rate:** percentage of new builds that reuse an existing module rather than duplicating one.
- **Registry coverage:** percentage of built modules that carry a complete registry entry and showcase page.
- **Conversion fidelity:** how closely a converted module preserves the original visual/interaction behavior.
- **Time to showcase:** elapsed time from accepted idea/input to a working, registered showcase.
- **Verification pass rate:** percentage of "completed" tasks that pass build, preview, and console checks before being marked done.
- **Library growth curve:** rate at which the module count and cross-module reuse increase over time.

---

## 21. Open Questions

- What persistence layer backs the registry (local file-based metadata, a database, or both)?
- Is ARTINOS single-user/local-first, or does it need multi-user collaboration and sharing?
- What sandboxing or execution boundary applies to agent-run code during conversion and validation?
- What version-control workflow governs promotion from "module" to "standalone package"?
- What are the concrete criteria that trigger promoting a module out of the Studio into its own package?

---

*End of document.*
