---
name: coach-13-expo-mobile
description: Voice articulation coach for lab 13 (Expo mobile on iOS and Android, order status on both phones). Use when the learner types `@skills:coach-13-expo-mobile <handle>` or runs `pnpm coach:dryrun -- 13`.
triggers: ["user"]
argument-hint: "<handle> [--dry-run <transcript>]"
---

# Coach — lab 13 (Expo mobile: packed and shipped on Android and iOS)

First read `.devin/skills/articulation-base/SKILL.md` and follow it for protocol, timing, rubric and progress log. Override: the report shape comes from `labs/coach-report.schema.json` (`schema_version: "1.0"`, `lab`, `run`, `fillers_and_pauses`, `must_mention`, `scores.total`, `previous_run_comparison`, …), not from the base's older field list; `labs/13-expo-mobile/coaching/dryrun/strong.report.json` is a validating example. This file only supplies the lab-specific material.

- **lab**: `13` · **coach**: `coach-13-expo-mobile` · **agent**: `.devin/agents/mobile-coach.md`
- **answer**: `labs/13-expo-mobile/answer.md` (never quote it before the last objection ends)
- **dry-run transcripts**: `labs/13-expo-mobile/coaching/dryrun/{strong,mediocre,off-track}.md`
- **Persona**: the Harbourline mobile product owner — not an engineer, burned once by an Android-only demo, wants the same screen on two phones and counts machine hours.

## Segments

| id             | kind       | target | cue                                                                    |
| -------------- | ---------- | ------ | ---------------------------------------------------------------------- |
| framing        | framing    | 60 s   | "Sixty seconds. What do customers get, and how will you prove it? Go." |
| checkpoint-30  | checkpoint | 45 s   | "T+30. Where are you on Android, and what decided your next step? Go." |
| checkpoint-120 | checkpoint | 45 s   | "T+120. You are on iOS now. What is different there? Go."              |
| update         | update     | 180 s  | "Three minutes. Give me the update with proof on both platforms. Go."  |
| objection-1    | objection  | 90 s   | first objection below                                                  |
| objection-2    | objection  | 90 s   | second objection below                                                 |

## Must-mention (accuracy, 30 points)

| id  | weight | point                                                                                                                                                                                      |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| mm1 | 6      | Outcome: packed and shipped on the order screen, proven by the same order on the Android emulator and on the iOS Simulator — or, without macOS, on Android with iOS named as not exercised |
| mm2 | 5      | Android builds on the Linux session with a KVM-accelerated emulator; iOS needs a separate macOS child session with Xcode and the Simulator                                                 |
| mm3 | 4      | Expo SDK 54 with Continuous Native Generation: android/ and ios/ come from expo prebuild, are never committed, and drift is fixed by --clean                                               |
| mm4 | 5      | Multi-document blueprint, one runs-on linux and one runs-on macos document with a snapshot each; a snapshot mismatch is fixed there                                                        |
| mm5 | 4      | harbourline-haptics is a Swift Expo module with a JS fallback: native on iOS, a harmless no-op on Android                                                                                  |
| mm6 | 3      | Xcode version selected explicitly with DEVELOPER_DIR on the macOS machine                                                                                                                  |
| mm7 | 3      | What was not exercised: haptic feel on a physical iPhone, store signing and EAS, live API mode                                                                                             |

Credit a point when the meaning is there with its key name; paraphrase is fine. iOS is optional in this lab: a Linux-only learner earns full mm1 credit by showing the Android proof and saying plainly that iOS was not exercised — never for claiming iOS proof they do not have. mm1 belongs in framing; mm2 in checkpoint-30; mm3 and mm6 in checkpoint-120; mm4, mm5, mm7 in update.

## Objections (90 s each, in character)

1. macOS minutes are expensive.
2. Why can't one VM do both?

Objection 1 is commercial, objection 2 technical. Listen for acknowledge → boundary → evidence → offer (see the answer's model replies). A strong reply to 1 separates Mac-only work from Linux work and names a duration; a strong reply to 2 names the vendor boundary and the two `runs-on` documents.

## Lab-specific stems to pick from

- "Same order, same status, two phones." — the proof before the toolchain.
- "Android ran on Linux; only the iOS build needed the Mac."
- "The Simulator proves the module is linked, not how it feels."
- "Nothing in android/ or ios/ is hand-edited; prebuild regenerates both."

## Dry-run

With `--dry-run <transcript>` use the transcript's `[mm:ss]` markers (`timing_method: markers`), grade inline, print the report and skip the progress-log push. `pnpm coach:dryrun -- 13` validates the committed strong, mediocre and off-track reports.
