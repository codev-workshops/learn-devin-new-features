# Articulation gap report — lab 15 capstone (coach-15-capstone)

Learner: **calibration** · mode: dry-run · run 1 · 2026-10-22T11:30:00Z · timing: markers (±5 s) · transcript: `labs/coach-dryrun/fixtures/generic-mediocre.md`

## Scores — 33/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 4/30 | None of the 7 must-mention points of the drawn scenario (lamp-week-oversell) is stated; nothing is contradicted, the answer is simply content-free (anchor: 0–8 = one point or fewer). |
| Structure | 12/25 | Problem, approach, evidence and next step are all findable but thin; the update has no risk and no ask (anchor: 14–17 = parts findable, order broken). |
| Customer relevance | 8/20 | Impact appears once ("some users were affected", "maybe a few customers") with no number, asked for and not given (anchor: 10–13 = outcome present but buried; 5–8 = misleading). |
| Brevity and fluency | 6/15 | 6 of 7 segments off target, 6 fillers (0.67/min), one 12 s pause, one tag question (anchor: 7–9 = several off (6 of seven here)). |
| Recovery | 3/10 | Objection 1 acknowledged ("fair question") with no boundary or evidence; objection 2 deflected to "next month"; objection 3 conceded (anchor: 5–6 = partly; 0–2 = not used). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 90-second framing after the envelope | 90 s | 72 s | -18 s | under |
| Think-aloud checkpoint (T+30) | 45 s | 57 s | +12 s | over |
| Think-aloud checkpoint (T+90, after the change) | 45 s | 45 s | +0 s | on |
| Four-minute unscripted customer update | 240 s | 150 s | -90 s | under |
| Objection 1 with follow-up — “Finance halved your budget mid-morning. What did you stop doing, and what does that cost Lumen?” | 90 s | 51 s | -39 s | under |
| Objection 2 with follow-up — “How do I know this does not happen again on Friday at nine o'clock?” | 90 s | 47 s | -43 s | under |
| Objection 3 with follow-up — “Why should I trust a review done by the same tool that wrote the fix?” | 90 s | 37 s | -53 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “there was a problem in the system and I looked into it with Devin”
- **Approach** — present: “I used Devin to investigate, it found the cause, and then we made a change and tested it”
- **Evidence** — weak: “The error went away after the change, so that told me it was the right thing”
- **Next step** — weak: “Next step is to monitor it”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 6 in 8.9 spoken min (0.67/min) — basically ×2, actually ×1, um ×1, you know ×1, so yeah ×1
- Tag questions: 1 (“Then I will ask Devin to explain what it found and see if it makes sense, right?”)
- Pauses over 8 s: 12 s at [02:10] in checkpoint-30

## Missing key points

- [ ] The reservation reads stock and then writes it without a row lock, so concurrent checkouts sell lamps that do not exist (6) — missed; belonged in framing
- [ ] Reproduced with the oversell injector: twenty concurrent checkouts against a three-unit lamp (5) — missed; belonged in checkpoint-30
- [ ] Re-planned for the halved budget: the oversell fix first, the back-in-stock sign-up cut to a small separate pull request (4) — missed; belonged in checkpoint-90
- [ ] Re-running the injector after the fix shows no more than three checkouts succeed and stock never goes negative (5) — missed; belonged in update
- [ ] The review finding on lock order was answered and Devin Review is clean on the final commit (4) — missed; belonged in update
- [ ] Lumen sessions run under the Lumen ACU limit so Trailhead on-call is never blocked (3) — missed; belonged in update
- [ ] A monitor on negative available stock pages a human before customers notice (3) — missed; belonged in objection-2

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: "I think" (×2 in the framing)
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “So, basically, there was a problem in the system and I looked into it with Devin.”

## Three stems for next time

1. Lead with the missing top point: "The reservation reads stock and then — and the evidence is …"
1. "The customers affected were …, and the number is …"
1. "That's a fair concern; the boundary is …, the evidence is …, and what I can offer is …"

## Compared with your previous run

Calibration run of the generic transcript (labs/coach-dryrun/fixtures/generic-mediocre.md) against scenario lamp-week-oversell, the scenario of the lab's own mediocre dry run; no previous run.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
