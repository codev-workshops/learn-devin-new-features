# Articulation gap report — lab 02 lifecycle-hooks (coach-02-lifecycle-hooks)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:00:00Z · timing: markers (±5 s) · transcript: `labs/02-lifecycle-hooks/coaching/dryrun/mediocre.md`

## Scores — 57/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 18/30 | Exit codes, rewrite and bad migration right; matcher semantics and open-vs-closed never stated (anchor: 17–21 = right conclusion, shaky mechanism). |
| Structure | 15/25 | All parts findable but the framing front-loaded three "because" clauses and the evidence was a command, not an observation (anchor: 14–17 = order broken once). |
| Customer relevance | 11/20 | The customer's loss never quantified; the row-count interruption produced a hedge (anchor: 10–13 = impact mentioned once, hedged). |
| Brevity and fluency | 8/15 | Framing, update and objection 2 over target, objection 1 and checkpoint 60 under; six fillers, one tag question, one 12-second pause (anchor: 7–9 = several segments off target). |
| Recovery | 5/10 | Objections answered but without evidence; the follow-up "open or closed" was deferred (anchor: 5–6 = answers but defensively). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 74 s | +14 s | over |
| Think-aloud checkpoint (T+15) | 45 s | 52 s | +7 s | over |
| Think-aloud checkpoint (T+60) | 45 s | 39 s | -6 s | under |
| 3-minute update to the DBA | 180 s | 201 s | +21 s | over |
| Objection 1 (technical) — “Isn't this just a lint rule?” | 90 s | 58 s | -32 s | under |
| Objection 2 (commercial, one follow-up allowed) — “If the hook has a bug, are we locked out of our own database?” | 90 s | 102 s | +12 s | over |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “So, because the reset happened on staging, and because both brands share the database”
- **Approach** — present: “It is a PreToolUse hook, and when the command is a reset on another database it exits 2 so it is blocked”
- **Evidence** — weak: “I'll know it works when the tests pass with the hook on.”
- **Next step** — present: “Next action is to open the PR on the branch.”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: yes

## Fillers and pauses

- Fillers: 6 in 7.3 spoken min (0.82/min) — actually ×2, basically ×2, so yeah ×1, you know ×1
- Tag questions: 1 (“That's the idea, right?”)
- Pauses over 8 s: 12 s at [15:20] in checkpoint-15

## Missing key points

- [x] Exit code 2 from PreToolUse denies the call while exit 0 lets it run and other codes are only logged (7) — “when the command is a reset on another database it exits 2 so it is blocked, and exit 0 means it continues”
- [x] The psql call is rewritten into the read-only wrapper through updatedInput instead of being refused (6) — “the psql command is changed to the wrapper with updatedInput so it is read-only”
- [ ] The matcher is a regex on the tool name and a list of patterns matches any entry (5) — missed; belonged in checkpoint-60
- [ ] A broken hooks file or crashed hook fails open so the script itself must fail closed (6) — missed; belonged in update
- [x] The bad migration patch was refused with an exit 2 reason and an audit log line as proof (6) — “The bad migration patch was also blocked with exit 2 and it is in the log.”

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: because (×3 in the opening sentence)
- Coach asked “did you say…?”: never
- Article/plural slips: "the matcher one" — "the matcher injector"
- Re-record: “So, because the reset happened on staging, and because both brands share the database…”

## Three stems for next time

1. "If the hook itself breaks, the policy fails… because…" — answer open-or-closed in one sentence.
1. "The matcher is a regex, so… guards exactly…" — explain what the injector taught you.
1. "You lost two days and 400 orders; this stops…" — put the customer's number first.

## Compared with your previous run

First recorded run for dryrun on lab 02; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
