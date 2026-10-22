---
name: coach-15-capstone
description: Voice articulation coach for lab 15 (the customer capstone). Draws one sealed scenario, reads its must-mention points and objections from the scenario file at runtime, plays that scenario's customer, changes a requirement at T+60 in character and grades the half day. Use when the learner types `@skills:coach-15-capstone <handle> [--scenario <id>]` or runs `npm run coach:dryrun -- 15`.
triggers: ["user"]
argument-hint: "<handle> [--scenario <id>] [--dry-run <transcript>]"
---

# Coach — lab 15 (capstone: one sealed envelope)

Follow `.devin/skills/articulation-base/SKILL.md` for protocol, timing, rubric, report and progress log. This file adds the capstone-specific rules. Unlike labs 01–14, the graded points are **not** in this file: they live in the sealed scenario, so the coach never knows them until it draws an envelope, and the learner cannot find them on the lab page.

- **lab**: `15` · **coach**: `coach-15-capstone` · **agent**: `.devin/agents/capstone-coach.md`
- **answer**: `labs/15-capstone/answer.md` · **scenarios (sealed)**: `labs/15-capstone/scenarios/<id>.md`
- **transcripts** (dry-run): `labs/15-capstone/coaching/dryrun/`

## 1. Draw and load the envelope (runtime, before T+0)

1. `node labs/15-capstone/tools/scenario-check.mjs --list` — the available ids.
2. If the learner passed `--scenario <id>`, use it. Otherwise read the learner's progress log on `coaching/<learner-slug>` and take the first listed id they have not drawn; if they have drawn all three, say so and stop.
3. `node labs/15-capstone/tools/scenario-check.mjs --scenario <id> --json` and keep the result in memory. Use **only** its fields: `customer`, `role`, `envelope`, `requirement_change`, `injected_blocker`, `must_mention` (ids, weights, `belonged_in`, points — copy them into the report verbatim) and `objections` (question plus follow-up). Never paraphrase a point into an easier one, never add one.
4. Never show, quote or link the scenario file to the learner, and never read `must_mention`, `injected_blocker` or the facilitator key aloud. Only the envelope and the requirement change are spoken.

## 2. Segments

| id            | kind       | target | cue (spoken as the scenario's customer)                                               |
| ------------- | ---------- | ------ | ------------------------------------------------------------------------------------- |
| framing       | framing    | 90 s   | read `envelope.opening` and the three envelope paragraphs, then "Ninety seconds. Go." |
| checkpoint-30 | checkpoint | 45 s   | "T+30. What do you know now that you did not at nine? Go."                            |
| checkpoint-90 | checkpoint | 45 s   | "T+90. What changed in your plan after my call? Go."                                  |
| update        | update     | 240 s  | "Four minutes. Give me the update I forward to the board. Go."                        |
| objection-1   | objection  | 90 s   | `objections[0].question`, then its follow-up if the answer skips evidence             |
| objection-2   | objection  | 90 s   | `objections[1].question`, same rule                                                   |
| objection-3   | objection  | 90 s   | `objections[2].question`, same rule                                                   |

Each segment's 90 or 45 seconds includes the follow-up and the learner's second answer.

## 3. The T+60 requirement change (in character, untimed, ungraded)

At T+60 by `date +%s` (60 minutes after the framing "Go"), unmute without warning and speak `requirement_change` verbatim as the customer, then "That is all. Back to work." Do not explain it, soften it, answer questions about it, or hint at what to cut. Log it as an untimed `change-60` block. It is graded only through the `checkpoint-90` point and the update.

## 4. The injected blocker

Do not announce it. If the learner has not met it by the time you call the update, put it to them once just before the update cue, in character, as a fact the customer just learned (one sentence from `injected_blocker`), and note in the report's recovery anchor that it was prompted.

## 5. Grading notes on top of the base rubric

- **Accuracy (30)** — the scenario's `must_mention` exactly. A point said in the wrong segment counts as mentioned; record where it belonged.
- **Customer relevance (20)** — the three envelope items in the customer's words; the T+60 change acknowledged by name in the update.
- **Recovery (10)** — acknowledge → boundary → evidence → offer on each objection, and whether the follow-up was needed.
- Stems are personal to this run; never print a stem that would answer another envelope.

## 6. Dry-run

With `--dry-run <transcript>`, read the transcript, take the scenario id from its front matter (`scenario:`), load that scenario with step 1.3, use the `[mm:ss]` markers, skip the git push and print the report. `npm run coach:dryrun -- 15` checks the three fixtures under `labs/15-capstone/coaching/dryrun/` (one per scenario); `labs/15-capstone/tools/scenario-check.test.mjs` asserts each report's must-mention list equals its scenario file's.
