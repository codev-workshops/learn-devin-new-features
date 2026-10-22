# Articulation gap report — lab 03 customization-scopes (coach-03-customization-scopes)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:30:00Z · timing: markers (±5 s) · transcript: `labs/03-customization-scopes/coaching/dryrun/off-track.md`

## Scores — 21/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 6/30 | Only additive loading was touched, then contradicted by "lower in the file wins"; globs, the local file, skills and ownership missing (anchor: 0–8 = wrong mechanism). |
| Structure | 6/25 | No problem statement, no evidence, a next step about more experiments (anchor: 0–8 = skeleton absent). |
| Customer relevance | 4/20 | Neither lead's condition answered; Trailhead would still need Platform to edit root AGENTS.md (anchor: 0–5 = customer absent). |
| Brevity and fluency | 3/15 | Framing 35 s over, checkpoint 45 22 s over, everything else short; twelve fillers, two tag questions, two long pauses (anchor: 0–4 = most segments off, disfluent). |
| Recovery | 2/10 | Objection 1 answered with the misconception, objection 2 dismissed (anchor: 0–3 = defensive or wrong). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 95 s | +35 s | over |
| Think-aloud checkpoint (T+10) | 45 s | 17 s | -28 s | under |
| Think-aloud checkpoint (T+45) | 45 s | 67 s | +22 s | over |
| 3-minute update to both team leads | 180 s | 150 s | -30 s | under |
| Objection 1 (technical) — “Platform's checklist will override Trailhead's VAT rule.” | 90 s | 21 s | -69 s | under |
| Objection 2 (commercial, one follow-up allowed) — “Governance by markdown — who audits it?” | 90 s | 14 s | -76 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — missing
- **Approach** — weak: “Um, so basically I will put everything in the root AGENTS.md, the checklist and then a Trailhead section under it.”
- **Evidence** — missing
- **Next step** — weak: “Next I want to try more injectors, you know.”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 12 in 6.1 spoken min (1.97/min) — actually ×3, basically ×2, you know ×2, like ×1, um ×4
- Tag questions: 2 (“The Trailhead part wins because it is further down, actually, and the rule files are in context together so that is fine, right?”, “No, the Trailhead section is lower in the file so it wins, no?”)
- Pauses over 8 s: 15 s at [00:40] in framing; 14 s at [45:15] in checkpoint-45

## Missing key points

- [x] Layers add up rather than override so the shared checklist defers on tax and the Trailhead rule owns it (7) — “the rule files are in context together”
- [ ] A glob rule loads only when a matching path is touched and the misspelt globs meant the VAT rule never loaded (6) — missed; belonged in checkpoint-45
- [ ] AGENTS.local.md is git-ignored and only changes the sessions of the person whose checkout it sits in (5) — missed; belonged in update
- [ ] A global skill follows one person across projects while the repo skill is shared and reviewed in pull requests (5) — missed; belonged in update
- [ ] CODEOWNERS splits the repo layers between Platform and Trailhead while org and enterprise scopes need settings access (7) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: um (×4)
- Coach asked “did you say…?”: never
- Article/plural slips: "the AGENTS.md, the bottom part" — "the bottom of AGENTS.md"
- Re-record: “The Trailhead part wins because it is further down, actually, and the rule files are in context together so that is fine, right?”; “No, the Trailhead section is lower in the file so it wins, no?”

## Three stems for next time

1. "Every layer is in context at once, so the checklist must defer on…" — replace "lower in the file wins".
1. "Trailhead owns its own rule file, so Jonas's team can…" — answer his condition first.
1. "Here is the resolver output for money.ts: …" — bring one piece of evidence to every answer.

## Compared with your previous run

First recorded run for dryrun on lab 03; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
