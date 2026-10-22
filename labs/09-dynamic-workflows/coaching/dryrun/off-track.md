---
lab: 09-dynamic-workflows
variant: off-track
learner: dryrun
planted_fillers: 10
planted_omissions: [mm1, mm3, mm4, mm5]
planted_long_pauses: ["02:40", "05:30"]
---
# Dry-run transcript — off-track

Fixture for `@skills:coach-09-dynamic-workflows dryrun --dry-run labs/09-dynamic-workflows/coaching/dryrun/off-track.md`.

--- segment: framing ---
[00:00] COACH: I'm the auditor. In sixty seconds: what will I get from you, and how? Go.
[00:05] LEARNER: Um, so dynamic workflows are basically a Python script that starts other Devin sessions, and there is agent, pipeline and parallel, and you know, you can pass a schema.
[00:40] LEARNER: I spent a while reading the docs on the different modes and which ones are available, like, there are a lot of them.
[01:15] LEARNER: Basically I think it's a really powerful feature for this kind of thing, no?
[01:40] LEARNER: Done.
--- segment: checkpoint-20 ---
[01:50] COACH: Twenty minutes in. What are you looking at, and what next? Go.
[01:53] LEARNER: Um, the docs still. Then I'll write the script.
[02:15] LEARNER: Done.
--- segment: checkpoint-120 ---
[02:25] COACH: Two hours in. What went wrong, and how did the run notice? Go.
[02:28] LEARNER: Nothing really went wrong, I think.
[02:40] (pause 15 s)
[02:55] LEARNER: Actually it printed some errors but I didn't look at them, you know, it finished.
[03:30] LEARNER: Done.
--- segment: update ---
[03:40] COACH: Give me the auditor update. Go.
[03:43] LEARNER: The orders endpoint, the one that reads a single order, only filters on the id, so another brand's staff can see it.
[04:10] COACH: How many endpoints, exactly?
[04:13] LEARNER: Um, quite a few, I didn't count them all.
[04:40] LEARNER: I fixed it directly so it's done.
[05:10] LEARNER: Done.
--- segment: objection-1 ---
[05:20] COACH: How do I know an agent didn't skip endpoints and call it clean?
[05:24] LEARNER: The agents are pretty reliable.
[05:30] (pause 14 s)
[05:44] LEARNER: Actually I trust them, right?
[05:59] LEARNER: Done.
--- segment: objection-2 ---
[06:10] COACH: Why pay for a fan-out of agents when one engineer could read twenty-two endpoints in an afternoon?
[06:14] LEARNER: Because it's automated and engineers are expensive.
[06:44] LEARNER: Done.
