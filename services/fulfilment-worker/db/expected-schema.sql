-- Tables the fulfilment worker reads and writes (services/fulfilment-worker/src/fulfilment_worker/store_postgres.py).
-- db/ at the repo root is owned by W1-api; this file documents the shape the worker expects and
-- doubles as the schema for the worker's own Postgres integration test (tests/test_store_postgres.py).
-- Column names follow the OpenAPI schemas in snake_case. Money columns are NUMERIC(12,2).

CREATE TABLE IF NOT EXISTS inventory (
  sku           TEXT        NOT NULL,
  warehouse     TEXT        NOT NULL,
  on_hand       INTEGER     NOT NULL DEFAULT 0,
  reserved      INTEGER     NOT NULL DEFAULT 0,
  safety_stock  INTEGER     NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ,
  PRIMARY KEY (sku, warehouse)
);

CREATE TABLE IF NOT EXISTS carts (
  id                  UUID        PRIMARY KEY,
  brand               TEXT        NOT NULL,
  user_email          TEXT        NOT NULL,
  status              TEXT        NOT NULL DEFAULT 'open',
  pending_payment_id  TEXT,
  created_at          TIMESTAMPTZ NOT NULL,
  updated_at          TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS cart_lines (
  id          UUID          PRIMARY KEY,
  cart_id     UUID          NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  sku         TEXT          NOT NULL,
  name        TEXT          NOT NULL,
  quantity    INTEGER       NOT NULL,
  unit_price  NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id          UUID          PRIMARY KEY,
  number      TEXT          NOT NULL,
  brand       TEXT          NOT NULL,
  user_email  TEXT          NOT NULL,
  cart_id     UUID,
  status      TEXT          NOT NULL,
  currency    TEXT          NOT NULL DEFAULT 'USD',   -- scenarios/bad-migration.patch drops this default (W1-fixtures)
  totals      JSONB         NOT NULL,
  payment_id  TEXT,
  placed_at   TIMESTAMPTZ   NOT NULL,
  updated_at  TIMESTAMPTZ   NOT NULL
);

CREATE TABLE IF NOT EXISTS order_lines (
  order_id    UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  position    INTEGER       NOT NULL,
  sku         TEXT          NOT NULL,
  name        TEXT          NOT NULL,
  quantity    INTEGER       NOT NULL,
  unit_price  NUMERIC(12,2) NOT NULL,
  line_total  NUMERIC(12,2) NOT NULL,
  warehouse   TEXT          NOT NULL,
  PRIMARY KEY (order_id, position)
);

CREATE TABLE IF NOT EXISTS order_events (
  id           UUID        PRIMARY KEY,
  order_id     UUID        NOT NULL,
  type         TEXT        NOT NULL,
  from_status  TEXT,
  to_status    TEXT,
  source       TEXT,
  detail       TEXT,
  at           TIMESTAMPTZ NOT NULL
);

-- PayGate deliveries land here (via services/api or the worker's inbox server). There is
-- deliberately NO unique index on event_id: the worker ignores it (PLANTED.md#duplicate-webhook).
CREATE TABLE IF NOT EXISTS webhook_inbox (
  id            UUID        PRIMARY KEY,
  event_id      TEXT        NOT NULL,
  type          TEXT        NOT NULL,
  payload       JSONB       NOT NULL,
  received_at   TIMESTAMPTZ NOT NULL,
  processed_at  TIMESTAMPTZ,
  result        TEXT
);

CREATE TABLE IF NOT EXISTS outbox (
  id            UUID        PRIMARY KEY,
  topic         TEXT        NOT NULL,
  payload       JSONB       NOT NULL,
  order_id      UUID,
  created_at    TIMESTAMPTZ NOT NULL,
  processed_at  TIMESTAMPTZ,
  attempts      INTEGER     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sent_emails (
  id        BIGSERIAL   PRIMARY KEY,
  to_email  TEXT        NOT NULL,
  subject   TEXT        NOT NULL,
  body      TEXT        NOT NULL,
  order_id  UUID,
  sent_at   TIMESTAMPTZ,
  meta      JSONB       NOT NULL DEFAULT '{}'::jsonb
);
