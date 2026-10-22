# RB-102 — Negative on-hand inventory (oversell)

**Service:** kade-api · **Monitor:** 48213771 · **Owner:** Platform on-call · **Last reviewed:** 2026-10-21 · **Supersedes:** RB-101

## Symptom

`kade.inventory.on_hand` goes negative for a SKU during a traffic peak (flash sale, newsletter). Orders for the SKU keep being created and paid. The number keeps falling after any manual correction.

## Why this is not a cache problem

The worker has no inventory cache (removed in 2026.07). A negative on-hand means `POST /checkout` reserved more units than existed: the reservation reads `available`, then writes `on_hand - qty` without a row lock, so concurrent checkouts all pass the read. Every paid order for the missing units is a real customer who will not receive the product. Duplicate PayGate deliveries make it worse: the worker decrements stock once per delivery.

## Steps

1. Acknowledge the incident. **Do not** correct the stock count by hand — it hides the size of the problem and the alert re-fires as soon as traffic returns (see incident 2187, 02:31 → 02:52).
2. Quantify impact through the contract:
   - `GET /admin/inventory?belowSafety=true` — every SKU at or below zero.
   - `GET /admin/orders?status=paid&from=<deploy time>` and `status=confirmed` — count orders per affected SKU; compare with units on hand at the deploy. That difference is the number of customers who paid for nothing.
3. Stop the bleeding without a deploy: set the affected SKUs' price list entry to unavailable or raise `safetyStock` above the current on-hand via the merchandiser console so the storefront shows out of stock. If the sale must continue, the incident commander decides.
4. Find the cause in the traces: look for `checkout.reserve` spans with `db.statement` = `SELECT … FROM inventory` **without** `FOR UPDATE`, followed by an `UPDATE inventory SET on_hand = on_hand - $1` — several spans with the same `inventory.available_read` value in the same second (observability/otel/traces-oversell-checkout.json).
5. Check for the amplifier: `kade.webhooks.processed` by `{attempt}` and the worker logs for the same `event_id` processed twice.
6. Mitigation that holds until morning: pause the Lamp Week price list (`PUT /admin/price-lists/lamp-week-2026` with `activeTo` = now) so demand drops below the reservation race window; keep the SKUs out of stock.
7. Write the incident report (impact, timeline, cause, mitigation, follow-ups: row lock on reservation, idempotent webhook consumer). Hand over to merchandising at 08:00 with the affected-order list.

## Escalation

Incident commander immediately when more than one SKU is affected or orders exceed units by more than 10.
