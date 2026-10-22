---
lab: 10-guardrails
variant: strong
learner: dryrun
planted_fillers: 1
planted_omissions: []
planted_long_pauses: []
---
# Dry-run transcript — strong

Fixture for `@skills:coach-10-guardrails dryrun --dry-run labs/10-guardrails/coaching/dryrun/strong.md`.

--- segment: framing ---
[00:00] COACH: I'm the CISO. In sixty seconds: where can our sessions talk to now, and what keeps it that way? Go.
[00:04] LEARNER: From today every Devin session can reach two places: the npm registry and the PayGate sandbox. Nothing else, and no MCP servers.
[00:22] LEARNER: What makes that stick is one word: mandatory. The enterprise profile is a floor that no organization, automation or session can loosen. A recommended profile would only be a default that anyone below can replace.
[00:45] LEARNER: What I need from you is one decision about two Python hosts for our build.
[00:58] LEARNER: Done.
--- segment: checkpoint-10 ---
[01:10] COACH: Ten minutes in. What are you looking at, and what next? Go.
[01:13] LEARNER: I see two lists, not one. Network and MCP are separate allowlists. I think npm and star-dot-sandbox-dot-paygate go in the host list, and the MCP list stays empty until you approve a server.
[01:38] LEARNER: I'll try the resolver on all five targets next, and I'll check that example.com and production PayGate come back blocked.
[01:54] LEARNER: Done.
--- segment: checkpoint-45 ---
[02:05] COACH: I just tightened the PayGate entry. What happens to sessions already running? Go.
[02:08] LEARNER: I see the floor-tightened file. A session that is already running keeps the profile it resolved until it wakes or reboots. New sessions get your change straight away.
[02:32] LEARNER: I checked it with the then option: the webhooks host still works now and is blocked after the next wake. If it's urgent, owners put sessions to sleep.
[02:52] LEARNER: Done.
--- segment: update ---
[03:05] COACH: Give me the update I can repeat to the committee. Go.
[03:08] LEARNER: What is enforced: sessions reach registry.npmjs.org and the PayGate sandbox, and nothing else. No MCP servers.
[03:30] LEARNER: Where it is set: kade-floor, an enterprise profile, mandatory, bound as the enterprise default.
[03:50] COACH: Who can loosen it?
[03:53] LEARNER: Only an enterprise admin, by editing kade-floor. A session that picks no profile still gets the floor; I resolved it.
[04:20] LEARNER: What runs stricter: the webhook-triage automation gets read-only git and read-only Devin MCP, and npm only.
[04:45] LEARNER: Helpers: child sessions are governed by their parent's chain, so delegating work cannot step outside the floor.
[05:10] LEARNER: When changes land: new sessions at once, running sessions on their next wake.
[05:30] LEARNER: What it does not cover: messages. AI Guardrails screens those; I suggest log only for a week, then block for exfiltration and injection.
[05:50] LEARNER: My ask: decide on pypi.org and files.pythonhosted.org for the snapshot build.
[06:07] LEARNER: Done.
--- segment: objection-1 ---
[06:20] COACH: A profile is config — what stops a developer turning it off?
[06:24] LEARNER: It is a setting, you're right. The boundary is who can edit it: kade-floor is enterprise scope and mandatory, so only enterprise admins change it.
[06:52] LEARNER: Below it, an opt-out is ignored and a mid-session approval for a new host is clamped. And the write paths are closed in the profile itself: the GitHub CLI token is removed, git access is set per level, and automations get Devin MCP read-only.
[07:30] LEARNER: I'll send you the resolver output after every change so you can see it held.
[07:52] LEARNER: Done.
--- segment: objection-2 ---
[08:05] COACH: This will block legitimate npm installs.
[08:09] LEARNER: That would hurt, I agree. But all 1,302 remote packages in our lockfile come from one host, registry.npmjs.org, and the three install scripts fetch nothing else.
[08:45] LEARNER: The real break is the snapshot build: two hosts for the Python worker. One decision from you fixes all builds.
[09:15] LEARNER: Anything else shows up as a blocked request we review, um, not a silent hole.
[09:41] LEARNER: Done.
