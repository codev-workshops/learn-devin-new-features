---
lab: 14-outposts
variant: mediocre
learner: dryrun
planted_fillers: 6
planted_omissions: [mm6, mm7]
planted_long_pauses: ["02:41"]
---
# Dry-run transcript — mediocre

Fixture for `@skills:coach-14-outposts dryrun --dry-run labs/14-outposts/coaching/dryrun/mediocre.md`.
Planted: six fillers (actually ×2, basically ×2, so yeah ×1, you know ×1), one tag question, an 11-second pause in the T+60 checkpoint, and two omitted must-mention points (mm6 patching ownership, mm7 live versus rehearsed).

--- segment: framing ---
[00:00] COACH: One minute. Where will our code and keys live, and what do I get on Friday? Go.
[00:04] LEARNER: So, Outposts is a Devin feature for self-hosting, and we set it up this week with Docker.
[00:30] LEARNER: Basically, the commands and the repo checkout happen on our worker in the VPC, and Devin Cloud still does the inference.
[01:14] LEARNER: You get the image and two workers on Friday. Done.

--- segment: checkpoint-15 ---
[01:26] COACH: T+15. What did you just verify, and what is next? Go.
[01:29] LEARNER: The image builds. I start it with devin worker start with the outpost name and the token.
[01:48] LEARNER: The token is only shown once, so I actually saved it in the secret manager.
[02:09] LEARNER: Next, the smoke test. Done.

--- segment: checkpoint-60 ---
[02:21] COACH: T+60. What did the replays prove, and what can they not prove? Go.
[02:24] LEARNER: The replay shows each worker takes one session, so with two containers the third session waits with a banner.
[02:41] (pause 11 s)
[03:01] LEARNER: The third one waits, right? It does not fail. So yeah, next is the report.
[03:19] LEARNER: Done.

--- segment: update ---
[03:31] COACH: Three minutes. Give me the update I take to legal. Go.
[03:35] LEARNER: Outcome: basically the image works, it has the repo, git, ffmpeg and Chrome with DEVIN_CHROME_PATH, and no passwordless sudo.
[04:21] LEARNER: People can use Slack with bang outpost, or the admin sets the organization default platform.
[05:06] LEARNER: Risk: if both teams are on it, sessions wait, you know, so maybe more workers.
[06:01] LEARNER: Ask: can we get an admin to create the Outpost? Done.

--- segment: objection-1 ---
[06:13] COACH: The control plane still sees our code, so what did we actually gain? Go.
[06:17] LEARNER: Yes, it actually does see the code, that is true.
[06:53] LEARNER: But the commands run on our machines, so it is better.
[07:23] LEARNER: Done.

--- segment: objection-2 ---
[07:35] COACH: What happens when the worker is down at 2 a.m.? Go.
[07:39] LEARNER: Fair. The session waits for a machine instead of failing.
[08:05] LEARNER: Docker restarts the container, and the second worker keeps serving meanwhile.
[08:35] LEARNER: The replay showed worker-b coming back and its session resuming.
[09:03] LEARNER: We should add an alert for that. Done.

--- segment: objection-3 ---
[09:15] COACH: Who patches the worker image? Go.
[09:19] LEARNER: Good question. Somebody has to rebuild it when the base image changes.
[09:55] LEARNER: We can figure out an owner later.
[10:17] LEARNER: Done.
