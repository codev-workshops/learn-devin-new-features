# Articulation gap report — lab 06 review-remediation (coach-06-review-remediation)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T12:50:00Z · timing: markers (±5 s) · transcript: `labs/06-review-remediation/coaching/dryrun/off-track.md`

## Scores — 16/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 5/30 | Only the rounding cent is stated, then dismissed; offering to merge breaks the lab rule (anchor: 3–7 = one point, one inaccuracy). |
| Structure | 5/25 | Feature tour instead of a headline; no evidence anywhere (anchor: 3–6 = parts missing). |
| Customer relevance | 3/20 | No yes/no on rounding safety; "one cent is not much" to a tech lead whose finance team reconciles every cent (anchor: 2–4). |
| Brevity and fluency | 2/15 | Thirteen fillers, two tag questions, two long pauses; framing 40 s over, update 80 s under (anchor: 1–3). |
| Recovery | 1/10 | Both objections conceded without acknowledgement, boundary or evidence (anchor: 0–2). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 100 s | +40 s | over |
| Think-aloud checkpoint (T+10) | 45 s | 24 s | -21 s | under |
| Think-aloud checkpoint (T+50) | 45 s | 66 s | +21 s | over |
| Update to the tech lead | 180 s | 100 s | -80 s | under |
| Objection 1 (technical) — “That per-line query thing is a flag, not a bug. Carts are small. Why are you blocking my PR on it?” | 90 s | 26 s | -64 s | under |
| Objection 2 (commercial) — “Every review round costs us a day before Black Friday. Why not ship and fix forward?” | 90 s | 21 s | -69 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — missing: “so Devin Review is really good, like, it reads the whole diff”
- **Approach** — weak: “Basically the tests on the PR are green, so it should be fine, no?”
- **Evidence** — missing: “one cent is not much, actually”
- **Next step** — weak: “Basically we can merge it and look again after Black Friday.”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 13 in 5.6 spoken min (2.32/min) — actually ×2, basically ×3, so yeah ×1, you know ×1, like ×2, um ×4
- Tag questions: 2 (“Basically the tests on the PR are green, so it should be fine, no? It is very fast, you know.”, “Actually the findings are mostly flags, right? Devin can fix them all, basically.”)
- Pauses over 8 s: 14 s at [01:50] in checkpoint-10; 16 s at [05:10] in update

## Missing key points

- [ ] Effort level chosen on purpose: the highest for a change to totals and tax, the default for low-risk PRs (5) — missed; belonged in framing
- [x] The PR truncates per-line totals: two €19.90 socks come to 39.79 instead of 39.80 (5) — “So, the review ran. It said the PR truncates per-line totals, two socks come to 39.79 instead of 39.80, which is, like, one cent.”
- [ ] Security is checked on every review: a self-declared staff role lets a shopper set a price (5) — missed; belonged in framing
- [ ] A regression test that failed on the PR and passes on the fix is the evidence, not the green suite (4) — missed; belonged in update
- [ ] One finding quoted into the review chat, and the answer checked against a test (3) — missed; belonged in update
- [ ] Re-review after the fix resolved the findings; an unchanged diff is skipped, not re-reviewed (3) — missed; belonged in update
- [ ] The review rule targeted only money.ts; replaced with one covering every money path (3) — missed; belonged in update
- [ ] Disputed flag settled with evidence on the thread, and nothing merged into main (2) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: basically (×3)
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “Basically we can merge it and look again after Black Friday.”; “Um, one cent is not much, actually.”

## Three stems for next time

1. "Not safe to ship yet" — answer the tech lead's question first.
1. "One cent on every two-sock order" — multiply the cent before you dismiss it.
1. "Green tests did not cover a quantity of 2" — say what the suite missed.

## Compared with your previous run

First recorded run for dryrun on lab 06; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
