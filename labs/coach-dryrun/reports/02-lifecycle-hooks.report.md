# Articulation gap report — lab 02 lifecycle-hooks (coach-02-lifecycle-hooks)

Learner: **calibration** · mode: dry-run · run 1 · 2026-10-22T11:30:00Z · timing: markers (±5 s) · transcript: `labs/coach-dryrun/fixtures/generic-mediocre.md`

## Scores — 37/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 4/30 | None of the 5 must-mention points is stated; nothing is contradicted, the answer is simply content-free (anchor: 0–8 = one point or fewer). |
| Structure | 12/25 | Problem, approach, evidence and next step are all findable but thin; the update has no risk and no ask (anchor: 14–17 = parts findable, order broken; 5–9 = parts missing). |
| Customer relevance | 10/20 | Impact appears once ("some users were affected", "maybe a few customers") with no number, asked for and not given (anchor: 10–13 = impact mentioned once, hedged). |
| Brevity and fluency | 7/15 | 5 of 6 segments off target, 6 fillers (0.67/min), one 12 s pause, one tag question (anchor: 7–9 = several segments off). |
| Recovery | 4/10 | Objection 1 acknowledged ("fair question") with no boundary or evidence; objection 2 deflected to "next month" (anchor: 5–6 = answered defensively; 0–3 = concedes). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 72 s | +12 s | over |
| Think-aloud checkpoint (T+15) | 45 s | 57 s | +12 s | over |
| Think-aloud checkpoint (T+60) | 45 s | 45 s | +0 s | on |
| 3-minute update to the DBA | 180 s | 150 s | -30 s | under |
| Objection 1 (technical) — “Isn't this just a lint rule?” | 90 s | 51 s | -39 s | under |
| Objection 2 (commercial, one follow-up allowed) — “If the hook has a bug, are we locked out of our own database?” | 90 s | 47 s | -43 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “there was a problem in the system and I looked into it with Devin”
- **Approach** — present: “I used Devin to investigate, it found the cause, and then we made a change and tested it”
- **Evidence** — weak: “The error went away after the change, so that told me it was the right thing”
- **Next step** — weak: “Next step is to monitor it”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 6 in 8.9 spoken min (0.67/min) — basically ×2, actually ×1, um ×1, you know ×1, so yeah ×1
- Tag questions: 1 (“Then I will ask Devin to explain what it found and see if it makes sense, right?”)
- Pauses over 8 s: 12 s at [02:10] in checkpoint-15

## Missing key points

- [ ] Exit code 2 from PreToolUse denies the call while exit 0 lets it run and other codes are only logged (7) — missed; belonged in framing
- [ ] The psql call is rewritten into the read-only wrapper through updatedInput instead of being refused (6) — missed; belonged in update
- [ ] The matcher is a regex on the tool name and a list of patterns matches any entry (5) — missed; belonged in checkpoint-60
- [ ] A broken hooks file or crashed hook fails open so the script itself must fail closed (6) — missed; belonged in update
- [ ] The bad migration patch was refused with an exit 2 reason and an audit log line as proof (6) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: "I think" (×2 in the framing)
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “So, basically, there was a problem in the system and I looked into it with Devin.”

## Three stems for next time

1. Lead with the missing top point: "Exit code 2 from PreToolUse denies the call while exit 0 lets it run and other codes are only logged — and the evidence is …"
1. "The customers affected were …, and the number is …"
1. "That's a fair concern; the boundary is …, the evidence is …, and what I can offer is …"

## Compared with your previous run

Calibration run of the generic transcript (labs/coach-dryrun/fixtures/generic-mediocre.md); no previous run.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
