---
lab: 11-acu-analytics
variant: strong
learner: dryrun
planted_fillers: 1
planted_omissions: []
planted_long_pauses: []
---
# Dry-run transcript — strong

Fixture for `@skills:coach-11-acu-analytics dryrun --dry-run labs/11-acu-analytics/coaching/dryrun/strong.md`.
Planted: one filler (actually ×1), no tag questions, no long pauses, no omitted must-mention points. The outcome leads, the update uses exactly three ACU figures with their sources, and both objections follow acknowledge → boundary → evidence → offer.

--- segment: framing ---
[00:00] COACH: Sixty seconds. Why were two people blocked, and what will you change? Go.
[00:04] LEARNER: Two people were blocked this morning by two different caps. Kadé has an organization limit per brand team and a personal tier per member, Devin enforces both independently, and either one stops new work. Raising one never lifts the other.
[00:30] LEARNER: The Trailhead lead hit the team cap; the Lumen engineer hit his personal cap. I will fix each one with the cap that blocked it, and give you one number per team for the budget.
[00:58] LEARNER: You will know it works when both of them can start a session today and Trailhead stays open through the sale. Done.

--- segment: checkpoint-10 ---
[01:10] COACH: T+10. What are you looking at right now, and what will you check next? Go.
[01:13] LEARNER: I see the Trailhead lead at 180 of her 400 ACU tier, so she is under her own cap.
[01:24] LEARNER: I think the block is the organization: Trailhead is at 3,000 of its 3,000 limit, so only an enterprise admin raising the organization limit helps her. A personal override would not.
[01:54] LEARNER: I'll try a 600 override in the simulator to prove that, and I'll check the organization line again. Done.

--- segment: checkpoint-40 ---
[02:06] COACH: T+40. Pick two numbers on your screen. What does each one count? Go.
[02:09] LEARNER: The Lumen engineer's meter shows 410: 250 cloud plus 160 local. His 90 ACU of Devin Review are not in it, because Review is left out of personal limits, but they are in Lumen's organization total.
[02:50] LEARNER: Trailhead's Cloud tab shows 2,180. That is a Cloud-only number on the Newest version of analytics, picked with the gear icon next to the date picker, so it leaves out local usage. Legacy is the old layout; I will not mix the two. And the spring report is empty because no billing cycle covers a range before the contract started. Done.

--- segment: update ---
[03:04] COACH: Three minutes. Give me the update I can take to the budget review. Go.
[03:08] LEARNER: Outcome: both people can work again today, and you get a cap per team. The team cap is the organization limit. A tier applies to each member separately; it is never a pooled team budget.
[03:40] LEARNER: Evidence: Trailhead has used its full 3,000 ACU, from Enterprise Consumption for this billing window. The Winter Drop forecast adds 900 ACU, from the merchandising lead's sale plan.
[04:20] LEARNER: Risk: the limits reset on the contract day, the 23rd, which is three days after the sale ends, so waiting is not an option. The Lumen engineer's temporary override also expires on that day.
[04:58] LEARNER: Next action: the enterprise admin raises Trailhead to 4,200 ACU for this window, which the simulator shows holding on the last sale day, and gives the on-call engineer a temporary override until the reset.
[06:00] LEARNER: Ask: approve those numbers as this month's team caps, and we review them actually on the 23rd. Done.

--- segment: objection-1 ---
[06:12] COACH: Trailhead will be blocked mid-sale. Go.
[06:15] LEARNER: That is the outcome we must avoid, and you are right that waiting for the reset does not help.
[06:30] LEARNER: The boundary is the organization limit, not anyone's personal tier. The evidence: with the sale forecast, a 4,000 limit ends the 20th at 3,900, so I proposed 4,200 for margin.
[07:38] LEARNER: I can offer a check every morning of the sale against the Consumption page, and individuals keep the Request more path if their own tier gets close. Done.

--- segment: objection-2 ---
[07:52] COACH: Why do the two dashboards show different totals? Go.
[07:55] LEARNER: Fair question; two totals for one team is how budgets lose trust.
[08:05] LEARNER: Both are right, they count different things. Enterprise Consumption covers all three organizations, 8,870. Trailhead's Cloud tab leaves out 400 local and 420 Review, and its last 30 days include a week of the previous window, 3,210 against 3,000.
[09:22] LEARNER: Also 120 local ACU from one Trailhead engineer sit in Platform until her billing organization is set. I propose we budget on one view, the organization total for the billing window, and I attach the ledger. Done.
