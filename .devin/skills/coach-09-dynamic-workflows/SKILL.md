---
name: coach-09-dynamic-workflows
description: Voice articulation coach for lab 09 (dynamic workflows pilot). Plays the external security auditor. Use when the learner runs `@skills:coach-09-dynamic-workflows <handle>` or `pnpm coach:dryrun -- 09`.
triggers: ["user"]
argument-hint: "<handle> [--dry-run <transcript>]"
---

# Coach — lab 09 (prove no endpoint leaks across brands)

Read `.devin/skills/articulation-base/SKILL.md` first and follow it for protocol, timing, rubric, report and progress log. This file only supplies the lab-specific material.

- **lab**: `09` · **slug**: `dynamic-workflows` · **coach**: `coach-09-dynamic-workflows` · **grader agent**: `.devin/agents/workflows-coach.md`
- **answer**: `labs/09-dynamic-workflows/answer.md` · **dry-run transcripts**: `labs/09-dynamic-workflows/coaching/dryrun/`
- **Persona**: the external security auditor from the brief. Reads evidence, not prompts. Wants per-endpoint verdicts, an independent verifier, and ACU per agent. Polite, impatient with totals that have no breakdown.
- **Scenario the learner just finished**: an audit → fix → verify workflow over `services/api/src/routes`, run on a two-file slice, with at least one failed agent, a resume by run ID, and a fix on a throwaway branch.

## Timing

| Segment        | Target | Cue                                                                              |
| -------------- | ------ | -------------------------------------------------------------------------------- |
| framing        | 60 s   | "In sixty seconds: what will I get from you, and how? Go."                       |
| checkpoint-20  | 45 s   | "Twenty minutes in. What are you looking at, and what next? Go."                 |
| checkpoint-120 | 45 s   | "Two hours in. What went wrong, and how did the run notice? Go."                 |
| update         | 180 s  | "Give me the auditor update. Go." Interrupt once: "How many endpoints, exactly?" |
| objection-1    | 90 s   | technical                                                                        |
| objection-2    | 90 s   | commercial. Must be answered with ACU-per-agent numbers                          |

## Must mention (accuracy, 30 points)

| id  | weight | point                                                                                                                     | belongs in     |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------- | -------------- |
| mm1 | 8      | Every endpoint covered: the count comes from the code (22 in 7 route files) and a small slice ran first                   | framing        |
| mm2 | 6      | The confirmed leak: the single-order read filters on id alone, so staff of one brand can read the other brand's order     | update         |
| mm3 | 6      | A failed or invalid agent was caught in code with a bounded retry, and resuming the same run ID replayed finished agents  | checkpoint-120 |
| mm4 | 5      | The fix lives on a throwaway branch named by the script, a separate agent verified it, and main keeps the defect          | update         |
| mm5 | 5      | Cost quoted per agent from the run (roughly 0.7–1.0 ACU each, about 3.5 for the slice) with a projection for the full run | objection-2    |

## Objections (segment 4)

| #   | objection                                                                                  | acknowledgement cue                                                                   |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| 1   | How do I know an agent didn't skip endpoints and call it clean?                            | "An agent can omit things…" then the script-computed inventory and the coverage check |
| 2   | Why pay for a fan-out of agents when one engineer could read 22 endpoints in an afternoon? | "One reader is cheaper per line…" then per-agent ACU numbers and a capped offer       |

Score objection-2 at most 4/10 on recovery if no per-agent ACU figure is spoken.

## Dry-run

With `--dry-run <transcript>`, read the transcript, use its `[mm:ss]` markers, skip the git push, and print the report. `pnpm coach:dryrun -- 09` validates the three fixtures in `labs/09-dynamic-workflows/coaching/dryrun/`.
