---
lab: 10-guardrails
variant: mediocre
learner: dryrun
planted_fillers: 6
planted_omissions: [mm3, mm5]
planted_long_pauses: ["02:40"]
---
# Dry-run transcript — mediocre

Fixture for `@skills:coach-10-guardrails dryrun --dry-run labs/10-guardrails/coaching/dryrun/mediocre.md`.

--- segment: framing ---
[00:00] COACH: I'm the CISO. In sixty seconds: where can our sessions talk to now, and what keeps it that way? Go.
[00:04] LEARNER: So I made three profiles in a JSON file, harbourline-floor, harbourline-dev and harbourline-automation, and basically ran the resolver on them.
[00:30] LEARNER: The enterprise one is mandatory, which means it's a floor nobody below can loosen. Recommended would just be a default.
[00:55] LEARNER: Sessions get the registry and the sandbox.
[01:12] LEARNER: Done.
--- segment: checkpoint-10 ---
[01:20] COACH: Ten minutes in. What are you looking at, and what next? Go.
[01:23] LEARNER: I'm looking at the lists. MCP is its own allowlist, separate from network, so the MCP list stays empty and the package registry and PayGate sandbox go in hosts.
[02:00] LEARNER: Done.
--- segment: checkpoint-45 ---
[02:10] COACH: I just tightened the PayGate entry. What happens to sessions already running? Go.
[02:14] LEARNER: Um, I re-ran the resolver with the new file and it shows the API host only.
[02:40] (pause 11 s)
[02:51] LEARNER: So the change is applied, I think everyone gets it.
[03:15] LEARNER: Done.
--- segment: update ---
[03:25] COACH: Give me the update I can repeat to the committee. Go.
[03:28] LEARNER: We have a mandatory floor with the package registry and PayGate sandbox, an org default, and a stricter automation profile.
[04:00] COACH: Who can loosen it?
[04:03] LEARNER: Nobody really, it's mandatory. And child sessions follow the parent's chain, so helpers can't get around it.
[04:40] LEARNER: Guardrails are on too. It's basically ready, so yeah.
[06:00] LEARNER: Done.
--- segment: objection-1 ---
[06:10] COACH: A profile is config — what stops a developer turning it off?
[06:14] LEARNER: It's mandatory, so a developer can't, and AI Guardrails would block anything that tries to get out anyway.
[06:55] LEARNER: Only admins can change it.
[07:40] LEARNER: Done.
--- segment: objection-2 ---
[07:50] COACH: This will block legitimate pnpm installs.
[07:54] LEARNER: The registry is on the list, you know, so installs work.
[08:40] LEARNER: If something breaks we can actually add hosts later, that's fine, right?
[09:40] LEARNER: Done.
