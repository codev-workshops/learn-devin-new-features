# Articulation gap report — lab 02 lifecycle-hooks (coach-02-lifecycle-hooks)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:00:00Z · timing: markers (±5 s) · transcript: `labs/02-lifecycle-hooks/coaching/dryrun/strong.md`

## Scores — 92/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 28/30 | All five points correct and in Priya's terms; the matcher point came only at the T+60 checkpoint (anchor: 27–30 = cause, effect and fix all correct). |
| Structure | 23/25 | Problem → approach → evidence → next step held in framing and update; Outcome → Evidence → Risk → Next action → Ask held (anchor: 22–25 = order held throughout). |
| Customer relevance | 18/20 | Opened with the two lost days and 400 replayed orders; one number per evidence sentence (anchor: 17–20 = leads with who was affected). |
| Brevity and fluency | 14/15 | Every segment within ±5 s; one filler in about 8 minutes; no restarts (anchor: 13–15 = on target, ≤3 fillers/min). |
| Recovery | 9/10 | Both objections acknowledge → boundary → evidence → offer; the interruption answered in one sentence (anchor: 9–10 = evidence and a next step each time). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 58 s | -2 s | on |
| Think-aloud checkpoint (T+15) | 45 s | 42 s | -3 s | on |
| Think-aloud checkpoint (T+60) | 45 s | 46 s | +1 s | on |
| 3-minute update to the DBA | 180 s | 178 s | -2 s | on |
| Objection 1 (technical) — “Isn't this just a lint rule?” | 90 s | 86 s | -4 s | on |
| Objection 2 (commercial, one follow-up allowed) — “If the hook has a bug, are we locked out of our own database?” | 90 s | 87 s | -3 s | on |

## Structure (problem → approach → evidence → next step)

- **Problem** — present: “Last quarter that reset cost you two days of price-list edits and about 400 replayed orders.”
- **Approach** — present: “The policy is a PreToolUse hook on Devin's shell tool, committed in the repo, that checks every command before it runs.”
- **Evidence** — present: “the staging reset was refused with exit 2 and the reason text, and the test suite ran with exit 0.”
- **Next step** — present: “Next action: a CI check that parses the hooks file and replays the evidence table on every pull request.”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: yes

## Fillers and pauses

- Fillers: 1 in 7.9 spoken min (0.13/min) — um ×1
- Tag questions: 0
- Pauses over 8 s: none

## Missing key points

- [x] Exit code 2 from PreToolUse denies the call while exit 0 lets it run and other codes are only logged (7) — “the hook exits with code 2 and Devin is refused with a reason it can read; exit 0 lets ordinary commands run, and any other exit code is only logged”
- [x] The psql call is rewritten into the read-only wrapper through updatedInput instead of being refused (6) — “psql is not blocked, it is rewritten into the read-only wrapper through updatedInput”
- [x] The matcher is a regex on the tool name and a list of patterns matches any entry (5) — “the matcher is a regex on the tool name”
- [x] A broken hooks file or crashed hook fails open so the script itself must fail closed (6) — “a broken hooks file or a crashed hook fails open, so the guard simply does not run; inside the script I fail closed”
- [x] The bad migration patch was refused with an exit 2 reason and an audit log line as proof (6) — “When Devin tried to apply the bad migration patch, the hook refused it with a reason naming the destructive DDL, and the audit log has the line with the timestamp.”

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: "star-exec-star" (spoken glob; transcript may render it as "star exec star")
- Repeated words: none
- Coach asked “did you say…?”: never
- Article/plural slips: none

## Three stems for next time

1. "The exact command Devin ran was… and the hook answered with…" — keep quoting the evidence verbatim.
1. "The one thing this does not protect is…" — name the residual risk before Priya asks.
1. "Matched tool names are… because the pattern is anchored…" — bring the matcher point into the framing next time.

## Compared with your previous run

First recorded run for dryrun on lab 02; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
