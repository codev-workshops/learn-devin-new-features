# Articulation gap report — lab 07 automation-preflight (coach-07-automation-preflight)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:00:00Z · timing: markers (±5 s) · transcript: `labs/07-automation-preflight/coaching/dryrun/mediocre.md`

## Scores — 62/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 20/30 | Five of seven points; failure behaviour and timeout (mm5) and the live/fixture line (mm7) missing (anchor: 16–21 = most points, two missing). |
| Structure | 15/25 | Outcome came after the backstory in the framing; the update had no Risk heading (anchor: 13–17 = order partly held). |
| Customer relevance | 13/20 | The 11 → 3 numbers were there but arrived late; the cost answer had no figure (anchor: 12–15 = numbers present, buried). |
| Brevity and fluency | 8/15 | Checkpoint-15 and both objections under target, the update 33 s short; five fillers, one tag question and an 11 s pause (anchor: 7–9 = several segments off, fillers 0.5–1/min). |
| Recovery | 6/10 | Objection 1 skipped the acknowledgement; objection 2 acknowledged but offered no number (anchor: 5–7 = pattern held once). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 62 s | +2 s | on |
| Think-aloud checkpoint (T+15) | 45 s | 36 s | -9 s | under |
| Think-aloud checkpoint (T+75) | 45 s | 40 s | -5 s | on |
| Update to the payments lead | 180 s | 147 s | -33 s | under |
| Objection 1 (technical) | 90 s | 40 s | -50 s | under |
| Objection 2 (commercial) | 90 s | 70 s | -20 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “So the Automation was set up last week with a webhook trigger, and every notification from PayGate started a session”
- **Approach** — present: “I am putting a Preflight check in front of it”
- **Evidence** — weak: “I ran the replay twice and the second time it opened nothing”
- **Next step** — present: “Ask: is three investigations the right number for you?”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 5 in 6.6 spoken min (0.76/min) — actually ×2, basically ×2, you know ×1
- Tag questions: 1 (“so the next-day replay is a new occurrence, right?”)
- Pauses over 8 s: 11 s at [02:21] in checkpoint-75

## Missing key points

- [x] Outcome in numbers: 11 PayGate notifications in, 3 investigations out (evt_lab07_a twice, evt_lab07_c once) (6) — “eleven notifications become three investigations: evt_lab07_a twice and evt_lab07_c once”
- [x] A Preflight script instead of the LLM filter, because deduplication needs memory across events (5) — “a script is better than the LLM filter here, because the filter has no memory of earlier events and deduplication needs that”
- [x] STATE_FILE plus item id paygate:event_id with version = replay_seq, so a manual replay counts as a new occurrence (5) — “The item id is paygate plus the event id, and the version is the replay number”
- [x] Transient retries and recoveries are skipped; the final attempt or a non-retryable signature failure goes through (4) — “skips retries until the last attempt and skips recoveries, and a signature failure goes straight through”
- [ ] Timeout set within 1–300 s; a timeout, non-zero exit or invalid output stops the event with no automatic retry (4) — missed; belonged in update
- [x] Run now bypasses Preflight, so it does not test the filter (3) — “Run now bypasses Preflight, so it is actually not a test of the filter”
- [ ] Which parts ran live and which ran on the offline fixture replay (3) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: "and then" / "and" chained four times in the framing
- Coach asked “did you say…?”: never
- Article/plural slips: "the next-day replay is a new occurrence" — fine; "a STATE_FILE" earlier would be "the state file"
- Re-record: “So the Automation was set up last week with a webhook trigger, and every notification from PayGate started a session…”

## Three stems for next time

1. "Eleven notifications in, three investigations out." — move it from the third sentence of the framing to the first.
1. "If the script breaks, the event fails loudly; it is never a silent skip." — your update had no risk sentence; this is it.
1. "I acknowledge … The boundary is … The evidence is … I can offer …" — objection 1 opened with "No".

## Compared with your previous run

First recorded run for dryrun on lab 07; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
