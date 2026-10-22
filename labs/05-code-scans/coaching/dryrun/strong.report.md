# Articulation gap report — lab 05 code-scans (coach-05-code-scans)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:40:00Z · timing: markers (±5 s) · transcript: `labs/05-code-scans/coaching/dryrun/strong.md`

## Scores — 93/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 28/30 | All eight points stated with the file or number behind them (anchor: 27–30 = every point, sourced). |
| Structure | 23/25 | Headline first in framing and update; outcome → evidence → next → risk → ask held, with risk placed after next action (anchor: 22–25 = order held, one minor swap). |
| Customer relevance | 19/20 | Yes/no on cross-brand access first, then 7 findings and 121 statements per page; ask is concrete (anchor: 18–20 = numbers in most sentences). |
| Brevity and fluency | 14/15 | Every segment within ±5 s; one filler in 10.8 spoken minutes, no long pauses (anchor: 13–15). |
| Recovery | 9/10 | All three objections followed acknowledge → boundary → evidence → offer; the interruption got a number, not a hedge (anchor: 9–10). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 58 s | -2 s | on |
| Think-aloud checkpoint (T+20) | 45 s | 44 s | -1 s | on |
| Think-aloud checkpoint (T+90) | 45 s | 44 s | -1 s | on |
| Customer update to the CTO | 180 s | 178 s | -2 s | on |
| Objection 1 (technical) — “Our SAST already does this. Why do we need a second scanner?” | 90 s | 88 s | -2 s | on |
| Objection 2 (commercial) — “How many false positives will my platform team have to triage every week?” | 90 s | 86 s | -4 s | on |
| Objection 3 (governance) — “Who approved Devin opening pull requests against our repository?” | 90 s | 88 s | -2 s | on |

## Structure (problem → approach → evidence → next step)

- **Problem** — present: “The risk is that one brand's staff can read the other brand's orders”
- **Approach** — present: “I will run three scans on main, not one”
- **Evidence** — present: “forty products means a hundred and twenty-one statements per page load”
- **Next step** — present: “Ask: thirty minutes with the security lead to load the SARIF file”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: yes

## Fillers and pauses

- Fillers: 1 in 9.8 spoken min (0.1/min) — actually ×1
- Tag questions: 0
- Pauses over 8 s: none

## Missing key points

- [x] Security Swarm for the brand leak and the webhook, a performance scan for the catalog, an accessibility scan for the admin console (5) — “I will run three scans on main, not one. Security Swarm for the brand leak and the webhook, because it reasons about trust boundaries; a performance scan for the catalog, because it counts queries per request; an acce…”
- [x] The order detail lookup ignores the caller's brand header, so Lumen staff can read Trailhead orders (5) — “Outcome: yes, we are leaking across brands. The order detail lookup ignores the caller's brand header, so Lumen staff can read Trailhead orders by ID. That is one high-severity finding, in one file.”
- [x] The PayGate webhook signature is computed but never compared (4) — “Evidence: the PayGate webhook signature is computed but never compared, so anyone who can reach the endpoint can mark an order paid — the second high finding. And the Lamp Week collection runs one query plus three per…”
- [x] The Lamp Week collection runs one query plus three per product (4) — “Evidence: the PayGate webhook signature is computed but never compared, so anyone who can reach the endpoint can mark an order paid — the second high finding. And the Lamp Week collection runs one query plus three per…”
- [x] One finding assigned to Devin produced a pull request that was closed unmerged (3) — “Next action, actually done already: one finding assigned to Devin produced a pull request that was closed unmerged, because this course keeps the defect on main; the fix and its test are reviewable. One false positive…”
- [x] One false positive dismissed with a written reason (3) — “Next action, actually done already: one finding assigned to Devin produced a pull request that was closed unmerged, because this course keeps the defect on main; the fix and its test are reviewable. One false positive…”
- [x] Scan new commits on the unchanged branch found nothing new, as expected (3) — “After closing the PR I ran Scan new commits on the unchanged branch; it found nothing new, as expected, because nothing had landed on main. And the findings are exported as SARIF for the existing security dashboard, s…”
- [x] Findings exported as SARIF for the existing security dashboard (3) — “After closing the PR I ran Scan new commits on the unchanged branch; it found nothing new, as expected, because nothing had landed on main. And the findings are exported as SARIF for the existing security dashboard, s…”

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: none
- Coach asked “did you say…?”: never
- Article/plural slips: none

## Three stems for next time

1. "Yes, we are leaking across brands — here is the one file." — keep the yes/no before the count.
1. "Risk: … Ask: …" — move the risk line before the next action next time so the ask lands last.
1. "After a month we compare…" — keep offering a measurable trial when a stakeholder defends an existing tool.

## Compared with your previous run

First recorded run for dryrun on lab 05; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
