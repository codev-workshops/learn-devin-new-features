# Articulation gap report — lab 15 capstone (coach-15-capstone)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T13:40:00Z · timing: markers (±5 s) · transcript: `labs/15-capstone/coaching/dryrun/mediocre.md`

## Scores — 66/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 24/30 | Cause, reproduction, re-plan, proof and review stated; the Lumen ACU limit protecting Trailhead and the negative-stock monitor never said (anchor: 22–25 = five of seven points). |
| Structure | 16/25 | Update has Outcome, Evidence and Ask but no Risk or Next action; framing opens with background (anchor: 14–17 = parts findable, order broken). |
| Customer relevance | 12/20 | The Friday deadline appears late; the budget change is acknowledged but its cost to Lumen is never quantified (anchor: 10–13 = outcome present but buried). |
| Brevity and fluency | 8/15 | Framing and T+90 over, update and two objections under; six fillers in 10.5 minutes, one tag question, one 11-second pause (anchor: 7–9 = several segments off target). |
| Recovery | 6/10 | Objection 2 held the pattern; objections 1 and 3 needed the follow-up and still gave no number or named catch with evidence (anchor: 5–6 = pattern partly held). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 90-second framing after the envelope | 90 s | 104 s | +14 s | over |
| Think-aloud checkpoint (T+30) | 45 s | 44 s | -1 s | on |
| Think-aloud checkpoint (T+90, after the change) | 45 s | 58 s | +13 s | over |
| Four-minute unscripted customer update | 240 s | 205 s | -35 s | under |
| Objection 1 with follow-up — “Finance halved your budget mid-morning. What did you stop doing, and what does that cost Lumen?” | 90 s | 70 s | -20 s | under |
| Objection 2 with follow-up — “How do I know this does not happen again on Friday at nine o'clock?” | 90 s | 88 s | -2 s | on |
| Objection 3 with follow-up — “Why should I trust a review done by the same tool that wrote the fix?” | 90 s | 61 s | -29 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “So, this is about Lamp Week and the oversell from last year”
- **Approach** — present: “I will start with the fix because Friday is close”
- **Evidence** — present: “Re-running the injector after the fix shows no more than three checkouts succeed”
- **Next step** — weak: “Ask: can someone merge the fix before Thursday?”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 6 in 10.5 spoken min (0.57/min) — actually ×2, basically ×2, so yeah ×1, you know ×1
- Tag questions: 1 (“It found the lock-order issue, the deadlock with the admin update, that is a real one, right?”)
- Pauses over 8 s: 11 s at [03:39] in checkpoint-90

## Missing key points

- [x] The reservation reads stock and then writes it without a row lock, so concurrent checkouts sell lamps that do not exist (6) — “The reservation reads stock and then writes it without a row lock, so concurrent checkouts sell lamps that do not exist”
- [x] Reproduced with the oversell injector: twenty concurrent checkouts against a three-unit lamp (5) — “Reproduced with the oversell injector: twenty concurrent checkouts against a three-unit lamp”
- [x] Re-planned for the halved budget: the oversell fix first, the back-in-stock sign-up cut to a small separate pull request (4) — “Re-planned for the halved budget: the oversell fix first, the back-in-stock sign-up cut to a small separate pull request”
- [x] Re-running the injector after the fix shows no more than three checkouts succeed and stock never goes negative (5) — “Re-running the injector after the fix shows no more than three checkouts succeed and stock never goes negative”
- [x] The review finding on lock order was answered and Devin Review is clean on the final commit (4) — “The review finding on lock order was answered and Devin Review is clean on the final commit”
- [ ] Lumen sessions run under the Lumen ACU limit so Trailhead on-call is never blocked (3) — missed; belonged in update
- [ ] A monitor on negative available stock pages a human before customers notice (3) — missed; belonged in objection-2

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: none
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “So, this is about Lamp Week and the oversell from last year, and I looked at the incident and the feature and the budget.”

## Three stems for next time

1. "Lamp Week is safe from overselling; here is the proof." — lead with the outcome, not with the history.
1. "I cut X; that saves N ACU and costs Lumen Y." — answer a budget question with two numbers.
1. "If it happens again, the alert pages the on-call within a minute." — name who wakes up and how.

## Compared with your previous run

First recorded run for dryrun on lab 15 (scenario lamp-week-oversell); no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
