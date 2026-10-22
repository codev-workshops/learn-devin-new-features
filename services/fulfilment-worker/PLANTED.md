# Planted defects — fulfilment worker and PayGate fake

These three defects are **course fixtures** (see `packages/contracts/seed-spec.yaml#planted_edge_cases`).
They stay on `main`. Remediation is demonstrated on throwaway branches that are closed without merging,
and every lab that uses them (7, 12, 15 for the first two; 5, 6, 9 for the third) depends on the symptoms
below being reproducible with the commands shown. Do not fix them here.

Every demo runs offline against the in-memory store (`MemoryStore`), so it works before `services/api`
and the `db/` migrations exist. `scripts/demo-duplicate-webhook.sh` additionally runs the real wire path.

## duplicate-webhook

- **Where:** `src/fulfilment_worker/webhooks.py::process_pending` applies every inbox row. Nothing reads
  `event_id` for idempotency, `db/expected-schema.sql` deliberately has no unique index on
  `webhook_inbox.event_id`, and `inbox_server.py` happily accepts a replay with the same id (202 twice).
- **Symptom:** the same `payment.succeeded` delivered twice (PayGate is at-least-once; `paygate-fake fire
  --duplicate`) confirms the order twice, decrements `onHand` twice, and queues two confirmation emails.
- **Reproduce:**
  ```sh
  python3 -m fulfilment_worker demo duplicate-webhook        # in-memory, deterministic
  PYTHON=python3.12 scripts/demo-duplicate-webhook.sh        # paygate-fake --duplicate -> inbox -> tick
  ```
  Expected tail: `on_hand 3 -> 1 (idempotent would be 2); confirmed 2x, 2 emails`.
- **Tests that pin the symptom:** `tests/test_webhooks_plant.py::test_duplicate_event_id_decrements_twice`,
  `tests/test_store_postgres.py` (same assertion through PostgreSQL), `tests/test_inbox_server.py`.
- **Remediation sketch (throwaway branch only):** check `event_id` before applying, or add
  `CREATE UNIQUE INDEX ON webhook_inbox (event_id)` and let the inbox return 202 for the duplicate without
  inserting. Both the `MemoryStore` and the `PostgresStore` paths need the change.

## abandoned-cart-sweeper

- **Where:** `src/fulfilment_worker/sweeper.py::sweep` deletes every open cart older than 48 h. It looks up
  the pending order for the cart only to release the reservation and empty the order — it never skips carts
  whose `pendingPaymentId` is set.
- **Symptom:** a customer who paid late (PayGate `--delay`) gets a `payment.succeeded` webhook for a cart
  the sweeper has already deleted. The worker confirms the (now line-less) order: a ghost order with
  `lines: []`, a non-zero total, nothing reserved and nothing to pick.
- **Reproduce:**
  ```sh
  python3 -m fulfilment_worker demo abandoned-cart
  ```
  Expected tail: `late webhook confirmed order TS-200117 with 0 lines`.
- **Tests that pin the symptom:** `tests/test_sweeper_plant.py::test_sweeper_deletes_cart_with_pending_payment`,
  `::test_late_webhook_after_sweep_confirms_ghost_order`.
- **Remediation sketch:** skip carts with a pending payment younger than the PayGate session TTL, and have
  the webhook processor refuse to confirm an order with no lines (refund instead).

## rounding-mismatch

- **Where:** `src/fulfilment_worker/totals.py::recompute` uses `Decimal` with `ROUND_HALF_EVEN` on the
  order subtotal. `services/api` (W1-api) stores totals computed with JS floats, rounding tax half-up
  *per line* (`totals.py::api_totals` models that side for the fixtures).
- **Symptom:** one-cent drift that never reconciles: `$58.00 × 8.25% = 4.785` is 4.79 for the API and 4.78
  for the worker; a two-line VAT-inclusive Trailhead order splits VAT per line as 34.00 but 33.99 on the
  subtotal. The reconciliation report (`kade-worker reconcile`) is never empty.
- **Reproduce:**
  ```sh
  python3 -m fulfilment_worker demo rounding-drift
  ```
  Expected tail: `3/8 orders never reconcile`.
- **Tests that pin the symptom:** `tests/test_totals.py::test_planted_rounding_mismatch_lumen_half_cent`,
  `::test_planted_rounding_mismatch_trailhead_per_line`.
- **Remediation sketch:** one rounding rule on both sides (the contract says money is a decimal string:
  compute in the API with a decimal library, round once per order, same mode as the worker).

## Not planted here

The unverified webhook signature (`POST /webhooks/payments` in `services/api`) belongs to W1-api. The worker's
own inbox (`kade-worker inbox`) verifies `X-PayGate-Signature` properly, and `paygate-fake` always signs.
