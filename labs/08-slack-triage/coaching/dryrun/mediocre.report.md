# Articulation gap report — lab 08 slack-triage (coach-08-slack-triage)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:00:00Z · timing: markers (±5 s) · transcript: `labs/08-slack-triage/coaching/dryrun/mediocre.md`

## Scores — 56/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 18/30 | Four of six points; the routing correction and the network policy are missing, and the pasted ticket was described as "ignored". (anchors: 27–30 every point tied to a count, setting or file; 15–20 four of six; under 10 two or fewer) |
| Structure | 14/25 | Opened with the setup rather than the outcome; the update has no ask. (anchors: 22–25 all parts in order; 13–17 parts present but weak; under 8 problem only) |
| Customer relevance | 11/20 | Thread answers and tagging were described, but only one count reached the support lead. (anchors: 16–20 answered in terms of what the support team sees, with counts; 10–13 some; under 6 feature talk) |
| Brevity and fluency | 8/15 | Four segments off target, a 12-second silence at T+45 and six fillers. (anchors: 11–15 segments on target, under 1 filler/min; 6–8 two or more segments off; under 4 most segments off) |
| Recovery | 5/10 | Objection 1 had no boundary or evidence; objection 2 had the boundary and one number but no offer. (anchors: 7–10 acknowledge → boundary → evidence → offer held with numbers; 4–6 partial; under 3 no pattern) |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 74 s | +14 s | over |
| Think-aloud checkpoint (T+10) | 45 s | 40 s | -5 s | on |
| Think-aloud checkpoint (T+45) | 45 s | 57 s | +12 s | over |
| Slack update to the support lead (≤120 words, spoken in 90 s) | 90 s | 60 s | -30 s | under |
| Objection 1 (technical) — “Who is accountable when the bot posts a wrong diagnosis?” | 90 s | 92 s | +2 s | on |
| Objection 2 (commercial) — “My team will stop reading the channel if the bot posts every time.” | 90 s | 105 s | +15 s | over |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “So I set up a responder, basically a Support and Bugs one”
- **Approach** — present: “It groups the double-charge reports into one issue linked to the first thread”
- **Evidence** — weak: “Actually, the replay had six posts”
- **Next step** — missing
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 6 in 7.1 spoken min (0.85/min) — actually ×1, basically ×2, so yeah ×1, you know ×1, um ×1
- Tag questions: 1 (“It's mostly right anyway, right?”)
- Pauses over 8 s: 12 s at [02:10] in checkpoint-45

## Missing key points

- [x] Repeated double-charge reports are grouped into one issue linked to the first report's thread, not answered each time (7) — “It groups the double-charge reports into one issue linked to the first thread, so it does not answer each time”
- [x] A shared scratchpad keeps triaged reports with channel, timestamp and reporter, the duplicates and the routing table (6) — “it keeps the triaged reports with channel and timestamp and reporter, the duplicates and the routing table”
- [ ] A routing correction replied in the thread updates the routing table so later reports go to the right owner (6) — missed; belonged in objection-1
- [x] The diagnosis is written back once in the original thread with the owner tagged, and repeats only get a reaction (5) — “The diagnosis is written back once in the original thread with the owner tagged, and repeats only get a reaction”
- [ ] Channel messages are untrusted input, so the responder runs under a network policy allowlist that blocks other hosts (4) — missed; belonged in checkpoint-45
- [x] The same setup runs on a Microsoft Teams channel through a Teams trigger, without private channels (2) — “It can run on a Microsoft Teams channel through a Teams trigger too, without private channels”

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: basically (×2)
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “The pasted ticket was also there, basically it ignored it, you know.”; “It's mostly right anyway, right?”

## Three stems for next time

1. "Your team will stop…" — lead the framing with the outcome before the responder type.
1. "When an engineer says wrong owner…" — say where the correction is kept and what happens next time.
1. "The setting that blocks it is…" — name the network policy instead of "it ignored it".

## Compared with your previous run

First recorded run for dryrun on lab 08; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
