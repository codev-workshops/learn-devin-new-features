# RB-101 — Negative on-hand inventory (inventory cache)

**Service:** kade-api / kade-fulfilment-worker · **Monitor:** 48213771 · **Owner:** Platform on-call · **Last reviewed:** 2026-06-03

## Symptom

Datadog reports a negative `kade.inventory.on_hand` for one SKU. The storefront still shows the product as "low stock".

## Cause

The fulfilment worker keeps an in-memory inventory cache that drifts from the database when the worker is restarted mid-batch. The negative number is a cache artefact, not real stock. Customers are not affected.

## Steps

1. Confirm the alert in Datadog and acknowledge the PagerDuty incident.
2. Restart the fulfilment worker to flush its cache:
   `docker compose -f docker-compose.yml -f docker-compose.services.yml restart fulfilment-worker`
3. Correct the on-hand figure to the last known warehouse count with the admin API:
   `PATCH /admin/inventory/{sku}` with `{"warehouse":"US-NJ","delta":<amount>,"reason":"count_correction","note":"RB-101"}`
4. Wait for the monitor to recover (≈5 min). Resolve the incident.
5. No incident report is needed for cache artefacts; add a note to the PagerDuty incident.

## Escalation

Only if the worker restart fails. Do not page merchandising at night for a cache artefact.
