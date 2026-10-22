# Articulation gap report — lab 14 outposts (coach-14-outposts)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T11:10:00Z · timing: markers (±5 s) · transcript: `labs/14-outposts/coaching/dryrun/strong.md`

## Scores — 92/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 29/30 | All seven points with names and numbers; the boundary is stated before the product (anchor: 27–30 = all points, precise). |
| Structure | 23/25 | Every segment holds its skeleton; the update order held (anchor: 22–25 = order held throughout). |
| Customer relevance | 18/20 | Framed around the CISO's condition and her Friday deadline (anchor: 17–20 = customer outcome first). |
| Brevity and fluency | 13/15 | Every segment within ±5 s; one filler in 9.9 minutes, no long pauses (anchor: 13–15 = on target, fluent). |
| Recovery | 9/10 | All three objections follow acknowledge → boundary → evidence → offer (anchor: 9–10 = pattern held every time). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing for the CISO | 60 s | 58 s | -2 s | on |
| Think-aloud checkpoint (T+15) | 45 s | 44 s | -1 s | on |
| Think-aloud checkpoint (T+60) | 45 s | 46 s | +1 s | on |
| Three-minute update to the CISO | 180 s | 178 s | -2 s | on |
| Objection 1 (data boundary) — “The control plane still sees our code, so what did we actually gain?” | 90 s | 88 s | -2 s | on |
| Objection 2 (availability) — “What happens when the worker is down at 2 a.m.?” | 90 s | 86 s | -4 s | on |
| Objection 3 (ownership) — “Who patches the worker image?” | 90 s | 90 s | +0 s | on |

## Structure (problem → approach → evidence → next step)

- **Problem** — present: “Execution moves into our VPC; inference does not.”
- **Approach** — present: “a worker image we build and own, two workers on it”
- **Evidence** — present: “the smoke test exits zero”
- **Next step** — present: “Next action: create the Outpost with an admin.”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: yes

## Fillers and pauses

- Fillers: 1 in 9.8 spoken min (0.1/min) — actually ×1
- Tag questions: 0
- Pauses over 8 s: none

## Missing key points

- [x] Commands, file edits and repo access run on Harbourline's worker in the VPC while inference and planning stay in Devin Cloud (6) — “every command, file edit and repo checkout runs on a Harbourline worker inside the VPC … Devin Cloud keeps planning and inference”
- [x] Worker started with devin worker start plus the outpost name and its token, the token shown once and kept in the secret manager (5) — “devin worker start, the outpost name harbourline-vpc and its token; the token is shown once, so it went straight into the secret manager”
- [x] One session per worker so two containers serve two sessions and the third waits under a banner rather than failing (5) — “one session per worker, so our two containers ran S1 and S2 and S3 waited under the banner”
- [x] Engineers reach the outpost through the organization default platform and the Slack bang command (4) — “type bang outpost in Slack, or do nothing once an admin makes it the organization default platform”
- [x] Image bakes in the repo with git, ffmpeg and Chrome via DEVIN_CHROME_PATH and grants no passwordless sudo (4) — “bakes in the repo with git, ffmpeg and Chrome through DEVIN_CHROME_PATH … grants no passwordless sudo”
- [x] Platform engineering rebuilds the image on a schedule and rolls one worker at a time (3) — “rebuild from the stable base every week … roll one worker at a time”
- [x] Which steps ran live and which only ran on the offline queue model (3) — “the image build ran here; worker registration, Slack and the default platform only ran on the offline queue model”

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: none
- Coach asked “did you say…?”: never
- Article/plural slips: none

## Three stems for next time

1. "Execution moves; inference does not." — keep leading with the boundary.
1. "I saw this run live: … I rehearsed this offline: …" — you did this; keep it in every update.
1. "Two workers, two sessions; the third waits, it does not fail." — say the capacity number before the risk.

## Compared with your previous run

First recorded run for dryrun on lab 14; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
