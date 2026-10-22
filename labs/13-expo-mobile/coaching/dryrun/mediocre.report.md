# Articulation gap report — lab 13 expo-mobile (coach-13-expo-mobile)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T11:00:00Z · timing: markers (±5 s) · transcript: `labs/13-expo-mobile/coaching/dryrun/mediocre.md`

## Scores — 64/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 20/30 | Five of seven points; the blueprint and snapshot (mm4) and the not-exercised list (mm7) missing (anchor: 16–21 = most points, two missing). |
| Structure | 15/25 | Outcome came after the backstory in the framing; the update had no Risk sentence and a vague ask (anchor: 13–17 = order partly held). |
| Customer relevance | 13/20 | Both platforms named, but no order id and no Mac duration (anchor: 12–15 = outcome present, buried). |
| Brevity and fluency | 9/15 | Framing 12 s long, update 30 s short, both objections short; four fillers, one tag question, a 10 s pause (anchor: 7–9 = several segments off). |
| Recovery | 7/10 | Objection 2 held the pattern; objection 1 skipped the acknowledgement and the evidence (anchor: 5–7 = pattern held once). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 72 s | +12 s | over |
| Think-aloud checkpoint (T+30, Android) | 45 s | 38 s | -7 s | under |
| Think-aloud checkpoint (T+120, iOS) | 45 s | 53 s | +8 s | over |
| Update to the product owner | 180 s | 150 s | -30 s | under |
| Objection 1 (commercial) | 90 s | 42 s | -48 s | under |
| Objection 2 (technical) | 90 s | 67 s | -23 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “So I started with the Expo app and the Gradle build”
- **Approach** — present: “I'll try iOS next on a macOS child session with Xcode and the Simulator”
- **Evidence** — weak: “The screenshots are in the evidence folder.”
- **Next step** — weak: “Next we can actually ship it if you are happy.”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 4 in 7 spoken min (0.57/min) — actually ×2, basically ×1, you know ×1
- Tag questions: 1 (“so I set DEVELOPER_DIR to Xcode 16, right?”)
- Pauses over 8 s: 10 s at [02:30] in checkpoint-120

## Missing key points

- [x] Outcome: packed and shipped on the order screen, proven by the same order on the Android emulator and on the iOS Simulator — or, without macOS, on Android with iOS named as not exercised (6) — “The goal is that customers see packed and shipped on the order screen on both phones”
- [x] Android builds on the Linux session with a KVM-accelerated emulator; iOS needs a separate macOS child session with Xcode and the Simulator (5) — “the emulator is fast because it has KVM”
- [x] Expo SDK 54 with Continuous Native Generation: android/ and ios/ come from expo prebuild, are never committed, and drift is fixed by --clean (4) — “Expo SDK 54 generates ios/ with prebuild, we never commit it, and prebuild --clean fixes drift”
- [ ] Multi-document blueprint, one runs-on linux and one runs-on macos document with a snapshot each; a snapshot mismatch is fixed there (5) — missed; belonged in update
- [x] harbourline-haptics is a Swift Expo module with a JS fallback: native on iOS, a harmless no-op on Android (4) — “on Android it is actually the JS fallback, so nothing breaks there”
- [x] Xcode version selected explicitly with DEVELOPER_DIR on the macOS machine (3) — “I set DEVELOPER_DIR to Xcode 16”
- [ ] What was not exercised: haptic feel on a physical iPhone, store signing and EAS, live API mode (3) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: "and then" chained three times in the framing
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “So I started with the Expo app and the Gradle build, and then the emulator, and you know, it took a while to come up.”

## Three stems for next time

1. "Customers will see packed and shipped on both phones." — move it from the second sentence of the framing to the first.
1. "Not exercised: a physical iPhone, store signing, live API mode." — your update had no such line; this is it.
1. "I acknowledge … The boundary is … The evidence is … I can offer …" — objection 1 had no acknowledgement and no figure.

## Compared with your previous run

First recorded run for dryrun on lab 13; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
