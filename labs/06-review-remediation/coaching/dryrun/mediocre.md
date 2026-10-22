---
lab: 06-review-remediation
variant: mediocre
learner: dryrun
planted_fillers: 6
planted_omissions: [mm1, mm7]
planted_long_pauses: ["02:20"]
---
# Dry-run transcript — mediocre

Fixture for `@skills:coach-06-review-remediation dryrun --dry-run labs/06-review-remediation/coaching/dryrun/mediocre.md`.
Planted: six fillers (actually ×2, basically ×2, so yeah ×1, you know ×1), one tag question, one 12-second pause at [02:20], and two omitted must-mention points: the effort-level choice (mm1) and the review rule (mm7).

--- segment: framing ---
[00:00] COACH: I'm Tomás. You have read my note about PR #26. Sixty seconds: what is the risk, how will you review it, and what will I have at the end? Go.
[00:04] LEARNER: So, basically, because it touches totals, and because Black Friday is coming, and because of the tax, I think we need a review.
[00:24] LEARNER: The PR truncates per-line totals: two €19.90 socks come to 39.79 instead of 39.80. I will use Devin Review on it, basically.
[00:48] LEARNER: Security is checked on every review, and I think a self-declared staff role lets a shopper set a price. I'll leave the settings as they are.
[01:14] LEARNER: Done.
--- segment: checkpoint-10 ---
[01:30] COACH: Ten minutes in. What has the review told you so far, and what are you checking first?
[01:34] LEARNER: I am looking at the findings, actually. There are a few of them. I'll check the security one first.
[01:58] LEARNER: The rounding one is the big one for finance, right?
[02:20] (pause 12 s)
[02:24] LEARNER: Done.
--- segment: checkpoint-50 ---
[02:40] COACH: Fifty minutes in. What have you fixed, what are you still disputing, and how will you prove the totals?
[02:44] LEARNER: I fixed the override and the rounding. The flag I will argue about later, you know, if the author complains.
[03:30] LEARNER: Done.
--- segment: update ---
[03:40] COACH: Give me the update as if I were paying for it. Go.
[03:43] LEARNER: So we fixed the rounding and the override on a branch. A regression test that failed on the PR and passes on the fix is the evidence, not the green suite.
[04:15] COACH: What is the subtotal now?
[04:18] LEARNER: It is right now, I think, 39.80 or so.
[04:30] LEARNER: I quoted one finding into the review chat and checked the answer against a test, actually. Then the re-review after the fix resolved the findings; an unchanged diff is skipped, not re-reviewed.
[05:10] LEARNER: The disputed flag I settled with evidence on the thread, and nothing merged into main. So yeah, that is the update.
[07:10] LEARNER: Done.
--- segment: objection-1 ---
[07:20] COACH: That per-line query thing is a flag, not a bug. Carts are small. Why are you blocking my PR on it?
[07:24] LEARNER: Because Devin Review raised it, and flags can turn out to be bugs. We should be careful before Black Friday.
[08:20] LEARNER: Done.
--- segment: objection-2 ---
[08:30] COACH: Every review round costs us a day before Black Friday. Why not ship and fix forward?
[08:34] LEARNER: The review is fast. Fixing forward is risky with money. We can do fewer reviews after Black Friday.
[09:44] LEARNER: Done.
