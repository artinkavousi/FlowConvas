# PRD — <Project / Feature name>

> Status: draft · Owner: <name> · Sources: spec/research.md (if any) · Updated: <date>

## 1. Summary
One paragraph: what this is and why it exists. A newcomer should understand the
project from this alone.

## 2. Problem
The problem and who has it. What's painful today and what it costs.

## 3. Goals & non-goals
**Goals** (measurable/observable):
- G-1: …

**Non-goals** (deliberately out of scope — be generous here):
- NG-1: …

## 4. Users & journeys
Personas and the concrete situations they're in.
- Persona: <who> — context, needs, constraints.
- Journey: as a <user>, I <do X> so that <outcome>. (2–4 of these.)

## 5. Functional requirements
Numbered, testable, outcome-focused. Priority: M(ust) / S(hould) / C(ould).
| ID | Requirement (what, not how) | Priority | Acceptance criterion |
|----|------------------------------|----------|----------------------|
| FR-1 | The system shall … | M | … |
| FR-2 | … | S | … |

## 6. Non-functional requirements
Concrete budgets/targets where possible.
- NFR-1 (performance): … (e.g. interaction < 16ms, cold load < 2s)
- NFR-2 (accessibility): …
- NFR-3 (security/privacy): …
- NFR-4 (compatibility): browsers / devices / offline …

## 7. Edge cases & error states
The non-happy paths the build must handle, not discover later.
- EC-1: <condition> → expected behavior.

## 8. Dependencies & integrations
External services, libraries, APIs, data sources, and what each is relied on for.

## 9. Constraints & assumptions
Fixed stack, platforms, deadlines, and anything assumed true.

## 10. Success metrics
How we'll know it worked, with targets. Tie back to the goals.

## 11. Rollout & risk
How it ships (phasing/flags), and the rollback or fallback if it goes wrong.

## 12. Out of scope (for now)
Deliberately deferred, so the plan doesn't accidentally include it.

## 13. Open questions
Unresolved decisions. `/dev-spec-plan` resolves these first.
- Q-1: …
