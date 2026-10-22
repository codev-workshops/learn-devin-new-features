---
lab: 01-onboarding
variant: strong
learner: dryrun
planted_fillers: 1
planted_omissions: []
planted_long_pauses: []
---
# Dry-run transcript — strong

Fixture for `@skills:coach-01-onboarding dryrun --dry-run labs/01-onboarding/coaching/dryrun/strong.md`.
Planted: one filler (actually ×1), no tag questions, no long pauses, no omitted must-mention points. Every segment within ±5 s of target.

--- segment: framing ---
[00:00] COACH: One minute, and I'm not an engineer. What's the problem and what will Devin change? Go.
[00:03] LEARNER: Today every new engineer loses their first week to setup, and last month one of them wiped the shared database by following an old note.
[00:20] LEARNER: Starting Monday, the machine Devin works on comes up ready by itself, because the blueprint prepares the machine, and AGENTS.md tells Devin how to work in the repo.
[00:41] LEARNER: The only reset anyone is pointed at is lab:reset; it reseeds the local database by default, so no doc exports a shared URL.
[01:02] LEARNER: You will know it worked when Monday's starter runs every check on day one without asking anyone. Done.

--- segment: checkpoint-10 ---
[01:15] COACH: Ten minutes in. What are you looking at, and what do you check next? Go.
[01:18] LEARNER: I see the repository blueprint in settings still installs services/payroll-worker, and that folder no longer exists; the worker is services/fulfilment-worker.
[01:36] LEARNER: I think that one stale path is why the snapshot build failed and sessions start with nothing installed.
[01:48] LEARNER: I'll try the corrected maintenance commands by hand.
[01:59] LEARNER: I'll check every gate exits zero before I save it. Done.

--- segment: checkpoint-40 ---
[02:10] COACH: Forty minutes in. Same question — what are you looking at now? Go.
[02:13] LEARNER: I see a new AGENTS.md under services/api/src telling people to test against the shared database.
[02:28] LEARNER: I think the safety rules in the root file win, so I delete it on a throwaway branch rather than add a third note.
[02:56] LEARNER: I'll check the budget tool: only the first 16 KiB of each AGENTS.md is read automatically, per file, and all six of ours are under it. Done.

--- segment: update ---
[03:08] COACH: Three minutes. Tell me what's different for Monday's starter. Go.
[03:12] LEARNER: Outcome: a fresh session now comes up with every check green and nobody types a setup command.
[03:35] LEARNER: Evidence: I fixed the one wrong path in the blueprint, ran all four gates on a clean machine, and every one exited zero.
[04:05] LEARNER: The instructions agree now: I removed the conflicting note and reduced the old setup page to a pointer, and the PayGate key is documented by name only, never by value.
[04:40] LEARNER: The repeated setup steps live in one skill, harbourline-dev, because our old Knowledge notes are moving to Skills anyway.
[05:05] LEARNER: For questions like where the seed is defined I used Ask Devin, because it only reads the code; for the gates and the reset I used an Agent session, because those have to run.
[05:35] LEARNER: Risk: nothing in code stops a reset against a shared address, so I have proposed a guard to the API owners.
[06:06] LEARNER: Ask: can you add lab:reset to the day-one checklist so Monday's starter learns it first? Done.

--- segment: objection-1 ---
[06:18] COACH: Why not just fix the README? Go.
[06:21] LEARNER: Fair question, and I did correct the stale lines.
[06:32] LEARNER: But a README is read by a person; the blueprint is what builds the machine, so a fix there is executed every session instead of hoped for.
[07:05] LEARNER: The proof is the clean build: gates green with no manual steps.
[07:47] LEARNER: Next step: I will retire the old page and point it at the skill. Done.

--- segment: objection-2 ---
[07:58] COACH: Will the new hire still learn the codebase if Devin does it for them? Go.
[08:02] LEARNER: Yes. Setup is where the first week disappears, not where people learn.
[08:25] LEARNER: Devin gets the machine ready; your starter spends that week in the code, reading the same AGENTS.md rules Devin follows.
[09:00] LEARNER: Actually, the rules they must learn by hand, money and brands, are written down once.
[09:29] LEARNER: Next step: pair them on one real ticket on day two. Done.
