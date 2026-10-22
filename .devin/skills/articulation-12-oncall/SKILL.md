---
name: coach-12-oncall
description: Voice articulation coach for lab 12 (Devin Oncall, the 02:10 LH-LAMP-03 oversell page). Use when the learner types `@skills:coach-12-oncall <handle>` or runs `npm run coach:dryrun -- 12`.
triggers: ["user"]
argument-hint: "<handle> [--dry-run <transcript>]"
---

# Coach — lab 12 (Devin Oncall: negative on-hand after the Lamp Week deploy)

First read `.devin/skills/articulation-base/SKILL.md` and follow it for protocol, timing, rubric, report schema and progress log. This file only supplies the lab-specific material.

- **lab**: `12` · **coach**: `coach-12-oncall` · **agent**: `.devin/agents/oncall-coach.md`
- **answer**: `labs/12-oncall/answer.md` (never quote it before the last objection ends)
- **dry-run transcripts**: `labs/12-oncall/coaching/dryrun/{strong,mediocre,off-track}.md`
- **Persona**: the Kadé incident commander at 02:55 UTC — tired, precise, interrupts jargon, wants the number first.

## Segments

| id            | kind       | target | cue                                                                                   |
| ------------- | ---------- | ------ | ------------------------------------------------------------------------------------- |
| framing       | framing    | 45 s   | "Forty-five seconds. What is broken, for whom, and what is Devin doing about it? Go." |
| update-15     | update     | 120 s  | "T+15. Give me the update you would post in the channel. Go."                         |
| checkpoint-60 | checkpoint | 45 s   | "T+60. What are you looking at, and what do you check next? Go."                      |
| update        | update     | 180 s  | "Closing update for the morning team, three minutes. Go."                             |
| objection-1   | objection  | 90 s   | first objection below                                                                 |
| objection-2   | objection  | 90 s   | second objection below                                                                |

## Must-mention (accuracy, 30 points)

| id  | weight | point                                                                                                     |
| --- | ------ | --------------------------------------------------------------------------------------------------------- |
| mm1 | 6      | Impact in numbers: 40 paid orders for LH-LAMP-03 against 3 units, $1,888 charged (≈ $2,360 at list)       |
| mm2 | 5      | Evidence chain from monitor 48213771 to incident 2187 to a checkout.reserve trace to the reservation code |
| mm3 | 5      | Primary cause is the unlocked read-then-write reservation, amplified by duplicate payment webhooks        |
| mm4 | 4      | Mitigation until 08:00 that stops new sales of the SKU without a deploy or a manual stock edit            |
| mm5 | 4      | Lite for the bounded triage, a full mode for the cross-service root cause, with the reason                |
| mm6 | 3      | The cache runbook was wrong and the oversell runbook was followed instead, with the deciding observation  |
| mm7 | 3      | Which integrations were live and which ran on the fixture shim                                            |

Credit a point when the meaning is there with its key number or id; paraphrase is fine. mm1 belongs in framing; mm2, mm6 in update-15; mm3 in checkpoint-60; mm4, mm5, mm7 in update.

## Objections (90 s each, in character)

1. Would Devin have paged a human sooner?
2. You trusted a runbook that was wrong — why?

Listen for acknowledge → boundary → evidence → offer (see the answer's model replies).

## Lab-specific stems to pick from

- "Right now, 40 customers have paid for a lamp we do not have." — impact before timeline.
- "Confirmed: … Suspected: …" — label certainty in every update.
- "The runbook said X; the telemetry said Y; I followed Y because…"
- "Lite for …, full mode for …, because…"

## Dry-run

With `--dry-run <transcript>` use the transcript's `[mm:ss]` markers (`timing_method: markers`), grade inline, print the report and skip the progress-log push. `npm run coach:dryrun -- 12` validates the committed strong, mediocre and off-track reports.
