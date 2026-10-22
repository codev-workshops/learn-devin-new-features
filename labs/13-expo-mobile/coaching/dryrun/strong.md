---
lab: 13-expo-mobile
variant: strong
learner: dryrun
planted_fillers: 0
planted_omissions: []
planted_long_pauses: []
---
# Dry-run transcript — strong

Fixture for `@skills:coach-13-expo-mobile dryrun --dry-run labs/13-expo-mobile/coaching/dryrun/strong.md`.
Planted: nothing. Every must-mention point lands in its segment, timings are within five seconds, no fillers and no long pauses. Small slip: one point in the update is a little dense.

--- segment: framing ---
[00:00] COACH: Sixty seconds. What do customers get, and how will you prove it? Go.
[00:03] LEARNER: Customers will see packed and shipped on the order screen of the Kadé app, on Android and on iOS.
[00:14] LEARNER: The proof is the same packed order, screenshotted on the Android emulator and on the iOS Simulator, side by side.
[00:29] LEARNER: Devin builds Android on its Linux machine, and a macOS child session builds iOS in Xcode, so neither platform is a guess.
[00:46] LEARNER: You will know it works when both screenshots show the same status pill and the same timeline.
[00:59] LEARNER: Done.

--- segment: checkpoint-30 ---
[01:10] COACH: T+30. Where are you on Android, and what decided your next step? Go.
[01:13] LEARNER: I see the emulator booted in under two minutes because the Linux session has KVM acceleration.
[01:24] LEARNER: I think the release build is the right one, because it bundles the JavaScript and needs no Metro server.
[01:37] LEARNER: I'll try the packed order next, and I'll check that iOS waits for a separate macOS child session with Xcode and the Simulator.
[01:56] LEARNER: Done.

--- segment: checkpoint-120 ---
[02:05] COACH: T+120. You are on iOS now. What is different there? Go.
[02:08] LEARNER: I see the Mac had two Xcodes, a release and a beta, so the child pins the release Xcode with DEVELOPER_DIR.
[02:19] LEARNER: I think the carry-over from Android is Expo SDK 54 prebuild: ios/ is generated, never committed, and prebuild --clean fixes any drift.
[02:36] LEARNER: I'll check that KadeHaptics is in Podfile.lock before I take the screenshot.
[02:49] LEARNER: Done.

--- segment: update ---
[03:00] COACH: Three minutes. Give me the update with proof on both platforms. Go.
[03:03] LEARNER: Outcome: the order screen shows packed and shipped on both phones.
[03:12] LEARNER: Evidence on Android: the Linux emulator shows order LH-001004 as packed with its timeline, and the cart says the haptic uses the JS fallback.
[03:38] LEARNER: Evidence on iOS: the Simulator shows the same order in the same state, and the cart says native kade-haptics, a small Swift module.
[04:02] LEARNER: That module has a JS fallback, so Android gets a harmless no-op instead of a crash.
[04:20] LEARNER: Setup: the blueprint now has two documents, runs-on linux and runs-on macos, each with its own snapshot. When a snapshot was missing the Android SDK we fixed the blueprint, not the machine, so the next engineer boots straight in.
[04:58] LEARNER: Risk: the Simulator proves the module is linked and called; it cannot prove how the tap feels.
[05:15] LEARNER: Not exercised: a physical iPhone, store signing and EAS builds, and live API mode. All runs used the mock data.
[05:38] LEARNER: Next action: one tester confirms the haptic on a real iPhone this week.
[05:50] LEARNER: Ask: may we ship the Android build now and iOS after that check?
[06:01] LEARNER: Done.

--- segment: objection-1 ---
[06:10] COACH: macOS minutes are expensive.
[06:13] LEARNER: I acknowledge that; Mac time costs more than Linux time.
[06:22] LEARNER: The boundary is that only the iOS build and its screenshots need the Mac. Android, tests, lint and this report ran on Linux.
[06:45] LEARNER: The evidence is the child session: it worked for about forty minutes and stopped as soon as it pushed.
[07:05] LEARNER: I can offer to run the iOS check only on release candidates, not on every change.
[07:38] LEARNER: Done.

--- segment: objection-2 ---
[07:45] COACH: Why can't one VM do both?
[07:48] LEARNER: Fair question.
[07:52] LEARNER: The boundary is the vendors: Apple only ships the iOS Simulator inside Xcode on macOS, and the Android emulator needs KVM on Linux.
[08:15] LEARNER: The evidence is the blueprint itself: one document per platform, each picked by its runs-on line.
[08:38] LEARNER: I can offer one pull request and one report for both, even though two machines did the work.
[09:16] LEARNER: Done.
