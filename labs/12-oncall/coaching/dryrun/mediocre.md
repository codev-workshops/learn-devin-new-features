---
lab: 12-oncall
variant: mediocre
learner: dryrun
planted_fillers: 6
planted_omissions: [mm5, mm7]
planted_long_pauses: ["03:53"]
---
# Dry-run transcript — mediocre

Fixture for `@skills:coach-12-oncall dryrun --dry-run labs/12-oncall/coaching/dryrun/mediocre.md`.
Planted: six fillers (actually ×2, basically ×2, so yeah ×1, you know ×1), one tag question, one 11-second pause in the T+60 checkpoint, and two omitted must-mention points (mm5, mm7: no mode choice and no fixture/live statement). The framing opens with the timeline instead of the impact; the first objection skips the evidence step.

--- segment: framing ---
[00:00] COACH: Forty-five seconds. What is broken, for whom, and what is Devin doing about it? Go.
[00:05] LEARNER: So, the Lamp Week deploy went out at 22:40, and then the newsletter went out, and then at 02:10 the page came in for negative on-hand.
[00:25] LEARNER: Basically, 40 customers paid for LH-LAMP-03 and we had 3 units, so around 2,360 dollars.
[00:58] LEARNER: Devin Oncall is looking at it, and I think it is mitigated when the alert stops. Done.

--- segment: update-15 ---
[01:13] COACH: T+15. Give me the update you would post in the channel. Go.
[01:17] LEARNER: Outcome: we know the impact, it is the 40 orders.
[01:31] LEARNER: Evidence: actually, the monitor 48213771 opened incident 2187, and in the traces there are three checkout.reserve spans reading 3 at the same time, so it goes to the reservation code in the API.
[02:08] LEARNER: The on-call used RB-101, the cache one, but it is wrong because the stock went negative again after his correction, so I use RB-102 instead.
[02:43] LEARNER: Risk is that it continues. Next, I check the worker, you know, for the webhooks.
[03:28] LEARNER: Ask: can we turn off the SKU? Done.

--- segment: checkpoint-60 ---
[03:43] COACH: T+60. What are you looking at, and what do you check next? Go.
[03:46] LEARNER: I see the same event id twice in the worker logs.
[03:53] (pause 11 s)
[04:04] LEARNER: I think it is the reservation race and the webhooks double it, that's the cause, no?
[04:27] LEARNER: Next I check the failure-rate monitor. Done.

--- segment: update ---
[04:42] COACH: Closing update for the morning team, three minutes. Go.
[04:47] LEARNER: Outcome: it is under control, the lamp is out of stock on the storefront.
[05:07] LEARNER: Impact: 40 orders, about 2,360 dollars, merchandising will contact the customers.
[05:27] LEARNER: Evidence: monitor, incident 2187, the trace with the three reservations, and the checkout code. Basically the worker also processes the same PayGate event twice.
[06:07] LEARNER: Mitigation until 08:00: the SKU is unavailable on the price list, we did not deploy and nobody edits the stock by hand. So, yeah, the site is up.
[07:22] LEARNER: Follow-ups: row lock and idempotent webhooks, actually both after 08:00. Done.

--- segment: objection-1 ---
[07:37] COACH: Would Devin have paged a human sooner? Go.
[07:41] LEARNER: Maybe, yes. The runbook has a rule to escalate when more than one SKU is affected.
[08:05] LEARNER: Devin follows what we put in the responder.
[08:47] LEARNER: We can add that rule to the responder so it pages you earlier. Done.

--- segment: objection-2 ---
[09:02] COACH: You trusted a runbook that was wrong — why? Go.
[09:06] LEARNER: I did not, the on-call did.
[09:17] LEARNER: When the runbook and the telemetry disagree, I go with the telemetry.
[09:42] LEARNER: The correction re-fired at 02:52, which a cache problem would not do.
[10:30] LEARNER: We should delete RB-101 and point the responder at RB-102. Done.
