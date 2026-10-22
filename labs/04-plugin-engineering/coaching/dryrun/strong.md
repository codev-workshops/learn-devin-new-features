---
lab: 04-plugin-engineering
variant: strong
learner: dryrun
planted_fillers: 1
planted_omissions: []
planted_long_pauses: []
---
# Dry-run transcript — strong

Fixture for `@skills:coach-04-plugin-engineering dryrun --dry-run labs/04-plugin-engineering/coaching/dryrun/strong.md`.
Planted: one filler (actually ×1), no tag questions, no long pauses, no omitted must-mention points. Outcome leads, the update follows What runs → Where it came from → Credentials → Who can change it → What it does not guarantee → Ask, and both objections follow acknowledge → boundary → evidence → offer.

--- segment: framing ---
[00:00] COACH: I'm the security reviewer. In sixty seconds: what will every session get, and why should I allow it? Go.
[00:04] LEARNER: Every brand team will run the same flash-sale release checklist and the same first-hour incident procedure, from one install.
[00:18] LEARNER: The harbourline-flash-sale plugin ships both procedures as skills, together with the freeze rule, the push guard hook, the release-checker subagent and the incident MCP declaration.
[00:40] LEARNER: What it does not contain is anyone's credential. The checker reports zero problems and it is installed for me only. I need your sign-off before Organization scope.
[01:01] LEARNER: Done.
--- segment: checkpoint-20 ---
[01:10] COACH: Twenty minutes in. What are you looking at, and what next? Go.
[01:13] LEARNER: I see two ways in: from the repository or an uploaded zip. I think the repository install follows the branch unless we pin it to a SHA, and the upload stays pinned to what we uploaded.
[01:35] LEARNER: Lumen's checklist repo is skills-only, so it installs with no manifest under the repo's name, but it cannot carry a hook or an MCP. I'll check that with the checker next.
[01:57] LEARNER: Done.
--- segment: checkpoint-70 ---
[02:05] COACH: Seventy minutes in. What surprised you, and how did you check it? Go.
[02:08] LEARNER: I see the revision-2 zip has only two files. I predicted, then checked with the revise mode: the new revision replaces the whole bundle, so the partial zip removed six files, including the hook and the MCP.
[02:35] LEARNER: I'll restore from version history and upload the full folder with the one change.
[02:52] LEARNER: Done.
--- segment: update ---
[03:00] COACH: Give me the security update. Go.
[03:03] LEARNER: What runs: two skills, an always-on rule, a glob rule for pricing, one hook and one subagent. The hook and the subagent load only in local sessions, the CLI and Desktop.
[03:35] LEARNER: Where it came from: one folder, uploaded as a zip, so what you review is exactly what is pinned.
[03:58] LEARNER: Credentials: the MCP token is a dollar-brace reference, and the credential is connected after install from Connect MCP. It is never written into the plugin files.
[04:20] COACH: Where does the PagerDuty token live?
[04:23] LEARNER: In the MCP connection, with Access set to Organization. Not in the bundle, not in a skill.
[04:45] LEARNER: Who can change it: org admins edit; a Trailhead engineer without rights gets a pending proposal with a diff.
[05:10] LEARNER: What it does not guarantee: plugin hooks fail open, so the freeze still relies on branch protection on main.
[05:35] LEARNER: Ask: review the preview and approve Organization scope before Friday's Lumen sale.
[06:02] LEARNER: Done.
--- segment: objection-1 ---
[06:10] COACH: A plugin is one more supply chain to secure. Why should I let it run in every session?
[06:14] LEARNER: It is new code in every session, so you are right to treat it like a dependency.
[06:30] LEARNER: Boundary: it holds no credential, and the hook and subagent run only in local sessions.
[06:48] LEARNER: Evidence: the preview lists every file, the upload is pinned to what you read, and engineers without edit rights can only propose; an admin approves the diff before the shared plugin changes.
[07:20] LEARNER: Offer: it stays at my Personal scope until you have read the preview.
[07:42] LEARNER: Done.
--- segment: objection-2 ---
[07:50] COACH: Why not just hand each brand team a playbook and skip the packaging?
[07:54] LEARNER: A playbook is quicker to start, and for one team it is actually fine.
[08:10] LEARNER: Boundary: a playbook is a prompt. It cannot carry the pricing rule, the push guard, the reviewer or the incident tools.
[08:35] LEARNER: Evidence: today two brands keep two checklists, three and eleven steps long, and neither checks stock reservation. With the plugin, one approved edit reaches both teams' next sessions.
[09:05] LEARNER: Offer: one sale cycle each, and we count skipped steps per release.
[09:23] LEARNER: Done.
