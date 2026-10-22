# Articulation gap report — lab 06 review-remediation (coach-06-review-remediation)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T12:00:00Z · timing: markers (±5 s) · transcript: `labs/06-review-remediation/coaching/dryrun/strong.md`

## Scores — 93/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 29/30 | All eight points stated with the numbers; the rule fix could name the new target glob (anchor: 27–30 = all points, accurate). |
| Structure | 23/25 | Headline first in the framing; the update held Outcome → Evidence → Risk → Next → Ask (anchor: 22–25). |
| Customer relevance | 18/20 | Both amounts in cents, the one-cent lamp and the brand affected; no figure for how many orders a day have two socks (anchor: 17–20). |
| Brevity and fluency | 14/15 | Every segment on time; one filler, no tag questions, no long pauses (anchor: 13–15). |
| Recovery | 9/10 | Both objections acknowledged, bounded, evidenced and closed with an offer (anchor: 9–10). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 58 s | -2 s | on |
| Think-aloud checkpoint (T+10) | 45 s | 43 s | -2 s | on |
| Think-aloud checkpoint (T+50) | 45 s | 44 s | -1 s | on |
| Update to the tech lead | 180 s | 180 s | +0 s | on |
| Objection 1 (technical) — “That per-line query thing is a flag, not a bug. Carts are small. Why are you blocking my PR on it?” | 90 s | 85 s | -5 s | on |
| Objection 2 (commercial) — “Every review round costs us a day before Black Friday. Why not ship and fix forward?” | 90 s | 85 s | -5 s | on |

## Structure (problem → approach → evidence → next step)

- **Problem** — present: “Headline: PR #26 is not safe to ship yet.”
- **Approach** — present: “Effort level chosen on purpose: the highest for a change to totals and tax”
- **Evidence** — present: “Two socks: 39.79 on the PR, 39.80 on the fix and on main.”
- **Next step** — present: “Ask: approve this pattern so the author can redo the PR cleanly”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: yes

## Fillers and pauses

- Fillers: 1 in 8.3 spoken min (0.12/min) — basically ×1
- Tag questions: 0
- Pauses over 8 s: none

## Missing key points

- [x] Effort level chosen on purpose: the highest for a change to totals and tax, the default for low-risk PRs (5) — “Effort level chosen on purpose: the highest for a change to totals and tax, the default for low-risk PRs like docs. You get a fix on a throwaway branch with a test you can rerun.”
- [x] The PR truncates per-line totals: two €19.90 socks come to 39.79 instead of 39.80 (5) — “Headline: PR #26 is not safe to ship yet. The PR truncates per-line totals: two €19.90 socks come to 39.79 instead of 39.80, and that cent breaks reconciliation with the worker.”
- [x] Security is checked on every review: a self-declared staff role lets a shopper set a price (5) — “Security is checked on every review, and it found that a self-declared staff role lets a shopper set a price: a merchandiser header pinned a lamp at one cent.”
- [x] A regression test that failed on the PR and passes on the fix is the evidence, not the green suite (4) — “Evidence: a regression test that failed on the PR and passes on the fix is the evidence, not the green suite. Two socks: 39.79 on the PR, 39.80 on the fix and on main.”
- [x] One finding quoted into the review chat, and the answer checked against a test (3) — “I quoted the rounding finding into the review chat and asked which seeded SKU breaks it. It named the €19.90 socks, and I checked the answer against a test.”
- [x] Re-review after the fix resolved the findings; an unchanged diff is skipped, not re-reviewed (3) — “Yes. Re-review after the fix resolved the findings with nothing new. When I pushed an empty commit, the unchanged diff was skipped, not re-reviewed, which is what the docs describe.”
- [x] The review rule targeted only money.ts; replaced with one covering every money path (3) — “Risk: the review rule targeted only money.ts, so this PR walked around its test requirement. I replaced it with one covering every money path in services/api.”
- [x] Disputed flag settled with evidence on the thread, and nothing merged into main (2) — “The disputed flag was settled with evidence on the thread: I moved re-pricing out of the transaction. Nothing merged into main; both plants are still there.”

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: none
- Coach asked “did you say…?”: never
- Article/plural slips: none

## Three stems for next time

1. "Two socks, one cent, every order" — keep the smallest failing case in the headline.
1. "The Bugs block the merge, not the flag" — separate the two before the author does.
1. "Here is the target glob" — name the new rule's target, not just that it is wider.

## Compared with your previous run

First recorded run for dryrun on lab 06; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
