# AGENTS.md — services/fulfilment-worker (owner: W1-worker)

- Python 3.12. Gates: `pytest -q`, `ruff check .`, `ruff format --check .` (the workspace `npm run test/lint/build`
  forward to them). Run them from this directory before every commit.
- Money is `Decimal` built from two-fractional-digit strings; `money.parse` rejects floats on purpose. Brand rules
  live in `brands.py` and mirror `packages/contracts/seed-spec.yaml`.
- `PLANTED.md` lists three deliberate defects (duplicate-webhook, abandoned-cart-sweeper, rounding-mismatch).
  Never fix them on `main`; tests in `tests/test_*_plant.py` and `tests/test_totals.py` pin the symptoms and
  must keep passing. Remediation demos live on throwaway branches that are closed without merging.
- `db/expected-schema.sql` documents what the worker reads and writes. The real migrations are owned by W1-api in
  `db/`; reconcile column names in `store_postgres.py` only.
- `docker-compose.services.yml` at the repo root is owned by this service; never edit the root `docker-compose.yml`.
