# Articulation gap report — lab 08 slack-triage (coach-08-slack-triage)

Learner: **calibration** · mode: dry-run · run 1 · 2026-10-22T11:30:00Z · timing: markers (±5 s) · transcript: `labs/coach-dryrun/fixtures/generic-mediocre.md`

## Scores — 34/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 4/30 | None of the 6 must-mention points is stated; nothing is contradicted, the answer is simply content-free (anchor: under 10 = one point or fewer). |
| Structure | 13/25 | Problem, approach, evidence and next step are all findable but thin; the update has no risk and no ask (anchor: 13–17 = parts present but weak). |
| Customer relevance | 8/20 | Impact appears once ("some users were affected", "maybe a few customers") with no number, asked for and not given (anchor: 10–13 = some reviewer questions answered; under 6 = feature talk). |
| Brevity and fluency | 5/15 | 5 of 6 segments off target, 6 fillers (0.74/min), one 12 s pause, one tag question (anchor: 6–8 = two or more off; update over by more than 50 %). |
| Recovery | 4/10 | Objection 1 acknowledged ("fair question") with no boundary or evidence; objection 2 deflected to "next month" (anchor: 4–6 = partial; objection 2 capped at 4 without a number). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 72 s | +12 s | over |
| Think-aloud checkpoint (T+10) | 45 s | 57 s | +12 s | over |
| Think-aloud checkpoint (T+45) | 45 s | 45 s | +0 s | on |
| Slack update to the support lead (≤120 words, spoken in 90 s) | 90 s | 150 s | +60 s | over |
| Objection 1 (technical) — “Who is accountable when the bot posts a wrong diagnosis?” | 90 s | 51 s | -39 s | under |
| Objection 2 (commercial) — “My team will stop reading the channel if the bot posts every time.” | 90 s | 47 s | -43 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “there was a problem in the system and I looked into it with Devin”
- **Approach** — present: “I used Devin to investigate, it found the cause, and then we made a change and tested it”
- **Evidence** — weak: “The error went away after the change, so that told me it was the right thing”
- **Next step** — weak: “Next step is to monitor it”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 6 in 8.1 spoken min (0.74/min) — basically ×2, actually ×1, um ×1, you know ×1, so yeah ×1
- Tag questions: 1 (“Then I will ask Devin to explain what it found and see if it makes sense, right?”)
- Pauses over 8 s: 12 s at [02:10] in checkpoint-10

## Missing key points

- [ ] Repeated double-charge reports are grouped into one issue linked to the first report's thread, not answered each time (7) — missed; belonged in framing
- [ ] A shared scratchpad keeps triaged reports with channel, timestamp and reporter, the duplicates and the routing table (6) — missed; belonged in checkpoint-10
- [ ] A routing correction replied in the thread updates the routing table so later reports go to the right owner (6) — missed; belonged in objection-1
- [ ] The diagnosis is written back once in the original thread with the owner tagged, and repeats only get a reaction (5) — missed; belonged in objection-2
- [ ] Channel messages are untrusted input, so the responder runs under a network policy allowlist that blocks other hosts (4) — missed; belonged in checkpoint-45
- [ ] The same setup runs on a Microsoft Teams channel through a Teams trigger, without private channels (2) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: "I think" (×2 in the framing)
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “So, basically, there was a problem in the system and I looked into it with Devin.”

## Three stems for next time

1. Lead with the missing top point: "Repeated double-charge reports are grouped into one issue linked to the first report's thread — and the evidence is …"
1. "The customers affected were …, and the number is …"
1. "That's a fair concern; the boundary is …, the evidence is …, and what I can offer is …"

## Compared with your previous run

Calibration run of the generic transcript (labs/coach-dryrun/fixtures/generic-mediocre.md); no previous run.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
