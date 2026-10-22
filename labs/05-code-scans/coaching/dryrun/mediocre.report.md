# Articulation gap report — lab 05 code-scans (coach-05-code-scans)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:55:00Z · timing: markers (±5 s) · transcript: `labs/05-code-scans/coaching/dryrun/mediocre.md`

## Scores — 56/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 20/30 | Six of eight points stated; the dismissal with a reason and the export were never mentioned (anchor: 18–21 = most points, two missing). |
| Structure | 14/25 | Framing front-loaded three "because" clauses before the headline; update had no risk and no ask (anchor: 13–16 = parts findable, order broken). |
| Customer relevance | 10/20 | No statement count for Lamp Week; "around seven, maybe more" when asked for the total (anchor: 9–12 = one hedged number). |
| Brevity and fluency | 7/15 | Framing 70 s and update 210 s over; six fillers, one tag question, one 12-second pause (anchor: 6–8). |
| Recovery | 5/10 | Objections skipped boundary and evidence; the governance answer was defensive (anchor: 4–6 = pattern partly held). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 74 s | +14 s | over |
| Think-aloud checkpoint (T+20) | 45 s | 50 s | +5 s | on |
| Think-aloud checkpoint (T+90) | 45 s | 46 s | +1 s | on |
| Customer update to the CTO | 180 s | 210 s | +30 s | over |
| Objection 1 (technical) — “Our SAST already does this. Why do we need a second scanner?” | 90 s | 56 s | -34 s | under |
| Objection 2 (commercial) — “How many false positives will my platform team have to triage every week?” | 90 s | 70 s | -20 s | under |
| Objection 3 (governance) — “Who approved Devin opening pull requests against our repository?” | 90 s | 66 s | -24 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “because the brands share a database, and because the webhook is from a partner, and because Lamp Week is coming, I think we need scans”
- **Approach** — present: “I will run Security Swarm for the brand leak and the webhook”
- **Evidence** — weak: “so it is slow when there are many products”
- **Next step** — weak: “Next step is to fix the rest”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 6 in 9.5 spoken min (0.63/min) — actually ×2, basically ×2, so yeah ×1, you know ×1
- Tag questions: 1 (“That's the second one, right?”)
- Pauses over 8 s: 12 s at [02:20] in checkpoint-20

## Missing key points

- [x] Security Swarm for the brand leak and the webhook, a performance scan for the catalog, an accessibility scan for the admin console (5) — “I will run Security Swarm for the brand leak and the webhook, a performance scan for the catalog, and an accessibility scan for the admin console. It is the scans feature, basically.”
- [x] The order detail lookup ignores the caller's brand header, so Lumen staff can read Trailhead orders (5) — “The order detail lookup ignores the caller's brand header, I think, so a Lumen user can see Trailhead orders. At the end you get the findings list.”
- [x] The PayGate webhook signature is computed but never compared (4) — “The PayGate webhook signature is computed but never compared. That's the second one, right?”
- [x] The Lamp Week collection runs one query plus three per product (4) — “So we found the leak and the webhook problem, and the catalog. The Lamp Week collection runs one query plus three per product, so it is slow when there are many products.”
- [x] One finding assigned to Devin produced a pull request that was closed unmerged (3) — “One finding assigned to Devin produced a pull request that was closed unmerged, because we can't merge into main. Then I ran Scan new commits on the unchanged branch and it found nothing new, as expected, actually.”
- [ ] One false positive dismissed with a written reason (3) — missed; belonged in update
- [x] Scan new commits on the unchanged branch found nothing new, as expected (3) — “One finding assigned to Devin produced a pull request that was closed unmerged, because we can't merge into main. Then I ran Scan new commits on the unchanged branch and it found nothing new, as expected, actually.”
- [ ] Findings exported as SARIF for the existing security dashboard (3) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: because (×3 in the opening sentence)
- Coach asked “did you say…?”: never
- Article/plural slips: "There are a lot of them" — give the count: "There are seven."
- Re-record: “So, basically, because the brands share a database…”

## Three stems for next time

1. "We are leaking across brands. Here is why." — headline first, reasons second.
1. "Forty products means a hundred and twenty-one statements" — put the number on the slow page.
1. "I threw one finding out, and here is the note" — say what you dismissed and how you exported.

## Compared with your previous run

First recorded run for dryrun on lab 05; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
