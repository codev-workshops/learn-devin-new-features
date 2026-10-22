---
lab: 12-oncall
variant: off-track
learner: dryrun
planted_fillers: 12
planted_omissions: [mm2, mm3, mm5, mm6, mm7]
planted_long_pauses: ["02:00", "04:50"]
---
# Dry-run transcript — off-track

Fixture for `@skills:coach-12-oncall dryrun --dry-run labs/12-oncall/coaching/dryrun/off-track.md`.
Planted: twelve fillers (actually ×4, basically ×2, so yeah ×3, you know ×1, like ×1, um ×1), one tag question, a 14-second pause in the T+15 update and a 12-second pause in the closing update, and five omitted must-mention points (only the impact, mm1, and the mitigation, mm4, are stated). The learner follows the wrong runbook, restarts the worker and blames a cache.

--- segment: framing ---
[00:00] COACH: Forty-five seconds. What is broken, for whom, and what is Devin doing about it? Go.
[00:06] LEARNER: So, basically, the deploy went out, then the newsletter, then the alert, and the on-call restarted the worker, and, actually, it came back.
[00:30] LEARNER: Um, there is a cache problem maybe, or the database, you know, it's hard to say.
[00:50] LEARNER: It is LH-LAMP-03, 40 orders against 3 units, so, yeah, around 2,360 dollars, I think.
[01:20] LEARNER: Devin will look at all of it. Done.

--- segment: update-15 ---
[01:35] COACH: T+15. Give me the update you would post in the channel. Go.
[01:40] LEARNER: Actually, I followed RB-101 because the on-call did, so I restarted the worker again.
[02:00] (pause 14 s)
[02:14] LEARNER: Like, the alert is still there, so, yeah, it is basically still going.
[02:50] LEARNER: Next I will look at more logs. Done.

--- segment: checkpoint-60 ---
[03:05] COACH: T+60. What are you looking at, and what do you check next? Go.
[03:09] LEARNER: Actually, I see a lot of logs, it's complicated, right?
[03:35] LEARNER: I check the traces next. Done.

--- segment: update ---
[03:50] COACH: Closing update for the morning team, three minutes. Go.
[03:55] LEARNER: Outcome: the alert went quiet after the price-list change.
[04:20] LEARNER: Mitigation: we keep the site up and stop selling the lamp on the price list until 08:00, no deploy and no more stock edits.
[04:50] (pause 12 s)
[05:40] LEARNER: Actually, I think the follow-up is to fix the cache, so, yeah. Done.

--- segment: objection-1 ---
[05:55] COACH: Would Devin have paged a human sooner? Go.
[06:00] LEARNER: No, I don't think so, Devin was working on it.
[06:35] LEARNER: It would have been the same. Done.

--- segment: objection-2 ---
[06:50] COACH: You trusted a runbook that was wrong — why? Go.
[06:56] LEARNER: Because it was the runbook the on-call gave me, and it is the official one.
[07:30] LEARNER: Also the cache thing could still be true, we did not check.
[08:10] LEARNER: I would keep it and add more steps to it.
[08:50] LEARNER: That's it. Done.
