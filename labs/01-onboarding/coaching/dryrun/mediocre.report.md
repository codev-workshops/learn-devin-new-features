# Articulation gap report — lab 01 onboarding (coach-01-onboarding)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:20:00Z · timing: markers (±5 s) · transcript: `labs/01-onboarding/coaching/dryrun/mediocre.md`

## Scores — 61/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 20/30 | Blueprint vs instructions, the Skills migration, the reset and the stale path stated; no inclusion limit and no Ask-vs-Agent choice (anchor: 17–21 = four of six points). |
| Structure | 15/25 | All parts findable but the framing walks through setup steps before the outcome (anchor: 14–17 = all parts findable, order broken once). |
| Customer relevance | 12/20 | The week of lost time is there but late; the update never says what Monday's starter will do differently (anchor: 10–13 = one outcome, buried). |
| Brevity and fluency | 8/15 | Framing over target, update and objection 1 under; six fillers in 8.0 minutes, one tag question, one 12-second pause (anchor: 7–9 = several segments off target, fillers under 1/min). |
| Recovery | 6/10 | Objection 2 held the pattern; objection 1 conceded and skipped the evidence (anchor: 5–6 = pattern partly held). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing for a non-engineer | 60 s | 74 s | +14 s | over |
| Think-aloud checkpoint (T+10) | 45 s | 42 s | -3 s | on |
| Think-aloud checkpoint (T+40) | 45 s | 50 s | +5 s | on |
| 3-minute update to the hiring manager | 180 s | 155 s | -25 s | under |
| Objection 1 (technical) | 90 s | 68 s | -22 s | under |
| Objection 2 (commercial) | 90 s | 93 s | +3 s | on |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “So, first you install Node, then npm install, then the Python worker”
- **Approach** — present: “Devin will set up the blueprint, which is the machine setup”
- **Evidence** — weak: “the gates are green on a fresh machine”
- **Next step** — present: “Ask: please tell Jonas to delete his note.”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: yes

## Fillers and pauses

- Fillers: 6 in 8 spoken min (0.75/min) — actually ×2, basically ×2, so yeah ×1, you know ×1
- Tag questions: 1 (“Then I check the old setup page, it is the same problem, no? Done.”)
- Pauses over 8 s: 12 s at [02:33] in checkpoint-40

## Missing key points

- [ ] Only the first 16 KiB of each AGENTS.md is injected automatically; the cap is per file, so keep files short and front-loaded (6) — missed; belonged in checkpoint-40
- [x] The blueprint prepares the machine (initialize, maintenance, knowledge); AGENTS.md tells Devin how to work in the repo (6) — “the blueprint, which is the machine setup, and AGENTS.md is the instructions it reads”
- [x] Knowledge notes are migrating to Skills; repeated setup guidance becomes a skill rather than more AGENTS.md text (5) — “Our Knowledge notes are moving to Skills, so the setup steps are in the kade-dev skill”
- [ ] Ask Devin for read-only questions about the code, an Agent session for work that has to run, with a reason (4) — missed; belonged in update
- [x] `lab:reset` is the one supported reset and only reseeds the local lab database, so nobody wipes the shared one (5) — “The reset is lab:reset now, it only touches the local database”
- [x] The stale blueprint path (payroll-worker instead of fulfilment-worker) broke the snapshot build, and the fix was proven (4) — “the blueprint says payroll-worker but the folder is fulfilment-worker, so the build broke”

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: then (×4 in the opening sentence)
- Coach asked “did you say…?”: never
- Article/plural slips: "the AGENTS.md is the instructions" — "AGENTS.md holds the instructions"
- Re-record: “So, first you install Node, then npm install, then the Python worker…”; “I can fix the README too.”

## Three stems for next time

1. "Today a new engineer loses their first week to … On Monday …" — outcome before the steps.
1. "Only the start of each instruction file is read automatically, so…" — name the limit with its number.
1. "I asked Devin … for that, and started an Agent session for … because…"

## Compared with your previous run

First recorded run for dryrun on lab 01; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
