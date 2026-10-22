# Articulation gap report — lab 12 oncall (coach-12-oncall)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:40:00Z · timing: markers (±5 s) · transcript: `labs/12-oncall/coaching/dryrun/mediocre.md`

## Scores — 62/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 20/30 | Impact, evidence chain, cause, mitigation and the runbook switch stated; no mode choice and no fixture/live statement (anchor: 17–21 = five of seven points). |
| Structure | 16/25 | Updates follow the skeleton but the framing leads with the timeline; the T+15 outcome has no number of its own (anchor: 14–17 = all parts findable, order broken once). |
| Customer relevance | 12/20 | Numbers present but late in the framing; the closing update hands customers to merchandising without a count or decision (anchor: 10–13 = one number, buried). |
| Brevity and fluency | 8/15 | Framing and T+15 over target, closing update and objection 1 under; six fillers in 9.2 minutes, one tag question, one 11-second pause (anchor: 7–9 = several segments off target, fillers under 1/min). |
| Recovery | 6/10 | Objection 2 held the pattern; objection 1 skipped the evidence step and conceded the point (anchor: 5–6 = pattern partly held). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 45-second incident framing | 45 s | 58 s | +13 s | over |
| T+15 incident update | 120 s | 135 s | +15 s | over |
| Think-aloud checkpoint (T+60) | 45 s | 44 s | -1 s | on |
| Closing update | 180 s | 160 s | -20 s | under |
| Objection 1 (commercial) | 90 s | 70 s | -20 s | under |
| Objection 2 (technical) | 90 s | 88 s | -2 s | on |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “So, the Lamp Week deploy went out at 22:40, and then the newsletter went out”
- **Approach** — weak: “Devin Oncall is looking at it”
- **Evidence** — present: “in the traces there are three checkout.reserve spans reading 3 at the same time”
- **Next step** — present: “Ask: can we turn off the SKU?”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 6 in 9.2 spoken min (0.65/min) — actually ×2, basically ×2, so yeah ×1, you know ×1
- Tag questions: 1 (“I think it is the reservation race and the webhooks double it, that's the cause, no?”)
- Pauses over 8 s: 11 s at [03:53] in checkpoint-60

## Missing key points

- [x] Impact in numbers: 40 paid orders for LH-LAMP-03 against 3 units, $1,888 charged (≈ $2,360 at list) (6) — “40 customers paid for LH-LAMP-03 and we had 3 units, so around 2,360 dollars”
- [x] Evidence chain from monitor 48213771 to incident 2187 to a checkout.reserve trace to the reservation code (5) — “the monitor 48213771 opened incident 2187, and in the traces there are three checkout.reserve spans reading 3 at the same time, so it goes to the reservation code”
- [x] Primary cause is the unlocked read-then-write reservation, amplified by duplicate payment webhooks (5) — “it is the reservation race and the webhooks double it”
- [x] Mitigation until 08:00 that stops new sales of the SKU without a deploy or a manual stock edit (4) — “the SKU is unavailable on the price list, we did not deploy and nobody edits the stock by hand”
- [ ] Lite for the bounded triage, a full mode for the cross-service root cause, with the reason (4) — missed; belonged in update
- [x] The cache runbook was wrong and the oversell runbook was followed instead, with the deciding observation (3) — “The on-call used RB-101, the cache one, but it is wrong because the stock went negative again after his correction, so I use RB-102 instead”
- [ ] Which integrations were live and which ran on the fixture shim (3) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: and then (×2 in the opening sentence)
- Coach asked “did you say…?”: never
- Article/plural slips: "the monitor 48213771" — "monitor 48213771"
- Re-record: “So, the Lamp Week deploy went out at 22:40, and then the newsletter went out…”

## Three stems for next time

1. "Right now, 40 customers have paid for a lamp we do not have." — impact before the timeline.
1. "Lite for …, full mode for …, because…" — name the mode choice and its cost in the closing update.
1. "Tonight PagerDuty and Datadog were fixtures; nothing was live." — say which path you ran.

## Compared with your previous run

First recorded run for dryrun on lab 12; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
