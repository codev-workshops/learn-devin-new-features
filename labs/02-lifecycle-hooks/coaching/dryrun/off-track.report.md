# Articulation gap report — lab 02 lifecycle-hooks (coach-02-lifecycle-hooks)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:00:00Z · timing: markers (±5 s) · transcript: `labs/02-lifecycle-hooks/coaching/dryrun/off-track.md`

## Scores — 23/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 6/30 | Only exit 2 named, as a question; leads with an advisory README rule; no rewrite, no matcher, no failure mode, no evidence for the bad migration (anchor: 0–8 = contradicts the answer's feature fit). |
| Structure | 7/25 | No discernible problem → approach → evidence order; the update had no evidence and no ask (anchor: 5–8 = barely ordered). |
| Customer relevance | 4/20 | Talked about config files and package scripts, never about the lost edits or orders (anchor: 3–5 = talks only about code). |
| Brevity and fluency | 4/15 | Framing 75% over, update half the target, objections under 30 s; 12 fillers, two tag questions, two long pauses (anchor: 3–5 = over by >50% and frequent fillers). |
| Recovery | 2/10 | Conceded the lint-rule objection and was unsure about lock-out (anchor: 0–3 = concedes or freezes). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 105 s | +45 s | over |
| Think-aloud checkpoint (T+15) | 45 s | 20 s | -25 s | under |
| Think-aloud checkpoint (T+60) | 45 s | 36 s | -9 s | under |
| 3-minute update to the DBA | 180 s | 95 s | -85 s | under |
| Objection 1 (technical) — “Isn't this just a lint rule?” | 90 s | 23 s | -67 s | under |
| Objection 2 (commercial, one follow-up allowed) — “If the hook has a bug, are we locked out of our own database?” | 90 s | 29 s | -61 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “the seed script has a reset flag that is quite dangerous.”
- **Approach** — weak: “I think we write in the README and the AGENTS file that Devin should not run it, actually, and also the hook can exit 2 to block it, no?”
- **Evidence** — missing
- **Next step** — weak: “Next I will make the PR.”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 12 in 4.4 spoken min (2.73/min) — um ×4, actually ×3, basically ×2, you know ×2, like ×1
- Tag questions: 2 (“also the hook can exit 2 to block it, no?”, “It should be fine, right?”)
- Pauses over 8 s: 14 s at [00:40] in framing; 15 s at [60:15] in checkpoint-60

## Missing key points

- [x] Exit code 2 from PreToolUse denies the call while exit 0 lets it run and other codes are only logged (7) — “the hook can exit 2 to block it”
- [ ] The psql call is rewritten into the read-only wrapper through updatedInput instead of being refused (6) — missed; belonged in update
- [ ] The matcher is a regex on the tool name and a list of patterns matches any entry (5) — missed; belonged in checkpoint-60
- [ ] A broken hooks file or crashed hook fails open so the script itself must fail closed (6) — missed; belonged in update
- [ ] The bad migration patch was refused with an exit 2 reason and an audit log line as proof (6) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: scripts (×2)
- Coach asked “did you say…?”: never
- Article/plural slips: "the package json scripts" — "the package.json scripts"; "db slash migrations" — "the db/migrations folder"
- Re-record: “Um, so, basically there is the config file and the scripts…”; “It should be fine, right?”

## Three stems for next time

1. "The policy stops… before it reaches the database, by…" — headline the enforcement, not the README.
1. "The evidence is: exit code…, reason…, log line…" — one observation per sentence.
1. "That's fair. The difference is…" — acknowledge, then draw the boundary instead of agreeing.

## Compared with your previous run

First recorded run for dryrun on lab 02; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
