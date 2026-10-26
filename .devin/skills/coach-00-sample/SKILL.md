---
name: coach-00-sample
description: Worked example of a per-lab articulation coach, for lab 00 (the sample lab). Use when the learner says "coach me on lab 00" or runs `pnpm coach:dryrun -- 00`.
triggers: ["user"]
argument-hint: "[--dry-run <transcript>]"
---

# Coach — lab 00 (sample: the oversold Ember Table Lamp)

Follow `.devin/skills/articulation-base/SKILL.md` for protocol, timing, rubric, report and progress log. This file only supplies the lab-specific material.

- **lab**: `00` · **coach**: `coach-00-sample`
- **answer**: `labs/00-sample/answer.md` · **transcripts** (dry-run): `labs/00-sample/transcripts/`
- **Scenario the learner just finished**: `scenarios/oversell.sh` fired 20 concurrent checkouts at `LH-LAMP-03` (3 units on hand); 7 succeeded and `on_hand` went negative.

## must_say (segments 1–3)

1. Customers who checked out after the third unit were sold a lamp that does not exist.
2. The reservation reads stock and then writes it; two requests can both read "3".
3. The fix is to lock the row (`SELECT … FOR UPDATE`) or decrement atomically with a guard.
4. The four oversold orders need a customer-facing decision (refund, backorder) — the fix alone does not undo them.
5. Next step: an inventory alert when `on_hand` < 0.

## Checkpoints (segment 2)

1. "What did you look at first, and why the database rather than the web app?"
2. "What told you this was a race and not a bad seed count?"
3. "If the row lock had not fixed it, what would you have tried next?"

## Objections (segment 4)

1. "We've had flash sales before. Why did this one oversell?"
2. "Can we just hide the buy button when stock is low instead of touching the database?"

## Dry-run

With `--dry-run <transcript>`, read the transcript file, use its `[t=…]` markers, skip the git push, and write the report to stdout. `pnpm coach:dryrun -- 00` does exactly this with `labs/00-sample/transcripts/good.md`.
