# Planted defects — services/api

These defects are **features of the course**. Never fix them on `main`; remediation demos live on throwaway branches that are closed without merging. Each row has a skipped test in `test/planted.test.ts` that states the correct behaviour and fails on `main` when un-skipped.

| id (seed-spec)         | Where                                                            | What is wrong                                                                                                                                                  | Symptom                                                                                                                                    | Skipped test           |
| ---------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| `oversell`             | `src/routes/checkout.ts` reservation loop                        | Reads `on_hand - reserved`, then `UPDATE … reserved + n` with no `SELECT … FOR UPDATE` / atomic guard, so concurrent checkouts all pass the availability check | `scenarios/oversell.sh` fires 20 checkouts on `LH-LAMP-03` (3 units); several succeed and `available` goes negative                        | `oversell`             |
| `cross-brand-leak`     | `src/routes/orders.ts` `GET /orders/:orderId`                    | Looks the order up by id only; the caller's `X-Kade-Brand` is never part of the predicate (the events/cancel routes do check it)                               | A Lumen merchandiser can read Trailhead orders by id                                                                                       | `cross-brand-leak`     |
| `unverified-signature` | `src/routes/webhooks.ts`                                         | `X-PayGate-Signature` is required and the expected HMAC is computed, but the two are never compared                                                            | Anyone can POST a webhook into the inbox                                                                                                   | `unverified-signature` |
| `n-plus-one`           | `src/routes/catalog.ts` + `src/services/catalog.ts#buildProduct` | The collection page calls `buildProduct` per product, and each call issues its own price, variant and per-variant inventory queries                            | Dozens of statements per Lamp Week page view (27 for six products; grows with every SKU and variant) (`Db.queryCount` makes it measurable) | `n-plus-one`           |
| `price-drift`          | `src/routes/checkout.ts` totals                                  | Order lines and totals come from `cart_lines.unit_price` captured when the line was added, not from the current price list                                     | A flash-sale price change (or a stale pre-sale cart) is not reflected at checkout                                                          | `price-drift`          |
| `currency-rounding`    | `src/money.ts` (`roundHalfUp`, `computeTotals`)                  | Totals use JavaScript floats with half-up rounding; the fulfilment worker recomputes with Decimal and banker's rounding                                        | 1-cent drift on ≈3% of VAT-inclusive Trailhead orders; reconciliation never balances                                                       | `currency-rounding`    |

## Demonstrating a plant

```bash
npm run db:seed -- --reset                       # universal reset
sed -i 's/it.skip(/it(/' services/api/test/planted.test.ts   # on a throwaway branch only
npm test -w services/api                         # the un-skipped tests now fail
git checkout -- services/api/test/planted.test.ts
```

Worker-side plants (`duplicate-webhook`, `abandoned-cart-sweeper`) and the migration plant (`bad-migration`) are owned by `services/fulfilment-worker` and `scenarios/`; the API deliberately keeps `webhook_inbox.event_id` non-unique and `orders.currency NOT NULL DEFAULT 'USD'` so they can be exercised.
