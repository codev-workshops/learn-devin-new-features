# Articulation gap report — lab 15 capstone (coach-15-capstone)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T14:20:00Z · timing: markers (±5 s) · transcript: `labs/15-capstone/coaching/dryrun/off-track.md`

## Scores — 27/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 9/30 | Only the dedupe cause and the affected count stated; no reproduction, no T+60 re-plan, no isolation audit, no profile evidence, no signature risk (anchor: 0–10 = two of seven points). |
| Structure | 7/25 | Feature before incident; no evidence anywhere; the update ends on a question (anchor: 5–9 = parts missing). |
| Customer relevance | 6/20 | The auditor's constraint is deferred and the T+60 change is never acknowledged; widening the network breaks the envelope (anchor: 0–7 = customer outcome absent). |
| Brevity and fluency | 3/15 | Seven of eight segments off target; twelve fillers in 10.4 minutes, two tag questions, two long pauses (anchor: 0–4 = most segments off, frequent fillers). |
| Recovery | 2/10 | No objection held the pattern; every follow-up was needed and none produced evidence (anchor: 0–3 = conceded or deflected). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 90-second framing after the envelope | 90 s | 135 s | +45 s | over |
| Think-aloud checkpoint (T+30) | 45 s | 70 s | +25 s | over |
| Think-aloud checkpoint (T+90, after the change) | 45 s | 20 s | -25 s | under |
| Think-aloud checkpoint (T+150) | 45 s | 75 s | +30 s | over |
| Four-minute unscripted customer update | 240 s | 120 s | -120 s | under |
| Objection 1 with follow-up — “An audit of every endpoint sounds expensive. Why not sample ten?” | 90 s | 40 s | -50 s | under |
| Objection 2 with follow-up — “You let an AI agent work on our payment webhooks. What stops it from breaking the signature check?” | 90 s | 35 s | -55 s | under |
| Objection 3 with follow-up — “I am the auditor. How do I verify your evidence without trusting Devin?” | 90 s | 130 s | +40 s | over |

## Structure (problem → approach → evidence → next step)

- **Problem** — missing: “I will start with the refund button because that is the thing the support team asked for”
- **Approach** — weak: “So the plan is refund, then the worker, then the audit.”
- **Evidence** — missing: “It is basically working.”
- **Next step** — weak: “Can we look at it tomorrow?”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 12 in 10.4 spoken min (1.15/min) — actually ×1, basically ×2, you know ×1, like ×2, um ×6
- Tag questions: 2 (“Um, okay, so I will start with the refund button because that is the thing the support team asked for, right?”, “Um, it is taking longer than I thought because the API has no refund endpoint, no?”)
- Pauses over 8 s: 12 s at [02:47] in checkpoint-30; 14 s at [05:30] in checkpoint-150

## Missing key points

- [x] The worker processes the same payment webhook twice because it ignores the event id, so it must dedupe on it (6) — “the worker processes the same payment webhook twice because it ignores the event id, so it must dedupe on it”
- [ ] Reproduced with the duplicate-webhook injector: one payment, two confirmations, stock taken twice (5) — missed; belonged in checkpoint-30
- [ ] After the change the isolation evidence goes first and the refund is limited to same-brand merchandisers (4) — missed; belonged in checkpoint-90
- [ ] Brand isolation checked on every endpoint, and the order-by-id endpoint leaks across brands (5) — missed; belonged in checkpoint-150
- [ ] Sessions ran under a profile allowing only npm and the PayGate sandbox, and the blocked Python install did not widen it (4) — missed; belonged in update
- [x] How many orders and customers were double-charged and need a refund (3) — “Around thirty orders were double-charged across both brands, about twenty-five customers”
- [ ] The payment webhook signature is read but never verified, which is a second risk (3) — missed; belonged in objection-2

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: none
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “Um, okay, so I will start with the refund button because that is the thing the support team asked for, right?”; “So I added PyPI to the allowed hosts and then it worked.”

## Three stems for next time

1. "Customers are being charged twice; that goes first." — rank by cost before choosing the fun problem.
1. "I kept the constraint and did this instead…" — never widen a permission to get past a blocker; say what you did instead.
1. "You can re-run this without me: …" — give the auditor one command and one table.

## Compared with your previous run

First recorded run for dryrun on lab 15 (scenario double-charge-audit); no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
