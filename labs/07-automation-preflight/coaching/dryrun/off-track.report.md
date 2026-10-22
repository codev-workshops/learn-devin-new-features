# Articulation gap report — lab 07 automation-preflight (coach-07-automation-preflight)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:00:00Z · timing: markers (±5 s) · transcript: `labs/07-automation-preflight/coaching/dryrun/off-track.md`

## Scores — 32/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 10/30 | Two of seven points (mm1 hedged, mm4); the dedupe mechanism was wrong and no risks were stated (anchor: 6–11 = two or three points). |
| Structure | 8/25 | The framing was a feature tour; the update had no evidence and no ask (anchor: 6–10 = order lost). |
| Customer relevance | 7/20 | The numbers came last and were hedged; nothing for finance (anchor: 5–8 = the customer has to dig). |
| Brevity and fluency | 4/15 | Every segment off target, the objections 60 s short; nine fillers and two long pauses (anchor: 3–5 = most segments off, fillers over 1/min). |
| Recovery | 3/10 | Both objections dismissed without acknowledgement, evidence or offer (anchor: 0–4 = pattern absent). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 88 s | +28 s | over |
| Think-aloud checkpoint (T+15) | 45 s | 26 s | -19 s | under |
| Think-aloud checkpoint (T+75) | 45 s | 22 s | -23 s | under |
| Update to the payments lead | 180 s | 80 s | -100 s | under |
| Objection 1 (technical) | 90 s | 30 s | -60 s | under |
| Objection 2 (commercial) | 90 s | 28 s | -62 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “We had too many sessions, so basically I added a filter”
- **Approach** — weak: “I am writing the filter prompt”
- **Evidence** — missing
- **Next step** — weak: “Next I will turn it on”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 9 in 4.6 spoken min (1.96/min) — actually ×3, basically ×3, you know ×2, um ×1
- Tag questions: 1 (“so it works, no?”)
- Pauses over 8 s: 12 s at [01:48] in checkpoint-15; 14 s at [03:10] in update

## Missing key points

- [x] Outcome in numbers: 11 PayGate notifications in, 3 investigations out (evt_lab07_a twice, evt_lab07_c once) (6) — “It goes from eleven to three, I think, so evt_lab07_a twice and evt_lab07_c once”
- [ ] A Preflight script instead of the LLM filter, because deduplication needs memory across events (5) — missed; belonged in checkpoint-15
- [ ] STATE_FILE plus item id paygate:event_id with version = replay_seq, so a manual replay counts as a new occurrence (5) — missed; belonged in checkpoint-75
- [x] Transient retries and recoveries are skipped; the final attempt or a non-retryable signature failure goes through (4) — “Retries before the last attempt and recoveries are skipped, and signature failures go through”
- [ ] Timeout set within 1–300 s; a timeout, non-zero exit or invalid output stops the event with no automatic retry (4) — missed; belonged in update
- [ ] Run now bypasses Preflight, so it does not test the filter (3) — missed; belonged in update
- [ ] Which parts ran live and which ran on the offline fixture replay (3) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: "and" chained five times in the framing
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “I actually tested it with Run now and it started sessions, so it works, no?”

## Three stems for next time

1. "Today, … notifications turn into … sessions. After this change, …" — open with the outcome, not a list of Automation parts.
1. "Same event id and replay number means same investigation." — a rule the script enforces, not something a filter "thinks".
1. "I acknowledge … The boundary is … The evidence is … I can offer …" — use all four parts in each objection.

## Compared with your previous run

First recorded run for dryrun on lab 07; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
