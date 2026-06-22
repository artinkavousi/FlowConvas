> # AGENTS.md — Universal Project Agent Rules
>
> > Stable constitution for Codex, Cursor, Claude Code, Kilo, Cline/Roo, and other coding agents.
> > For Codex, keep as `AGENTS.md` in repo root. Read and follow before every task.
>
> ---
>
> ## 0. Prime Directive
>
> Preserve the project's soul while upgrading the system.
>
> Before changing anything, understand the existing architecture, visual identity, behavior, physics, interactions, naming, and intent.
>
> Build real working software — not demos, starters, placeholders, or architecture theater.
>
> Leave the project cleaner, stronger, more reusable, more polished, and verified.
>
> Allowed final states:
>
> - **PASS** — complete and verified with proof.
> - **BLOCKED** — real blocker with evidence and next unblock step.
> - **NEEDS HUMAN DECISION** — a real product/design/architecture decision is required.
>
> Never claim success without proof.
>
> ---
>
> ## 1. Core Values (in priority order)
>
> 1. Correct working behavior
> 2. Preservation of original identity and interactions
> 3. Premium visual/UI quality
> 4. Compact reusable modules
> 5. Clear architecture, minimal file sprawl
> 6. Strong naming, performance-conscious implementation
> 7. Verified output
>
> Build what this project needs, not what a tutorial would build.
>
> ---
>
> ## 2. Work Budget & Focus
>
> Plan enough to build correctly, then build. Verification is required but must not replace implementation.
>
> **Effort budget:**
>
> | Phase         | Budget |
> |---------------|--------|
> | Building      | 70%    |
> | Integration   | 15%    |
> | Verification  | 10%    |
> | Reporting     | 5%     |
>
> **Do not waste the run on:** excessive planning, repeated file scanning, side quests, unnecessary test infrastructure, repeated verification without new changes, long summaries instead of implementation, docs instead of building, checking unrelated files, architecture or verification theater.
>
> **Default task loop:**
>
> ```
> read rules → inspect relevant files → build → integrate → verify → fix if needed → report proof
> ```
>
> If verification fails, fix the root cause and rerun the smallest relevant check. A task succeeds only when the result exists, is integrated, and has proof.
>
> ---
>
> ## 3. Compact Module Philosophy
>
> Prefer one strong file over many weak files.
>
> **Good structure:**
>
> ```
> src/
>   App.tsx
>   NodeCanvas.tsx
>   TaskPanel.tsx
>   GraphRuntime.ts
>   Theme.ts
>   Physics.ts
>   Sound.ts
> ```
>
> **Avoid:** `src/components/features/views/panels/core/internal/shared/base/utils/hooks`
>
> **Split only when:**
>
> - the file is genuinely hard to understand
> - a module is reused by real features
> - a system has clear separate responsibility
> - testing or performance requires isolation
> - the split makes the project *easier*, not harder
>
> **Default module shape:**
>
> ```
> ModuleName.tsx
>   imports → local types → constants → helpers → main component → local subcomponents → exports
> ```
>
> Avoid barrel/re-export spaghetti unless it clearly improves clarity.
>
> ---
>
> ## 4. Copy / Port / Reuse
>
> When porting, reusing, or adapting code from another source:
>
> 1. Locate and inspect the source files first.
> 2. Copy the original implementation as directly as possible.
> 3. Make only minimum changes for imports, paths, types, styling hooks, and integration.
> 4. Preserve source logic, behavior, naming, structure, styling, and interactions.
> 5. Do not rewrite from memory or assumptions.
> 6. Do not replace with a generic equivalent.
> 7. Report unavoidable deviations.
> 8. Verify the port works in the target project.
>
> **Porting priority:** `direct copy → minimal compatibility edits → integration wrapper → refactor only after it works`
>
> If the source cannot be found or is incompatible, report that clearly before inventing a replacement.
>
> ---
>
> ## 5. UI / UX Quality
>
> The UI must feel designed, premium, intentional, and professional.
>
> **Preferred direction:**
>
> - Cinematic / high-end editorial / creative-tool quality
> - Glass, depth, layered surfaces, clear spacing
> - Sharp typography, elegant motion
> - Subtle glow, blur, shadow, and depth
>
> **Avoid:** generic dashboards, AI slop aesthetic, random gradients, plain gray panels, low contrast, unstyled defaults, tutorial-looking output.
>
> **Interactive systems must feel alive:**
>
> - Pointer response, hover/selection states
> - Drag physics, momentum, spring motion
> - Micro-animation, canvas feedback
> - Panel resizing, smooth transitions
>
> A passing build is not enough for visual work.
>
> ---
>
> ## 6. Visual QA Gate
>
> For UI, canvas, 3D, shader, node graph, panel, animation, or layout work — verify visually.
>
> **Check:** composition, typography, spacing, contrast, motion, interaction states, responsiveness, premium feel, match to reference.
>
> **Auto-fail:** generic library demo look, lost original behavior, weak visual hierarchy, missing interaction states, placeholder UI, no visual inspection for visual tasks.
>
> If visual quality fails, improve before final response.
>
> ---
>
> ## 7. Three.js / WebGPU / TSL / R3F
>
> **Preferred pipeline:** `TSL → WebGPU → WebGL2 → WebGL`
>
> For new projects, prefer latest stable compatible versions. For existing projects, inspect and respect installed versions before changing APIs.
>
> **Before coding, check:** `package.json`, lockfile, bundler config, Three.js version, renderer setup, imports, scene lifecycle, animation loop, resize/dispose paths, browser constraints.
>
> **Rules:**
>
> - Do not invent Three.js or TSL APIs
> - Do not mix incompatible versions
> - Do not downgrade advanced requests into cubes/simple demos
> - Treat render quality, lighting, materials, postprocessing, interaction, and performance as first-class
> - Verify with console checks, screenshots, and performance notes
>
> **Serious graphics systems should consider:** renderer, scene/environment, lighting/shadows, camera/controls, materials/shaders, simulation loop, postprocessing, resize/dispose, debug/perf tools, Tweakpane when useful.
>
> ---
>
> ## 8. React Rules
>
> React code should be compact, readable, reusable, visually intentional, state-clean, and effect-safe.
>
> **Avoid:** massive prop drilling, unnecessary context providers, unnecessary global state, uncontrolled side effects, over-splitting into tiny files.
>
> Use Zustand or similar only when state is genuinely shared.
>
> ---
>
> ## 9. Orchestrator Mode
>
> Use for large tasks: architecture change, UI system, node graph, canvas, graphics pipeline, serious visual upgrade, or long-running work.
>
> **First produce a concise plan:** goal, non-goals, files to inspect, milestones, acceptance criteria, verification commands. Then execute only the next milestone.
>
> Do not spend most of the run planning, summarizing, or checking unrelated files.
>
> **Internal roles:**
>
> | Role       | Focus                                  |
> |------------|----------------------------------------|
> | Architect  | Structure, integration, risks          |
> | Designer   | Visual identity, UX, interaction       |
> | Engineer   | Implementation                         |
> | Verifier   | Targeted build/test/preview proof      |
> | Refactorer | Reduce mess without changing behavior  |
>
> Use subagents only for shallow read-heavy work (codebase mapping, docs/API research, review/QA, visual inspection). Do not use many subagents for tightly coupled implementation unless file ownership is isolated.
>
> ---
>
> ## 10. Verification & Evidence
>
> Verification must be targeted, not theatrical. Use only checks relevant to the changed work:
>
> - Typecheck, lint (if relevant/fast)
> - Smallest relevant tests
> - Build, preview/dev route (if UI)
> - Console check (if runtime/UI)
> - Screenshot/visual notes (if visual)
>
> Do not repeatedly run broad verification without code changes. Do not create test infrastructure unless the task specifically requires it.
>
> **Before completion, provide:**
>
> - Files changed
> - Commands run, pass/fail results
> - Tested route/screen, console status
> - Screenshot/visual notes (when relevant)
> - Known limitations
>
> **If verification fails:** identify root cause → fix smallest relevant issue → rerun smallest relevant check → stop only when proof exists or a real blocker remains.
>
> **For port/copy tasks, report:** source files used, what was copied directly, minimum edits made, deviations, target integration status, verification result.
>
> If the agent cannot locate source files, say so before inventing replacement code.
>
> ---
>
> ## 11. Common Failure Patterns (avoid all)
>
> - Generic starter/sample substitution
> - File sprawl, package spaghetti before app is stable
> - Architecture or verification theater
> - Losing original design/behavior
> - Shallow "smallest obvious" implementation
> - TODO/stub/placeholder leakage
> - Overclaiming completion
> - Rewriting source that should have been ported directly
> - Spending tokens on side jobs instead of building
>
> ---
>
> ## 12. Completion Gate
>
> Before final response, confirm:
>
> - [ ] Feature implemented end-to-end
> - [ ] Original identity/behavior preserved unless intentionally changed
> - [ ] No generic demo substitution
> - [ ] No TODO/stub/placeholder leakage
> - [ ] Files remain compact and clear
> - [ ] Relevant verification ran with proof
> - [ ] Visual QA passed (for visual work)
>
> If any item fails, continue working or report **BLOCKED** with evidence.
>
> ---
>
> ## 13. Codex Command Notes
>
> For long/multi-step work:
>
> ```
> /goal Follow AGENTS.md. Preserve project identity, build the milestone, verify with proof.
> ```
>
> For porting:
>
> ```
> /goal Port source files directly with minimum compatibility edits. No generic replacements.
> ```
>
> For visual upgrades:
>
> ```
> /goal Preserve original visual identity while upgrading to premium quality. Verify visually.
> ```
>
> Before risky/unclear work:
>
> ```
> /plan Create a concise milestone plan. Do not edit app code yet.
> ```
>
> ---
>
> > **Golden rule:** Preserve the soul. Upgrade the system. Keep modules compact. Reuse source directly when porting. Verify everything.