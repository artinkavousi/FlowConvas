# Conversion Plan — <id>

> Step 7 artifact. Save as `docs/conversions/<id>-conversion-plan.md` (flat — no nested folder).
> Fill **every** section. A completely blind downstream agent must be able to execute this with no other
> context. Spec: [`blueprinting.md`](../blueprinting.md). Pipeline:
> [`converter-pipeline.md`](../converter-pipeline.md). Contract:
> [`module-and-lab-standards.md`](../module-and-lab-standards.md).
>
> Conversion id: `<id>` · Mode: A | B · Author/model: <model> · Date (UTC): <YYYY-MM-DD>

---

## 0. Overview (at a glance)

> Required, and first. A clean, minimal, scannable summary so a reader instantly grasps the plan before
> the deep sections. Keep it tight.

**What:** <one or two lines — what the source is and what it produces>. Mode <A|B> · Status: <…>.

**Decomposed modules (canonical library):**

| Kind | Module (clean name, no `.module`) | Category | Status |
|---|---|---|---|
| universal | `<Feature>` | `<category>` | ⬜/✅ |
| domain | `<Feature>` | `<category>` | ⬜/✅ |

**Reuse (extend existing — do NOT duplicate):** `<existing-module-id>` (why) · …

**Direct copy (harvest near-verbatim from the source):** `<File>` (→ `<category>`) · …

**Lab (Mode B):** `STUDIO/src/labs/<id>/` — <host runtime> + snapshots + `local/` (<what>).

---

## 1. Source & deep analysis (steps 1–2)

- **Input type / source path(s):** `REF/<source>` (or idea/PRD text).
- **Original pipeline:** raw WebGL | WebGL2 | WebGPU | Three.js GLSL | TSL | other: <…>
- **What it does (1 paragraph):** …
- **Files read (the real source):** `path — purpose` (list every file inspected). If any required source
  is missing → **BLOCKED**, list the path, stop.
- **All major systems found:** render · GPGPU/WebGPU · physics/particles · emitters · input · environment
  · postfx · math/noise/color · performance · audio · UI · scaffolding (to discard).

### TSL-triage decision (step 2 Pipeline Rule)
- **Decision:** Rebuild on **TSL** (`three/webgpu`+`three/tsl`) | Port on original pipeline.
- **Reason:** … (if TSL deferred, state the prohibitive-complexity reason here and in the deviation report).
- **Operator rewrites needed:** `+ * -` → `.add().mul().sub()` chains (STUDIO has no TSL operator plugin).

---

## 2. Decomposition & scope map (steps 3–6)

| System | Generalized form | Classification | Lands in | Reuse-first hit? | Harvest-by-copy? |
|---|---|---|---|---|---|
| … | … | Core Universal / Domain / Project-specific / Scaffolding | `STUDIO/src/modules/<category>/…` or `labs/<id>/local/…` | existing module id or "new" | yes/no |

- **Reuse-first result (step 5):** existing modules that cover/extend the need (ids), and what is
  genuinely new.
- **Direct asset harvest (step 6):** ready-made reusable files in the source to copy verbatim.
- **Out of scope (discarded scaffolding):** …

---

## 3. Per-module build plan (one block per canonical module)

### `STUDIO/src/modules/<category>/<Feature>.ts(x)`  (or `.js` for untyped Three/TSL)
- **Ported from:** `<source path / lines>` — preserve verbatim where possible.
- **Public exports:** `createX(canvas, opts) → handle` | `class X` | React `<X/>`.
- **Sections:** imports → types → constants/defaults → helpers → main → exports → dispose → notes.
- **Functions (signature · params · returns · side effects):**
  - `fn(a: T, b: U): R` — params: a=…, b=…; returns: …; effects: …; ports source: `<file:lines>`.
- **Render/hardware details:** renderer, TSL/GLSL, loop, buffer formats, ping-pong/compute layout,
  resize, `dispose()`, capability/fallback.
- **`ArtinosModule` entry plan** (`<Feature>.meta.ts`):
  - `id` (`=== schema.id`), `name`, `category`, `description`, `tags`.
  - `schema.parameters`: `key/label/type/default` (+ `min/max/step` for numbers), grouped.
  - `dependencies` (incl. `'webgpu'` if required), `presets`, `related`, `agentNotes` (full text),
    `version`, `updatedAt`.
- **Showcase (`<Feature>.showcase.tsx`):** bridge id, canvas ref, ResizeObserver, `dispose()`; default
  OUTSIDE the selector (ADR-13).
- **Standalone-reuse proof:** how its showcase runs it **outside** the source's domain.

*(repeat for every canonical module)*

---

## 4. Mode B — Lab capsule plan (skip for Mode A)

- **Lab id / path:** `STUDIO/src/labs/<id>/`
- **Files:** `<PascalId>Lab.tsx` · `<PascalId>Lab.meta.ts` · `create<PascalId>Lab.js`.
- **Composition (`create<PascalId>Lab.js`):** how systems are wired to reproduce the original init +
  render loop (mirror the source's `main`/entry).
- **Snapshots into `labs/<id>/modules/<category>/`:** list each canonical module copied in + provenance
  (`canonicalSource`, `copiedFor`, `syncStatus`).
- **`local/` project-specific files:** `presets/` · `composition/` · `tuning/` · `interaction/`.
- **Showcase dashboard controls/presets:** the parameter set + named presets.

---

## 5. Ordered task checklist (steps 8–11)

> Dependency-ordered, self-contained. Each task: files · pattern to mirror · out-of-scope · acceptance check.

- [ ] T-1 — … · files: … · mirror: … · acceptance: `command` → expected.
- [ ] T-2 — …
- [ ] … (modules first, Lab last)

---

## 6. Fidelity, deviations & validation

- **Preserved verbatim:** visuals · interactions · physics · shader loops · constants · naming · audio.
- **Planned deviations (with reason):** … (also reported at the end of the conversion).
- **Validation (DoD):** `npm run check-registry -w STUDIO` · `npm run lint -w STUDIO` · live preview with
  a control driving it · zero console errors · side-by-side fidelity vs source.
