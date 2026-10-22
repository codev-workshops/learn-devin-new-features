# Articulation gap report — lab 03 customization-scopes (coach-03-customization-scopes)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:30:00Z · timing: markers (±5 s) · transcript: `labs/03-customization-scopes/coaching/dryrun/mediocre.md`

## Scores — 57/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 18/30 | Additive layers, the local file and the CODEOWNERS split right; the dead glob and global versus repo skills never stated (anchor: 17–21 = right conclusion, shaky mechanism). |
| Structure | 15/25 | All parts findable but the framing front-loaded three "because" clauses and the evidence was a hope, not an observation (anchor: 14–17 = order broken once). |
| Customer relevance | 11/20 | Neither lead's loss quantified; the VAT-owner interruption produced a hedge (anchor: 10–13 = impact mentioned once, hedged). |
| Brevity and fluency | 8/15 | Framing, update, checkpoint 10 and objection 2 over target, objection 1 and checkpoint 45 under; six fillers, one tag question, one 12-second pause (anchor: 7–9 = several segments off target). |
| Recovery | 5/10 | Objections answered without evidence; the follow-up on private overrides was deferred (anchor: 5–6 = answers but defensively). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 74 s | +14 s | over |
| Think-aloud checkpoint (T+10) | 45 s | 52 s | +7 s | over |
| Think-aloud checkpoint (T+45) | 45 s | 39 s | -6 s | under |
| 3-minute update to both team leads | 180 s | 201 s | +21 s | over |
| Objection 1 (technical) — “Platform's checklist will override Trailhead's VAT rule.” | 90 s | 58 s | -32 s | under |
| Objection 2 (commercial, one follow-up allowed) — “Governance by markdown — who audits it?” | 90 s | 102 s | +12 s | over |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “So, because the staging basket was wrong, and because both teams review checkout”
- **Approach** — present: “The checklist goes in .devin/rules and the Trailhead VAT goes in its own rule”
- **Evidence** — weak: “You will know it works when Devin follows it.”
- **Next step** — present: “Ask: can you both review it this week?”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: yes

## Fillers and pauses

- Fillers: 6 in 8.8 spoken min (0.68/min) — actually ×2, basically ×2, so yeah ×1, you know ×1
- Tag questions: 1 (“That's the plan, right?”)
- Pauses over 8 s: 12 s at [10:20] in checkpoint-10

## Missing key points

- [x] Layers add up rather than override so the shared checklist defers on tax and the Trailhead rule owns it (7) — “all the layers are loaded together, so the checklist defers on tax.”
- [ ] A glob rule loads only when a matching path is touched and the misspelt globs meant the VAT rule never loaded (6) — missed; belonged in checkpoint-45
- [x] AGENTS.local.md is git-ignored and only changes the sessions of the person whose checkout it sits in (5) — “The local file is git-ignored, so it only changes the sessions of the person who has it.”
- [ ] A global skill follows one person across projects while the repo skill is shared and reviewed in pull requests (5) — missed; belonged in update
- [x] CODEOWNERS splits the repo layers between Platform and Trailhead while org and enterprise scopes need settings access (7) — “CODEOWNERS gives Platform the checklist and Trailhead the VAT file, and org settings need admin access.”

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: because (×3 in the opening sentence)
- Coach asked “did you say…?”: never
- Article/plural slips: "the skill one" — "the skill injector"
- Re-record: “So, because the staging basket was wrong, and because both teams review checkout…”

## Three stems for next time

1. "The VAT rule was dead because its globs… and the resolver showed…" — explain what the injector taught you.
1. "A global skill is yours; the repo skill is ours, so…" — name the collision and the fix.
1. "Dana, the 19% overcharge cost two days; this stops it by…" — put the customer's number first.

## Compared with your previous run

First recorded run for dryrun on lab 03; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
