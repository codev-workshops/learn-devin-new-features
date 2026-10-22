# Articulation gap report — lab 14 outposts (coach-14-outposts)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T11:10:00Z · timing: markers (±5 s) · transcript: `labs/14-outposts/coaching/dryrun/mediocre.md`

## Scores — 64/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 22/30 | Boundary, worker start and token, queueing, routing and image contents stated; no patching owner and no live-versus-rehearsed statement (anchor: 17–22 = five of seven points). |
| Structure | 16/25 | Update has Outcome, Risk and Ask but no Evidence or Next action; framing leads with the product (anchor: 14–17 = parts findable, order broken). |
| Customer relevance | 12/20 | The CISO's condition appears only in the second sentence; the Friday deliverable is vague (anchor: 10–13 = outcome present but buried). |
| Brevity and fluency | 8/15 | Framing and T+60 over, update and two objections under; six fillers in 9.1 minutes, one tag question, one 11-second pause (anchor: 7–9 = several segments off target). |
| Recovery | 6/10 | Objection 2 held the pattern; objections 1 and 3 conceded without evidence or an offer (anchor: 5–6 = pattern partly held). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing for the CISO | 60 s | 74 s | +14 s | over |
| Think-aloud checkpoint (T+15) | 45 s | 43 s | -2 s | on |
| Think-aloud checkpoint (T+60) | 45 s | 58 s | +13 s | over |
| Three-minute update to the CISO | 180 s | 150 s | -30 s | under |
| Objection 1 (data boundary) — “The control plane still sees our code, so what did we actually gain?” | 90 s | 70 s | -20 s | under |
| Objection 2 (availability) — “What happens when the worker is down at 2 a.m.?” | 90 s | 88 s | -2 s | on |
| Objection 3 (ownership) — “Who patches the worker image?” | 90 s | 62 s | -28 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “So, Outposts is a Devin feature for self-hosting”
- **Approach** — present: “the commands and the repo checkout happen on our worker in the VPC”
- **Evidence** — weak: “basically the image works”
- **Next step** — present: “Ask: can we get an admin to create the Outpost?”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 6 in 9.1 spoken min (0.66/min) — actually ×2, basically ×2, so yeah ×1, you know ×1
- Tag questions: 1 (“The third one waits, right?”)
- Pauses over 8 s: 11 s at [02:41] in checkpoint-60

## Missing key points

- [x] Commands, file edits and repo access run on Kadé's worker in the VPC while inference and planning stay in Devin Cloud (6) — “the commands and the repo checkout happen on our worker in the VPC, and Devin Cloud still does the inference”
- [x] Worker started with devin worker start plus the outpost name and its token, the token shown once and kept in the secret manager (5) — “devin worker start with the outpost name and the token … only shown once, so I actually saved it in the secret manager”
- [x] One session per worker so two containers serve two sessions and the third waits under a banner rather than failing (5) — “each worker takes one session, so with two containers the third session waits with a banner”
- [x] Engineers reach the outpost through the organization default platform and the Slack bang command (4) — “Slack with bang outpost, or the admin sets the organization default platform”
- [x] Image bakes in the repo with git, ffmpeg and Chrome via DEVIN_CHROME_PATH and grants no passwordless sudo (4) — “it has the repo, git, ffmpeg and Chrome with DEVIN_CHROME_PATH, and no passwordless sudo”
- [ ] Platform engineering rebuilds the image on a schedule and rolls one worker at a time (3) — missed; belonged in objection-3
- [ ] Which steps ran live and which only ran on the offline queue model (3) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: none
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “So, Outposts is a Devin feature for self-hosting, and we set it up this week with Docker.”

## Three stems for next time

1. "Execution moves; inference does not." — lead with the boundary, not the product name.
1. "Platform engineering owns the image: rebuild, smoke test, roll one at a time." — answer the ownership objection with a name and a cadence.
1. "I saw this run live: … I rehearsed this offline: …" — say which path you ran.

## Compared with your previous run

First recorded run for dryrun on lab 14; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
