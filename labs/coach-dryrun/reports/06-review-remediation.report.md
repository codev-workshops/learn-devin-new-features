# Articulation gap report — lab 06 review-remediation (coach-06-review-remediation)

Learner: **calibration** · mode: dry-run · run 1 · 2026-10-22T11:30:00Z · timing: markers (±5 s) · transcript: `labs/coach-dryrun/fixtures/generic-mediocre.md`

## Scores — 35/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 4/30 | None of the 8 must-mention points is stated; nothing is contradicted, the answer is simply content-free (anchor: 3–7 = one point). |
| Structure | 13/25 | Problem, approach, evidence and next step are all findable but thin; the update has no risk and no ask (anchor: 13–16 = parts findable, order broken). |
| Customer relevance | 8/20 | Impact appears once ("some users were affected", "maybe a few customers") with no number, asked for and not given (anchor: 9–12 = one hedged number; 3–5 = no numbers). |
| Brevity and fluency | 6/15 | 5 of 6 segments off target, 6 fillers (0.67/min), one 12 s pause, one tag question (anchor: 6–8 = two or more segments off). |
| Recovery | 4/10 | Objection 1 acknowledged ("fair question") with no boundary or evidence; objection 2 deflected to "next month" (anchor: 3–5 = acknowledged ("fair"), no evidence). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 72 s | +12 s | over |
| Think-aloud checkpoint (T+10) | 45 s | 57 s | +12 s | over |
| Think-aloud checkpoint (T+50) | 45 s | 45 s | +0 s | on |
| Update to the tech lead | 180 s | 150 s | -30 s | under |
| Objection 1 (technical) — “That per-line query thing is a flag, not a bug. Carts are small. Why are you blocking my PR on it?” | 90 s | 51 s | -39 s | under |
| Objection 2 (commercial) — “Every review round costs us a day before Black Friday. Why not ship and fix forward?” | 90 s | 47 s | -43 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “there was a problem in the system and I looked into it with Devin”
- **Approach** — present: “I used Devin to investigate, it found the cause, and then we made a change and tested it”
- **Evidence** — weak: “The error went away after the change, so that told me it was the right thing”
- **Next step** — weak: “Next step is to monitor it”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 6 in 8.9 spoken min (0.67/min) — basically ×2, actually ×1, um ×1, you know ×1, so yeah ×1
- Tag questions: 1 (“Then I will ask Devin to explain what it found and see if it makes sense, right?”)
- Pauses over 8 s: 12 s at [02:10] in checkpoint-10

## Missing key points

- [ ] Effort level chosen on purpose: the highest for a change to totals and tax, the default for low-risk PRs (5) — missed; belonged in framing
- [ ] The PR truncates per-line totals: two €19.90 socks come to 39.79 instead of 39.80 (5) — missed; belonged in framing
- [ ] Security is checked on every review: a self-declared staff role lets a shopper set a price (5) — missed; belonged in framing
- [ ] A regression test that failed on the PR and passes on the fix is the evidence, not the green suite (4) — missed; belonged in update
- [ ] One finding quoted into the review chat, and the answer checked against a test (3) — missed; belonged in update
- [ ] Re-review after the fix resolved the findings; an unchanged diff is skipped, not re-reviewed (3) — missed; belonged in update
- [ ] The review rule targeted only money.ts; replaced with one covering every money path (3) — missed; belonged in update
- [ ] Disputed flag settled with evidence on the thread, and nothing merged into main (2) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: "I think" (×2 in the framing)
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “So, basically, there was a problem in the system and I looked into it with Devin.”

## Three stems for next time

1. Lead with the missing top point: "Effort level chosen on purpose — and the evidence is …"
1. "The customers affected were …, and the number is …"
1. "That's a fair concern; the boundary is …, the evidence is …, and what I can offer is …"

## Compared with your previous run

Calibration run of the generic transcript (labs/coach-dryrun/fixtures/generic-mediocre.md); no previous run.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
