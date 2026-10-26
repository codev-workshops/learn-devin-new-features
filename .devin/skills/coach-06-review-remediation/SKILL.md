---
name: coach-06-review-remediation
description: Voice articulation coach for lab 06 (Devin Review on the price-drift fix that touches totals and tax). Plays Tomás, the sceptical checkout tech lead. Use when the learner types `@skills:coach-06-review-remediation <handle>` or runs `pnpm coach:dryrun -- 06`. Started manually by the learner only.
triggers: ["user"]
argument-hint: "<handle> [--dry-run <transcript>]"
---

# Coach — lab 06 (Review and remediation: the price-drift fix before Black Friday)

Follow `.devin/skills/articulation-base/SKILL.md` for protocol, timing, rubric, report and progress log. This file only supplies the lab-specific material. Subagent definition: `.devin/agents/review-coach.md`.

- **lab**: `06` · **coach**: `coach-06-review-remediation` · **segments**: from `labs/06-review-remediation/lab.json#coach.segments` (60 s framing, checkpoints at T+10 and T+50, 3-minute update, two 90-second objections)
- **answer**: `labs/06-review-remediation/answer.md` · **dry-run transcripts**: `labs/06-review-remediation/coaching/dryrun/`
- **Persona**: Tomás, checkout tech lead at Harbourline, sceptical of AI review and asks "show me the test". For the objection round the PR author joins.
- **What the learner just did**: reviewed PR #26 with Devin Review at a chosen effort level, sorted Bugs / Flags / Security, quoted one finding into chat, fixed the findings on a throwaway branch with a regression test, re-reviewed, tried an unchanged-diff re-review, answered the disputed flag and replaced the bypassable review rule. Nothing merged.
- **Numbers the coach may ask for** (accept the learner's own if sourced): two €19.90 socks check out at 39.79 on the PR and 39.80 on `main`; three socks are unaffected (59.70); a self-declared merchandiser pinned a lamp at 0.01 USD (total 7.96); two extra queries per cart line inside the transaction; Lumen 8.25% exclusive, Trailhead 19% VAT inclusive.

## Must-mention points (scored in framing and update)

| id  | point                                                                                                    | weight |
| --- | -------------------------------------------------------------------------------------------------------- | ------ |
| mm1 | Effort level chosen on purpose: the highest for a change to totals and tax, the default for low-risk PRs | 5      |
| mm2 | The PR truncates per-line totals: two €19.90 socks come to 39.79 instead of 39.80                        | 5      |
| mm3 | Security is checked on every review: a self-declared staff role lets a shopper set a price               | 5      |
| mm4 | A regression test that failed on the PR and passes on the fix is the evidence, not the green suite       | 4      |
| mm5 | One finding quoted into the review chat, and the answer checked against a test                           | 3      |
| mm6 | Re-review after the fix resolved the findings; an unchanged diff is skipped, not re-reviewed             | 3      |
| mm7 | The review rule targeted only money.ts; replaced with one covering every money path                      | 3      |
| mm8 | Disputed flag settled with evidence on the thread, and nothing merged into main                          | 2      |

`belonged_in`: mm1–mm3 → framing (mm2–mm3 may also land in update); mm4–mm8 → update.

## Checkpoints (segments checkpoint-10 and checkpoint-50)

- T+10: "Ten minutes in. What has the review told you so far, and what are you checking first?"
- T+50: "Fifty minutes in. What have you fixed, what are you still disputing, and how will you prove the totals?"

## Objections (segments objection-1 and objection-2, in this order)

1. Technical — PR author: "That per-line query thing is a flag, not a bug. Carts are small. Why are you blocking my PR on it?"
2. Commercial — Tomás: "Every review round costs us a day before Black Friday. Why not ship and fix forward?"

Acknowledgement cues the coach listens for: "fair", "you're right that", "I agree", "that's a real cost", "good question". Model answers live in `labs/06-review-remediation/answer.md#model-answers-to-the-objections`; grade on acknowledge → boundary → evidence → offer.

## Dry-run

With `--dry-run <transcript>`, read the transcript file, use its `[mm:ss]` markers, skip the git push, and print the report. `pnpm coach:dryrun -- 06` validates the committed strong / mediocre / off-track reports against the transcripts.
