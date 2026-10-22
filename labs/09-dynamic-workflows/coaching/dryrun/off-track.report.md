# Articulation gap report — lab 09 dynamic-workflows (coach-09-dynamic-workflows)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:00:00Z · timing: markers (±5 s) · transcript: `labs/09-dynamic-workflows/coaching/dryrun/off-track.md`

## Scores — 22/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 6/30 | Only the leak itself was named; no coverage, failure handling, verification or cost (anchors: 27–30 every point with a number; 15–20 three of five; under 10 one point). |
| Structure | 6/25 | Feature tour instead of a verdict; no evidence or next step (anchors: 22–25 all parts in order; 13–17 parts present but weak; under 8 problem only). |
| Customer relevance | 5/20 | No endpoint count, ignored the freeze, no cost (anchors: 16–20 auditor's numbers and constraints used; 10–13 some numbers; under 6 feature talk). |
| Brevity and fluency | 3/15 | Five of six segments off target; ten fillers, two tag questions, two long pauses (anchors: 11–15 segments on target, under 1 filler/min; 6–8 two or more segments off; under 4 most segments off). |
| Recovery | 2/10 | Neither objection acknowledged or bounded; the commercial answer had no numbers (anchors: 7–10 acknowledge → boundary → evidence → offer held with numbers; 4–6 partial; under 3 no pattern). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 100 s | +40 s | over |
| Think-aloud checkpoint (T+20) | 45 s | 25 s | -20 s | under |
| Think-aloud checkpoint (T+120) | 45 s | 65 s | +20 s | over |
| Three-minute auditor update | 180 s | 60 s | -120 s | under |
| Objection 1 (technical) — “How do I know an agent didn't skip endpoints and call it clean?” | 90 s | 35 s | -55 s | under |
| Objection 2 (commercial) — “Why pay for a fan-out of agents when one engineer could read 22 endpoints in an afternoon?” | 90 s | 30 s | -60 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — missing
- **Approach** — weak: “dynamic workflows are basically a Python script that starts other Devin sessions”
- **Evidence** — missing
- **Next step** — missing
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 10 in 5.2 spoken min (1.92/min) — actually ×2, basically ×2, you know ×2, like ×1, um ×3
- Tag questions: 2 (“Basically I think it's a really powerful feature for this kind of thing, no?”, “Actually I trust them, right?”)
- Pauses over 8 s: 15 s at [02:40] in checkpoint-120; 14 s at [05:30] in objection-1

## Missing key points

- [ ] Every endpoint covered: the count comes from the code (22 in 7 route files) and a small slice ran first (8) — missed; belonged in framing
- [x] The confirmed leak: the single-order read filters on id alone, so staff of one brand can read the other brand's order (6) — “only filters on the id, so another brand's staff can see it”
- [ ] A failed or invalid agent was caught in code with a bounded retry, and resuming the same run ID replayed finished agents (6) — missed; belonged in checkpoint-120
- [ ] The fix lives on a throwaway branch named by the script, a separate agent verified it, and main keeps the defect (5) — missed; belonged in update
- [ ] Cost quoted per agent from the run (roughly 0.7–1.0 ACU each, about 3.5 for the slice) with a projection for the full run (5) — missed; belonged in objection-2

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: basically (×2), um (×3)
- Coach asked “did you say…?”: never
- Article/plural slips: "I fixed it directly so it's done" — a fix on main breaks the freeze; say where it lives
- Re-record: “Um, so dynamic workflows are basically a Python script…”; “I fixed it directly so it's done.”

## Three stems for next time

1. "You get…" — open with what the auditor receives.
1. "The run noticed because…" — read the log before saying nothing went wrong.
1. "Per agent, the run cost…" — bring numbers to every cost question.

## Compared with your previous run

First recorded run for dryrun on lab 09; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
