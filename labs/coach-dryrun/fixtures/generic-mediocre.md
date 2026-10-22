---
lab: any
variant: generic-mediocre
learner: calibration
planted_fillers: 6
planted_omissions: all
planted_long_pauses: ["02:10"]
---
# Cross-lab calibration transcript — generic mediocre

Fixture for the W5 cross-lab calibration (`node labs/coach-dryrun/calibrate.mjs`). The same
answer is fed to every per-lab coach in dry-run mode. It names no lab-specific point, so every
must-mention point of every lab is missed; it is otherwise a typical mediocre answer: a
recognisable order, one hedged impact statement, no numbers, objections answered weakly.

Planted: six fillers (basically ×2, actually ×1, um ×1, you know ×1, so yeah ×1), one tag
question, one 12-second pause at [02:10], no lab-specific point.

Segment mapping (applied by `calibrate.mjs`, not by the coach): `framing` → the lab's framing;
`checkpoint-a` and `checkpoint-b` → the lab's first and second segment between framing and the
closing `update` (checkpoints, or an interim update in lab 12); `update` → the closing update;
`objection-1` … `objection-3` → the lab's objections in order. Labs with two objections ignore
`objection-3`. The objection lines below are placeholders: the coach asks its own lab's
objection, in character.

--- segment: framing ---
[00:00] COACH: (asks the lab's framing question, in character) Go.
[00:03] LEARNER: So, basically, there was a problem in the system and I looked into it with Devin. I think the main issue was in the configuration, and some users were affected by it.
[00:30] LEARNER: I used Devin to investigate, it found the cause, and then we made a change and tested it. It works now, I think.
[00:58] LEARNER: Next we should monitor it.
[01:12] LEARNER: Done.
--- segment: checkpoint-a ---
[01:25] COACH: (asks the lab's first checkpoint question, in character) Go.
[01:28] LEARNER: I am looking at the logs and the code, actually. There is a lot of output. I will check the most important part first.
[01:52] LEARNER: Then I will ask Devin to explain what it found and see if it makes sense, right?
[02:10] (pause 12 s)
[02:22] LEARNER: Done.
--- segment: checkpoint-b ---
[02:35] COACH: (asks the lab's second checkpoint question, in character) Go.
[02:38] LEARNER: The error went away after the change, so that told me it was the right thing. Also the explanation from Devin matched what I saw.
[03:20] LEARNER: Done.
--- segment: update ---
[03:30] COACH: (asks for the lab's closing update, in character) Go.
[03:33] LEARNER: So, we found the problem and fixed it. Devin helped with the investigation and the change, and I checked the result.
[04:10] COACH: What is the impact in numbers?
[04:13] LEARNER: Um, I don't have the exact number. Maybe a few customers, you know, it was not too many.
[04:40] LEARNER: The change is on a branch and it was tested. We should keep an eye on it and maybe add a test later.
[05:30] LEARNER: Next step is to monitor it. So yeah, that is the update.
[06:00] LEARNER: Done.
--- segment: objection-1 ---
[06:10] COACH: (raises the lab's first objection, in character)
[06:14] LEARNER: That's a fair question. Devin found the issue faster than we would have, and we tested the change. Basically we can tune it later if needed.
[07:05] LEARNER: Done.
--- segment: objection-2 ---
[07:15] COACH: (raises the lab's second objection, in character)
[07:18] LEARNER: I think it is fine for now. It is a pilot, and we can review it again next month.
[08:05] LEARNER: Done.
--- segment: objection-3 ---
[08:15] COACH: (raises the lab's third objection, in character; labs with two objections skip this segment)
[08:18] LEARNER: I'm not sure. I would have to check with the team and get back to you.
[08:55] LEARNER: Done.
