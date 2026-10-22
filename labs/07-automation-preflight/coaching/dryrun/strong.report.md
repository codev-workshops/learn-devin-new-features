# Articulation gap report — lab 07 automation-preflight (coach-07-automation-preflight)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:00:00Z · timing: markers (±5 s) · transcript: `labs/07-automation-preflight/coaching/dryrun/strong.md`

## Scores — 90/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 28/30 | All seven points stated with their numbers and ids; mm7 was brief (anchor: 26–30 = every point, one thin). |
| Structure | 22/25 | Outcome → Evidence → Risk → Next action → Ask held in the update; both checkpoints used the four verbs (anchor: 21–25 = order held throughout). |
| Customer relevance | 18/20 | Before/after numbers in the first sentence; the cost question answered in sessions, not tooling words (anchor: 17–20 = numbers first, change absorbed). |
| Brevity and fluency | 13/15 | Every segment within ±5 s; one filler in 8.4 minutes, no long pauses (anchor: 13–15 = all on target, fillers under 0.5/min). |
| Recovery | 9/10 | Both objections acknowledged, bounded, evidenced and closed with an offer (anchor: 9–10 = pattern held twice). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 58 s | -2 s | on |
| Think-aloud checkpoint (T+15) | 45 s | 44 s | -1 s | on |
| Think-aloud checkpoint (T+75) | 45 s | 46 s | +1 s | on |
| Update to the payments lead | 180 s | 176 s | -4 s | on |
| Objection 1 (technical) | 90 s | 88 s | -2 s | on |
| Objection 2 (commercial) | 90 s | 91 s | +1 s | on |

## Structure (problem → approach → evidence → next step)

- **Problem** — present: “Today, eleven PayGate notifications from one morning started eleven Devin sessions”
- **Approach** — present: “I am adding a Preflight check that skips retries, recoveries and noise before Devin starts”
- **Evidence** — present: “the replay prints events 11, sessions 3, skipped 8, failed 0”
- **Next step** — present: “Ask: can I turn on queueing with three concurrent runs?”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: yes

## Fillers and pauses

- Fillers: 1 in 8.4 spoken min (0.12/min) — actually ×1
- Tag questions: 0
- Pauses over 8 s: none

## Missing key points

- [x] Outcome in numbers: 11 PayGate notifications in, 3 investigations out (evt_lab07_a twice, evt_lab07_c once) (6) — “After this change they start three: evt_lab07_a twice, once for the morning and once for the next-day replay, and evt_lab07_c once”
- [x] A Preflight script instead of the LLM filter, because deduplication needs memory across events (5) — “I'll try a Preflight script, because deduplication needs memory across events”
- [x] STATE_FILE plus item id paygate:event_id with version = replay_seq, so a manual replay counts as a new occurrence (5) — “emits an item with id paygate colon event id and version equal to replay_seq”
- [x] Transient retries and recoveries are skipped; the final attempt or a non-retryable signature failure goes through (4) — “transient retries that are not the last attempt are skipped, and so are recoveries”
- [x] Timeout set within 1–300 s; a timeout, non-zero exit or invalid output stops the event with no automatic retry (4) — “the event stops before any action and there is no automatic retry. I set the timeout to 30 seconds, inside the 1 to 300 allowed”
- [x] Run now bypasses Preflight, so it does not test the filter (3) — “Run now bypasses Preflight, so clicking it does not test the filter”
- [x] Which parts ran live and which ran on the offline fixture replay (3) — “everything today ran on the offline fixture replay; no live Automation received a notification”

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: "replay_seq" may be transcribed as "replay seek", "evt_lab07_a" may be transcribed as "event lab oh seven A"
- Repeated words: none
- Coach asked “did you say…?”: never
- Article/plural slips: none

## Three stems for next time

1. "Eleven notifications in, three investigations out." — you led with it; keep it as the first five words next time too.
1. "Same event id and replay number means same investigation." — say it as one rule before you name STATE_FILE.
1. "Integrations: live were … ; fixtures were …" — give the fixture/live line its own sentence, not a tail.

## Compared with your previous run

First recorded run for dryrun on lab 07; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
