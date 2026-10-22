---
lab: 04-plugin-engineering
variant: off-track
learner: dryrun
planted_fillers: 11
planted_omissions: [mm1, mm3, mm4, mm5]
planted_long_pauses: ["02:45", "06:40"]
---
# Dry-run transcript — off-track

Fixture for `@skills:coach-04-plugin-engineering dryrun --dry-run labs/04-plugin-engineering/coaching/dryrun/off-track.md`.

--- segment: framing ---
[00:00] COACH: I'm the security reviewer. In sixty seconds: what will every session get, and why should I allow it? Go.
[00:04] LEARNER: Um, so, plugins are basically a new feature, and you know, they're like, packages of skills.
[00:40] LEARNER: I made a skill for the release checklist. It has a lot of steps, I can read them out.
[01:20] LEARNER: And I put the PagerDuty key in the config for now so the demo works.
[01:54] LEARNER: Done.
--- segment: checkpoint-20 ---
[02:00] COACH: Twenty minutes in. What are you looking at, and what next? Go.
[02:03] LEARNER: The install screen. A repo install keeps up with the branch unless you pin a SHA. Uploads stay as uploaded and skills-only repos need no manifest.
[02:23] LEARNER: Done.
--- segment: checkpoint-70 ---
[02:30] COACH: Seventy minutes in. What surprised you, and how did you check it? Go.
[02:34] LEARNER: Uh, nothing really surprised me.
[02:45] (pause 15 s)
[03:00] LEARNER: The upload patched the one file, so that's basically fine.
[03:45] LEARNER: Done.
--- segment: update ---
[03:55] COACH: Give me the security update. Go.
[03:58] LEARNER: It works, actually. The hook guarantees nobody pushes to main, even in cloud sessions.
[04:30] COACH: Where does the PagerDuty token live?
[04:33] LEARNER: Um, in the plugin, in the MCP part, for now.
[05:33] LEARNER: Done.
--- segment: objection-1 ---
[05:40] COACH: A plugin is one more supply chain to secure. Why should I let it run in every session?
[05:44] LEARNER: It's from our own team, like, so it's safe.
[06:24] LEARNER: Done.
--- segment: objection-2 ---
[06:30] COACH: Why not just hand each brand team a playbook and skip the packaging?
[06:34] LEARNER: Plugins are basically newer, so, you know.
[06:40] (pause 14 s)
[06:54] LEARNER: They're better, right? Everyone uses them.
[08:34] LEARNER: Done.
