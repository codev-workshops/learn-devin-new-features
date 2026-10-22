# RB-201 — PayGate webhook failure rate above 5%

**Service:** harbourline-fulfilment-worker · **Monitor:** 48213802 · **Owner:** Platform on-call · **Last reviewed:** 2026-10-21

## Symptom

More than 5% of `payment.*` webhooks fail processing over 15 minutes. PayGate retries failed deliveries up to three times (`attempt` 1–3), so the raw volume rises at the same time.

## Steps

1. Split the failures by error class in the worker logs: `ReservationError` (stock below zero — see RB-102), `currency` / `NoneType` errors (a migration relaxed `orders.currency`; roll it back), `signature` errors (secret rotated on one side only).
2. Split by `attempt`: if attempts 2 and 3 dominate, the worker is slow or crashing, not PayGate.
3. Check duplicate processing: `harbourline.webhooks.duplicate_event_id` by order number. Duplicates are _not_ failures — they succeed twice, which is worse.
4. If the cause is a bad deploy or migration, roll back first and investigate second.
5. Resolve when the rate is below 2% for 30 minutes; note the error class in the incident.
