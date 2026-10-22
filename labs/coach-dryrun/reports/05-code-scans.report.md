# Articulation gap report — lab 05 code-scans (coach-05-code-scans)

Learner: **calibration** · mode: dry-run · run 1 · 2026-10-22T11:30:00Z · timing: markers (±5 s) · transcript: `labs/coach-dryrun/fixtures/generic-mediocre.md`

## Scores — 34/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 4/30 | None of the 8 must-mention points is stated; nothing is contradicted, the answer is simply content-free (anchor: 6–10 = one or two points (below band: none)). |
| Structure | 13/25 | Problem, approach, evidence and next step are all findable but thin; the update has no risk and no ask (anchor: 13–16 = parts findable, order broken). |
| Customer relevance | 8/20 | Impact appears once ("some users were affected", "maybe a few customers") with no number, asked for and not given (anchor: 9–12 = one hedged number; 3–5 = no numbers). |
| Brevity and fluency | 6/15 | 6 of 7 segments off target, 6 fillers (0.67/min), one 12 s pause, one tag question (anchor: 6–8 = two or more segments off). |
| Recovery | 3/10 | Objection 1 acknowledged ("fair question") with no boundary or evidence; objection 2 deflected to "next month"; objection 3 conceded (anchor: 4–6 = partly held; 0–2 = not held). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 72 s | +12 s | over |
| Think-aloud checkpoint (T+20) | 45 s | 57 s | +12 s | over |
| Think-aloud checkpoint (T+90) | 45 s | 45 s | +0 s | on |
| Customer update to the CTO | 180 s | 150 s | -30 s | under |
| Objection 1 (technical) — “Our SAST already does this. Why do we need a second scanner?” | 90 s | 51 s | -39 s | under |
| Objection 2 (commercial) — “How many false positives will my platform team have to triage every week?” | 90 s | 47 s | -43 s | under |
| Objection 3 (governance) — “Who approved Devin opening pull requests against our repository?” | 90 s | 37 s | -53 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “there was a problem in the system and I looked into it with Devin”
- **Approach** — present: “I used Devin to investigate, it found the cause, and then we made a change and tested it”
- **Evidence** — weak: “The error went away after the change, so that told me it was the right thing”
- **Next step** — weak: “Next step is to monitor it”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 6 in 8.9 spoken min (0.67/min) — basically ×2, actually ×1, um ×1, you know ×1, so yeah ×1
- Tag questions: 1 (“Then I will ask Devin to explain what it found and see if it makes sense, right?”)
- Pauses over 8 s: 12 s at [02:10] in checkpoint-20

## Missing key points

- [ ] Security Swarm for the brand leak and the webhook, a performance scan for the catalog, an accessibility scan for the admin console (5) — missed; belonged in framing
- [ ] The order detail lookup ignores the caller's brand header, so Lumen staff can read Trailhead orders (5) — missed; belonged in framing
- [ ] The PayGate webhook signature is computed but never compared (4) — missed; belonged in framing
- [ ] The Lamp Week collection runs three queries per product, 27 for the eight lamps (4) — missed; belonged in framing
- [ ] One finding assigned to Devin produced a pull request that was closed unmerged (3) — missed; belonged in update
- [ ] One false positive dismissed with a written reason (3) — missed; belonged in update
- [ ] Scan new commits on the unchanged branch found nothing new, as expected (3) — missed; belonged in update
- [ ] Findings exported as SARIF for the existing security dashboard (3) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: "I think" (×2 in the framing)
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “So, basically, there was a problem in the system and I looked into it with Devin.”

## Three stems for next time

1. Lead with the missing top point: "Security Swarm for the brand leak and the webhook — and the evidence is …"
1. "The customers affected were …, and the number is …"
1. "That's a fair concern; the boundary is …, the evidence is …, and what I can offer is …"

## Compared with your previous run

Calibration run of the generic transcript (labs/coach-dryrun/fixtures/generic-mediocre.md); no previous run.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
