# Plan — <Project / Feature name>

> Status: draft · Based on: spec/prd.md, spec/research.md · Updated: <date>
> Readiness: PASS | CONCERNS | FAIL  (set at end of /dev-spec-plan)

## 1. Approach
The strategy in a few sentences: how we get from nothing to the PRD's goals, and
the order of attack at a high level.

## 2. Architecture
Modules/components and how they fit; prefer the smallest structure that works.

**Components & responsibilities**
- <module> — does X; owns Y.

**Data model**
- <entity/state shape> and where it lives.

**Public interfaces (contracts the rest of the system depends on)**
```
<key signatures / API shapes>
```

**Data / control flow**
```
<sketch: boxes & arrows, or a short file tree of what will exist>
```

**Design direction** (UI work only)
Aesthetic/interaction direction so the build isn't generic. Reference any
frontend-design conventions in play.

## 3. Key decisions
Each non-trivial choice with the options weighed.
- D-1: <decision> — chosen over <alternative> because <reason>. (→ decisions.md)

## 4. Risks
Each with a concrete mitigation, not just a worry.
- R-1: <risk> → mitigation: <action>.

## 5. Test & verification strategy
What proves correctness overall (unit / integration / e2e / visual), and what
"done" means for the whole effort.

## 6. Observability
What we log/measure to know it works in practice (metrics, errors, traces).

## 7. Milestones
Coarse checkpoints that each deliver something verifiable.
- M-1: <milestone> — done when <observable condition>.
