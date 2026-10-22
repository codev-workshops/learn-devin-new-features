---
lab: 02-lifecycle-hooks
variant: mediocre
learner: dryrun
planted_fillers: 6
planted_omissions: [hk3, hk4]
planted_long_pauses: ["15:20"]
---
# Dry-run transcript — mediocre

Fixture for `@skills:coach-02-lifecycle-hooks dryrun --dry-run labs/02-lifecycle-hooks/coaching/dryrun/mediocre.md`.
Planted: six fillers (actually ×2, basically ×2, so yeah ×1, you know ×1), one tag question, one 12-second pause at [15:20], and two omitted must-mention points: the regex/list matcher (hk3) and fail-open versus fail-closed (hk4).

--- segment: framing ---
[00:00] COACH: Before you start — how exactly will you stop Devin from running that reset against our shared database again? Sixty seconds. Go.
[00:04] LEARNER: So, because the reset happened on staging, and because both brands share the database, and because Devin will be working every day, basically I am adding a hook.
[00:30] LEARNER: It is a PreToolUse hook, and when the command is a reset on another database it exits 2 so it is blocked, and exit 0 means it continues.
[00:55] LEARNER: I'll know it works when the tests pass with the hook on. That's the idea, right?
[01:14] LEARNER: Done.
--- segment: checkpoint-15 ---
[15:00] COACH: What are you looking at right now, and what will you check next?
[15:04] LEARNER: I see the JSON that comes into the script. I think the command is in tool_input.
[15:20] (pause 12 s)
[15:32] LEARNER: Sorry, I was reading the docs. I'll check the exit code next.
[15:56] LEARNER: Done.
--- segment: checkpoint-60 ---
[60:00] COACH: Sixty minutes in. What are you looking at right now, and what will you check next?
[60:04] LEARNER: I see the injector file, the matcher one. It did not run the guard, so I changed it back to the old file.
[60:22] LEARNER: I'll check the other injectors after this, you know, the slow one.
[60:43] LEARNER: Done.
--- segment: update ---
[75:00] COACH: Give me the update before I sign off. Go.
[75:04] LEARNER: So the outcome is that the hook is working on my branch, basically.
[75:25] LEARNER: Evidence: the staging reset was blocked with exit 2, and the psql command is changed to the wrapper with updatedInput so it is read-only.
[75:55] COACH: How many rows changed when you tried the delete?
[75:59] LEARNER: None, I think, actually I did not count them.
[76:25] LEARNER: The bad migration patch was also blocked with exit 2 and it is in the log.
[77:00] LEARNER: Risk: so yeah, if the hooks file is wrong there could be a problem. Next action is to open the PR on the branch.
[77:45] LEARNER: Ask: can you review it this week?
[78:21] LEARNER: Done.
--- segment: objection-1 ---
[79:00] COACH: Isn't this just a lint rule?
[79:04] LEARNER: It is similar. But the hook runs when Devin runs the command, so it can stop it.
[79:30] LEARNER: A lint rule would not see the command.
[80:02] LEARNER: Done.
--- segment: objection-2 ---
[81:00] COACH: If the hook has a bug, are we locked out of our own database?
[81:05] LEARNER: Not really, it only affects Devin, and we can remove the file actually.
[81:40] COACH: So which is it — open or closed?
[81:44] LEARNER: I would have to test that more. We could add a check later.
[82:47] LEARNER: Done.
