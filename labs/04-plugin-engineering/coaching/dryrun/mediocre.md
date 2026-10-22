---
lab: 04-plugin-engineering
variant: mediocre
learner: dryrun
planted_fillers: 6
planted_omissions: [mm3, mm5]
planted_long_pauses: ["03:00"]
---
# Dry-run transcript — mediocre

Fixture for `@skills:coach-04-plugin-engineering dryrun --dry-run labs/04-plugin-engineering/coaching/dryrun/mediocre.md`.

--- segment: framing ---
[00:00] COACH: I'm the security reviewer. In sixty seconds: what will every session get, and why should I allow it? Go.
[00:04] LEARNER: So I started with the manifest, plugin.json, and basically the name has to be lowercase, and then there is a skills folder.
[00:30] LEARNER: The plugin has the release skill and the incident skill, plus the rule, the hook, the subagent and the MCP, all in one plugin.
[00:55] LEARNER: The idea is every team gets the same steps.
[01:15] LEARNER: Done.
--- segment: checkpoint-20 ---
[01:25] COACH: Twenty minutes in. What are you looking at, and what next? Go.
[01:28] LEARNER: I'm looking at install options. Repo installs follow the branch unless you pin a SHA, uploads are fixed, and the Lumen repo works without a manifest.
[02:05] LEARNER: Done.
--- segment: checkpoint-70 ---
[02:15] COACH: Seventy minutes in. What surprised you, and how did you check it? Go.
[02:19] LEARNER: Um, the second upload looked different, some files were not there, I think.
[03:00] (pause 12 s)
[03:12] LEARNER: I uploaded the full folder again and it was fine.
[03:19] LEARNER: Done.
--- segment: update ---
[03:30] COACH: Give me the security update. Go.
[03:33] LEARNER: So it has two skills and some rules and a hook, and the hook blocks pushing to main during a sale.
[04:00] COACH: Where does the PagerDuty token live?
[04:03] LEARNER: It's a reference in the MCP config, and you connect the credential after install, it's not written into the plugin files.
[04:40] LEARNER: Basically it's ready for the organization, so yeah.
[06:00] LEARNER: Done.
--- segment: objection-1 ---
[06:10] COACH: A plugin is one more supply chain to secure. Why should I let it run in every session?
[06:14] LEARNER: It's actually just markdown and one small hook, and the hook stops pushes to main.
[06:50] LEARNER: And only admins can change it. I think that's enough.
[07:46] LEARNER: Done.
--- segment: objection-2 ---
[07:55] COACH: Why not just hand each brand team a playbook and skip the packaging?
[07:59] LEARNER: A playbook can't carry the hook or the MCP, and the copies drift apart.
[08:40] LEARNER: It's easier for everyone in the long run, that's the point, right?
[09:20] LEARNER: Plus teams can basically just install it.
[09:44] LEARNER: Done.
