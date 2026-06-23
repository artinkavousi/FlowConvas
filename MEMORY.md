# MEMORY.md - ARTINOS Project Memory

> Durable project memory for agents working in `G:\CODE2026\.PROJECTS\ARTINOS`.
> Read this with `AGENTS.md` before making changes. This file captures current
> architecture decisions, package boundaries, user preferences, and verification gates.
> It is not a replacement for the docs; it is the fast memory index that points to them.

---

## 0. Required Reading Order

1. `AGENTS.md` - universal operating rules: preserve identity, build real software, verify with proof.
2. `MEMORY.md` - current repo-specific memory and boundaries.
3. `STUDIO/AGENTS.md` - Studio module, registry, converter, and library-sync rules.
4. `spec/decisions.md` - accepted ADRs; append-only source of architectural decisions.
5. Task-specific docs:
   - `ARTINOS-PRD.md` and `spec/prd.md` for product intent.
   - `spec/plan.md` and `spec/tasks.md` for MVP plan and current task gates.
   - `spec/converter-workflow.md` for converting external sources into modules.
   - `PANELFLOW/README.md`, `PANELFLOW/DOCS/PANELFLOW_PRD.md`, and
     `PANELFLOW/DOCS/PANELFLOW_IMPLEMENTATION_GUIDE.md` for PANELFLOW package work.

---

## 1. Prime Project Memory

- ARTINOS is a local-first creative studio, registry, converter, and agent-operable build system for reusable interactive visual modules: React components, panels, UI blocks, 3D scenes, shaders, TSL/WebGPU systems, pages, and workflows.
- PANELFLOW is an independent, universal, self-contained UI/UX, dock, panel, design-system, and control-surface package. Treat it like an installable `node_modules` package.
- ARTINOS consumes PANELFLOW and builds ARTINOS-specific interface, modules, registry, showcases, branding, and workflows on top of it.
- Do not hardcode ARTINOS assumptions into PANELFLOW. Host-specific branding/content belongs in `STUDIO`, not the package.
- PANELFLOW files and components should be copy-pasteable into other React projects with minimal dependency pain.
- ARTINOS modules should also stay copy-paste portable: compact, self-contained, with listed dependencies and no unnecessary lock-in to ARTINOS shell logic.
- The current preferred UX model is: component/project runs in the main viewport; Scene Settings, Inspector, and Library are the main dock panels; graph/tools are secondary panels.
- The Inspector is the user-facing home for active component/project controls and information. Generated auto-control panels can exist internally, but should not clutter the rail unless explicitly exposed.

---

## 2. Package Boundaries

### PANELFLOW

Owns:
- Panel OS, panel registry, panel store, panel chrome, icon rail, dock modes, command palette.
- Editor dock and viewport slot infrastructure.
- Control schema engine: `ComponentSchema`, `registerComponent`, generated panels, bridge store, instance support.
- Frost Tweakpane integration and styling.
- Graph canvas and node/panel orchestration surfaces.
- Shared visual language: tokens, glass surfaces, teal accent, dock styling, panel layout primitives.

Must remain:
- Host-brandable, not ARTINOS-branded by default.
- Buildable as a package through `npm run build:lib -w PANELFLOW`.
- Usable by other projects via public exports from `PANELFLOW/src/export.ts`.
- Self-contained where possible: Frost panel/hook import their own CSS, generated controls derive from schema + bridge, and package internals avoid needing STUDIO.

### STUDIO / ARTINOS

Owns:
- ARTINOS host branding and product-specific copy.
- File-based reusable module registry.
- Module discovery, search, selection, active module state, and preview stage.
- Library and active-module Inspector panels specific to ARTINOS.
- Conversion workflow and module scaffold/check scripts.
- ARTINOS modules under `STUDIO/src/modules/<id>/`.

Must not:
- Rebuild PANELFLOW panel/control/dock/design systems in STUDIO.
- Fork PANELFLOW logic into ARTINOS when the capability belongs in the package.
- Add one-off demo pages that bypass the panel/dock/viewport model.

---

## 3. Current Architecture Memory

