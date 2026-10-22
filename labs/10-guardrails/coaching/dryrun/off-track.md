---
lab: 10-guardrails
variant: off-track
learner: dryrun
planted_fillers: 10
planted_omissions: [mm1, mm3, mm4, mm5]
planted_long_pauses: ["01:50", "05:10"]
---
# Dry-run transcript — off-track

Fixture for `@skills:coach-10-guardrails dryrun --dry-run labs/10-guardrails/coaching/dryrun/off-track.md`.

--- segment: framing ---
[00:00] COACH: I'm the CISO. In sixty seconds: where can our sessions talk to now, and what keeps it that way? Go.
[00:04] LEARNER: Um, so security profiles are basically a feature in settings, and there's like, a lot of options in there.
[00:40] LEARNER: You can set network stuff and git stuff and, you know, the token thing.
[01:20] LEARNER: I set it to recommended so teams aren't blocked, basically.
[01:40] LEARNER: Done.
--- segment: checkpoint-10 ---
[01:45] COACH: Ten minutes in. What are you looking at, and what next? Go.
[01:48] LEARNER: Uh, the JSON.
[01:50] (pause 14 s)
[02:04] LEARNER: I put npm in the network list and the MCP list is separate I guess, it's empty.
[02:50] LEARNER: Done.
--- segment: checkpoint-45 ---
[03:00] COACH: I just tightened the PayGate entry. What happens to sessions already running? Go.
[03:03] LEARNER: They get it, actually.
[03:20] LEARNER: Done.
--- segment: update ---
[03:30] COACH: Give me the update I can repeat to the committee. Go.
[03:33] LEARNER: So yeah, profiles are set up and guardrails are on.
[04:00] COACH: Who can loosen it?
[04:03] LEARNER: Teams can if they need to, it's recommended, that's the point, no?
[04:40] LEARNER: Um, and sessions can ask for access when they need it.
[05:10] (pause 13 s)
[05:40] LEARNER: Done.
--- segment: objection-1 ---
[05:50] COACH: A profile is config — what stops a developer turning it off?
[05:53] LEARNER: The guardrails would catch it, basically.
[06:30] LEARNER: Done.
--- segment: objection-2 ---
[06:40] COACH: This will block legitimate npm installs.
[06:43] LEARNER: We just approve it in the session.
[07:05] LEARNER: Done.
