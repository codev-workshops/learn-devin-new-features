# Articulation gap report — lab 14 outposts (coach-14-outposts)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T11:10:00Z · timing: markers (±5 s) · transcript: `labs/14-outposts/coaching/dryrun/off-track.md`

## Scores — 28/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 9/30 | Only the boundary and the routing stated, and the boundary is then contradicted (anchor: 6–10 = two of seven points, one wrong claim). |
| Structure | 8/25 | No skeleton in the update; no evidence and no next action anywhere (anchor: 6–9 = parts missing). |
| Customer relevance | 6/20 | Claims nothing leaves the VPC, the opposite of what the CISO needs to hear (anchor: 5–8 = misleading to the customer). |
| Brevity and fluency | 3/15 | Every segment off target; twelve fillers in 8.6 minutes, one tag question, two long pauses (anchor: 0–4 = far off target, frequent fillers). |
| Recovery | 2/10 | All three objections dismissed or wrong; no acknowledge or offer (anchor: 0–2 = pattern not used). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing for the CISO | 60 s | 95 s | +35 s | over |
| Think-aloud checkpoint (T+15) | 45 s | 30 s | -15 s | under |
| Think-aloud checkpoint (T+60) | 45 s | 70 s | +25 s | over |
| Three-minute update to the CISO | 180 s | 120 s | -60 s | under |
| Objection 1 (data boundary) — “The control plane still sees our code, so what did we actually gain?” | 90 s | 40 s | -50 s | under |
| Objection 2 (availability) — “What happens when the worker is down at 2 a.m.?” | 90 s | 55 s | -35 s | under |
| Objection 3 (ownership) — “Who patches the worker image?” | 90 s | 35 s | -55 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “Outposts is basically like a private Devin”
- **Approach** — weak: “I put the token in the Dockerfile”
- **Evidence** — missing: “mostly fine”
- **Next step** — missing: “it should be fine”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 12 in 7.4 spoken min (1.62/min) — actually ×4, basically ×2, so yeah ×3, you know ×1, like ×1, um ×1
- Tag questions: 1 (“It is all private now, no?”)
- Pauses over 8 s: 14 s at [01:57] in checkpoint-15; 12 s at [04:31] in update

## Missing key points

- [x] Commands, file edits and repo access run on Harbourline's worker in the VPC while inference and planning stay in Devin Cloud (6) — “the worker runs in our VPC, so the code runs there and Devin Cloud only does the thinking”
- [ ] Worker started with devin worker start plus the outpost name and its token, the token shown once and kept in the secret manager (5) — missed; belonged in checkpoint-15
- [ ] One session per worker so two containers serve two sessions and the third waits under a banner rather than failing (5) — missed; belonged in checkpoint-60
- [x] Engineers reach the outpost through the organization default platform and the Slack bang command (4) — “People can use the default platform setting or Slack.”
- [ ] Image bakes in the repo with git, ffmpeg and Chrome via DEVIN_CHROME_PATH and grants no passwordless sudo (4) — missed; belonged in update
- [ ] Platform engineering rebuilds the image on a schedule and rolls one worker at a time (3) — missed; belonged in objection-3
- [ ] Which steps ran live and which only ran on the offline queue model (3) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: so yeah (×3)
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “It is all private now, no? Nothing leaves the VPC.”; “No, it does not see our code any more.”

## Three stems for next time

1. "Execution moves; inference does not." — never say nothing leaves the VPC.
1. "The token is shown once; it lives in the secret manager, never in the image."
1. "Two workers, two sessions; the third waits, it does not fail." — read the queue replay before you report it.

## Compared with your previous run

First recorded run for dryrun on lab 14; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
