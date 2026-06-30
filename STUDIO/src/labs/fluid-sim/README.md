# Lab: fluid-sim

Faithful, self-contained replica of `REF/WebGpu-Fluid-Simulation-master`, rebuilt from reusable
ARTINOS components (Mode B — see `spec/fluid-modeb-conversion-plan.md` and `docs/converter-pipeline.md`).
Supersedes the deleted monolithic `webgpu-fluid` module.

## What it is
The complete original experience: fluid solver + internal particles + the full emitter system +
audio reactivity + presets + adaptive quality + pointer interaction. The original Tweakpane GUI is
replaced by the PANELFLOW control surface; the perf HUD, video recorder, URL preset-sharing and
keyboard debug targets are dropped.

## Capsule layout
```
labs/fluid-sim/
  FluidSimLab.tsx         # bridge-driven preview (canvas + mic toggle + dispose)
  FluidSimLab.meta.ts     # registry entry (id "fluid-sim", category lab)
  createFluidSimLab.js    # composition factory — reproduces REF main.js init + loop
  modules/                # VERBATIM reusable-module snapshot (self-contained, copy-pasteable)
    fluid/ particles/ emitters/ audio/ presets/ performance/ compat/
    config.js  input.js  assets/
  local/                  # project-specific (not canonical library) material
    presets/  tuning/
  README.md
```

## Component modules (canonical, shipped standalone under `src/modules/`)
- `webgpu-fluid-sim` — the fluid solver visual (`fluid/` + particles + compat)
- `fluid-emitters` — the emitter system (`emitters/`)
- `audio-reactive` — the audio-reactivity engine (`audio/`)

The Lab keeps its **own** verbatim `modules/` snapshot so it stays portable/copy-pasteable
(Lab Capsule Standard); the standalone modules carry their own copies of the same source by design.
Promotion of shared cores into `packages/` (de-dupe) is the future path (master guideline §14).

## Provenance
Ported verbatim from `REF/WebGpu-Fluid-Simulation-master/src` (Three.js r184 + TSL + WebGPU).
See `local/tuning/provenance.ts`.
