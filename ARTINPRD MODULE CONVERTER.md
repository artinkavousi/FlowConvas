Here is the expanded PRD example section with **sample files, naming rules, inputs/outputs, registry fields, and final structure**.

## Example Workflow: Converting an Existing Project into an ARTINOS Module

Example input:

```txt
WebGL-Fluid-Simulation-master.zip
```

This is an existing standalone interactive visual project.

In ARTINOS, this should not remain an isolated demo. The system should analyze it, extract the reusable creative core, convert it into a clean ARTINOS module, register it in the library, and create a full showcase page with controls, preview, usage examples, and validation notes.

------

## Example Agent Input

The agent may receive any of these input types:

```txt
Input Type: Existing Project
Input Source: WebGL-Fluid-Simulation-master.zip
Goal: Convert into reusable ARTINOS visual module.
Target Category: WebGPU / Fluid / Interactive Visual
Expected Output: Reusable module + showcase page + registry entry + controls + usage docs.
```

Or:

```txt
Input Type: Idea / PRD
Idea: Build an interactive fluid hero background with audio reactivity and pointer splats.
Goal: Create reusable visual component and showcase page.
Target Category: Interactive Visual / Hero Section / WebGPU
Expected Output: Component, presets, controls, registry item, showcase route.
```

------

## What the Agent Should Do

The agent should:

1. Inspect the project structure, dependencies, runtime logic, UI, shaders, interactions, presets, and controls.
2. Identify the real reusable systems inside the project.
3. Separate one-off app scaffolding from reusable visual modules.
4. Preserve the original visual behavior, shader logic, physics, audio reactivity, controls, and interaction quality.
5. Decompose the project into compact ARTINOS reusable files.
6. Add the new module to the ARTINOS library.
7. Create a showcase page with live preview, controls, presets, code usage, dependency list, and reuse instructions.
8. Add registry metadata so the module can be searched, previewed, copied, reused, extended, and used by AI agents.
9. Keep the showcase, registry, and reusable source fully synced.
10. Verify build, preview, console, and behavior before reporting completion.

------

## Example Final Output

The fluid simulation project could become:

```txt
ARTINOS Library
  Visual Modules
    WebGPU Fluid Simulation
      - reusable source module
      - live showcase page
      - registry entry
      - control schema
      - presets
      - dependency list
      - usage example
      - agent instructions
      - validation notes
```

The module should be reusable as:

- full-screen interactive background
- hero section visual
- audio-reactive visualizer
- shader/material showcase
- WebGPU/TSL creative module
- node graph visual effect
- reusable scene capsule
- standalone interactive page
- component inside another project

------

## Example File Structure

Prefer compact files first:

```txt
src/artinos/
  ARTINOSStudio.tsx
  StudioRegistry.ts
  ShowcaseRouter.tsx

  modules/
    WebGPUFluidModule.tsx
    WebGPUFluidShowcase.tsx
```

If the module grows and parts are truly reused, then split into a slightly larger structure:

```txt
src/artinos/
  ARTINOSStudio.tsx
  StudioRegistry.ts
  ShowcaseRouter.tsx

  modules/
    webgpu-fluid/
      WebGPUFluidModule.tsx
      WebGPUFluidShowcase.tsx
      WebGPUFluidRegistry.ts
      WebGPUFluidPresets.ts
      WebGPUFluidControls.ts
```

Avoid unnecessary file sprawl like:

```txt
src/components/fluid/
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
  helpers.ts
  adapters.ts
```

Only split files when there is real reuse or the file becomes genuinely hard to maintain.

------

## Naming Rules

Use clear, direct, searchable names.

Good names:

```txt
WebGPUFluidModule.tsx
WebGPUFluidShowcase.tsx
WebGPUFluidRegistry.ts
WebGPUFluidPresets.ts
WebGPUFluidControls.ts
FluidEmitterSystem.ts
AudioReactiveFluid.ts
ShaderGradientModule.tsx
MagneticCardsModule.tsx
ParticleHeroModule.tsx
SplineSceneModule.tsx
```

