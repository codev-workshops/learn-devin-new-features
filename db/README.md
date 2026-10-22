# db/ — migrations and seeds

Owned by W1-api. The database is PostgreSQL 16 started by the root `docker compose` file.

| Path              | What                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `migrations/*.sql` | [node-pg-migrate](https://github.com/salsita/node-pg-migrate) SQL migrations (`-- Up Migration` / `-- Down Migration` sections)      |
| seeds             | Generated, not stored: `services/api/src/seed/` derives the whole dataset deterministically from `packages/contracts/seed-spec.yaml` |

Commands (from the repo root; both delegate to `services/api`):

```sh
npm run db:up                    # start Postgres and wait for the healthcheck
npm run db:migrate               # apply pending migrations (table `pgmigrations`)
npm run db:seed                  # seed an empty database; refuses to run twice
npm run db:seed -- --reset       # truncate every table and rebuild the seed — the universal lab reset
npm run db:seed -- --verify      # recompute the dataset and compare row counts and checksums with the database
```

`DATABASE_URL` (default `postgres://kade:kade@localhost:5432/kade`) selects the database. The seed is
byte-for-byte reproducible: identical ids, timestamps and totals on every run because every random
choice comes from a PRNG seeded with `seed: 20261022` and every clock reading is `as_of`.

Planted schema facts (see `services/api/PLANTED.md`): `webhook_inbox.event_id` is not unique on
purpose, and `orders.currency` carries the `NOT NULL DEFAULT` that `scenarios/bad-migration.patch`
removes.

## Worker compatibility

`services/fulfilment-worker/db/expected-schema.sql` documents what the worker reads and writes. The initial migration keeps the two in step: `orders.totals` (jsonb mirror of the API totals), `order_lines` keyed by `(order_id, position)`, `outbox(topic, order_id, attempts)`, `webhook_inbox.result`, nullable `webhook_inbox.occurred_at`, nullable `inventory.brand/product_sku` and `cart_lines.currency`, and the `sent_emails` table. The API always fills the richer columns; the worker may leave them null.
