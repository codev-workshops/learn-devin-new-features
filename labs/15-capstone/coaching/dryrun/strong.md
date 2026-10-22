---
lab: 15-capstone
variant: strong
learner: dryrun
scenario: ghost-orders-eu
planted_fillers: 1
planted_omissions: []
planted_long_pauses: []
---
# Dry-run transcript — strong (scenario `ghost-orders-eu`)

Fixture for `@skills:coach-15-capstone dryrun --scenario ghost-orders-eu --dry-run labs/15-capstone/coaching/dryrun/strong.md`.
Planted: one filler (actually ×1), no tag questions, no long pauses, no omitted must-mention points. The learner names the cost first, re-plans out loud after the T+60 call and keeps every session on the EU outpost when the queue blocks. The `change-60` block is the untimed T+60 requirement change, spoken verbatim from the scenario file.

--- segment: framing ---
[00:00] COACH: Good morning. I am Lena Vogt, I run Trailhead Supply. Three things, and I need all three handled by lunch. Incident: Since Monday, customers have been charged for orders that arrive in our admin console empty: a paid total, no lines, nothing to ship. Support counted fourteen complaints overnight. Every hour this runs, someone pays for nothing. Feature request: I promised our retail partners digital gift cards in euros for the winter campaign. I need a first version I can show them on Friday. Governance constraint: Our data-protection officer has ruled that no Devin session touching Trailhead code or data may execute outside our EU Outpost, `kade-eu`. Not one command on the default cloud machines. Ninety seconds. Go.
[00:03] LEARNER: Paid orders are arriving empty because the cart sweeper deletes carts older than 48 hours even with a pending payment, so the late webhook creates a paid order with no lines.
[00:24] LEARNER: That is fourteen customers paying for nothing, and it keeps happening every night until the sweeper changes.
[00:46] LEARNER: So the incident goes first, the gift cards second, and the EU rule applies to both from the first command.
[01:07] LEARNER: Before any session starts I make kade-eu the only platform for this work and check it took effect.
[01:28] LEARNER: By lunch you get the cause, an open fix with proof, a gift-card plan and a list of every session and where it ran. Done.

--- segment: checkpoint-30 ---
[01:40] COACH: T+30. What do you know now that you did not at nine? Go.
[01:43] LEARNER: I reset the stack and reproduced it on the local stack with the abandoned-carts injector before changing any code; it printed the symptom line with a paid order and zero lines.
[02:04] LEARNER: I traced it to the sweeper query in the fulfilment worker; it never checks the payment status.
[02:24] LEARNER: Next I open a leaf branch for the fix and write the failing test first. Done.

--- segment: change-60 ---
[02:36] COACH: Lena again. Two things from legal, sorry. First: whatever you post to the team about these orders must not contain customer e-mail addresses or order ids — counts only. Second: gift cards are Trailhead-only for now; Lumen will copy us next quarter, so do not build anything shared yet.
[02:45] COACH: That is all. Back to work.

--- segment: checkpoint-90 ---
[03:06] COACH: T+90. What changed in your plan after my call? Go.
[03:09] LEARNER: Your call changed two things.
[03:31] LEARNER: I re-planned after the change: team updates carry counts only, no customer e-mails or order ids, and gift cards stay Trailhead-only.
[03:52] LEARNER: I rewrote the Slack summary to say fourteen orders, no identifiers, and I dropped the shared voucher module. Done.

--- segment: checkpoint-150 ---
[04:04] COACH: T+150. What is proven, and what is still a claim? Go.
[04:07] LEARNER: Proven: every session ran on the kade-eu outpost and the second session waited in the queue instead of moving to the cloud.
[04:27] LEARNER: That actually cost me twenty minutes of waiting, which I spent writing the report.
[04:47] LEARNER: Still a claim: the gift-card tax rule until finance reads it. Done.

--- segment: update ---
[04:59] COACH: Four minutes. Give me the update I forward to the board. Go.
[05:02] LEARNER: Outcome: the ghost orders have a known cause and a fix waiting for review, and nothing left the EU outpost.
[05:31] LEARNER: Evidence: the abandoned-carts injector shows the symptom on main and is silent on the fix branch; the sweeper now skips carts with a pending payment.
[06:01] LEARNER: Fourteen affected customers listed for refunds, with the fix as an open pull request and the re-run that proves it.
[06:30] LEARNER: The refund list is counts-only in the team channel, as legal asked; the names are in the finance ticket.
[07:00] LEARNER: Gift cards are a separate pull request and VAT is charged when the card is redeemed, not when it is sold.
[07:29] LEARNER: It is Trailhead-only, euros as decimal strings, with tests that failed before and pass now.
[07:58] LEARNER: Risk: the queue. One worker means a second urgent session waits; today that was twenty minutes.
[08:28] LEARNER: Next action: platform engineering adds a second EU worker; I have written the request.
[08:57] LEARNER: Ask: approve the refunds for the fourteen customers today so support can close the tickets. Done.

--- segment: objection-1 ---
[09:09] COACH: Half a day of Devin for fourteen orders. What did that cost us, and would a person have been cheaper? Go.
[09:12] LEARNER: Fair question.
[09:34] LEARNER: The half day was three sessions and nineteen ACU, about six per problem.
[09:55] COACH: Which step would you not hand to Devin next time?
[10:17] LEARNER: Drafting the refund list. A person in support would have done that in ten minutes from the admin console, more cheaply than the session did.
[10:38] LEARNER: The incident fix itself would have taken a person most of a day; the open pull request is the evidence. Done.

--- segment: objection-2 ---
[10:50] COACH: If execution stayed in the EU, what exactly left the EU? Go.
[10:53] LEARNER: You are right to ask.
[11:14] LEARNER: Execution, the repo checkout and every command stayed on the EU worker; planning and inference ran in Devin Cloud.
[11:35] COACH: So the model saw our code. Did it see customer data?
[11:56] LEARNER: The model saw code and the synthetic seed orders in the session; no production customer data is in this repo.
[12:17] LEARNER: I can send the session list filtered by platform so you can check each one. Done.

--- segment: objection-3 ---
[12:29] COACH: Who stops an engineer from starting a Trailhead session on the default cloud tomorrow morning? Go.
[12:32] LEARNER: Today nothing would, if it were left to good intentions.
[12:54] LEARNER: The control is the organization default platform set to kade-eu, with the cloud override limited to admins.
[13:16] COACH: And how would we find out if they did?
[13:37] LEARNER: The session list shows the platform for every session; a weekly filter on it is our audit trail.
[13:59] LEARNER: I will put both in the runbook and send you the filter today. Done.
