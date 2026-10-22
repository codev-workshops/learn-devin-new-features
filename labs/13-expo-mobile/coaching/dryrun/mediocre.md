---
lab: 13-expo-mobile
variant: mediocre
learner: dryrun
planted_fillers: 4
planted_omissions: [mm4, mm7]
planted_long_pauses: ["02:30"]
---
# Dry-run transcript — mediocre

Fixture for `@skills:coach-13-expo-mobile dryrun --dry-run labs/13-expo-mobile/coaching/dryrun/mediocre.md`.
Planted: four fillers (actually ×2, basically ×1, you know ×1), one tag question, one 10-second pause in checkpoint-120, and two omitted must-mention points (mm4 multi-document blueprint and snapshot, mm7 not exercised). The framing runs long, the update runs short and has no risk sentence.

--- segment: framing ---
[00:00] COACH: Sixty seconds. What do customers get, and how will you prove it? Go.
[00:04] LEARNER: So I started with the Expo app and the Gradle build, and then the emulator, and you know, it took a while to come up.
[00:30] LEARNER: The goal is that customers see packed and shipped on the order screen on both phones.
[00:48] LEARNER: The proof is the same order on the Android emulator and on the iOS Simulator.
[01:12] LEARNER: Done.

--- segment: checkpoint-30 ---
[01:20] COACH: T+30. Where are you on Android, and what decided your next step? Go.
[01:23] LEARNER: I see the build is green on the Linux session, and the emulator is fast because it has KVM.
[01:38] LEARNER: I'll try iOS next on a macOS child session with Xcode and the Simulator.
[01:58] LEARNER: Done.

--- segment: checkpoint-120 ---
[02:05] COACH: T+120. You are on iOS now. What is different there? Go.
[02:09] LEARNER: The Mac had the wrong Xcode by default, so I set DEVELOPER_DIR to Xcode 16, right?
[02:30] (pause 10 s)
[02:40] LEARNER: And Expo SDK 54 generates ios/ with prebuild, we never commit it, and prebuild --clean fixes drift.
[02:58] LEARNER: Done.

--- segment: update ---
[03:05] COACH: Three minutes. Give me the update with proof on both platforms. Go.
[03:08] LEARNER: So the order screen works on both phones. Basically the same order shows packed on Android and on iOS.
[03:35] LEARNER: On iOS the cart says native harbourline-haptics, which is a Swift module, and on Android it is actually the JS fallback, so nothing breaks there.
[04:10] LEARNER: The screenshots are in the evidence folder.
[04:40] LEARNER: Next we can actually ship it if you are happy.
[05:35] LEARNER: Done.

--- segment: objection-1 ---
[05:45] COACH: macOS minutes are expensive.
[05:48] LEARNER: The Mac was only used for the iOS part, the rest was Linux.
[06:10] LEARNER: We could use it less often.
[06:30] LEARNER: Done.

--- segment: objection-2 ---
[06:40] COACH: Why can't one VM do both?
[06:43] LEARNER: That is fair. The iOS Simulator only runs on macOS with Xcode, Apple does not ship it for Linux.
[07:10] LEARNER: And the Android emulator wants KVM, so we used two machines, one report.
[07:50] LEARNER: Done.
