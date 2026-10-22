# Articulation gap report — lab 06 review-remediation (coach-06-review-remediation)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T12:25:00Z · timing: markers (±5 s) · transcript: `labs/06-review-remediation/coaching/dryrun/mediocre.md`

## Scores — 57/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 22/30 | Six of eight points stated; the effort-level choice and the review rule were never mentioned (anchor: 18–22 = most points, two missing). |
| Structure | 14/25 | Framing front-loaded three "because" clauses; the update had no risk and no ask (anchor: 13–16 = parts findable, order broken). |
| Customer relevance | 10/20 | "39.80 or so" when asked for the subtotal; no before/after amount (anchor: 9–12 = one hedged number). |
| Brevity and fluency | 7/15 | Framing 14 s and update 30 s over; six fillers, one tag question, one 12-second pause (anchor: 6–8). |
| Recovery | 4/10 | Neither objection acknowledged; no evidence and no offer (anchor: 3–5). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 74 s | +14 s | over |
| Think-aloud checkpoint (T+10) | 45 s | 50 s | +5 s | on |
| Think-aloud checkpoint (T+50) | 45 s | 46 s | +1 s | on |
| Update to the tech lead | 180 s | 210 s | +30 s | over |
| Objection 1 (technical) — “That per-line query thing is a flag, not a bug. Carts are small. Why are you blocking my PR on it?” | 90 s | 56 s | -34 s | under |
| Objection 2 (commercial) — “Every review round costs us a day before Black Friday. Why not ship and fix forward?” | 90 s | 70 s | -20 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “because it touches totals, and because Black Friday is coming, and because of the tax, I think we need a review”
- **Approach** — weak: “I will use Devin Review on it, basically.”
- **Evidence** — weak: “It is right now, I think, 39.80 or so.”
- **Next step** — missing: “So yeah, that is the update.”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 6 in 8.4 spoken min (0.71/min) — actually ×2, basically ×2, so yeah ×1, you know ×1
- Tag questions: 1 (“The rounding one is the big one for finance, right?”)
- Pauses over 8 s: 12 s at [02:20] in checkpoint-10

## Missing key points

- [ ] Effort level chosen on purpose: the highest for a change to totals and tax, the default for low-risk PRs (5) — missed; belonged in framing
- [x] The PR truncates per-line totals: two €19.90 socks come to 39.79 instead of 39.80 (5) — “The PR truncates per-line totals: two €19.90 socks come to 39.79 instead of 39.80. I will use Devin Review on it, basically.”
- [x] Security is checked on every review: a self-declared staff role lets a shopper set a price (5) — “Security is checked on every review, and I think a self-declared staff role lets a shopper set a price. I'll leave the settings as they are.”
- [x] A regression test that failed on the PR and passes on the fix is the evidence, not the green suite (4) — “So we fixed the rounding and the override on a branch. A regression test that failed on the PR and passes on the fix is the evidence, not the green suite.”
- [x] One finding quoted into the review chat, and the answer checked against a test (3) — “I quoted one finding into the review chat and checked the answer against a test, actually. Then the re-review after the fix resolved the findings; an unchanged diff is skipped, not re-reviewed.”
- [x] Re-review after the fix resolved the findings; an unchanged diff is skipped, not re-reviewed (3) — “I quoted one finding into the review chat and checked the answer against a test, actually. Then the re-review after the fix resolved the findings; an unchanged diff is skipped, not re-reviewed.”
- [ ] The review rule targeted only money.ts; replaced with one covering every money path (3) — missed; belonged in update
- [x] Disputed flag settled with evidence on the thread, and nothing merged into main (2) — “The disputed flag I settled with evidence on the thread, and nothing merged into main. So yeah, that is the update.”

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: because (×3 in the opening sentence)
- Coach asked “did you say…?”: never
- Article/plural slips: "There are a few of them" — give the count: "One security finding, three bugs."
- Re-record: “So, basically, because it touches totals…”

## Three stems for next time

1. "Not safe to ship, here is why" — the decision before the reasons.
1. "39.79 on the PR, 39.80 on the fix" — both numbers, no "or so".
1. "I chose this effort level because…" — say the choice and the reason.

## Compared with your previous run

First recorded run for dryrun on lab 06; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
