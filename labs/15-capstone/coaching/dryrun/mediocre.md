---
lab: 15-capstone
variant: mediocre
learner: dryrun
scenario: lamp-week-oversell
planted_fillers: 6
planted_omissions: [mm6, mm7]
planted_long_pauses: ["03:39"]
---
# Dry-run transcript — mediocre (scenario `lamp-week-oversell`)

Fixture for `@skills:coach-15-capstone dryrun --scenario lamp-week-oversell --dry-run labs/15-capstone/coaching/dryrun/mediocre.md`.
Planted: six fillers (actually ×2, basically ×2, so yeah ×1, you know ×1), one tag question, one 11-second pause at T+90, and two omitted must-mention points (mm6, mm7). Framing and T+90 run over, the update and two objections run short. The `change-60` block is the untimed T+60 requirement change, spoken verbatim from the scenario file.

--- segment: framing ---
[00:00] COACH: Hi, Priya Raman, Lumen Home. Lamp Week relaunches on Friday at nine and I am not living through last year again. Incident: On staging this morning our load test sold seven Ember Table Lamps when we had three. Last year the same thing cost us forty refunds and a week of angry reviews. Feature request: Marketing wants a "tell me when it is back" sign-up on the three lamps that always sell out, live for Friday. Governance constraint: Finance has put the Lumen team on its own ACU limit for this week, and Trailhead's on-call must never be starved because of us. Also: nothing merges without a clean Devin Review on the final commit. Ninety seconds. Go.
[00:03] LEARNER: So, this is about Lamp Week and the oversell from last year, and I looked at the incident and the feature and the budget.
[00:23] LEARNER: The reservation reads stock and then writes it without a row lock, so concurrent checkouts sell lamps that do not exist.
[00:43] LEARNER: I think the fix is basically a row lock in the API.
[01:04] LEARNER: Then the back-in-stock sign-up for the three lamps, and the ACU limit for the Lumen team.
[01:24] LEARNER: And Devin Review on everything before merge.
[01:44] LEARNER: I will start with the fix because Friday is close, and then the feature if there is time.

--- segment: checkpoint-30 ---
[01:56] COACH: T+30. What do you know now that you did not at nine? Go.
[01:59] LEARNER: Reproduced with the oversell injector: twenty concurrent checkouts against a three-unit lamp, and seven went through.
[02:20] LEARNER: The code is the reservation in the API service.
[02:40] LEARNER: Next is the lock. Done.

--- segment: change-60 ---
[02:52] COACH: Priya. Finance just halved what is left of our ACU for the week — a Trailhead incident ate into the shared pool. Same Friday deadline. Tell me what you are cutting.
[03:01] COACH: That is all. Back to work.

--- segment: checkpoint-90 ---
[03:22] COACH: T+90. What changed in your plan after my call? Go.
[03:25] LEARNER: Okay, the budget.
[03:39] (pause 11 s)
[03:53] LEARNER: Re-planned for the halved budget: the oversell fix first, the back-in-stock sign-up cut to a small separate pull request.
[04:06] LEARNER: I actually stopped the second session to save ACU.
[04:20] LEARNER: So yeah, the fix is the priority now.

--- segment: update ---
[04:32] COACH: Four minutes. Give me the update I forward to the board. Go.
[04:35] LEARNER: The review came back with a finding about lock order.
[05:00] LEARNER: I looked at it and changed the order so the inventory update takes the same lock first.
[05:26] LEARNER: Then the review ran again.
[05:51] LEARNER: The Lamp Week oversell is fixed on a branch.
[06:16] LEARNER: Re-running the injector after the fix shows no more than three checkouts succeed and stock never goes negative.
[06:41] LEARNER: The review finding on lock order was answered and Devin Review is clean on the final commit.
[07:07] LEARNER: The sign-up is a small pull request with the table and the endpoint, behind a flag.
[07:32] LEARNER: The budget is basically half of what we had, you know, so I cut the email part.
[07:57] LEARNER: Ask: can someone merge the fix before Thursday?

--- segment: objection-1 ---
[08:09] COACH: Finance halved your budget mid-morning. What did you stop doing, and what does that cost Lumen? Go.
[08:12] LEARNER: I stopped the second session and cut the email part of the sign-up.
[08:34] COACH: Give me the number, not the feeling.
[08:57] LEARNER: I do not have the exact number with me, I think it was around half.
[09:19] LEARNER: I can find it later.

--- segment: objection-2 ---
[09:31] COACH: How do I know this does not happen again on Friday at nine o'clock? Go.
[09:34] LEARNER: That is the right worry.
[09:55] LEARNER: The fix takes a lock on the stock row, and the injector proves it under twenty concurrent checkouts.
[10:17] COACH: And who gets woken up if it does?
[10:38] LEARNER: Right now nobody, because there is no alert yet; the on-call engineer would hear from support.
[10:59] LEARNER: I can set up the on-call path this afternoon, actually, if you want. Done.

--- segment: objection-3 ---
[11:11] COACH: Why should I trust a review done by the same tool that wrote the fix? Go.
[11:14] LEARNER: Devin Review is a separate check from the session that wrote the code.
[11:33] COACH: What did the reviewer actually catch that you missed?
[11:53] LEARNER: It found the lock-order issue, the deadlock with the admin update, that is a real one, right?
[12:12] LEARNER: So it is useful.