Avoid vague names:

```txt
index.tsx
main.tsx
utils.ts
helpers.ts
stuff.ts
demo.tsx
test.tsx
newComponent.tsx
module1.tsx
```

Use this naming pattern:

```txt
[FeatureName]Module.tsx      → reusable module/component
[FeatureName]Showcase.tsx    → showcase/demo page
[FeatureName]Registry.ts     → registry metadata
[FeatureName]Presets.ts      → presets
[FeatureName]Controls.ts     → control schema
[FeatureName]Runtime.ts      → reusable runtime logic
```

------

## Example Reusable Module API

The converted module should expose a clean API:

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

Example props:

```ts
export type WebGPUFluidModuleProps = {
  preset?: "aurora" | "bass-drop" | "deep-space" | "molten-metal";
  interactive?: boolean;
  audioReactive?: boolean;
  showParticles?: boolean;
  quality?: "low" | "medium" | "high" | "auto";
  className?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
};
```

The module should handle:

- WebGPU capability checks
- graceful fallback message
- pointer interaction
- preset loading
- responsive resizing
- performance scaling
- cleanup on unmount
- optional audio permission flow
- optional particles
- optional controls connection

------

## Example Registry Entry

Each reusable module should be registered:

```ts
export const webgpuFluidRegistryItem = {
  id: "webgpu-fluid-simulation",
  name: "WebGPU Fluid Simulation",
  slug: "webgpu-fluid",
  type: "interactive-visual-module",
  category: "WebGPU / Fluid / Interactive Visual",
  description:
    "Reusable WebGPU fluid simulation module with pointer splats, emitters, particles, presets, audio reactivity, quality scaling, and live controls.",

  source: "src/artinos/modules/webgpu-fluid/WebGPUFluidModule.tsx",
  showcase: "/showcase/webgpu-fluid",

  dependencies: ["three", "tweakpane"],
  tags: ["webgpu", "fluid", "shader", "interactive", "audio-reactive"],

  inputs: [
    "preset",
    "interactive",
    "audioReactive",
    "showParticles",
    "quality",
    "className"
  ],

  outputs: [
    "onReady",
    "onError",
    "performanceStats",
    "currentPreset",
    "captureFrame"
  ],

  capabilities: [
    "WebGPU rendering",
    "fluid simulation",
    "pointer interaction",
    "emitters",
    "particles",
    "audio reactivity",
    "presets",
    "performance scaling"
  ],

  reusableAs: [
    "hero background",
    "interactive page",
    "audio visualizer",
    "shader showcase",
    "creative coding module",
    "node graph visual effect"
  ],

  agentNotes:
    "Preserve the original solver behavior, visual identity, interactions, and shader logic. Do not replace with a generic Three.js demo. Runtime must remain reusable and independent from the showcase page.",

  validation: {
    build: "required",
    preview: "required",
    console: "required",
    interaction: "required"
  }
};
```

------

## Example Controls Schema

Each module should expose controls that the Studio, showcase page, inspector, or node graph can reuse.

```ts
export const webgpuFluidControls = {
  preset: {
    type: "select",
    label: "Preset",
    options: ["aurora", "bass-drop", "deep-space", "molten-metal"],
    default: "aurora"
  },

  quality: {
    type: "select",
    label: "Quality",
    options: ["low", "medium", "high", "auto"],
    default: "auto"
  },

  interactive: {
    type: "boolean",
    label: "Pointer Interaction",
    default: true
  },

  audioReactive: {
    type: "boolean",
    label: "Audio Reactive",
    default: false
  },

  showParticles: {
    type: "boolean",
    label: "Particles",
    default: true
  },

  bloom: {
    type: "range",
    label: "Bloom",
    min: 0,
    max: 2,
    step: 0.01,
    default: 0.7
  },

  fluidStrength: {
    type: "range",
    label: "Fluid Strength",
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.45
  }
};
```

------

## Example Inputs and Outputs

Each module should clearly define what it receives and what it exposes.

