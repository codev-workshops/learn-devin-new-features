---
lab: 13-expo-mobile
variant: off-track
learner: dryrun
planted_fillers: 8
planted_omissions: [mm1, mm3, mm4, mm6, mm7]
planted_long_pauses: ["02:50", "04:20"]
---
# Dry-run transcript — off-track

Fixture for `@skills:coach-13-expo-mobile dryrun --dry-run labs/13-expo-mobile/coaching/dryrun/off-track.md`.
Planted: eight fillers (um ×3, basically ×2, actually ×1, so yeah ×1, like ×1), two tag questions, a 12-second pause in checkpoint-120 and a 9-second pause in the update, and five omitted must-mention points (mm1 outcome on both platforms, mm3 prebuild, mm4 blueprint, mm6 Xcode selection, mm7 not exercised). The learner talks toolchain throughout and never states what customers get.

--- segment: framing ---
[00:00] COACH: Sixty seconds. What do customers get, and how will you prove it? Go.
[00:04] LEARNER: Um, so the mobile app is Expo and React Native, and basically I had to get Gradle working first.
[00:30] LEARNER: Gradle needed a lot of memory, and the NDK, and then CMake for all the ABIs, um, it was a long build.
[01:05] LEARNER: Then I looked at the haptics thing, which is Swift.
[01:35] LEARNER: Done.

--- segment: checkpoint-30 ---
[01:45] COACH: T+30. Where are you on Android, and what decided your next step? Go.
[01:48] LEARNER: The emulator runs on the Linux box with KVM. iOS needs a Mac session for Xcode, no?
[02:15] LEARNER: Done.

--- segment: checkpoint-120 ---
[02:25] COACH: T+120. You are on iOS now. What is different there? Go.
[02:28] LEARNER: Like, everything. CocoaPods is, um, slow, and the pods took ages.
[02:50] (pause 12 s)
[03:02] LEARNER: I basically ran it again and it worked, right?
[03:30] LEARNER: Done.

--- segment: update ---
[03:40] COACH: Three minutes. Give me the update with proof on both platforms. Go.
[03:43] LEARNER: So the builds are done. The haptics module is native Swift on iOS, and on Android there is a JS fallback that does nothing.
[04:20] (pause 9 s)
[04:29] LEARNER: Actually I think it is fine to ship, so yeah.
[05:10] LEARNER: Done.

--- segment: objection-1 ---
[05:20] COACH: macOS minutes are expensive.
[05:23] LEARNER: Not really, it was one session.
[05:45] LEARNER: Done.

--- segment: objection-2 ---
[05:55] COACH: Why can't one VM do both?
[05:58] LEARNER: It just can't. Apple.
[06:20] LEARNER: Done.
