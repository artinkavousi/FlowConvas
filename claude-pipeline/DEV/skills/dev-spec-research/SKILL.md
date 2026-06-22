---
name: dev-spec-research
description: Deep research stage that combines local-folder analysis with web research before a PRD is written. Use whenever the user wants to research a problem space, survey prior art, compare libraries/approaches/tools, understand a domain, or asks "what's the best way to build X" / "what are my options" before committing to a spec. Reads the repo and the web; writes spec/research.md, which feeds /dev-spec-prd. Run under Opus with web search enabled; delegate breadth to subagents when available.
---

# spec-research

Stage 0 of the spec pipeline. Produce `spec/research.md`: a grounded survey of how
to build the thing well, so the PRD and plan rest on evidence instead of guesswork.
Best run under Opus with web access.

## Steps

1. **Frame the questions.** Restate the goal in one line, then list the specific
   questions worth answering: what already exists here, what the current best
   practices are, which libraries/approaches compete and how they trade off, what
   the known pitfalls are. Confirm the framing with the user if the goal is broad.

2. **Local pass.** Read the repo: structure, existing modules, conventions, any
   docs or prior `spec/` artifacts, and code that the new work would touch or
   reuse. Note constraints the codebase already imposes (stack, patterns,
   versions). This pass is read-only.

3. **Web pass.** Research current external knowledge: prior art and how others
   solved it, candidate libraries/tools with concrete tradeoffs, performance and
   security considerations, and common failure modes. Prefer primary sources
   (official docs, papers, maintainer posts) over aggregators. **In Claude Code,
   delegate parallel topics to subagents** so the noisy reading stays out of the
   main context and only the synthesis returns. Cite sources inline.

4. **Synthesize, don't dump.** Write `spec/research.md` from
   `references/research-template.md`: findings grouped by question, an options
   comparison, a recommended approach with explicit rationale and rejected
   alternatives, open questions, risks, and a reference list. Resolve conflicts
   between sources rather than listing both; flag where local code contradicts
   common web advice.

5. **Hand off.** Tell the user research is at `spec/research.md` and that
   `/dev-spec-prd` will consume it. Don't write requirements or code here.

## Gotchas

- **Don't boil the ocean.** Time-box breadth; depth goes to the questions that
  change the decision, not every tangent.
- **Recency matters.** Library APIs and best practices drift — prefer recent,
  versioned sources and note publication dates for anything fast-moving.
- **Local beats web on conflict.** What the repo actually does overrides general
  advice; call out the mismatch explicitly.
- **A recommendation is required.** Research that ends in "it depends" failed its
  job — commit to an approach and state what would change your mind.

## Quality bar

Good research is decision-shaped: a reader finishes knowing which approach to take
and why the alternatives lost. Every nontrivial claim is cited. The recommended
approach is concrete enough that `/dev-spec-prd` can write requirements directly from it.
