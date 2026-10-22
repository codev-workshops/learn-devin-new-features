# Articulation gap report — lab 09 dynamic-workflows (coach-09-dynamic-workflows)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:00:00Z · timing: markers (±5 s) · transcript: `labs/09-dynamic-workflows/coaching/dryrun/strong.md`

## Scores — 89/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 28/30 | All five points with quotable sentences and per-agent numbers (anchors: 27–30 every point with a number; 15–20 three of five; under 10 one point). |
| Structure | 23/25 | Verdict → coverage → failure → fix → cost → ask held, including after the interruption (anchors: 22–25 all parts in order; 13–17 parts present but weak; under 8 problem only). |
| Customer relevance | 18/20 | Used the auditor's own terms: endpoint count, independent verifier, per-agent cost, freeze on main (anchors: 16–20 auditor's numbers and constraints used; 10–13 some numbers; under 6 feature talk). |
| Brevity and fluency | 12/15 | All six segments within ±5 s; one filler in about 8 minutes (anchors: 11–15 segments on target, under 1 filler/min; 6–8 two or more segments off; under 4 most segments off). |
| Recovery | 8/10 | Both objections ran acknowledge → boundary → evidence → offer; the commercial one used four per-agent ACU figures (anchors: 7–10 acknowledge → boundary → evidence → offer held with numbers; 4–6 partial; under 3 no pattern). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 55 s | -5 s | on |
| Think-aloud checkpoint (T+20) | 45 s | 43 s | -2 s | on |
| Think-aloud checkpoint (T+120) | 45 s | 47 s | +2 s | on |
| Three-minute auditor update | 180 s | 177 s | -3 s | on |
| Objection 1 (technical) — “How do I know an agent didn't skip endpoints and call it clean?” | 90 s | 87 s | -3 s | on |
| Objection 2 (commercial) — “Why pay for a fan-out of agents when one engineer could read 22 endpoints in an afternoon?” | 90 s | 93 s | +3 s | on |

## Structure (problem → approach → evidence → next step)

- **Problem** — present: “You get a verdict for every endpoint the API serves”
- **Approach** — present: “one audit agent per route file, a fixer per file with a confirmed leak, and a separate verifier”
- **Evidence** — present: “A separate verifier agent wrote its own check and returned pass”
- **Next step** — present: “Ask: approve the full run at a ten ACU cap”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: yes

## Fillers and pauses

- Fillers: 1 in 8.4 spoken min (0.12/min) — actually ×1
- Tag questions: 0
- Pauses over 8 s: none

## Missing key points

- [x] Every endpoint covered: the count comes from the code (22 in 7 route files) and a small slice ran first (8) — “twenty-two endpoints in seven route files, and the count comes from the code”
- [x] The confirmed leak: the single-order read filters on id alone, so staff of one brand can read the other brand's order (6) — “The single-order read filters on the order id alone, so a merchandiser or admin of one brand can read the other brand's order”
- [x] A failed or invalid agent was caught in code with a bounded retry, and resuming the same run ID replayed finished agents (6) — “The script caught the error and retried each one once”
- [x] The fix lives on a throwaway branch named by the script, a separate agent verified it, and main keeps the defect (5) — “on a throwaway branch named by the script, with the planted test un-skipped. A separate verifier agent wrote its own check”
- [x] Cost quoted per agent from the run (roughly 0.7–1.0 ACU each, about 3.5 for the slice) with a projection for the full run (5) — “zero point nine nine ACU to audit carts, zero point seven one for orders, zero point nine six for the fix and zero point eight four for the verifier”

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: none
- Coach asked “did you say…?”: never
- Article/plural slips: "each one has a file and line" — "a file-and-line reference" reads cleaner
- Re-record: “Cost: three and a half ACU for the slice.”

## Three stems for next time

1. "The number first: …" — lead every answer to "how many" with the figure.
1. "The settled figure is…" — say which ACU number you quote and why, before you are asked.
1. "No agent decides the list; the script does." — keep the boundary to one sentence.

## Compared with your previous run

First recorded run for dryrun on lab 09; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
