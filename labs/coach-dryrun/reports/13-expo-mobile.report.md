# Articulation gap report — lab 13 expo-mobile (coach-13-expo-mobile)

Learner: **calibration** · mode: dry-run · run 1 · 2026-10-22T11:30:00Z · timing: markers (±5 s) · transcript: `labs/coach-dryrun/fixtures/generic-mediocre.md`

## Scores — 35/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 4/30 | None of the 7 must-mention points is stated; nothing is contradicted, the answer is simply content-free (anchor: 0–10 = most points missing). |
| Structure | 12/25 | Problem, approach, evidence and next step are all findable but thin; the update has no risk and no ask (anchor: 13–17 = order partly held). |
| Customer relevance | 8/20 | Impact appears once ("some users were affected", "maybe a few customers") with no number, asked for and not given (anchor: 12–15 = outcome present, buried; 0–7 = no customer outcome). |
| Brevity and fluency | 7/15 | 5 of 6 segments off target, 6 fillers (0.74/min), one 12 s pause, one tag question (anchor: 7–9 = several segments off). |
| Recovery | 4/10 | Objection 1 acknowledged ("fair question") with no boundary or evidence; objection 2 deflected to "next month" (anchor: 5–7 = held once; 3–5 = not held). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 72 s | +12 s | over |
| Think-aloud checkpoint (T+30, Android) | 45 s | 57 s | +12 s | over |
| Think-aloud checkpoint (T+120, iOS) | 45 s | 45 s | +0 s | on |
| Update to the product owner | 180 s | 150 s | -30 s | under |
| Objection 1 (commercial) | 90 s | 51 s | -39 s | under |
| Objection 2 (technical) | 90 s | 47 s | -43 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “there was a problem in the system and I looked into it with Devin”
- **Approach** — present: “I used Devin to investigate, it found the cause, and then we made a change and tested it”
- **Evidence** — weak: “The error went away after the change, so that told me it was the right thing”
- **Next step** — weak: “Next step is to monitor it”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 6 in 8.1 spoken min (0.74/min) — basically ×2, actually ×1, um ×1, you know ×1, so yeah ×1
- Tag questions: 1 (“Then I will ask Devin to explain what it found and see if it makes sense, right?”)
- Pauses over 8 s: 12 s at [02:10] in checkpoint-30

## Missing key points

- [ ] Outcome: packed and shipped on the order screen, proven by the same order on the Android emulator and on the iOS Simulator — or, without macOS, on Android with iOS named as not exercised (6) — missed; belonged in framing
- [ ] Android builds on the Linux session with a KVM-accelerated emulator; iOS needs a separate macOS child session with Xcode and the Simulator (5) — missed; belonged in checkpoint-30
- [ ] Expo SDK 54 with Continuous Native Generation: android/ and ios/ come from expo prebuild, are never committed, and drift is fixed by --clean (4) — missed; belonged in checkpoint-120
- [ ] Multi-document blueprint, one runs-on linux and one runs-on macos document with a snapshot each; a snapshot mismatch is fixed there (5) — missed; belonged in update
- [ ] kade-haptics is a Swift Expo module with a JS fallback: native on iOS, a harmless no-op on Android (4) — missed; belonged in update
- [ ] Xcode version selected explicitly with DEVELOPER_DIR on the macOS machine (3) — missed; belonged in checkpoint-120
- [ ] What was not exercised: haptic feel on a physical iPhone, store signing and EAS, live API mode (3) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: "I think" (×2 in the framing)
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “So, basically, there was a problem in the system and I looked into it with Devin.”

## Three stems for next time

1. Lead with the missing top point: "Outcome — and the evidence is …"
1. "The customers affected were …, and the number is …"
1. "That's a fair concern; the boundary is …, the evidence is …, and what I can offer is …"

## Compared with your previous run

Calibration run of the generic transcript (labs/coach-dryrun/fixtures/generic-mediocre.md); no previous run.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