- Root workspace uses npm workspaces for `PANELFLOW` and `STUDIO`.
- `STUDIO` declares `@artinos/panelflow` as `file:../PANELFLOW` while Vite aliases the package to PANELFLOW source for development HMR.
- `STUDIO` forces a single React copy through Vite aliases/dedupe to avoid duplicate-React store loops.
- `PANELFLOW/src/export.ts` is the package API contract. Add exports there intentionally.
- `Workspace` is host-brandable and accepts a host viewport. ARTINOS passes `brand={{ name: 'ARTINOS', ... }}` from `STUDIO`.
- Viewport is the live stage, not a documentation page. Controls and metadata live in dock panels.
- The graph is an optional panel, not the hardcoded center of the dock.
- The dock is a multi-panel host using resizable split columns plus a vertical icon rail.
- Current main panels are consolidated around meaningful surfaces: `Scene Settings`, `Inspector`, and `Library`. `Node Graph` is secondary/optional. Avoid bringing back old stub panels like generic Code/Engine placeholders.
- PANELFLOW owns the shared performance monitor contract. Host modules and reusable components should publish real render-loop telemetry through `usePerformanceTelemetry` / `publishPerformanceStats`; the dock monitor must display unavailable values honestly instead of decorative FPS/compute/memory constants.

---

## 4. Control Panel Pipeline

- PANELFLOW `ComponentSchema` is the canonical control schema for ARTINOS modules.
- `schema.id` must equal the ARTINOS module `id`.
- `registerComponent(module.schema)` and the control engine create generated control panels.
- Generated control panels should use `FrostPanePanel` / tweakpane_frost, not a separate ARTINOS-built control UI.
- `ParameterDef.group` maps to Tweakpane folders.
- Modifiers map to folders and must stay schema-driven.
- Edits write to the shared `useBridgeStore`.
- External bridge updates must refresh controls without remounting the whole pane.
- For multiple copies of the same component, prefer `registerComponentInstance` and concrete instance ids instead of writing into only the shared schema bucket.
- Module previews must read the bridge raw slice and apply defaults outside the selector:

```ts
const values = useBridgeStore((s) => s.componentValues['module-id']);
const color = values?.color ?? '#2dd4bf';
```

Never return a fresh fallback object inside the selector, such as `s.componentValues[id] || {}`.

---

## 5. Module And Registry Rules

- Module folder shape:

```txt
STUDIO/src/modules/<id>/
  <PascalId>Preview.tsx
  <id>.module.ts
```

- Each `<id>.module.ts` default-exports an `ArtinosModule`.
- Registry discovery uses `import.meta.glob('../modules/*/*.module.{ts,tsx}', { eager: true })`.
- Required fields include: `id`, `name`, `category`, `description`, `tags`, `schema`, `preview`, `sourcePath`, `dependencies`, `usage`, `agentNotes`, `version`, `updatedAt`.
- `agentNotes` must let another agent use or extend the module without reading the source first.
- When module source changes, update metadata, `usage`, `dependencies`, `agentNotes`, `validation`, and `updatedAt`.
- Run `npm run check-registry -w STUDIO` after any module/registry change.
- Useful one-off results should be captured as reusable modules. No useful system stays trapped in a demo.

---

## 6. Conversion / Porting Memory

- Always locate and inspect source files before porting.
- Port directly first. Preserve source logic, visuals, interactions, animation, physics, shaders, materials, presets, and naming as much as possible.
- Make only minimum compatibility edits for imports, paths, types, styling hooks, and integration.
- If the source cannot be found or is incompatible, report `BLOCKED` with evidence instead of inventing a generic replacement.
- Use `spec/converter-workflow.md` for accepted inputs, deliverables, module mapping, and validation.
- External conversions must include a fidelity note and report deviations.
- The WebGPU Fluid Simulation source was provided under `REF/WebGpu-Fluid-Simulation-master` and was ported as the `webgpu-fluid` module.

---

## 7. Visual / UX Memory

