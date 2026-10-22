# Articulation gap report — lab 09 dynamic-workflows (coach-09-dynamic-workflows)

Learner: **calibration** · mode: dry-run · run 1 · 2026-10-22T11:30:00Z · timing: markers (±5 s) · transcript: `labs/coach-dryrun/fixtures/generic-mediocre.md`

## Scores — 35/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 4/30 | None of the 5 must-mention points is stated; nothing is contradicted, the answer is simply content-free (anchor: under 10 = one point or fewer). |
| Structure | 13/25 | Problem, approach, evidence and next step are all findable but thin; the update has no risk and no ask (anchor: 13–17 = parts present but weak). |
| Customer relevance | 8/20 | Impact appears once ("some users were affected", "maybe a few customers") with no number, asked for and not given (anchor: 10–13 = some reviewer questions answered; under 6 = feature talk). |
| Brevity and fluency | 6/15 | 5 of 6 segments off target, 6 fillers (0.74/min), one 12 s pause, one tag question (anchor: 6–8 = two or more segments off; under 4 = most off). |
| Recovery | 4/10 | Objection 1 acknowledged ("fair question") with no boundary or evidence; objection 2 deflected to "next month" (anchor: 4–6 = partial; objection 2 capped at 4 without a number). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 72 s | +12 s | over |
| Think-aloud checkpoint (T+20) | 45 s | 57 s | +12 s | over |
| Think-aloud checkpoint (T+120) | 45 s | 45 s | +0 s | on |
| Three-minute auditor update | 180 s | 150 s | -30 s | under |
| Objection 1 (technical) — “How do I know an agent didn't skip endpoints and call it clean?” | 90 s | 51 s | -39 s | under |
| Objection 2 (commercial) — “Why pay for a fan-out of agents when one engineer could read 22 endpoints in an afternoon?” | 90 s | 47 s | -43 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “there was a problem in the system and I looked into it with Devin”
- **Approach** — present: “I used Devin to investigate, it found the cause, and then we made a change and tested it”
- **Evidence** — weak: “The error went away after the change, so that told me it was the right thing”
- **Next step** — weak: “Next step is to monitor it”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 6 in 8.1 spoken min (0.74/min) — basically ×2, actually ×1, um ×1, you know ×1, so yeah ×1
- Tag questions: 1 (“Then I will ask Devin to explain what it found and see if it makes sense, right?”)
- Pauses over 8 s: 12 s at [02:10] in checkpoint-20

## Missing key points

- [ ] Every endpoint covered: the count comes from the code (22 in 7 route files) and a small slice ran first (8) — missed; belonged in framing
- [ ] The confirmed leak: the single-order read filters on id alone, so staff of one brand can read the other brand's order (6) — missed; belonged in update
- [ ] A failed or invalid agent was caught in code with a bounded retry, and resuming the same run ID replayed finished agents (6) — missed; belonged in checkpoint-120
- [ ] The fix lives on a throwaway branch named by the script, a separate agent verified it, and main keeps the defect (5) — missed; belonged in update
- [ ] Cost quoted per agent from the run (roughly 0.7–1.0 ACU each, about 3.5 for the slice) with a projection for the full run (5) — missed; belonged in objection-2

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: "I think" (×2 in the framing)
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “So, basically, there was a problem in the system and I looked into it with Devin.”

## Three stems for next time

1. Lead with the missing top point: "Every endpoint covered — and the evidence is …"
1. "The customers affected were …, and the number is …"
1. "That's a fair concern; the boundary is …, the evidence is …, and what I can offer is …"

## Compared with your previous run

Calibration run of the generic transcript (labs/coach-dryrun/fixtures/generic-mediocre.md); no previous run.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
