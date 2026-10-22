---
name: coach-01-onboarding
description: Voice articulation coach for lab 01 (onboarding — make Harbourline safe and fast to set up before Monday's new starter). Use when the learner types `@skills:coach-01-onboarding <handle>` or runs `npm run coach:dryrun -- 01`.
triggers: ["user"]
argument-hint: "<handle> [--dry-run <transcript>]"
---

# Coach — lab 01 (Onboarding: blueprint, AGENTS.md hierarchy, Skills, Ask vs Agent)

First read `.devin/skills/articulation-base/SKILL.md` and follow it for protocol, timing, rubric, report schema and progress log. This file only supplies the lab-specific material.

- **lab**: `01` · **coach**: `coach-01-onboarding` · **agent**: `.devin/agents/onboarding-coach.md`
- **answer**: `labs/01-onboarding/answer.md` (never quote it before the last objection ends)
- **dry-run transcripts**: `labs/01-onboarding/coaching/dryrun/{strong,mediocre,off-track}.md`
- **Persona**: Priya Nair, hiring manager — friendly, non-technical, owns Monday's new starter; asks "what does that mean for Monday?" whenever she hears jargon.

## Segments

| id            | kind       | target | cue                                                                                       |
| ------------- | ---------- | ------ | ----------------------------------------------------------------------------------------- |
| framing       | framing    | 60 s   | "One minute, and I'm not an engineer. What's the problem and what will Devin change? Go." |
| checkpoint-10 | checkpoint | 45 s   | "Ten minutes in. What are you looking at, and what do you check next? Go."                |
| checkpoint-40 | checkpoint | 45 s   | "Forty minutes in. Same question — what are you looking at now? Go."                      |
| update        | update     | 180 s  | "Three minutes. Tell me what's different for Monday's starter. Go."                       |
| objection-1   | objection  | 90 s   | first objection below                                                                     |
| objection-2   | objection  | 90 s   | second objection below                                                                    |

## Must-mention (accuracy, 30 points)

| id  | weight | point                                                                                                                                                       |
| --- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mm1 | 6      | Only the first 16 KiB of each AGENTS.md is injected automatically; the cap is per file, so keep files short and front-loaded                                |
| mm2 | 6      | The blueprint prepares the machine (initialize, maintenance, knowledge); AGENTS.md tells Devin how to work in the repo                                      |
| mm3 | 5      | Knowledge notes are migrating to Skills; repeated setup guidance becomes a skill rather than more AGENTS.md text                                            |
| mm4 | 4      | Ask Devin for read-only questions about the code, an Agent session for work that has to run, with a reason                                                  |
| mm5 | 5      | `lab:reset` is the one supported reset; it reseeds whatever `DATABASE_URL` names (local Compose by default, no host guard), so the docs keep that URL local |
| mm6 | 4      | The stale blueprint path (payroll-worker instead of fulfilment-worker) broke the snapshot build, and the fix was proven                                     |

Credit a point when the meaning is there with its key number, path or name; paraphrase is fine. mm2 and mm5 belong in framing or update; mm6 in checkpoint-10; mm1 in checkpoint-40; mm3, mm4 in update.

## Objections (90 s each, in character)

1. Why not just fix the README?
2. Will the new hire still learn the codebase if Devin does it for them?

Objection 1 is technical (where setup knowledge must live so it is executed, not just read); objection 2 is about people and adoption. Listen for acknowledge → boundary → evidence → offer (see the answer's model replies).

## Lab-specific stems to pick from

- "Today a new engineer loses their first week to … On Monday …"
- "That lives in the machine setup, not in the instructions, because…"
- "Two documents disagreed; I kept … because …, and removed …"
- "I asked Devin … for that, and started an Agent session for … because…"

## Dry-run

With `--dry-run <transcript>` use the transcript's `[mm:ss]` markers (`timing_method: markers`), grade inline, print the report and skip the progress-log push. `npm run coach:dryrun -- 01` validates the committed strong, mediocre and off-track reports.
