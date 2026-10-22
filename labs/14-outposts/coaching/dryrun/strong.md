---
lab: 14-outposts
variant: strong
learner: dryrun
planted_fillers: 1
planted_omissions: []
planted_long_pauses: []
---
# Dry-run transcript — strong

Fixture for `@skills:coach-14-outposts dryrun --dry-run labs/14-outposts/coaching/dryrun/strong.md`.
Planted: one filler (actually ×1), no tag questions, no long pauses, no omitted must-mention points. The boundary leads, the update follows Outcome → Evidence → Risk → Next action → Ask, and all three objections follow acknowledge → boundary → evidence → offer.

--- segment: framing ---
[00:00] COACH: One minute. Where will our code and keys live, and what do I get on Friday? Go.
[00:03] LEARNER: Execution moves into our VPC; inference does not.
[00:18] LEARNER: With an Outpost, every command, file edit and repo checkout runs on a Harbourline worker inside the VPC, and the PayGate sandbox keys stay in our secret store; Devin Cloud keeps planning and inference.
[00:40] LEARNER: By Friday you get a worker image we build and own, two workers on it, and engineers reaching it from web, Slack and the default setting.
[00:58] LEARNER: And a table that says which parts I saw live and which I rehearsed. Done.

--- segment: checkpoint-15 ---
[01:10] COACH: T+15. What did you just verify, and what is next? Go.
[01:13] LEARNER: I built the image from the repo root and the policy check prints nine ok lines.
[01:30] LEARNER: The worker starts with devin worker start, the outpost name harbourline-vpc and its token; the token is shown once, so it went straight into the secret manager and is injected at run time, never in the image.
[01:54] LEARNER: Next I run the smoke test inside the image. Done.

--- segment: checkpoint-60 ---
[02:06] COACH: T+60. What did the replays prove, and what can they not prove? Go.
[02:09] LEARNER: The replays proved the queue rules: one session per worker, so our two containers ran S1 and S2 and S3 waited under the banner until S1 finished; it never failed.
[02:36] LEARNER: They cannot prove the live UI; that needs a real Outpost. Next I write the live-versus-rehearsed table.
[02:52] LEARNER: Done.

--- segment: update ---
[03:04] COACH: Three minutes. Give me the update I take to legal. Go.
[03:07] LEARNER: Outcome: the Harbourline worker image is ready and passes every check; sessions on it keep the repo and keys inside the VPC.
[03:44] LEARNER: Evidence: the smoke test exits zero; the image bakes in the repo with git, ffmpeg and Chrome through DEVIN_CHROME_PATH, runs as a non-root user and grants no passwordless sudo.
[04:24] LEARNER: Engineers reach it three ways: pick harbourline-vpc on the web, type bang outpost in Slack, or do nothing once an admin makes it the organization default platform.
[04:59] LEARNER: Risk: at 09:00 two teams fill both workers, so a third session waits; if that happens daily we add worker-c.
[05:24] LEARNER: Live versus rehearsed: the image build ran here; worker registration, Slack and the default platform only ran on the offline queue model, because we have no Outpost permission yet.
[05:49] LEARNER: Next action: create the Outpost with an admin. Ask: who on your team holds the token?
[06:02] LEARNER: Done.

--- segment: objection-1 ---
[06:14] COACH: The control plane still sees our code, so what did we actually gain? Go.
[06:17] LEARNER: Fair point, and actually I will not pretend otherwise: the model sees what a session reads.
[06:39] LEARNER: What changed is execution. The checkout, the keys and every command now live on our hosts, behind our egress rules, with outbound HTTPS only.
[07:14] LEARNER: Evidence: the image and the runbook show nothing is cloned onto Devin machines.
[07:42] LEARNER: If you want less exposure still, we keep PayGate keys out of the repo and narrow what sessions read. Done.

--- segment: objection-2 ---
[07:54] COACH: What happens when the worker is down at 2 a.m.? Go.
[07:57] LEARNER: Then the session waits for a machine; it does not fail.
[08:19] LEARNER: The container restarts on its own, and with two workers the other one keeps serving.
[08:49] LEARNER: The replay shows worker-b dying at 02:00 and its session resuming when it came back.
[09:20] LEARNER: I will add an alert when fewer than two workers are healthy. Done.

--- segment: objection-3 ---
[09:32] COACH: Who patches the worker image? Go.
[09:35] LEARNER: We do: platform engineering owns it.
[09:57] LEARNER: We rebuild from the stable base every week and on any CVE notice, and roll one worker at a time so capacity never drops to zero.
[10:32] LEARNER: The smoke test gates every rollout, and we keep the previous tag to roll back.
[11:02] LEARNER: I can put the schedule in the runbook today. Done.
