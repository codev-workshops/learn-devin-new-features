# @harbourline/fulfilment-worker

Python 3.12 background worker for Harbourline: consumes the outbox, reserves and commits inventory,
processes PayGate payment webhooks, sweeps abandoned carts and recomputes order totals with `Decimal`
and banker's rounding. Three defects are planted on purpose — read [PLANTED.md](PLANTED.md) first.

## Layout

| Module                        | Role                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `webhooks.py`                 | Payment-webhook processor (`payment.succeeded/failed/refunded`, `chargeback.opened`)  |
| `reservations.py`             | `reserve` / `commit` / `release` against `inventory (sku, warehouse)`                  |
| `sweeper.py`                  | Abandoned-cart sweeper (48 h)                                                          |
| `outbox.py`                   | Outbox consumer: email topics → `sent_emails`, everything else logged                  |
| `totals.py`                   | `recompute` (worker, half-even) and `api_totals` (models the API side) + `reconcile`  |
| `money.py`, `brands.py`       | Decimal money strings (floats rejected) and the two brands' tax/shipping rules        |
| `store.py`, `store_postgres.py` | `Store` protocol; `MemoryStore` (optional JSON file) and psycopg 3 `PostgresStore`   |
| `inbox_server.py`, `signing.py` | HMAC-verifying webhook receiver (`POST /webhooks/payments`, `GET /inbox`, `/health`) |
| `fixtures.py`, `cli.py`       | Deterministic demo data; `harbourline-worker` CLI                                            |
| `db/expected-schema.sql`      | The tables the worker expects (`db/` migrations are owned by W1-api)                   |

## Run

```sh
cd services/fulfilment-worker
python3.12 -m pip install -e ".[dev]"          # ruff, pytest, psycopg, pyyaml

harbourline-worker run                                 # poll loop (DATABASE_URL → Postgres, else WORKER_STORE_PATH JSON)
harbourline-worker once [--sweep]                      # one tick, JSON summary
harbourline-worker sweep | reconcile | inventory [--sku SKU]
harbourline-worker inbox [--port 3003]                 # standalone HMAC-verifying webhook receiver
harbourline-worker seed-demo                           # Lamp Week order + late cart + reconciliation orders
harbourline-worker demo duplicate-webhook|abandoned-cart|rounding-drift [--json]
```

`python3 -m fulfilment_worker …` works without installing (set `PYTHONPATH=src`). Environment:
`DATABASE_URL`, `WORKER_STORE_PATH`, `PAYGATE_SECRET` (default `harbourline-local-paygate-secret`),
`WORKER_POLL_INTERVAL`, `SWEEPER_MAX_AGE_HOURS`, `SWEEPER_INTERVAL`, `WORKER_INBOX_PORT`, `WORKER_BATCH_SIZE`.

With Compose (from the repo root, overlay owned by this service):

```sh
docker compose -f docker-compose.yml -f docker-compose.services.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.services.yml --profile standalone up -d   # + worker inbox on :3003
```

## Gates

```sh
pytest -q && ruff check . && ruff format --check .       # or: pnpm --filter @harbourline/fulfilment-worker test / lint / build
HARBOURLINE_TEST_DATABASE_URL=postgres://harbourline:harbourline@localhost:5432/harbourline pytest -q tests/test_store_postgres.py
PYTHON=python3.12 scripts/demo-duplicate-webhook.sh      # wire-level duplicate-webhook proof
```

The Postgres test creates a `worker_test` schema from `db/expected-schema.sql`, so it runs against the root
`pnpm db:up` database without touching the API's tables.
