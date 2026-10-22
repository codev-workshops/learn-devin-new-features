---
lab: 06-review-remediation
variant: strong
learner: dryrun
planted_fillers: 1
planted_omissions: []
planted_long_pauses: []
---
# Dry-run transcript — strong

Fixture for `@skills:coach-06-review-remediation dryrun --dry-run labs/06-review-remediation/coaching/dryrun/strong.md`.
Timings come from the `[mm:ss]` markers; the clock for each segment runs from the coach's "Go" (or the learner's first line) to the learner's "Done."
Planted: one filler (basically ×1), no omissions, no long pauses.

--- segment: framing ---
[00:00] COACH: I'm Tomás. You have read my note about PR #26. Sixty seconds: what is the risk, how will you review it, and what will I have at the end? Go.
[00:03] LEARNER: Headline: PR #26 is not safe to ship yet. The PR truncates per-line totals: two €19.90 socks come to 39.79 instead of 39.80, and that cent breaks reconciliation with the worker.
[00:20] LEARNER: Security is checked on every review, and it found that a self-declared staff role lets a shopper set a price: a merchandiser header pinned a lamp at one cent.
[00:38] LEARNER: Effort level chosen on purpose: the highest for a change to totals and tax, the default for low-risk PRs like docs. You get a fix on a throwaway branch with a test you can rerun.
[00:58] LEARNER: Done.
--- segment: checkpoint-10 ---
[01:10] COACH: Ten minutes in. What has the review told you so far, and what are you checking first?
[01:13] LEARNER: I see one security finding and three bugs. I think the rounding bug matters most for finance, so I'll try two socks in a test, basically the smallest cart that breaks, and I'll check why the PR's own tests missed it.
[01:56] LEARNER: Done.
--- segment: checkpoint-50 ---
[02:10] COACH: Fifty minutes in. What have you fixed, what are you still disputing, and how will you prove the totals?
[02:13] LEARNER: I see the regression test failing on the PR at 39.79. I think removing the override and the truncation fixes both bugs, so I'll try the re-review next, and I'll check the per-line query flag with the author.
[02:57] LEARNER: Done.
--- segment: update ---
[03:10] COACH: Give me the three-minute update. Go.
[03:13] LEARNER: Outcome: the price-drift fix now works without the rounding regression or the price hole, on a throwaway branch.
[03:35] LEARNER: Evidence: a regression test that failed on the PR and passes on the fix is the evidence, not the green suite. Two socks: 39.79 on the PR, 39.80 on the fix and on main.
[04:05] LEARNER: I quoted the rounding finding into the review chat and asked which seeded SKU breaks it. It named the €19.90 socks, and I checked the answer against a test.
[04:30] COACH: Did the re-review agree?
[04:33] LEARNER: Yes. Re-review after the fix resolved the findings with nothing new. When I pushed an empty commit, the unchanged diff was skipped, not re-reviewed, which is what the docs describe.
[05:05] LEARNER: Risk: the review rule targeted only money.ts, so this PR walked around its test requirement. I replaced it with one covering every money path in services/api.
[05:35] LEARNER: The disputed flag was settled with evidence on the thread: I moved re-pricing out of the transaction. Nothing merged into main; both plants are still there.
[05:58] LEARNER: Ask: approve this pattern so the author can redo the PR cleanly, with a second reviewer from payments.
[06:10] LEARNER: Done.
--- segment: objection-1 ---
[06:20] COACH: That per-line query thing is a flag, not a bug. Carts are small. Why are you blocking my PR on it?
[06:23] LEARNER: Fair, it is a flag, and you're right that most carts are small. The two Bugs block the merge, not the flag. On the flag: the loop ran inside the transaction after the inventory updates, so reserved rows stayed locked longer on the busiest day. Moving it before the transaction costs nothing and keeps the statements inside equal to main. If you still disagree, we measure checkout latency before and after and decide on the number.
[07:48] LEARNER: Done.
--- segment: objection-2 ---
[08:00] COACH: Every review round costs us a day before Black Friday. Why not ship and fix forward?
[08:03] LEARNER: That's a real cost, and I agree the calendar matters. But fixing forward means a cent off on every two-sock Trailhead order and a free-discount hole until the fix lands. The review took minutes, not a day, and the re-review was clean. My offer: the highest effort only on money and tax paths, the default for everything else.
[09:28] LEARNER: Done.
