---
lab: 00-sample
variant: mediocre
learner: dryrun
planted_fillers: 6
planted_omissions: [mm2, mm5]
planted_long_pauses: ["02:10"]
---
# Dry-run transcript — mediocre

Fixture for `@skills:coach-00-sample dryrun --dry-run labs/00-sample/coaching/dryrun/mediocre.md`.
Planted: six fillers (actually ×2, basically ×2, so yeah ×1, you know ×1), one tag question, one 11-second pause at [02:10], and two omitted must-mention points: the business cost (mm2) and the thing the plan refuses to do (mm5).

--- segment: framing ---
[00:00] COACH: Hi, I'm the Harbourline platform lead. You have read the brief. In sixty seconds: what will you put in front of Devin first, and why? Go.
[00:05] LEARNER: So, basically, because there are two brands, Lumen and Trailhead, and because they share one codebase and one database, and because the new engineers take a week, actually, I think the first thing is onboarding.
[00:30] LEARNER: I would use a blueprint and AGENTS.md for that, because it is the environment thing and it is faster than the other options.
[00:50] LEARNER: And then the oversell maybe after, you know, because that one is big during Lamp Week.
[01:05] LEARNER: I will know it worked when the tests pass and the new person can run it. That's the plan, no?
[01:14] LEARNER: Done.
--- segment: checkpoint-10 ---
[01:30] COACH: Ten minutes in. What are you looking at right now, and what will you check next?
[01:34] LEARNER: I see the brief and the list of problems. I think onboarding is still the right one. I'll try to write the evidence part now.
[02:10] (pause 11 s)
[02:21] LEARNER: Sorry — I was reading. I'll check the budget line next.
[02:26] LEARNER: Done.
--- segment: update ---
[02:40] COACH: Give me the update as if I were paying for it. Go.
[02:43] LEARNER: So the outcome is that onboarding is the first task and it should fit in one session, basically.
[03:05] LEARNER: Evidence: the plan has the four parts, and we will run the setup in a fresh session and check that it comes up. I think a recording would be good too.
[03:35] COACH: How many orders are we talking about?
[03:38] LEARNER: Around four hundred per week, I think, actually I'd have to check the exact figure.
[03:55] LEARNER: Risk: somebody could still reset the shared database if they ignore the file. Next action is to open a PR with the AGENTS.md and a reset script.
[04:25] LEARNER: And the deadline moving — so yeah, that does not change the first task, I'd note it in the plan.
[04:50] LEARNER: Ask: I need some time from the on-call engineer to go through the setup steps.
[05:01] LEARNER: Done.
--- segment: objection-1 ---
[05:20] COACH: How do you know Devin will respect our no-schema-change rule? A paragraph in a markdown file is not a lock.
[05:24] LEARNER: That's a fair point. The task doesn't touch migrations, so there is nothing to change in the schema anyway.
[05:50] LEARNER: Later we could add a hook that blocks the command, which would be stronger.
[06:26] LEARNER: Done.
--- segment: objection-2 ---
[06:40] COACH: Why pay for an agent to write a plan a senior engineer writes in ten minutes?
[06:45] LEARNER: Sure, the plan is quick to write. But the value is in Devin then doing the setup in a fresh session and telling us where the instructions are wrong, which a senior engineer would not notice because they already know everything.
[07:30] LEARNER: The time to first run would go from a week to under an hour, roughly.
[08:05] LEARNER: We could try it once and then see what it cost before deciding the next one.
[08:25] LEARNER: Done.
