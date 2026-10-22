# Articulation gap report — lab 13 expo-mobile (coach-13-expo-mobile)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T11:00:00Z · timing: markers (±5 s) · transcript: `labs/13-expo-mobile/coaching/dryrun/off-track.md`

## Scores — 31/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 8/30 | Two of seven points (mm2, mm5); no outcome, no prebuild, no blueprint, no Xcode selection, no not-exercised list (anchor: 0–10 = most points missing). |
| Structure | 7/25 | Toolchain story in place of an outcome; the update had no evidence, risk or ask (anchor: 0–8 = no order). |
| Customer relevance | 6/20 | Customers and order status never mentioned (anchor: 0–7 = no customer outcome). |
| Brevity and fluency | 5/15 | Framing 35 s long, update 90 s short, objections 22 s; eight fillers, two tag questions, two long pauses (anchor: 4–6 = most segments off). |
| Recovery | 5/10 | Both objections dismissed without acknowledgement; objection 2 named the vendor only (anchor: 3–5 = pattern not held). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 95 s | +35 s | over |
| Think-aloud checkpoint (T+30, Android) | 45 s | 30 s | -15 s | under |
| Think-aloud checkpoint (T+120, iOS) | 45 s | 65 s | +20 s | over |
| Update to the product owner | 180 s | 90 s | -90 s | under |
| Objection 1 (commercial) | 90 s | 22 s | -68 s | under |
| Objection 2 (technical) | 90 s | 22 s | -68 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — missing
- **Approach** — weak: “basically I had to get Gradle working first”
- **Evidence** — missing
- **Next step** — weak: “Actually I think it is fine to ship, so yeah.”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 8 in 5.4 spoken min (1.48/min) — actually ×1, basically ×2, so yeah ×1, like ×1, um ×3
- Tag questions: 2 (“iOS needs a Mac session for Xcode, no?”, “I basically ran it again and it worked, right?”)
- Pauses over 8 s: 12 s at [02:50] in checkpoint-120; 9 s at [04:20] in update

## Missing key points

- [ ] Outcome on both platforms: packed and shipped on the order screen, proven by the same order on the Android emulator and the iOS Simulator (6) — missed; belonged in framing
- [x] Android builds on the Linux session with a KVM-accelerated emulator; iOS needs a separate macOS child session with Xcode and the Simulator (5) — “The emulator runs on the Linux box with KVM. iOS needs a Mac session for Xcode”
- [ ] Expo SDK 54 with Continuous Native Generation: android/ and ios/ come from expo prebuild, are never committed, and drift is fixed by --clean (4) — missed; belonged in checkpoint-120
- [ ] Multi-document blueprint, one runs-on linux and one runs-on macos document with a snapshot each; a snapshot mismatch is fixed there (5) — missed; belonged in update
- [x] kade-haptics is a Swift Expo module with a JS fallback: native on iOS, a harmless no-op on Android (4) — “The haptics module is native Swift on iOS, and on Android there is a JS fallback that does nothing”
- [ ] Xcode version selected explicitly with DEVELOPER_DIR on the macOS machine (3) — missed; belonged in checkpoint-120
- [ ] What was not exercised: haptic feel on a physical iPhone, store signing and EAS, live API mode (3) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: "and" chained four times in the framing
- Coach asked “did you say…?”: never
- Article/plural slips: "the pods took ages" — fine; "the haptics thing" → "the haptics module"
- Re-record: “Um, so the mobile app is Expo and React Native, and basically I had to get Gradle working first.”; “It just can't. Apple.”

## Three stems for next time

1. "Customers will see packed and shipped on the order screen, on Android and iOS." — say this before any tool name.
1. "Same order, same status, two phones." — the proof the product owner asked for; it never came.
1. "I acknowledge … The boundary is … The evidence is … I can offer …" — both objections were brushed off.

## Compared with your previous run

First recorded run for dryrun on lab 13; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
