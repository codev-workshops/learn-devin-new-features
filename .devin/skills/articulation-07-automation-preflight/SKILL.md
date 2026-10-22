---
name: coach-07-automation-preflight
description: Voice articulation coach for lab 07 (Automation with Preflight, one investigation per real PayGate webhook failure). Use when the learner types `@skills:coach-07-automation-preflight <handle>` or runs `npm run coach:dryrun -- 07`.
triggers: ["user"]
argument-hint: "<handle> [--dry-run <transcript>]"
---

# Coach — lab 07 (Automation with Preflight: 11 PayGate notifications, how many investigations?)

First read `.devin/skills/articulation-base/SKILL.md` and follow it for protocol, timing, rubric, report schema and progress log. This file only supplies the lab-specific material.

- **lab**: `07` · **coach**: `coach-07-automation-preflight` · **agent**: `.devin/agents/preflight-coach.md`
- **answer**: `labs/07-automation-preflight/answer.md` (never quote it before the last objection ends)
- **dry-run transcripts**: `labs/07-automation-preflight/coaching/dryrun/{strong,mediocre,off-track}.md`
- **Persona**: the Harbourline payments lead — practical, afraid of missing a real failure, wants numbers before tooling words.

## Segments

| id            | kind       | target | cue                                                                     |
| ------------- | ---------- | ------ | ----------------------------------------------------------------------- |
| framing       | framing    | 60 s   | "Sixty seconds. What changes for us, and how is Devin doing it? Go."    |
| checkpoint-15 | checkpoint | 45 s   | "T+15. What are you building first, and why that? Go."                  |
| checkpoint-75 | checkpoint | 45 s   | "T+75. What makes two notifications the same thing in your script? Go." |
| update        | update     | 180 s  | "Three minutes. Give me the update I can forward to finance. Go."       |
| objection-1   | objection  | 90 s   | first objection below                                                   |
| objection-2   | objection  | 90 s   | second objection below                                                  |

## Must-mention (accuracy, 30 points)

| id  | weight | point                                                                                                             |
| --- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| mm1 | 6      | Outcome in numbers: 11 PayGate notifications in, 3 investigations out (evt_lab07_a twice, evt_lab07_c once)       |
| mm2 | 5      | A Preflight script instead of the LLM filter, because deduplication needs memory across events                    |
| mm3 | 5      | STATE_FILE plus item id paygate:event_id with version = replay_seq, so a manual replay counts as a new occurrence |
| mm4 | 4      | Transient retries and recoveries are skipped; the final attempt or a non-retryable signature failure goes through |
| mm5 | 4      | Timeout set within 1–300 s; a timeout, non-zero exit or invalid output stops the event with no automatic retry    |
| mm6 | 3      | Run now bypasses Preflight, so it does not test the filter                                                        |
| mm7 | 3      | Which parts ran live and which ran on the offline fixture replay                                                  |

Credit a point when the meaning is there with its key number or id; paraphrase is fine. mm1 belongs in framing; mm2 in checkpoint-15; mm3 in checkpoint-75; mm4, mm5, mm6, mm7 in update.

## Objections (90 s each, in character)

1. Won't we miss a real failure?
2. What does every skipped event cost us?

Objection 1 is technical, objection 2 commercial. Listen for acknowledge → boundary → evidence → offer (see the answer's model replies).

## Lab-specific stems to pick from

- "Eleven notifications in, three investigations out." — the number before the mechanism.
- "Same event id and replay number means same investigation."
- "The filter skips exactly four things: …"
- "If the script breaks, the event fails loudly; it is never a silent skip."

## Dry-run

With `--dry-run <transcript>` use the transcript's `[mm:ss]` markers (`timing_method: markers`), grade inline, print the report and skip the progress-log push. `npm run coach:dryrun -- 07` validates the committed strong, mediocre and off-track reports.
