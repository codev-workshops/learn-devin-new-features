# Articulation gap report — lab 12 oncall (coach-12-oncall)

Learner: **calibration** · mode: dry-run · run 1 · 2026-10-22T11:30:00Z · timing: markers (±5 s) · transcript: `labs/coach-dryrun/fixtures/generic-mediocre.md`

## Scores — 32/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 4/30 | None of the 7 must-mention points is stated; nothing is contradicted, the answer is simply content-free (anchor: 0–8 = one point or fewer). |
| Structure | 11/25 | Problem, approach, evidence and next step are all findable but thin; the update has no risk and no ask (anchor: 14–17 = all parts findable, order broken once; 6–9 = problem only; updates have no skeleton). |
| Customer relevance | 7/20 | Impact appears once ("some users were affected", "maybe a few customers") with no number, asked for and not given (anchor: 10–13 = one number, buried; 6–9 = one number, hedged). |
| Brevity and fluency | 6/15 | 5 of 6 segments off target, 6 fillers (0.74/min), one 12 s pause, one tag question (anchor: 7–9 = several off, fillers < 1/min (framing 60 % over)). |
| Recovery | 4/10 | Objection 1 acknowledged ("fair question") with no boundary or evidence; objection 2 deflected to "next month" (anchor: 5–6 = partly; 2–4 = no acknowledgement, no offer). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 45-second incident framing | 45 s | 72 s | +27 s | over |
| T+15 incident update | 120 s | 57 s | -63 s | under |
| Think-aloud checkpoint (T+60) | 45 s | 45 s | +0 s | on |
| Closing update | 180 s | 150 s | -30 s | under |
| Objection 1 (commercial) | 90 s | 51 s | -39 s | under |
| Objection 2 (technical) | 90 s | 47 s | -43 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “there was a problem in the system and I looked into it with Devin”
- **Approach** — present: “I used Devin to investigate, it found the cause, and then we made a change and tested it”
- **Evidence** — weak: “The error went away after the change, so that told me it was the right thing”
- **Next step** — weak: “Next step is to monitor it”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 6 in 8.1 spoken min (0.74/min) — basically ×2, actually ×1, um ×1, you know ×1, so yeah ×1
- Tag questions: 1 (“Then I will ask Devin to explain what it found and see if it makes sense, right?”)
- Pauses over 8 s: 12 s at [02:10] in update-15

## Missing key points

- [ ] Impact in numbers: 40 paid orders for LH-LAMP-03 against 3 units, $1,888 charged (≈ $2,360 at list) (6) — missed; belonged in framing
- [ ] Evidence chain from monitor 48213771 to incident 2187 to a checkout.reserve trace to the reservation code (5) — missed; belonged in update-15
- [ ] Primary cause is the unlocked read-then-write reservation, amplified by duplicate payment webhooks (5) — missed; belonged in checkpoint-60
- [ ] Mitigation until 08:00 that stops new sales of the SKU without a deploy or a manual stock edit (4) — missed; belonged in update
- [ ] Lite for the bounded triage, a full mode for the cross-service root cause, with the reason (4) — missed; belonged in update
- [ ] The cache runbook was wrong and the oversell runbook was followed instead, with the deciding observation (3) — missed; belonged in update-15
- [ ] Which integrations were live and which ran on the fixture shim (3) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: "I think" (×2 in the framing)
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “So, basically, there was a problem in the system and I looked into it with Devin.”

## Three stems for next time

1. Lead with the missing top point: "Impact in numbers — and the evidence is …"
1. "The customers affected were …, and the number is …"
1. "That's a fair concern; the boundary is …, the evidence is …, and what I can offer is …"

## Compared with your previous run

Calibration run of the generic transcript (labs/coach-dryrun/fixtures/generic-mediocre.md); no previous run.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
