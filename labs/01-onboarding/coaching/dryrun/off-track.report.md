# Articulation gap report — lab 01 onboarding (coach-01-onboarding)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:40:00Z · timing: markers (±5 s) · transcript: `labs/01-onboarding/coaching/dryrun/off-track.md`

## Scores — 23/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 5/30 | Only the lab reset is stated; blueprint and AGENTS.md described as the same thing (anchor: 0–8 = one point or a wrong claim). |
| Structure | 7/25 | No problem statement and no evidence; the update is a status of what Devin is doing (anchor: 5–9 = parts missing). |
| Customer relevance | 6/20 | No cost, no outcome for Monday's starter, and the gates were not run (anchor: 5–9 = no customer outcome). |
| Brevity and fluency | 3/15 | Four of six segments off target; twelve fillers in 7.4 minutes, three tag questions, two long pauses (anchor: 0–4 = most segments off target, fillers over 1.5/min). |
| Recovery | 2/10 | Both objections conceded with no evidence or next step (anchor: 0–2 = pattern not held). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing for a non-engineer | 60 s | 100 s | +40 s | over |
| Think-aloud checkpoint (T+10) | 45 s | 63 s | +18 s | over |
| Think-aloud checkpoint (T+40) | 45 s | 24 s | -21 s | under |
| 3-minute update to the hiring manager | 180 s | 102 s | -78 s | under |
| Objection 1 (technical) | 90 s | 108 s | +18 s | over |
| Objection 2 (commercial) | 90 s | 48 s | -42 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — missing
- **Approach** — weak: “I asked Devin to fix all the files”
- **Evidence** — missing
- **Next step** — weak: “It should be ready by Monday, yes?”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 12 in 7.4 spoken min (1.62/min) — actually ×1, basically ×2, so yeah ×1, you know ×2, like ×2, um ×4
- Tag questions: 3 (“Uh, I think I will rewrite it with Devin, right?”, “It should be ready by Monday, yes? Done.”, “Maybe not, but it is faster, no?”)
- Pauses over 8 s: 14 s at [02:10] in checkpoint-10; 15 s at [06:20] in objection-1

## Missing key points

- [ ] Only the first 16 KiB of each AGENTS.md is injected automatically; the cap is per file, so keep files short and front-loaded (6) — missed; belonged in checkpoint-40
- [ ] The blueprint prepares the machine (initialize, maintenance, knowledge); AGENTS.md tells Devin how to work in the repo (6) — missed; belonged in framing
- [ ] Knowledge notes are migrating to Skills; repeated setup guidance becomes a skill rather than more AGENTS.md text (5) — missed; belonged in update
- [ ] Ask Devin for read-only questions about the code, an Agent session for work that has to run, with a reason (4) — missed; belonged in update
- [x] `lab:reset` is the one supported reset; it reseeds whatever `DATABASE_URL` names (local Compose by default, no host guard), so the docs keep that URL local (5) — “use lab:reset instead of the reset command, so the shared database is safe”
- [ ] The stale blueprint path (payroll-worker instead of fulfilment-worker) broke the snapshot build, and the fix was proven (4) — missed; belonged in checkpoint-10

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: kind of (×2), config (×2 in one sentence)
- Coach asked “did you say…?”: never
- Article/plural slips: "the AGENTS.md is also config" — "AGENTS.md is"
- Re-record: “Um, so, Devin is like, an AI engineer…”; “The blueprint is sort of the config, and the AGENTS.md is also config, they are kind of the same.”; “Maybe not, but it is faster, no?”

## Three stems for next time

1. "Today a new engineer loses their first week to … On Monday …" — open with the cost.
1. "That lives in the machine setup, not in the instructions, because…" — they are different places.
1. "I ran the gates on a clean machine and they exited zero." — evidence before you say it is ready.

## Compared with your previous run

First recorded run for dryrun on lab 01; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
