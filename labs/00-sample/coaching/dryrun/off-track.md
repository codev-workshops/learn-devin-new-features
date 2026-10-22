---
lab: 00-sample
variant: off-track
learner: dryrun
planted_fillers: 12
planted_omissions: [mm1, mm3, mm4, mm5]
planted_long_pauses: ["01:05"]
---
# Dry-run transcript — off-track

Fixture for `@skills:coach-00-sample dryrun --dry-run labs/00-sample/coaching/dryrun/off-track.md`.
Planted: twelve fillers (actually ×4, basically ×2, so yeah ×3, you know ×1, like ×1, um ×1), two tag questions, one 12-second pause at [01:05], and four omitted must-mention points (only the business cost, mm2, is stated). The learner picks three problems at once, names no capability and lists commands as evidence.

--- segment: framing ---
[00:00] COACH: Hi, I'm the Harbourline platform lead. You have read the brief. In sixty seconds: what will you put in front of Devin first, and why? Go.
[00:06] LEARNER: So, basically, there are a lot of problems. Actually, the oversell one is bad, the rounding one is bad, and the leak is a security thing, so I would do those three first, you know.
[00:35] LEARNER: It costs you money — during Lamp Week you sold lamps you did not have, so maybe forty orders, and the rounding is a few cents on three percent of orders, so, yeah, that adds up.
[01:05] (pause 12 s)
[01:17] LEARNER: Um, I would just ask Devin to look at all of it and fix what it finds, like, in one go, and then we run the tests.
[01:40] LEARNER: And I will know it worked when pnpm test is green and the report balances, isn't it? Actually, basically, that's it.
[01:52] LEARNER: Done.
--- segment: checkpoint-10 ---
[02:10] COACH: Ten minutes in. What are you looking at right now, and what will you check next?
[02:14] LEARNER: I'm looking at the brief again. I'm not sure. I'll check later.
[02:30] LEARNER: Done.
--- segment: update ---
[02:40] COACH: Give me the update as if I were paying for it. Go.
[02:45] LEARNER: So, yeah, the update is that we start with the oversell, the leak and the rounding, and Devin fixes them.
[03:10] LEARNER: Evidence would be that the tests pass and the migrations run. Actually, we might need a schema change for the inventory lock, no?
[03:40] COACH: How many orders are we talking about?
[03:43] LEARNER: I don't remember the number exactly, a few hundred maybe. The next step is to start the session.
[03:55] LEARNER: Done.
--- segment: objection-1 ---
[04:10] COACH: How do you know Devin will respect our no-schema-change rule? A paragraph in a markdown file is not a lock.
[04:14] LEARNER: I think it will be fine, Devin follows instructions usually. If not we can revert.
[04:30] LEARNER: Done.
--- segment: objection-2 ---
[05:00] COACH: Why pay for an agent to write a plan a senior engineer writes in ten minutes?
[05:05] LEARNER: Well, the senior engineer is busy, and Devin can do a lot more than a plan, it can actually write the code and the tests and the migrations and the docs, and it can also run the scans and the review.
[06:00] LEARNER: So, yeah, it is cheaper per hour, and it does not get tired, and it can work at night when the engineers are asleep, and if it is wrong we just redo it.
[06:50] LEARNER: Also other companies use it, so it is probably worth it. I think that answers it.
[07:15] LEARNER: Done.
