---
lab: 12-oncall
variant: strong
learner: dryrun
planted_fillers: 1
planted_omissions: []
planted_long_pauses: []
---
# Dry-run transcript — strong

Fixture for `@skills:coach-12-oncall dryrun --dry-run labs/12-oncall/coaching/dryrun/strong.md`.
Planted: one filler (actually ×1), no tag questions, no long pauses, no omitted must-mention points. Impact leads, every update follows Outcome → Evidence → Risk → Next action → Ask, and both objections follow acknowledge → boundary → evidence → offer.

--- segment: framing ---
[00:00] COACH: Forty-five seconds. What is broken, for whom, and what is Devin doing about it? Go.
[00:04] LEARNER: Right now, 40 customers have paid for the Ember Table Lamp, LH-LAMP-03, and we only had 3 units. That is about 2,360 dollars of orders we cannot ship.
[00:20] LEARNER: What I know for sure: it started after the 22:40 Lamp Week deploy and it is still happening. What I do not know yet is whether other SKUs are hit.
[00:44] LEARNER: A Devin Oncall responder is pulling the incident, the monitor and the traces; I will call it mitigated when on-hand stops falling. Done.

--- segment: update-15 ---
[00:59] COACH: T+15. Give me the update you would post in the channel. Go.
[01:02] LEARNER: Outcome: impact confirmed — 40 paid orders for LH-LAMP-03 against 3 units, about 2,360 dollars.
[01:19] LEARNER: Evidence: monitor 48213771 fired at 02:10 and opened PagerDuty incident 2187. The trace shows three checkout.reserve spans in the same second, each reading available equals 3, with no FOR UPDATE. That points at the reservation loop in the API checkout route.
[01:54] LEARNER: Runbook: the on-call followed RB-101, the cache runbook. It is wrong — the worker has had no cache since July, and the hand correction at 02:31 re-fired at 02:52. I have switched to RB-102, the oversell runbook.
[02:24] LEARNER: Risk: suspected, not confirmed — duplicate payment webhooks may be making it worse. Next action: check the worker logs for repeated event ids.
[02:57] LEARNER: Ask: approval to mark the SKU unavailable on the Lamp Week price list. Done.

--- segment: checkpoint-60 ---
[03:12] COACH: T+60. What are you looking at, and what do you check next? Go.
[03:15] LEARNER: I see event evt_9f2a7c01 processed twice in the worker logs, and stock dropped twice for one order.
[03:30] LEARNER: I think the primary cause is the unlocked read-then-write reservation, and duplicate webhooks amplify it.
[03:59] LEARNER: I'll check the webhook failure-rate monitor next, to size how many orders were counted twice. Done.

--- segment: update ---
[04:14] COACH: Closing update for the morning team, three minutes. Go.
[04:18] LEARNER: Outcome: contained. Since 03:20, LH-LAMP-03 shows out of stock and on-hand has stayed flat.
[04:36] LEARNER: Impact: 40 paid orders against 3 units, about 2,360 dollars; 37 customers need a refund or a backorder offer, and merchandising owns that list at 08:00.
[04:59] LEARNER: Evidence: monitor 48213771, incident 2187, a trace with three concurrent reservations reading 3, then the checkout reservation loop. The amplifier is the worker processing the same PayGate event twice.
[05:29] LEARNER: Mitigation until 08:00: the SKU is unavailable on the Lamp Week price list and safety stock is above on-hand. No deploy and no manual stock edit; the site stays up.
[05:54] LEARNER: How I ran Devin: Lite for the triage, because fetching the incident, the series and the order count is narrow and cheap. A full mode for the root cause, because it crossed the API, the webhooks and the worker and needed a local reproduction.
[06:29] LEARNER: Integrations: PagerDuty and Datadog ran on the fixture shim tonight, not live. Actually, one more point: the alert storm at T+25 is the same incident, grouped under 2187.
[07:10] LEARNER: Ask: approve two follow-ups after 08:00 — a row lock on reservation and an idempotent webhook consumer. Done.

--- segment: objection-1 ---
[07:25] COACH: Would Devin have paged a human sooner? Go.
[07:28] LEARNER: Fair question — the page sat with one person for forty-five minutes.
[07:37] LEARNER: Devin does not replace the escalation policy; it follows the rule we give it. RB-102 says escalate when more than one SKU is hit or orders exceed units by more than ten.
[08:05] LEARNER: By 02:15 the series already showed far more than 3 orders, so that rule in the responder's runbook would have pulled you in at 02:15, not 02:55.
[08:53] LEARNER: I will add that rule to the responder and a PagerDuty escalation condition, and we review it at the post-incident meeting. Done.

--- segment: objection-2 ---
[09:08] COACH: You trusted a runbook that was wrong — why? Go.
[09:11] LEARNER: I did not trust it for long, but the on-call did, and that is on the process.
[09:23] LEARNER: A runbook is guidance; when it disagrees with the telemetry, the telemetry wins.
[09:36] LEARNER: Three things told me RB-101 was wrong: the worker has no cache since July, the monitor itself links RB-102, and the hand correction re-fired in twenty-one minutes.
[10:40] LEARNER: My offer: retire RB-101 today and give the responder RB-102 as its only runbook. Done.
