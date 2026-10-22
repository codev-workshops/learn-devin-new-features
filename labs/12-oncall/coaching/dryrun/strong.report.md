# Articulation gap report — lab 12 oncall (coach-12-oncall)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:00:00Z · timing: markers (±5 s) · transcript: `labs/12-oncall/coaching/dryrun/strong.md`

## Scores — 90/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 28/30 | All seven points stated with their numbers and ids; mm7 was brief (anchor: 26–30 = every point, one thin). |
| Structure | 22/25 | Outcome → Evidence → Risk → Next action → Ask held in both updates; confirmed vs suspected labelled (anchor: 21–25 = order held throughout). |
| Customer relevance | 18/20 | Impact, money and the 08:00 owner in the first sentence; the alert storm absorbed in one line (anchor: 17–20 = numbers first, change absorbed). |
| Brevity and fluency | 13/15 | Every segment within ±5 s; one filler in 9.4 minutes, no long pauses (anchor: 13–15 = all on target, fillers under 0.5/min). |
| Recovery | 9/10 | Both objections acknowledged, bounded, evidenced and closed with an offer (anchor: 9–10 = pattern held twice). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 45-second incident framing | 45 s | 44 s | -1 s | on |
| T+15 incident update | 120 s | 118 s | -2 s | on |
| Think-aloud checkpoint (T+60) | 45 s | 47 s | +2 s | on |
| Closing update | 180 s | 176 s | -4 s | on |
| Objection 1 (commercial) | 90 s | 88 s | -2 s | on |
| Objection 2 (technical) | 90 s | 92 s | +2 s | on |

## Structure (problem → approach → evidence → next step)

- **Problem** — present: “Right now, 40 customers have paid for the Ember Table Lamp”
- **Approach** — present: “A Devin Oncall responder is pulling the incident, the monitor and the traces”
- **Evidence** — present: “The trace shows three checkout.reserve spans in the same second, each reading available equals 3”
- **Next step** — present: “Ask: approve two follow-ups after 08:00”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: yes

## Fillers and pauses

- Fillers: 1 in 9.4 spoken min (0.11/min) — actually ×1
- Tag questions: 0
- Pauses over 8 s: none

## Missing key points

- [x] Impact in numbers: 40 paid orders for LH-LAMP-03 against 3 units, $1,888 charged (≈ $2,360 at list) (6) — “40 customers have paid for the Ember Table Lamp, LH-LAMP-03, and we only had 3 units. That is about 2,360 dollars”
- [x] Evidence chain from monitor 48213771 to incident 2187 to a checkout.reserve trace to the reservation code (5) — “monitor 48213771 fired at 02:10 and opened PagerDuty incident 2187. The trace shows three checkout.reserve spans in the same second”
- [x] Primary cause is the unlocked read-then-write reservation, amplified by duplicate payment webhooks (5) — “the primary cause is the unlocked read-then-write reservation, and duplicate webhooks amplify it”
- [x] Mitigation until 08:00 that stops new sales of the SKU without a deploy or a manual stock edit (4) — “the SKU is unavailable on the Lamp Week price list and safety stock is above on-hand. No deploy and no manual stock edit”
- [x] Lite for the bounded triage, a full mode for the cross-service root cause, with the reason (4) — “Lite for the triage, because fetching the incident, the series and the order count is narrow and cheap. A full mode for the root cause”
- [x] The cache runbook was wrong and the oversell runbook was followed instead, with the deciding observation (3) — “the on-call followed RB-101, the cache runbook. It is wrong — the worker has had no cache since July”
- [x] Which integrations were live and which ran on the fixture shim (3) — “PagerDuty and Datadog ran on the fixture shim tonight, not live”

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: "evt_9f2a7c01" may be transcribed as "event 9 F 2 A"
- Repeated words: none
- Coach asked “did you say…?”: never
- Article/plural slips: none

## Three stems for next time

1. "Right now, 40 customers… It is costing…" — keep the number in the first five words.
1. "Confirmed: … Suspected: …" — you did it in the T+15 update; carry it into the closing update too.
1. "Integrations: live were … ; fixtures were …" — give the fixture/live line its own sentence, not a tail.

## Compared with your previous run

First recorded run for dryrun on lab 12; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
