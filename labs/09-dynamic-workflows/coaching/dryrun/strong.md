---
lab: 09-dynamic-workflows
variant: strong
learner: dryrun
planted_fillers: 1
planted_omissions: []
planted_long_pauses: []
---
# Dry-run transcript — strong

Fixture for `@skills:coach-09-dynamic-workflows dryrun --dry-run labs/09-dynamic-workflows/coaching/dryrun/strong.md`.
Timings come from the `[mm:ss]` markers: from the coach's "Go" (or the learner's first line) to the learner's "Done."

--- segment: framing ---
[00:00] COACH: I'm the auditor. In sixty seconds: what will I get from you, and how? Go.
[00:03] LEARNER: You get a verdict for every endpoint the API serves. That is twenty-two endpoints in seven route files, and the count comes from the code, not from me.
[00:20] LEARNER: I ran it as a workflow: one audit agent per route file, a fixer per file with a confirmed leak, and a separate verifier, each on its own machine.
[00:38] LEARNER: The first run was a slice of two files, carts and orders, so finance saw the cost before approving the whole API.
[00:55] LEARNER: Done.
--- segment: checkpoint-20 ---
[01:10] COACH: Twenty minutes in. What are you looking at, and what next? Go.
[01:13] LEARNER: I see the seven route files and the regex that lists their endpoints. I think orders is the riskiest file, because it is the only one that reads a row by id. That is why it is in the slice.
[01:35] LEARNER: I'll try the slice with carts as the control. I'll check that every audit reports the exact endpoint strings the script expects.
[01:53] LEARNER: Done.
--- segment: checkpoint-120 ---
[02:05] COACH: Two hours in. What went wrong, and how did the run notice? Go.
[02:08] LEARNER: Three agents failed at session creation: I asked for a mode our org does not have. The script caught the error and retried each one once, and the retries show up in the cost table.
[02:30] LEARNER: Then I resumed the same run ID. All four finished agents replayed from the record and no new session did any work. Next I'll check the fix branch name, because it came out wrong.
[02:52] LEARNER: Done.
--- segment: update ---
[03:05] COACH: Give me the auditor update. Go.
[03:08] LEARNER: Verdict: one confirmed leak. The single-order read filters on the order id alone, so a merchandiser or admin of one brand can read the other brand's order.
[03:30] LEARNER: Coverage: the slice checked nine of the twenty-two endpoints, and carts is clean on all five of its endpoints. The rest are priced and queued.
[03:55] LEARNER: Failure and recovery: three agents never started, and a bounded retry recovered them. A coverage check would have stopped the run if any audit had skipped an endpoint.
[04:20] COACH: How many endpoints, exactly?
[04:22] LEARNER: Twenty-two in total, nine in this slice, and each one has a file and line.
[04:35] LEARNER: Fix and verification: the fix adds the brand to the query, on a throwaway branch named by the script, with the planted test un-skipped. A separate verifier agent wrote its own check and returned pass. Main still carries the defect, as the platform lead requires.
[05:10] LEARNER: One lesson: the agent returned a full path where I expected a file name, and that leaked into the branch name. Branch names now come from the input, never from agent output.
[05:35] LEARNER: Cost: three and a half ACU for the slice. Ask: approve the full run at a ten ACU cap.
[06:02] LEARNER: Done.
--- segment: objection-1 ---
[06:15] COACH: How do I know an agent didn't skip endpoints and call it clean?
[06:19] LEARNER: That's fair. An agent can omit things. The boundary is that no agent decides the list: the script computes it from the route files before any agent starts.
[06:45] LEARNER: The evidence is that every audit's endpoint list is compared with that inventory. A gap triggers one re-ask and then a hard failure, and the log shows all nine slice endpoints accounted for.
[07:20] LEARNER: I'd offer to run the full twenty-two with the same check and attach the log to your report.
[07:46] LEARNER: Done.
--- segment: objection-2 ---
[07:58] COACH: Why pay for a fan-out of agents when one engineer could read twenty-two endpoints in an afternoon?
[08:02] LEARNER: Agreed, one reader is cheaper per line. What you are paying for is an independent verifier and a bill per agent.
[08:25] LEARNER: The numbers from my run: zero point nine nine ACU to audit carts, zero point seven one for orders, zero point nine six for the fix and zero point eight four for the verifier. That is three point four nine for the slice.
[09:00] LEARNER: Actually, the settled figure was three point six four, and I would quote that one. The full proof projects to about eight ACU, plus about one point nine for each extra file that leaks.
[09:20] LEARNER: Approve ten ACU as a cap and you get every endpoint with independent proof.
[09:35] LEARNER: Done.
