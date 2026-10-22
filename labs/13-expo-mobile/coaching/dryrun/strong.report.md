# Articulation gap report — lab 13 expo-mobile (coach-13-expo-mobile)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T11:00:00Z · timing: markers (±5 s) · transcript: `labs/13-expo-mobile/coaching/dryrun/strong.md`

## Scores — 92/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 30/30 | All seven points, each in its segment (anchor: 27–30 = all points, accurate). |
| Structure | 23/25 | Outcome → Evidence → Risk → Not exercised → Next → Ask held in the update; the setup sentence is dense (anchor: 22–25 = order held throughout). |
| Customer relevance | 18/20 | Same order, same status, two phones, and a named duration for the Mac (anchor: 16–20 = outcome first, figures given). |
| Brevity and fluency | 13/15 | Every segment within five seconds; no fillers, no long pauses (anchor: 13–15 = on time, clean). |
| Recovery | 8/10 | Both objections followed acknowledge → boundary → evidence → offer (anchor: 8–10 = pattern held twice). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 59 s | -1 s | on |
| Think-aloud checkpoint (T+30, Android) | 45 s | 46 s | +1 s | on |
| Think-aloud checkpoint (T+120, iOS) | 45 s | 44 s | -1 s | on |
| Update to the product owner | 180 s | 181 s | +1 s | on |
| Objection 1 (commercial) | 90 s | 85 s | -5 s | on |
| Objection 2 (technical) | 90 s | 88 s | -2 s | on |

## Structure (problem → approach → evidence → next step)

- **Problem** — present: “Customers will see packed and shipped on the order screen of the Kadé app, on Android and on iOS”
- **Approach** — present: “Devin builds Android on its Linux machine, and a macOS child session builds iOS in Xcode”
- **Evidence** — present: “the Linux emulator shows order LH-001004 as packed with its timeline”
- **Next step** — present: “Ask: may we ship the Android build now and iOS after that check?”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: yes

## Fillers and pauses

- Fillers: 0 in 8.4 spoken min (0/min)
- Tag questions: 0
- Pauses over 8 s: none

## Missing key points

- [x] Outcome on both platforms: packed and shipped on the order screen, proven by the same order on the Android emulator and the iOS Simulator (6) — “The proof is the same packed order, screenshotted on the Android emulator and on the iOS Simulator, side by side”
- [x] Android builds on the Linux session with a KVM-accelerated emulator; iOS needs a separate macOS child session with Xcode and the Simulator (5) — “iOS waits for a separate macOS child session with Xcode and the Simulator”
- [x] Expo SDK 54 with Continuous Native Generation: android/ and ios/ come from expo prebuild, are never committed, and drift is fixed by --clean (4) — “Expo SDK 54 prebuild: ios/ is generated, never committed, and prebuild --clean fixes any drift”
- [x] Multi-document blueprint, one runs-on linux and one runs-on macos document with a snapshot each; a snapshot mismatch is fixed there (5) — “the blueprint now has two documents, runs-on linux and runs-on macos, each with its own snapshot”
- [x] kade-haptics is a Swift Expo module with a JS fallback: native on iOS, a harmless no-op on Android (4) — “That module has a JS fallback, so Android gets a harmless no-op instead of a crash”
- [x] Xcode version selected explicitly with DEVELOPER_DIR on the macOS machine (3) — “the child pins Xcode 16 with DEVELOPER_DIR”
- [x] What was not exercised: haptic feel on a physical iPhone, store signing and EAS, live API mode (3) — “Not exercised: a physical iPhone, store signing and EAS builds, and live API mode”

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: none
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “When a snapshot was missing the Android SDK we fixed the blueprint, not the machine, so the next engineer boots straight in.”

## Three stems for next time

1. "Setup: two blueprint documents, one per platform." — split the 38-second setup sentence into two.
1. "The Simulator proves the module is linked, not how it feels." — keep this exact risk line; it was your strongest sentence.
1. "Same order, same status, two phones." — open the update with it, before "Outcome:".

## Compared with your previous run

First recorded run for dryrun on lab 13; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
