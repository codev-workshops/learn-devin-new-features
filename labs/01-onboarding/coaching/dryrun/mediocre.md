---
lab: 01-onboarding
variant: mediocre
learner: dryrun
planted_fillers: 6
planted_omissions: [mm1, mm4]
planted_long_pauses: ["02:33"]
---
# Dry-run transcript — mediocre

Fixture for `@skills:coach-01-onboarding dryrun --dry-run labs/01-onboarding/coaching/dryrun/mediocre.md`.
Planted: six fillers (actually ×2, basically ×2, so yeah ×1, you know ×1), one tag question, one 12-second pause in the T+40 checkpoint, and two omitted must-mention points (mm1, mm4: no inclusion limit and no Ask-vs-Agent choice). The framing walks through setup steps before the outcome; the first objection concedes without evidence.

--- segment: framing ---
[00:00] COACH: One minute, and I'm not an engineer. What's the problem and what will Devin change? Go.
[00:04] LEARNER: So, first you install Node, then pnpm install, then the Python worker, then Docker for Postgres, and then you seed the database.
[00:30] LEARNER: Basically, it takes a new engineer about a week, and one of them reset the shared database.
[00:52] LEARNER: Devin will set up the blueprint, which is the machine setup, and AGENTS.md is the instructions it reads.
[01:14] LEARNER: The reset is lab:reset now, it only touches the local database. Done.

--- segment: checkpoint-10 ---
[01:28] COACH: Ten minutes in. What are you looking at, and what do you check next? Go.
[01:31] LEARNER: I see the blueprint says payroll-worker but the folder is fulfilment-worker, so the build broke.
[01:50] LEARNER: I think that is why nothing was installed.
[02:10] LEARNER: I'll fix the path and, you know, run the gates. Done.

--- segment: checkpoint-40 ---
[02:22] COACH: Forty minutes in. Same question — what are you looking at now? Go.
[02:25] LEARNER: I see two AGENTS.md files that disagree about the tests.
[02:31] LEARNER: Give me a second.
[02:33] (pause 12 s)
[02:45] LEARNER: I think the deeper one is wrong, it uses the shared database, so I delete it.
[03:12] LEARNER: Then I check the old setup page, it is the same problem, no? Done.

--- segment: update ---
[03:25] COACH: Three minutes. Tell me what's different for Monday's starter. Go.
[03:29] LEARNER: Outcome: the blueprint is fixed and the gates are green on a fresh machine.
[03:58] LEARNER: Actually, I also removed the conflicting AGENTS.md and the old setup page, and the PayGate key is only named, not stored.
[04:40] LEARNER: Our Knowledge notes are moving to Skills, so the setup steps are in the harbourline-dev skill.
[05:20] LEARNER: Risk is somebody still has an old note. So yeah, that's it.
[06:00] LEARNER: Ask: please tell Jonas to delete his note. Done.

--- segment: objection-1 ---
[06:12] COACH: Why not just fix the README? Go.
[06:16] LEARNER: We could, basically the README is also wrong.
[06:40] LEARNER: But the blueprint is what actually runs, so I fixed that first.
[07:20] LEARNER: I can fix the README too. Done.

--- segment: objection-2 ---
[07:32] COACH: Will the new hire still learn the codebase if Devin does it for them? Go.
[07:36] LEARNER: I think yes, because Devin only does the setup.
[08:10] LEARNER: They still read the code and the AGENTS.md files, and they can ask the team questions.
[09:05] LEARNER: We can pair them with someone in the first week. Done.
