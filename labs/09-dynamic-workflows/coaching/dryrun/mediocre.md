---
lab: 09-dynamic-workflows
variant: mediocre
learner: dryrun
planted_fillers: 6
planted_omissions: [mm3, mm5]
planted_long_pauses: ["02:50"]
---
# Dry-run transcript — mediocre

Fixture for `@skills:coach-09-dynamic-workflows dryrun --dry-run labs/09-dynamic-workflows/coaching/dryrun/mediocre.md`.

--- segment: framing ---
[00:00] COACH: I'm the auditor. In sixty seconds: what will I get from you, and how? Go.
[00:04] LEARNER: So I started by looking at how the API is organised, and there are route files, and basically each one has a few endpoints, and I wrote a workflow with agents.
[00:30] LEARNER: The workflow audits, fixes and verifies. I counted twenty-two endpoints from the code and ran two files first as a slice.
[00:55] LEARNER: The idea is you get a verdict per endpoint at the end.
[01:14] LEARNER: Done.
--- segment: checkpoint-20 ---
[01:25] COACH: Twenty minutes in. What are you looking at, and what next? Go.
[01:28] LEARNER: I'm looking at the orders routes. I think the order read might be the problem. Next I'll run the slice.
[02:05] LEARNER: Done.
--- segment: checkpoint-120 ---
[02:20] COACH: Two hours in. What went wrong, and how did the run notice? Go.
[02:24] LEARNER: Um, some agents had errors at the start, I think something about the mode.
[02:50] (pause 12 s)
[03:02] LEARNER: It worked in the end anyway, the results came back.
[03:22] LEARNER: Done.
--- segment: update ---
[03:35] COACH: Give me the auditor update. Go.
[03:38] LEARNER: So the main finding is that the single-order read filters on the id alone, so staff of one brand can actually read the other brand's order.
[04:05] LEARNER: Carts looked fine.
[04:15] COACH: How many endpoints, exactly?
[04:18] LEARNER: Twenty-two overall, but the slice was two files, I think nine endpoints.
[04:40] LEARNER: The fix adds the brand to the query, it's on a throwaway branch, and a separate agent verified it, and we left main alone because of the freeze.
[05:20] LEARNER: Basically next step is to run the rest of the files, so yeah.
[06:05] LEARNER: Done.
--- segment: objection-1 ---
[06:15] COACH: How do I know an agent didn't skip endpoints and call it clean?
[06:19] LEARNER: The script has the list of endpoints from the code, so it knows what to expect, and it checks the agent covered them.
[06:55] LEARNER: If something is missing it asks again. I think that's enough.
[07:50] LEARNER: Done.
--- segment: objection-2 ---
[08:00] COACH: Why pay for a fan-out of agents when one engineer could read twenty-two endpoints in an afternoon?
[08:04] LEARNER: It's actually faster because they run in parallel, and you get a verifier that's separate.
[08:40] LEARNER: It didn't cost that much overall, a few ACU, that's the cost, right?
[09:20] LEARNER: And it scales better when there are more files.
[09:50] LEARNER: Done.
