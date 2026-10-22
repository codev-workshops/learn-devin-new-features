---
lab: 02-lifecycle-hooks
variant: off-track
learner: dryrun
planted_fillers: 12
planted_omissions: [hk2, hk3, hk4, hk5]
planted_long_pauses: ["00:40", "60:15"]
---
# Dry-run transcript — off-track

Fixture for `@skills:coach-02-lifecycle-hooks dryrun --dry-run labs/02-lifecycle-hooks/coaching/dryrun/off-track.md`.
Planted: twelve fillers (um ×4, actually ×3, basically ×2, you know ×2, like ×1), two tag questions, long pauses at [00:40] and [60:15], and four omitted must-mention points (hk2–hk5). The learner proposes a README rule and talks about code, not the customer.

--- segment: framing ---
[00:00] COACH: Before you start — how exactly will you stop Devin from running that reset against our shared database again? Sixty seconds. Go.
[00:05] LEARNER: Um, so, basically there is the config file and the scripts and, you know, the seed script has a reset flag that is quite dangerous.
[00:40] (pause 14 s)
[00:54] LEARNER: Um, I think we write in the README and the AGENTS file that Devin should not run it, actually, and also the hook can exit 2 to block it, no?
[01:20] LEARNER: And, like, the migrations are in db slash migrations so we can look at them in review.
[01:45] LEARNER: Done.
--- segment: checkpoint-15 ---
[15:00] COACH: What are you looking at right now, and what will you check next?
[15:05] LEARNER: Um, the package json scripts. There are a lot of scripts.
[15:25] LEARNER: Done.
--- segment: checkpoint-60 ---
[60:00] COACH: Sixty minutes in. What are you looking at right now, and what will you check next?
[60:04] LEARNER: The documentation page for hooks, basically.
[60:15] (pause 15 s)
[60:30] LEARNER: I am still reading it, actually.
[60:40] LEARNER: Done.
--- segment: update ---
[75:00] COACH: Give me the update before I sign off. Go.
[75:05] LEARNER: The hook file is written and the AGENTS file has the rule, you know. I tested some commands and they worked, actually.
[75:50] LEARNER: Next I will make the PR. It should be fine, right?
[76:35] LEARNER: Done.
--- segment: objection-1 ---
[79:00] COACH: Isn't this just a lint rule?
[79:05] LEARNER: Yes, it is kind of the same idea.
[79:28] LEARNER: Done.
--- segment: objection-2 ---
[81:00] COACH: If the hook has a bug, are we locked out of our own database?
[81:06] LEARNER: Um, maybe, I am not sure. Then we can delete it.
[81:35] LEARNER: Done.