- The visual identity is high-end creative-tool quality: cinematic dark base, glass depth, layered dock surfaces, subtle grain, teal accent (`#2dd4bf`), sharp typography, restrained glow, and smooth interaction states.
- Avoid generic dashboards, plain gray panels, placeholder smoke pages, random gradients, and unstyled library defaults.
- For panel/control work, visual QA is mandatory. Build passing is not enough.
- The user strongly rejects replacing recognizable product/demo UI with stripped placeholder pages.
- Tweakpane must stay the control toolkit when requested; improve grouping, Frost styling, and schema-driven behavior instead of replacing it.
- Generated panels should be meaningful and grouped. Merge related content when it reduces clutter.

---

## 8. Verification Memory

Use targeted checks. Common gates:

```bash
npm run lint -w PANELFLOW
npm run build:lib -w PANELFLOW
npm run lint -w STUDIO
npm run check-registry -w STUDIO
npm run build -w STUDIO
```

For UI/panel/viewport work:
- Verify `http://127.0.0.1:3001/` or the active dev URL in the browser.
- Check console warnings/errors.
- Confirm the visible screen, not only build output.
- For generated controls, load a module and verify controls drive the live viewport.

For module changes:
- Confirm the registry lists the module.
- Confirm `schema.id === module.id`.
- Confirm source paths resolve.
- Confirm no duplicate module ids.

---

## 9. Settled Decisions Snapshot

See `spec/decisions.md` for full ADR text. Current accepted highlights:

- ARTINOS v1 is single-user and local-first.
- Registry is file-based, no database in v1.
- Agent-operable v1 means structured metadata + documented workflow, not a bespoke runtime.
- STUDIO consumes PANELFLOW source during development through workspace + Vite alias.
- PANELFLOW `ComponentSchema` is the canonical control schema.
- Converter is a documented workflow plus scaffold script.
- `check-registry` is the library-sync gate.
- No router in v1; navigation uses a tiny store.
- Viewport is live stage; controls live in the dock.
- Generated controls render with tweakpane_frost.
- Dock is a multi-panel host; graph is optional.
- PANELFLOW is a real local package; STUDIO consumes it as a package while keeping HMR.

---

## 10. Known Risks / Watch Points

- Do not let STUDIO become a second PANELFLOW implementation.
- Do not let PANELFLOW become ARTINOS-specific.
- Keep package exports intentional; avoid leaking raw internals unless meant as public API.
- Tweakpane/plugin chunks are large. Keep lazy loading and package build outputs intentional.
- If React store loops appear, check for duplicate React or selectors returning fresh fallback objects.
- If browser verification fails due to GPU adapter limitations, distinguish environment limits from app failure and verify in a GPU-capable browser when needed.
- Documentation is protected. Do not delete or prune docs during cleanup without explicit user approval.

---

## 11. Documentation Map

- `AGENTS.md` - universal agent constitution and completion gate.
- `MEMORY.md` - this repo-specific memory index.
- `ARTINOS-PRD.md` - full product vision.
- `spec/prd.md` - scoped implementation PRD.
- `spec/plan.md` - architecture, milestones, risks, verification strategy.
- `spec/tasks.md` - Studio MVP task breakdown and current completion state.
- `spec/decisions.md` - append-only ADR log.
- `spec/converter-workflow.md` - conversion procedure.
- `STUDIO/AGENTS.md` - Studio-specific module/registry rules.
- `PANELFLOW/README.md` - package usage and public API.
- `PANELFLOW/DOCS/PANELFLOW_PRD.md` - package product requirements.
- `PANELFLOW/DOCS/PANELFLOW_IMPLEMENTATION_GUIDE.md` - package audit, adjustments, migration, acceptance criteria.
- `PANELFLOW/DOCS/CHAT History.md` - historical prompt/context; use only as background, not as current implementation truth.
- `claude-pipeline/DEV/*` - optional spec-pipeline tooling reference; not the core runtime architecture.

---

## 12. Updating This Memory

- Update `MEMORY.md` when a decision changes, a new invariant is established, or a repeated failure pattern is discovered.
- Keep entries concise and durable. Do not paste whole docs here.
- If a decision belongs in history, append it to `spec/decisions.md` and summarize it here.
- If a rule affects future agent behavior, also cross-reference it from `AGENTS.md` or `STUDIO/AGENTS.md`.
