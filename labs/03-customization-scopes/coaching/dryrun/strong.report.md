# Articulation gap report — lab 03 customization-scopes (coach-03-customization-scopes)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:30:00Z · timing: markers (±5 s) · transcript: `labs/03-customization-scopes/coaching/dryrun/strong.md`

## Scores — 91/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 28/30 | All five points stated with the resolver as proof; the hierarchy explained as additive, not as a winner (anchor: 26–30 = mechanism and evidence both right). |
| Structure | 23/25 | Outcome → Evidence → Risk → Next action → Ask held in the update; each lead addressed by name (anchor: 22–25 = skeleton intact). |
| Customer relevance | 17/20 | The 19% overcharge is implied, not quantified; Jonas's six edit requests never mentioned (anchor: 15–17 = both conditions answered, one number missing). |
| Brevity and fluency | 14/15 | Every segment within ±5 s; one filler, no tag questions, no long pauses (anchor: 13–15 = on target, fluent). |
| Recovery | 9/10 | Both objections answered acknowledge → boundary → evidence → offer; objection 2 offered CI and enforcement (anchor: 9–10 = calm and evidenced). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 61 s | +1 s | on |
| Think-aloud checkpoint (T+10) | 45 s | 46 s | +1 s | on |
| Think-aloud checkpoint (T+45) | 45 s | 44 s | -1 s | on |
| 3-minute update to both team leads | 180 s | 182 s | +2 s | on |
| Objection 1 (technical) — “Platform's checklist will override Trailhead's VAT rule.” | 90 s | 89 s | -1 s | on |
| Objection 2 (commercial, one follow-up allowed) — “Governance by markdown — who audits it?” | 90 s | 91 s | +1 s | on |

## Structure (problem → approach → evidence → next step)

- **Problem** — present: “You get one checklist for both brands, and Trailhead keeps the last word on VAT.”
- **Approach** — present: “The checklist is a Platform rule, the VAT rule is a Trailhead rule, and CODEOWNERS gives each team its own file.”
- **Evidence** — present: “for money.ts the resolver loads six files and reports zero unresolved conflicts”
- **Next step** — present: “Ask: approve the two CODEOWNERS lines this week.”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: yes

## Fillers and pauses

- Fillers: 1 in 8.6 spoken min (0.12/min) — um ×1
- Tag questions: 0
- Pauses over 8 s: none

## Missing key points

- [x] Layers add up rather than override so the shared checklist defers on tax and the Trailhead rule owns it (7) — “every layer that applies is in context at the same time. So the shared checklist never states tax: it defers to the brand's own rule file, and the Trailhead rule owns tax presentation and rounding.”
- [x] A glob rule loads only when a matching path is touched and the misspelt globs meant the VAT rule never loaded (6) — “a glob rule loads only when a file it matches is touched, and the misspelt globs meant the VAT rule never loaded at all”
- [x] AGENTS.local.md is git-ignored and only changes the sessions of the person whose checkout it sits in (5) — “AGENTS.local.md is git-ignored: git status stays silent, and it only changes the sessions of the person whose checkout it sits in.”
- [x] A global skill follows one person across projects while the repo skill is shared and reviewed in pull requests (5) — “A global skill follows one person across projects; the repo skill is shared and reviewed in pull requests, so I renamed the personal one.”
- [x] CODEOWNERS splits the repo layers between Platform and Trailhead while org and enterprise scopes need settings access (7) — “CODEOWNERS sends the checklist to Platform and the VAT rule to Trailhead; org and enterprise scopes need settings access”

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: none
- Coach asked “did you say…?”: never
- Article/plural slips: none

## Three stems for next time

1. "You spent two days unpicking a 19% overcharge; this layout stops…" — open with Dana's number.
1. "Jonas, your team changes VAT without us because…" — say the six requests out loud.
1. "The resolver shows zero unresolved conflicts for money.ts, and CI will…" — keep the proof in one sentence.

## Compared with your previous run

First recorded run for dryrun on lab 03; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
