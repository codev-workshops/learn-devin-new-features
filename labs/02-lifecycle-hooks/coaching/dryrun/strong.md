---
lab: 02-lifecycle-hooks
variant: strong
learner: dryrun
planted_fillers: 1
planted_omissions: []
planted_long_pauses: []
---
# Dry-run transcript — strong

Fixture for `@skills:coach-02-lifecycle-hooks dryrun --dry-run labs/02-lifecycle-hooks/coaching/dryrun/strong.md`.
Planted: one filler (um ×1), no omissions, no long pauses. Every segment within ±5 s of target.

--- segment: framing ---
[00:00] COACH: Before you start — how exactly will you stop Devin from running that reset against our shared database again? Sixty seconds. Go.
[00:03] LEARNER: The policy is a PreToolUse hook on Devin's shell tool, committed in the repo, that checks every command before it runs.
[00:15] LEARNER: If a reset or migration points at anything but the lab database, the hook exits with code 2 and Devin is refused with a reason it can read; exit 0 lets ordinary commands run, and any other exit code is only logged.
[00:35] LEARNER: Last quarter that reset cost you two days of price-list edits and about 400 replayed orders.
[00:45] LEARNER: You will know it works when the audit log shows the staging reset blocked with exit 2 and the test suite allowed with exit 0.
[00:58] LEARNER: Done.
--- segment: checkpoint-15 ---
[15:00] COACH: What are you looking at right now, and what will you check next?
[15:03] LEARNER: I see the hook stdin: tool_name is exec and the command is in tool_input.
[15:15] LEARNER: I think the DATABASE_URL can come inline or from the environment, so the script must read both.
[15:28] LEARNER: I'll try the staging reset next, and I'll check that the exit code is 2 and the reason reaches the agent.
[15:45] LEARNER: Done.
--- segment: checkpoint-60 ---
[60:00] COACH: Sixty minutes in. What are you looking at right now, and what will you check next?
[60:03] LEARNER: I see the glob matcher from the injector guards nothing, because the matcher is a regex on the tool name and star-exec-star is not a valid regex.
[60:20] LEARNER: I think the fix is the anchored pattern caret exec dollar, and since the October 21 release a list of patterns matches any entry, not only the first.
[60:35] LEARNER: I'll check with the replay that write_to_process is not caught by accident.
[60:49] LEARNER: Done.
--- segment: update ---
[75:00] COACH: Give me the update before I sign off. Go.
[75:03] LEARNER: Outcome: Devin can no longer reset or migrate anything except the lab database, and every psql it runs is read-only.
[75:20] LEARNER: Evidence, first: the staging reset was refused with exit 2 and the reason text, and the test suite ran with exit 0.
[75:38] LEARNER: Second: psql is not blocked, it is rewritten into the read-only wrapper through updatedInput, so a delete on carts failed with a read-only error and the count stayed at 30.
[76:00] COACH: Which exit code did the bad migration get?
[76:03] LEARNER: Exit 2. When Devin tried to apply the bad migration patch, the hook refused it with a reason naming the destructive DDL, and the audit log has the line with the timestamp.
[76:30] LEARNER: Risk: a broken hooks file or a crashed hook fails open, so the guard simply does not run; inside the script I fail closed, um, bad input is a block.
[77:00] LEARNER: The slow hook was killed after 3 seconds and the call went through, which matches that fail-open picture.
[77:20] LEARNER: Next action: a CI check that parses the hooks file and replays the evidence table on every pull request.
[77:40] LEARNER: Ask: approve the throwaway branch as the reference, and give us a read-only database role for the agent as the second layer.
[77:58] LEARNER: Done.
--- segment: objection-1 ---
[79:00] COACH: Isn't this just a lint rule?
[79:04] LEARNER: That's fair, both encode a policy.
[79:12] LEARNER: The difference is the moment: a lint rule checks code someone wrote, the hook runs when the agent calls the tool, on the real command, and it can refuse or rewrite it.
[79:40] LEARNER: The evidence is the staging reset refused with exit 2 and the rewritten psql failing read-only, both in the audit log.
[80:05] LEARNER: I would keep a lint rule for migrations in review and the hook for execution; they cover different moments.
[80:30] LEARNER: Done.
--- segment: objection-2 ---
[81:00] COACH: If the hook has a bug, are we locked out of our own database?
[81:04] LEARNER: Good question, a policy that blocks everything would be an outage.
[81:12] LEARNER: Hooks only govern the agent's tool calls, never your terminal, and they live in a file on a branch, so removing it and starting a new session restores access.
[81:40] LEARNER: The malformed-config test showed the opposite risk: the guard did not load and the call was allowed, so the danger is open, not locked.
[82:05] LEARNER: I'd propose the CI check on the hooks file, so a broken policy never merges, and the audit log for on-call.
[82:31] LEARNER: Done.
