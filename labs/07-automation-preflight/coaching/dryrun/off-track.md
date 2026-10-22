---
lab: 07-automation-preflight
variant: off-track
learner: dryrun
planted_fillers: 9
planted_omissions: [mm2, mm3, mm5, mm6, mm7]
planted_long_pauses: ["01:48", "03:10"]
---
# Dry-run transcript — off-track

Fixture for `@skills:coach-07-automation-preflight dryrun --dry-run labs/07-automation-preflight/coaching/dryrun/off-track.md`.
Planted: nine fillers (actually ×3, basically ×3, you know ×2, um ×1), one tag question, two long pauses (12 s in checkpoint-15, 14 s in the update), and five omitted must-mention points (mm2, mm3, mm5, mm6, mm7). The learner describes the LLM filter as the dedupe mechanism and never reaches the risks.

--- segment: framing ---
[00:00] COACH: Sixty seconds. What changes for us, and how is Devin doing it? Go.
[00:05] LEARNER: Um, so Automations are basically a way to start Devin from events, and they have triggers, and conditions, and Preflight, and actions, and you know, a lot of options.
[00:40] LEARNER: We had too many sessions, so basically I added a filter.
[01:04] LEARNER: It goes from eleven to three, I think, so evt_lab07_a twice and evt_lab07_c once.
[01:28] LEARNER: That is the idea. Done.

--- segment: checkpoint-15 ---
[01:40] COACH: T+15. What are you building first, and why that? Go.
[01:44] LEARNER: I am writing the filter prompt.
[01:48] (pause 12 s)
[02:06] LEARNER: It says to ignore duplicates. Done.

--- segment: checkpoint-75 ---
[02:18] COACH: T+75. What makes two notifications the same thing in your script? Go.
[02:22] LEARNER: They are the same if the filter thinks they are duplicates, you know.
[02:40] LEARNER: It actually works most of the time. Done.

--- segment: update ---
[02:52] COACH: Three minutes. Give me the update I can forward to finance. Go.
[02:56] LEARNER: So it is basically working.
[03:06] LEARNER: Retries before the last attempt and recoveries are skipped, and signature failures go through.
[03:10] (pause 14 s)
[03:44] LEARNER: I actually tested it with Run now and it started sessions, so it works, no?
[04:12] LEARNER: Next I will turn it on. Done.

--- segment: objection-1 ---
[04:24] COACH: Won't we miss a real failure? Go.
[04:28] LEARNER: I do not think so, the filter is pretty smart.
[04:54] LEARNER: Done.

--- segment: objection-2 ---
[05:06] COACH: What does every skipped event cost us? Go.
[05:10] LEARNER: Not much, actually, it is a small thing.
[05:34] LEARNER: Done.
