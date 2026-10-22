---
doc_id: 1HarbourlineIncident2187DocFixture
title: "Incident 2187 — Negative on-hand LH-LAMP-03 (Lamp Week) — DRAFT"
owner: ops@harbourline.test
last_edited: 2026-10-22T02:58:00Z
status: draft
---

# Incident 2187 — Negative on-hand LH-LAMP-03

_This is the shared incident document as it looked when the incident commander was paged at 02:55. Sections marked TODO are what the lab asks the responder to complete._

## Timeline (UTC, 2026-10-21 → 22)

| Time  | What                                                                                    | Source                |
| ----- | --------------------------------------------------------------------------------------- | --------------------- |
| 22:40 | harbourline-api 2026.10.21-lampweek deployed (ECS deployment ecs-svc/8821)                     | infra/aws             |
| 23:00 | Lamp Week newsletter sent; LH-LAMP-03 is the hero product (3 units on hand)             | workspace sheet       |
| 00:50 | First LH-LAMP-03 orders beyond stock; on_hand goes to -4 by 01:00                       | datadog metrics       |
| 02:10 | Monitor 48213771 pages: on_hand = -37                                                   | pagerduty incident    |
| 02:20 | On-call follows RB-101: worker restart + manual count correction to 50                  | pagerduty log entries |
| 02:24 | Webhook failure-rate monitor enters WARN (5.6%)                                         | datadog               |
| 02:31 | Alert auto-resolves (value 50)                                                          | pagerduty             |
| 02:52 | Alert re-triggers: on_hand = -3; manual correction consumed by new orders in 21 minutes | pagerduty             |
| 02:55 | Escalated to incident commander; manual stock edits stopped                             | pagerduty             |

## Impact

TODO — number of orders for LH-LAMP-03 since 22:40 vs units on hand, revenue at risk, customers to contact. (Hint from the sheet: 3 units on Friday's count.)

## Evidence chain

TODO — monitor → incident → traces (`checkout.reserve` spans reading available=3 concurrently) → code path (`POST /checkout` reservation) → amplifier (duplicate `event_id` processing in the worker).

## Likely cause

TODO

## Mitigation until 08:00

TODO — RB-102 steps 3 and 6. No manual stock edits.

## Follow-ups

- [ ] Row lock on reservation (`SELECT … FOR UPDATE`) — services/api
- [ ] Idempotent webhook consumer keyed on `event_id` — services/fulfilment-worker
- [ ] Retire RB-101; link RB-102 from the monitor (done 2026-10-21 22:41 — but the on-call still had RB-101 bookmarked)
