# Articulation gap report — lab 12 oncall (coach-12-oncall)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T11:20:00Z · timing: markers (±5 s) · transcript: `labs/12-oncall/coaching/dryrun/off-track.md`

## Scores — 34/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 9/30 | Only impact and mitigation stated; no evidence chain, no cause, no mode choice, the wrong runbook followed (anchor: 6–10 = two of seven points). |
| Structure | 9/25 | No approach or evidence section; the framing is a timeline and the updates have no skeleton (anchor: 6–9 = problem only, order lost). |
| Customer relevance | 8/20 | One number, hedged with "I think"; the customer impact is never turned into a decision (anchor: 6–9 = one number, hedged). |
| Brevity and fluency | 5/15 | Five segments off target; twelve fillers in 7.6 minutes, one tag question, pauses of 14 s and 12 s (anchor: 4–6 = most segments off target, fillers over 1.5/min). |
| Recovery | 3/10 | Objection 1 dismissed; objection 2 defended the wrong runbook without evidence (anchor: 2–4 = no acknowledge, no offer). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 45-second incident framing | 45 s | 80 s | +35 s | over |
| T+15 incident update | 120 s | 75 s | -45 s | under |
| Think-aloud checkpoint (T+60) | 45 s | 30 s | -15 s | under |
| Closing update | 180 s | 110 s | -70 s | under |
| Objection 1 (commercial) | 90 s | 40 s | -50 s | under |
| Objection 2 (technical) | 90 s | 120 s | +30 s | over |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “the deploy went out, then the newsletter, then the alert”
- **Approach** — missing: “Devin will look at all of it.”
- **Evidence** — missing: “Next I will look at more logs.”
- **Next step** — weak: “Next I will look at more logs.”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 12 in 7.6 spoken min (1.58/min) — actually ×4, basically ×2, so yeah ×3, you know ×1, like ×1, um ×1
- Tag questions: 1 (“Actually, I see a lot of logs, it's complicated, right?”)
- Pauses over 8 s: 14 s at [02:00] in update-15; 12 s at [04:50] in update

## Missing key points

- [x] Impact in numbers: 40 paid orders for LH-LAMP-03 against 3 units, about $2,360 (6) — “It is LH-LAMP-03, 40 orders against 3 units, so, yeah, around 2,360 dollars”
- [ ] Evidence chain from monitor 48213771 to incident 2187 to a checkout.reserve trace to the reservation code (5) — missed; belonged in update-15
- [ ] Primary cause is the unlocked read-then-write reservation, amplified by duplicate payment webhooks (5) — missed; belonged in checkpoint-60
- [x] Mitigation until 08:00 that stops new sales of the SKU without a deploy or a manual stock edit (4) — “stop selling the lamp on the price list until 08:00, no deploy and no more stock edits”
- [ ] Lite for the bounded triage, a full mode for the cross-service root cause, with the reason (4) — missed; belonged in update
- [ ] The cache runbook was wrong and the oversell runbook was followed instead, with the deciding observation (3) — missed; belonged in update-15
- [ ] Which integrations were live and which ran on the fixture shim (3) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: then (×3 in the opening sentence)
- Coach asked “did you say…?”: Which logs? (coach, T+60)
- Article/plural slips: "the cache thing" — "the cache theory"
- Re-record: “So, basically, the deploy went out, then the newsletter, then the alert…”; “Actually, I see a lot of logs, it's complicated, right?”

## Three stems for next time

1. "What I know for sure is… What I do not know yet is…" — separate facts from guesses before you talk about causes.
1. "The runbook said X; the telemetry said Y; I followed Y because…" — check the runbook against the re-page.
1. "Monitor → incident → trace → code" — give one id per link before you name a cause.

## Compared with your previous run

First recorded run for dryrun on lab 12; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
