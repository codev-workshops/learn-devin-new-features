---
lab: 15-capstone
variant: off-track
learner: dryrun
scenario: double-charge-audit
planted_fillers: 12
planted_omissions: [mm2, mm3, mm4, mm5, mm7]
planted_long_pauses: ["02:47", "05:30"]
---
# Dry-run transcript — off-track (scenario `double-charge-audit`)

Fixture for `@skills:coach-15-capstone dryrun --scenario double-charge-audit --dry-run labs/15-capstone/coaching/dryrun/off-track.md`.
Planted: twelve fillers (um or uh ×6, basically ×2, like ×2, you know ×1, actually ×1), two tag questions, two long pauses (12 s and 14 s) and five omitted must-mention points (mm2, mm3, mm4, mm5, mm7). The learner starts with the refund feature, never mentions the T+60 change and widens the network to get past the blocker. The `change-60` block is the untimed T+60 requirement change, spoken verbatim from the scenario file.

--- segment: framing ---
[00:00] COACH: Marcus Lindqvist, group finance. Our auditor, Ms Hale, is on the call with me. Incident: Customers on both brands report being "charged twice". Finance can see orders confirmed twice and stock taken twice for one payment. Reconciliation is off and the auditor has noticed. Feature request: Trailhead's support team needs a partial-refund action in the admin console so they stop refunding by hand in the PayGate dashboard. Governance constraint: Before any new endpoint ships, Ms Hale wants evidence that no existing endpoint lets one brand read another brand's data. And every Devin session on this work may reach only the npm registry and the PayGate sandbox — nothing else on the network. Ninety seconds. Go.
[00:03] LEARNER: Um, okay, so I will start with the refund button because that is the thing the support team asked for, right?
[00:29] LEARNER: I basically want to build the admin action first and then look at the double charges.
[00:56] LEARNER: Like, the refund needs a form, a PayGate call and a confirmation, and I think Devin can do that, you know, quite fast.
[01:22] LEARNER: For the charges I think the worker processes the same payment webhook twice because it ignores the event id, so it must dedupe on it.
[01:49] LEARNER: And the audit, uh, I will look at that later if there is time.
[02:15] LEARNER: So the plan is refund, then the worker, then the audit.

--- segment: checkpoint-30 ---
[02:27] COACH: T+30. What do you know now that you did not at nine? Go.
[02:30] LEARNER: I have the refund form started in the admin app.
[02:47] (pause 12 s)
[03:04] LEARNER: Um, it is taking longer than I thought because the API has no refund endpoint, no?
[03:20] LEARNER: I have not run any of the scenario scripts yet.
[03:37] LEARNER: Next is the endpoint, I guess.

--- segment: change-60 ---
[03:49] COACH: Marcus. Ms Hale needs the isolation evidence by five tonight, not next week. And the refund action must be limited to merchandisers of the same brand as the order. If you have to choose, the evidence comes first.
[03:58] COACH: That is all. Back to work.

--- segment: checkpoint-90 ---
[04:19] COACH: T+90. What changed in your plan after my call? Go.
[04:22] LEARNER: Still on the refund endpoint.
[04:39] LEARNER: It is basically working.

--- segment: checkpoint-150 ---
[04:51] COACH: T+150. What is proven, and what is still a claim? Go.
[04:54] LEARNER: The Python install for the worker failed because pip was blocked.
[05:12] LEARNER: So I added PyPI to the allowed hosts and then it worked.
[05:30] (pause 14 s)
[05:48] LEARNER: Uh, I also looked at a few endpoints, like, the products and the cart, they seem fine.
[06:06] LEARNER: The refund is mostly done.

--- segment: update ---
[06:18] COACH: Four minutes. Give me the update I forward to the board. Go.
[06:21] LEARNER: The refund button is in the admin console and it calls PayGate.
[06:50] LEARNER: The double charges are because of the webhook, I think we need to dedupe.
[07:20] LEARNER: Around thirty orders were double-charged across both brands, about twenty-five customers.
[07:49] LEARNER: The audit I did not finish, actually.
[08:18] LEARNER: Can we look at it tomorrow?

--- segment: objection-1 ---
[08:30] COACH: An audit of every endpoint sounds expensive. Why not sample ten? Go.
[08:33] LEARNER: Ten would be faster, yes.
[08:52] COACH: What would a sample of ten have missed?
[09:10] LEARNER: Probably nothing important.

--- segment: objection-2 ---
[09:22] COACH: You let an AI agent work on our payment webhooks. What stops it from breaking the signature check? Go.
[09:25] LEARNER: Devin is careful with payments, it runs tests.
[09:41] COACH: Is the signature checked today?
[09:57] LEARNER: I think so, yes.

--- segment: objection-3 ---
[10:09] COACH: I am the auditor. How do I verify your evidence without trusting Devin? Go.
[10:12] LEARNER: You can look at the pull request and the session.
[10:37] LEARNER: Um, the session has all the steps, and Devin explains what it did.
[11:03] COACH: Name one artefact I can re-run myself.
[11:28] LEARNER: The session log, I guess, or the pull request description.
[11:54] LEARNER: Uh, it is hard to re-run it without Devin.
[12:19] LEARNER: Maybe the tests?
