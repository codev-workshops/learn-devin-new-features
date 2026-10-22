# Articulation gap report — lab 14 outposts (coach-14-outposts)

Learner: **calibration** · mode: dry-run · run 1 · 2026-10-22T11:30:00Z · timing: markers (±5 s) · transcript: `labs/coach-dryrun/fixtures/generic-mediocre.md`

## Scores — 33/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 4/30 | None of the 7 must-mention points is stated; nothing is contradicted, the answer is simply content-free (anchor: 0–8 = one point or fewer). |
| Structure | 12/25 | Problem, approach, evidence and next step are all findable but thin; the update has no risk and no ask (anchor: 14–17 = parts findable, order broken). |
| Customer relevance | 8/20 | Impact appears once ("some users were affected", "maybe a few customers") with no number, asked for and not given (anchor: 10–13 = outcome present but buried; 5–8 = misleading). |
| Brevity and fluency | 6/15 | 6 of 7 segments off target, 6 fillers (0.67/min), one 12 s pause, one tag question (anchor: 7–9 = several off (six of seven here)). |
| Recovery | 3/10 | Objection 1 acknowledged ("fair question") with no boundary or evidence; objection 2 deflected to "next month"; objection 3 conceded (anchor: 5–6 = partly; 0–2 = not used). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing for the CISO | 60 s | 72 s | +12 s | over |
| Think-aloud checkpoint (T+15) | 45 s | 57 s | +12 s | over |
| Think-aloud checkpoint (T+60) | 45 s | 45 s | +0 s | on |
| Three-minute update to the CISO | 180 s | 150 s | -30 s | under |
| Objection 1 (data boundary) — “The control plane still sees our code, so what did we actually gain?” | 90 s | 51 s | -39 s | under |
| Objection 2 (availability) — “What happens when the worker is down at 2 a.m.?” | 90 s | 47 s | -43 s | under |
| Objection 3 (ownership) — “Who patches the worker image?” | 90 s | 37 s | -53 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “there was a problem in the system and I looked into it with Devin”
- **Approach** — present: “I used Devin to investigate, it found the cause, and then we made a change and tested it”
- **Evidence** — weak: “The error went away after the change, so that told me it was the right thing”
- **Next step** — weak: “Next step is to monitor it”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 6 in 8.9 spoken min (0.67/min) — basically ×2, actually ×1, um ×1, you know ×1, so yeah ×1
- Tag questions: 1 (“Then I will ask Devin to explain what it found and see if it makes sense, right?”)
- Pauses over 8 s: 12 s at [02:10] in checkpoint-15

## Missing key points

- [ ] Commands, file edits and repo access run on Kadé's worker in the VPC while inference and planning stay in Devin Cloud (6) — missed; belonged in framing
- [ ] Worker started with devin worker start plus the outpost name and its token, the token shown once and kept in the secret manager (5) — missed; belonged in checkpoint-15
- [ ] One session per worker so two containers serve two sessions and the third waits under a banner rather than failing (5) — missed; belonged in checkpoint-60
- [ ] Engineers reach the outpost through the organization default platform and the Slack bang command (4) — missed; belonged in update
- [ ] Image bakes in the repo with git, ffmpeg and Chrome via DEVIN_CHROME_PATH and grants no passwordless sudo (4) — missed; belonged in update
- [ ] Platform engineering rebuilds the image on a schedule and rolls one worker at a time (3) — missed; belonged in objection-3
- [ ] Which steps ran live and which only ran on the offline queue model (3) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: "I think" (×2 in the framing)
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “So, basically, there was a problem in the system and I looked into it with Devin.”

## Three stems for next time

1. Lead with the missing top point: "Commands — and the evidence is …"
1. "The customers affected were …, and the number is …"
1. "That's a fair concern; the boundary is …, the evidence is …, and what I can offer is …"

## Compared with your previous run

Calibration run of the generic transcript (labs/coach-dryrun/fixtures/generic-mediocre.md); no previous run.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
