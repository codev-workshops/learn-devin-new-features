---
name: coach-11-acu-analytics
description: Voice articulation coach for lab 11 (ACU governance and analytics — organization limits vs per-user tiers, Newest vs Legacy analytics). Use when the learner types `@skills:coach-11-acu-analytics <handle>` or runs `npm run coach:dryrun -- 11`.
triggers: ["user"]
argument-hint: "<handle> [--dry-run <transcript>]"
---

# Coach — lab 11 (ACU governance: two people blocked, two dashboards that disagree)

First read `.devin/skills/articulation-base/SKILL.md` and follow it for protocol, timing, rubric, report schema and progress log. This file only supplies the lab-specific material.

- **lab**: `11` · **coach**: `coach-11-acu-analytics` · **agent**: `.devin/agents/acu-coach.md`
- **answer**: `labs/11-acu-analytics/answer.md` (never quote it before the last objection ends)
- **dry-run transcripts**: `labs/11-acu-analytics/coaching/dryrun/{strong,mediocre,off-track}.md`
- **Persona**: the Kadé finance controller — polite, numerate, wants the source of every figure, dislikes product vocabulary.

## Segments

| id            | kind       | target | cue                                                                          |
| ------------- | ---------- | ------ | ---------------------------------------------------------------------------- |
| framing       | framing    | 60 s   | "Sixty seconds. Why were two people blocked, and what will you change? Go."  |
| checkpoint-10 | checkpoint | 45 s   | "T+10. What are you looking at right now, and what will you check next? Go." |
| checkpoint-40 | checkpoint | 45 s   | "T+40. Pick two numbers on your screen. What does each one count? Go."       |
| update        | update     | 180 s  | "Three minutes. Give me the update I can take to the budget review. Go."     |
| objection-1   | objection  | 90 s   | first objection below                                                        |
| objection-2   | objection  | 90 s   | second objection below                                                       |

## Must-mention (accuracy, 30 points)

| id  | weight | point                                                                                                                                       |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| mm1 | 6      | Organization limit and per-user tier are enforced independently; either one blocks, and raising one never lifts the other                   |
| mm2 | 5      | The Trailhead lead is at 180 of 400 on her tier but Trailhead is at 3,000 of 3,000, so only an enterprise admin raising the org limit helps |
| mm3 | 4      | The per-user meter counts cloud plus local usage and leaves Devin Review out; the org limit includes Review                                 |
| mm4 | 4      | Limits reset on the contract day, the 23rd, after the 18–20 Nov sale, and temporary overrides expire then                                   |
| mm5 | 4      | Newest vs Legacy is the gear-icon Version setting; Cloud-only metrics exclude local usage; the empty state means no billing cycle in range  |
| mm6 | 4      | A tier applies to each member, not a pooled team budget; a team cap is an organization-level limit                                          |
| mm7 | 3      | The finance update carried exactly three ACU figures, each with the view it came from                                                       |

Credit a point when the meaning is there with its key number; paraphrase is fine. mm1 belongs in framing; mm2 in checkpoint-10; mm3 and mm5 in checkpoint-40; mm4, mm6, mm7 in update.

## Objections (90 s each, in character)

1. Trailhead will be blocked mid-sale.
2. Why do the two dashboards show different totals?

Objection 1 is commercial, objection 2 technical. Listen for acknowledge → boundary → evidence → offer (see the answer's model replies).

## Lab-specific stems to pick from

- "Two caps, two jobs: the organization limit is the team budget, the tier is the per-person guardrail."
- "She was under her own cap; the organization was not."
- "This number includes local usage; that one does not."
- "The reset is on the 23rd; the sale ends on the 20th."

## Dry-run

With `--dry-run <transcript>` use the transcript's `[mm:ss]` markers (`timing_method: markers`), grade inline, print the report and skip the progress-log push. `npm run coach:dryrun -- 11` validates the committed strong, mediocre and off-track reports.
