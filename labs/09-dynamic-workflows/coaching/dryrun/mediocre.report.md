# Articulation gap report — lab 09 dynamic-workflows (coach-09-dynamic-workflows)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:00:00Z · timing: markers (±5 s) · transcript: `labs/09-dynamic-workflows/coaching/dryrun/mediocre.md`

## Scores — 57/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 18/30 | Three of five points; the failure was described without how the script handled it, and no per-agent cost (anchors: 27–30 every point with a number; 15–20 three of five; under 10 one point). |
| Structure | 15/25 | Framing opened with method before the verdict; the update has no cost line (anchors: 22–25 all parts in order; 13–17 parts present but weak; under 8 problem only). |
| Customer relevance | 12/20 | Endpoint count and freeze mentioned; cost given as "a few ACU" (anchors: 16–20 auditor's numbers and constraints used; 10–13 some numbers; under 6 feature talk). |
| Brevity and fluency | 7/15 | Framing, checkpoint-120 and objection-2 over, update under; six fillers and a 12 s pause (anchors: 11–15 segments on target, under 1 filler/min; 6–8 two or more segments off; under 4 most segments off). |
| Recovery | 5/10 | Objection 1 had boundary and evidence but no offer; objection 2 had no per-agent number (capped at 5) (anchors: 7–10 acknowledge → boundary → evidence → offer held with numbers; 4–6 partial; under 3 no pattern). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 74 s | +14 s | over |
| Think-aloud checkpoint (T+20) | 45 s | 40 s | -5 s | on |
| Think-aloud checkpoint (T+120) | 45 s | 62 s | +17 s | over |
| Three-minute auditor update | 180 s | 150 s | -30 s | under |
| Objection 1 (technical) — “How do I know an agent didn't skip endpoints and call it clean?” | 90 s | 91 s | +1 s | on |
| Objection 2 (commercial) — “Why pay for a fan-out of agents when one engineer could read 22 endpoints in an afternoon?” | 90 s | 106 s | +16 s | over |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “So I started by looking at how the API is organised”
- **Approach** — present: “The workflow audits, fixes and verifies”
- **Evidence** — weak: “It worked in the end anyway, the results came back”
- **Next step** — present: “next step is to run the rest of the files”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 6 in 8.7 spoken min (0.69/min) — actually ×2, basically ×2, so yeah ×1, um ×1
- Tag questions: 1 (“It didn't cost that much overall, a few ACU, that's the cost, right?”)
- Pauses over 8 s: 12 s at [02:50] in checkpoint-120

## Missing key points

- [x] Every endpoint covered: the count comes from the code (22 in 7 route files) and a small slice ran first (8) — “I counted twenty-two endpoints from the code and ran two files first as a slice”
- [x] The confirmed leak: the single-order read filters on id alone, so staff of one brand can read the other brand's order (6) — “the single-order read filters on the id alone, so staff of one brand can actually read the other brand's order”
- [ ] A failed or invalid agent was caught in code with a bounded retry, and resuming the same run ID replayed finished agents (6) — missed; belonged in checkpoint-120
- [x] The fix lives on a throwaway branch named by the script, a separate agent verified it, and main keeps the defect (5) — “it's on a throwaway branch, and a separate agent verified it, and we left main alone”
- [ ] Cost quoted per agent from the run (roughly 0.7–1.0 ACU each, about 3.5 for the slice) with a projection for the full run (5) — missed; belonged in objection-2

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: I think (×4)
- Coach asked “did you say…?”: never
- Article/plural slips: "some agents had errors at the start" — say how many: "three agents failed"
- Re-record: “So I started by looking at how the API is organised, and there are route files…”; “It didn't cost that much overall, a few ACU, that's the cost, right?”

## Three stems for next time

1. "The verdict is…" — first sentence of the framing, before any method.
1. "Three agents failed; the script…" — name the count and the guard together.
1. "Per agent that was…" — read two ACU figures off the run before answering any cost question.

## Compared with your previous run

First recorded run for dryrun on lab 09; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
