# Tasks — <Project / Feature name>

> Based on: spec/plan.md · Execute with /dev-spec-build · Tick boxes as completed.
> `[ ]` todo · `[x]` done · Size: S/M/L (split any L) · "Wave" = parallel-safe (disjoint files).

---

## Epic A — <theme>  (omit epics for small efforts)

### Wave 1 — foundation (parallel-safe)

#### [ ] T-1 (S): <short imperative title>
- **Satisfies:** FR-1, FR-3
- **Files:** `src/feature/grid.ts` (create)
- **Interface:** `export function makeGrid(w: number, h: number): Grid`
- **Pattern:** mirror the structure/style of `src/feature/advect.ts`
- **Out of scope:** rendering, input handling
- **Test first:** write `grid.test.ts` asserting `makeGrid(2,2)` is a zeroed 2×2 grid
- **Acceptance:** `npm test grid` passes
- **Depends on:** none

#### [ ] T-2 (M): <title>
- **Satisfies:** FR-2
- **Files:** …
- **Interface:** …
- **Pattern:** …
- **Out of scope:** …
- **Test first:** …
- **Acceptance:** …
- **Depends on:** none

### Wave 2 — depends on Wave 1

#### [ ] T-3 (S): <title>
- **Satisfies:** FR-4
- **Files:** …
- **Interface:** …
- **Pattern:** …
- **Out of scope:** …
- **Test first:** …
- **Acceptance:** …
- **Depends on:** T-1

---

<!--
Every task must be doable by someone with only this repo + this entry.
If it isn't, it's underspecified — add the missing files / interface / pattern /
test / acceptance before handing it to /dev-spec-build. Split any task sized L.
-->
