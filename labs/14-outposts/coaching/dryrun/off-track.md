---
lab: 14-outposts
variant: off-track
learner: dryrun
planted_fillers: 12
planted_omissions: [mm2, mm3, mm5, mm6, mm7]
planted_long_pauses: ["01:57", "04:31"]
---
# Dry-run transcript — off-track

Fixture for `@skills:coach-14-outposts dryrun --dry-run labs/14-outposts/coaching/dryrun/off-track.md`.
Planted: twelve fillers (actually ×4, basically ×2, so yeah ×3, you know ×1, like ×1, um ×1), one tag question, a 14-second pause in the T+15 checkpoint and a 12-second pause in the update, and five omitted must-mention points (only the boundary, mm1, and the routing, mm4, are stated). The learner claims nothing leaves the VPC and bakes the token into the image.

--- segment: framing ---
[00:00] COACH: One minute. Where will our code and keys live, and what do I get on Friday? Go.
[00:05] LEARNER: So yeah, Outposts is basically, like, a private Devin.
[00:40] LEARNER: Actually the worker runs in our VPC, so the code runs there and Devin Cloud only does the thinking.
[01:10] LEARNER: It is all private now, no? Nothing leaves the VPC.
[01:35] LEARNER: So yeah. Done.

--- segment: checkpoint-15 ---
[01:47] COACH: T+15. What did you just verify, and what is next? Go.
[01:50] LEARNER: Um, I put the token in the Dockerfile so it starts without arguments.
[01:57] (pause 14 s)
[02:17] LEARNER: Actually that was quicker. Done.

--- segment: checkpoint-60 ---
[02:29] COACH: T+60. What did the replays prove, and what can they not prove? Go.
[02:34] LEARNER: The replay was, you know, mostly fine.
[03:09] LEARNER: Basically it all ran, I think, I did not look at the waiting part.
[03:39] LEARNER: Done.

--- segment: update ---
[03:51] COACH: Three minutes. Give me the update I take to legal. Go.
[03:56] LEARNER: Outcome: it is set up. Actually I also gave the worker passwordless sudo so installs work.
[04:31] (pause 12 s)
[04:51] LEARNER: People can use the default platform setting or Slack.
[05:51] LEARNER: So yeah, it should be fine. Done.

--- segment: objection-1 ---
[06:03] COACH: The control plane still sees our code, so what did we actually gain? Go.
[06:08] LEARNER: No, it does not see our code any more.
[06:43] LEARNER: Done.

--- segment: objection-2 ---
[06:55] COACH: What happens when the worker is down at 2 a.m.? Go.
[07:00] LEARNER: Then someone restarts it in the morning.
[07:25] LEARNER: Sessions will actually fail until then.
[07:50] LEARNER: Done.

--- segment: objection-3 ---
[08:02] COACH: Who patches the worker image? Go.
[08:07] LEARNER: Devin patches it, I think.
[08:37] LEARNER: Done.
