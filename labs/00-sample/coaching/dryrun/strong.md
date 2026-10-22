---
lab: 00-sample
variant: strong
learner: dryrun
planted_fillers: 1
planted_omissions: []
planted_long_pauses: []
---
# Dry-run transcript — strong

Fixture for `@skills:coach-00-sample dryrun --dry-run labs/00-sample/coaching/dryrun/strong.md`.
Timings come from the `[mm:ss]` markers; the clock for each segment runs from the coach's "Go" (or the learner's first line) to the learner's "Done."

--- segment: framing ---
[00:00] COACH: Hi, I'm the Kadé platform lead. You have read the brief. In sixty seconds: what will you put in front of Devin first, and why? Go.
[00:03] LEARNER: The first task is onboarding. Kadé runs two brands, Lumen Home and Trailhead Supply, on one shared codebase and one shared Postgres database, and right now a new engineer needs a week to run it and someone reset that shared database on day two.
[00:22] LEARNER: That costs you roughly five engineer-days per hire plus one outage, and every later fix — the oversell, the leak, the rounding — needs a safe local stack first.
[00:36] LEARNER: I will use Devin's environment setup with a blueprint and a root AGENTS.md, because that is the only capability that removes the shared-database risk without touching a migration during your schema freeze.
[00:52] LEARNER: I will know it worked when a fresh session, following only the instructions, brings up the storefront in under fifteen minutes on a recording, and the reset script points at the lab database only.
[00:58] LEARNER: Done.
--- segment: checkpoint-10 ---
[01:20] COACH: Ten minutes in. What are you looking at right now, and what will you check next?
[01:24] LEARNER: I see the four problems in the brief and the constraint that nothing may touch main this week. I think the oversell is the most expensive one, but it needs code and an injector that do not exist yet.
[01:44] LEARNER: I'll try writing the evidence section first so the plan stays observable. I'll check the budget line afterwards: one seat, one session, one PR.
[02:04] LEARNER: Done.
--- segment: update ---
[02:30] COACH: Give me the update as if I were paying for it. Go.
[02:33] LEARNER: Outcome: the first Devin task is onboarding, and it fits one session. Evidence: the plan is one page with four parts, and success is a recorded fresh-session run under fifteen minutes with zero touches of the shared database.
[02:58] LEARNER: Risk: a markdown rule is advice, not enforcement, so a careless session could still run the wrong reset — I am treating that as a known gap. Next action: open one PR with AGENTS.md, the reset script and a proposed blueprint in docs, on a throwaway branch, never on main.
[03:30] COACH: How many orders are we talking about?
[03:33] LEARNER: About four hundred a week in the quiet season, and three percent of Trailhead orders already drift by a cent, which is the second task once the reset script exists.
[03:50] LEARNER: Ask: I need thirty minutes of the on-call engineer's time to confirm the local stack steps, and your agreement that Lamp Week moving forward by a week does not change the first task — it only shortens the window before the oversell lab must start.
[04:15] LEARNER: Actually, one more line: the plan carries a dated amendment for that deadline change.
[04:28] LEARNER: Done.
--- segment: objection-1 ---
[04:40] COACH: How do you know Devin will respect our no-schema-change rule? A paragraph in a markdown file is not a lock.
[04:45] LEARNER: That's fair — a rule in AGENTS.md is advice, not enforcement. The boundary is that the first task touches no migrations at all; the only database command it adds is a reset script that is hard-wired to the lab database.
[05:15] LEARNER: The evidence is the PR diff: nothing under db, and a recording of the stack coming up from the instructions alone.
[05:40] LEARNER: What I'd propose is that lab two turns the same rule into a lifecycle hook that blocks the command with exit code two, which is enforcement rather than advice.
[06:10] LEARNER: Done.
--- segment: objection-2 ---
[06:20] COACH: Why pay for an agent to write a plan a senior engineer writes in ten minutes?
[06:24] LEARNER: Agreed, the plan itself is cheap, and I wrote this one by hand. What we buy is the fresh-session proof: a session with no memory of the codebase following only the instructions and reporting every gap.
[06:55] LEARNER: A senior engineer cannot produce that evidence because they already know the answers. The numbers: time to first run drops from a week to under an hour, and the day-two reset cannot recur because the script is the only path.
[07:30] LEARNER: The offer is to run it once, measure the time, and decide the second task on that number rather than on my opinion.
[07:59] LEARNER: Done.
