# scenarios/ — injectors, briefs and the lab reset (W1-fixtures)

Everything here drives the platform **only through the frozen OpenAPI contract** (`packages/contracts/openapi.yaml`): carts, checkout, admin inventory/orders, signed `POST /webhooks/payments`. No `psql`, no Docker, no service internals — so the same scripts run against `services/api`, against the test stub, or against a deployment.

| File                              | Plant (seed-spec id)     | Labs         | Visible symptom                                                                                        |
| --------------------------------- | ------------------------ | ------------ | ------------------------------------------------------------------------------------------------------ |
| `oversell.sh`                     | `oversell`               | 5, 9, 12, 15 | 20 concurrent checkouts on a 3-unit SKU; several succeed; `GET /admin/inventory` shows negative onHand |
| `duplicate-webhook.sh`            | `duplicate-webhook`      | 7, 12, 15    | Same `event_id` delivered twice → two `payment_received` events, two emails, stock decremented twice   |
| `abandoned-carts.sh`              | `abandoned-cart-sweeper` | 7, 12, 15    | Late `payment.succeeded` for a cart the sweeper deleted → paid order with zero lines (ghost order)     |
| `rounding-drift.sh`               | `currency-rounding`      | 5, 6, 9      | API totals (floats, half-up per line) differ by a cent from the exact Decimal/banker's recomputation   |
| `bad-migration.patch`             | `bad-migration`          | 2, 12        | `git apply` adds a migration dropping the NOT NULL default on `orders.currency`; worker dies on NULL   |
| `lab-reset.sh <nn>`               | —                        | all          | Called by `pnpm lab:reset -- <nn>` after `db:seed --reset`; reverts the patch, clears `.state`      |
| `scenarios.json`, `briefs/*.json` | —                        | all          | Manifest and customer briefs as data; lab authors copy `injectors[].lab` rows into `lab.json`          |

## Running

```sh
export HARBOURLINE_API_URL=http://localhost:3001        # default
scenarios/oversell.sh --concurrency 20           # exit 0 = symptom observed
scenarios/duplicate-webhook.sh --wait 20
scenarios/abandoned-carts.sh --older-than 48     # --sweeper worker|contract|auto; --fresh when the seeded carts are used up
scenarios/rounding-drift.sh --orders 40 --seed 7   # default --brand lumen-home (8.25% ties drift against services/api)
git apply scenarios/bad-migration.patch && pnpm db:migrate   # lab 2: a hook should block this
pnpm lab:reset -- 12
```

Exit codes (shared, `lib/common.sh`): `0` symptom observed · `2` precondition/usage (API down, missing `curl`/`jq`/`openssl`) · `3` no symptom — the plant looks fixed · `4` accepted by the API but the worker-side symptom did not appear within `--wait`. Every run ends with a `SYMPTOM:`/`NO SYMPTOM:` line and a machine-readable `RESULT: {…}` line; what each injector created is appended to `scenarios/.state/<injector>.jsonl` (gitignored) for the debrief.

Webhooks are signed with `PAYGATE_SECRET`; the `.env.example` default is assumed only when `HARBOURLINE_API_URL` is a loopback address, anything else must set it explicitly. `abandoned-carts.sh` runs the real sweeper (`python3 -m fulfilment_worker sweep`, which cancels the order and drops its lines) when the worker is importable and `DATABASE_URL` is set, and falls back to the contract-visible part (`DELETE /carts/{cartId}`) otherwise. `services/paygate-fake` reaches the same duplicate/late outcomes with its `--duplicate` and `--delay` knobs (`PUT /knobs` at runtime, or `paygate-fake fire --duplicate …`); these scripts are the path that needs only the API. `lab-reset.sh` turns the knobs off again when PayGate is reachable at `PAYGATE_URL`.

## Tests

```sh
node --test 'scenarios/test/*.test.mjs'
```

`test/contract-stub.mjs` is an in-memory implementation of the contract subset the injectors touch, **with the planted defects**, standing in for `services/api` + the worker. Each injector is executed for real (bash, curl, jq) against it and its symptom is asserted; the manifest, briefs, seed-spec plant ids and contract paths are cross-checked; the patch is applied and reverted in a scratch repo. Run the same suite against a live API with `SCENARIOS_LIVE=1 HARBOURLINE_API_URL=http://localhost:3001`.

Never fix a plant on `main`; remediation demos live on throwaway branches that are closed without merging.