### Inputs

```txt
preset
quality
interactive
audioReactive
showParticles
className
style
controlsOverride
initialEmitters
onReady
onError
```

### Outputs

```txt
ready state
error state
current preset
performance stats
available presets
capture/export function
runtime reference
control state
diagnostic messages
```

Example output API:

```ts
export type WebGPUFluidModuleHandle = {
  setPreset: (presetId: string) => void;
  reset: () => void;
  pause: () => void;
  resume: () => void;
  captureFrame: () => Promise<Blob>;
  getPerformanceStats: () => {
    fps: number;
    gpuTier?: string;
    quality: string;
  };
};
```

------

## Example Showcase Page

The showcase should use the real module:

```tsx
export function WebGPUFluidShowcase() {
  return (
    <ARTINOSShowcaseLayout
      title="WebGPU Fluid Simulation"
      category="WebGPU / Fluid / Interactive Visual"
      description="A reusable fluid simulation module with presets, pointer interaction, particles, and audio reactivity."
    >
      <WebGPUFluidModule
        preset="aurora"
        interactive
        audioReactive={false}
        showParticles
        quality="auto"
      />

      <ShowcaseControls moduleId="webgpu-fluid-simulation" />
      <ShowcaseUsage moduleId="webgpu-fluid-simulation" />
      <ShowcaseValidation moduleId="webgpu-fluid-simulation" />
    </ARTINOSShowcaseLayout>
  );
}
```

The showcase page should include:

- live preview
- full controls
- presets
- usage code
- dependency list
- copy-paste instructions
- registry metadata
- related modules
- validation status
- agent notes

------

## Example Usage in Another Project

After conversion, the module should be usable like this:

```tsx
import { WebGPUFluidModule } from "@/artinos/modules/webgpu-fluid/WebGPUFluidModule";

export default function HeroFluidPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      <WebGPUFluidModule
        preset="aurora"
        interactive
        audioReactive={false}
        showParticles
        quality="high"
        className="absolute inset-0"
      />

      <section className="relative z-10 flex min-h-screen items-center justify-center">
        <h1 className="text-7xl font-semibold text-white">
          ARTINOS Fluid Engine
        </h1>
      </section>
    </main>
  );
}
```

------

## Final Conversion Report Format

The agent must report the result like this:

```txt
PASS / BLOCKED / NEEDS HUMAN DECISION

Input:
- WebGL-Fluid-Simulation-master.zip

Summary:
- Converted standalone fluid simulation into reusable ARTINOS module.

Created:
- src/artinos/modules/webgpu-fluid/WebGPUFluidModule.tsx
- src/artinos/modules/webgpu-fluid/WebGPUFluidShowcase.tsx
- src/artinos/modules/webgpu-fluid/WebGPUFluidRegistry.ts
- src/artinos/modules/webgpu-fluid/WebGPUFluidPresets.ts
- src/artinos/modules/webgpu-fluid/WebGPUFluidControls.ts

Registered:
- webgpu-fluid-simulation

Showcase:
- /showcase/webgpu-fluid

Inputs:
- preset
- quality
- interactive
- audioReactive
- showParticles
- className

Outputs:
- onReady
- onError
- performanceStats
- currentPreset
- captureFrame

Preserved:
- original solver behavior
- pointer splats
- shader logic
- emitters
- particles
- presets
- audio reactivity
- performance scaling

Added:
- ARTINOS registry metadata
- showcase page
- reusable component API
- controls schema
- usage example
- validation notes

Validation:
- npm install: PASS / FAIL
- npm run build: PASS / FAIL
- preview: PASS / FAIL
- console: PASS / FAIL
- interaction test: PASS / FAIL

Known Issues:
- list any real unresolved issues

Next:
- recommended improvements
```

Do not mark the work complete unless build, preview, console, and interaction checks were actually performed.

The final result should turn every useful project, repo, demo, PRD, or idea into a reusable ARTINOS asset that stays synced with the library, gallery, showcases, examples, and future projects.