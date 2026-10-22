-- Up Migration
-- Harbourline schema (W1-api). Applied with `pnpm db:migrate` (node-pg-migrate, SQL files).
-- Money columns are numeric(12,2) and are rendered as decimal strings at the API boundary.

CREATE TABLE brands (
  id                  text PRIMARY KEY,
  name                text NOT NULL,
  currency            text NOT NULL CHECK (currency IN ('USD', 'EUR')),
  pricing             text NOT NULL CHECK (pricing IN ('tax_exclusive', 'tax_inclusive')),
  tax_rate            numeric(6, 4) NOT NULL,
  locale              text NOT NULL,
  warehouses          text[] NOT NULL,
  free_shipping_over  numeric(12, 2),
  shipping_flat       numeric(12, 2) NOT NULL,
  order_number_prefix text NOT NULL
);

CREATE TABLE users (
  email text PRIMARY KEY,
  brand text REFERENCES brands (id),
  role  text NOT NULL CHECK (role IN ('customer', 'merchandiser', 'admin')),
  name  text NOT NULL
);

CREATE TABLE collections (
  brand       text NOT NULL REFERENCES brands (id),
  slug        text NOT NULL,
  name        text NOT NULL,
  description text,
  promotion   text,
  position    integer NOT NULL DEFAULT 0,
  PRIMARY KEY (brand, slug)
);

CREATE TABLE products (
  sku          text PRIMARY KEY,
  brand        text NOT NULL REFERENCES brands (id),
  name         text NOT NULL,
  description  text,
  collection   text NOT NULL,
  preorder     boolean NOT NULL DEFAULT false,
  ships_on     date,
  bundle       text[],
  safety_stock integer NOT NULL DEFAULT 0,
  low_stock    boolean NOT NULL DEFAULT false,
  position     integer NOT NULL DEFAULT 0,
  FOREIGN KEY (brand, collection) REFERENCES collections (brand, slug)
);
CREATE INDEX products_brand_collection_idx ON products (brand, collection, position);

-- Sellable variants of a product (`TS-JKT-01-M-BLK`). Products without variants are sold by their own SKU.
CREATE TABLE variants (
  sku         text PRIMARY KEY,
  product_sku text NOT NULL REFERENCES products (sku) ON DELETE CASCADE,
  attributes  jsonb NOT NULL DEFAULT '{}'::jsonb,
  position    integer NOT NULL DEFAULT 0
);
CREATE INDEX variants_product_idx ON variants (product_sku, position);

-- One row per sellable SKU (product or variant) and warehouse. `available` = on_hand - reserved.
CREATE TABLE inventory (
  sku          text NOT NULL,
  warehouse    text NOT NULL,
  brand        text REFERENCES brands (id),
  product_sku  text REFERENCES products (sku) ON DELETE CASCADE,
  on_hand      integer NOT NULL DEFAULT 0,
  reserved     integer NOT NULL DEFAULT 0,
  safety_stock integer NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sku, warehouse)
);
CREATE INDEX inventory_brand_idx ON inventory (brand, sku);

CREATE TABLE price_lists (
  id          text PRIMARY KEY,
  brand       text NOT NULL REFERENCES brands (id),
  name        text NOT NULL,
  currency    text NOT NULL,
  active_from timestamptz,
  active_to   timestamptz
);

CREATE TABLE price_list_entries (
  price_list_id    text NOT NULL REFERENCES price_lists (id) ON DELETE CASCADE,
  sku              text NOT NULL REFERENCES products (sku) ON DELETE CASCADE,
  price            numeric(12, 2) NOT NULL,
  compare_at_price numeric(12, 2),
  PRIMARY KEY (price_list_id, sku)
);

CREATE TABLE carts (
  id                 uuid PRIMARY KEY,
  brand              text NOT NULL REFERENCES brands (id),
  user_email         text NOT NULL,
  status             text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'checked_out', 'abandoned')),
  pending_payment_id text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX carts_brand_status_idx ON carts (brand, status, updated_at);

CREATE TABLE cart_lines (
  id         uuid PRIMARY KEY,
  cart_id    uuid NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
  sku        text NOT NULL,
  name       text NOT NULL,
  quantity   integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12, 2) NOT NULL,
  currency   text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cart_lines_cart_idx ON cart_lines (cart_id, created_at);

CREATE SEQUENCE order_number_seq START WITH 100001;

CREATE TABLE orders (
  id               uuid PRIMARY KEY,
  number           text NOT NULL UNIQUE,
  brand            text NOT NULL REFERENCES brands (id),
  user_email       text NOT NULL,
  cart_id          uuid,
  status           text NOT NULL CHECK (status IN ('pending_payment', 'paid', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded', 'chargeback')),
  subtotal         numeric(12, 2) NOT NULL DEFAULT 0,
  discount         numeric(12, 2) NOT NULL DEFAULT 0,
  tax              numeric(12, 2) NOT NULL DEFAULT 0,
  shipping         numeric(12, 2) NOT NULL DEFAULT 0,
  total            numeric(12, 2) NOT NULL DEFAULT 0,
  currency         text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR')),
  tax_included     boolean NOT NULL DEFAULT false,
  totals           jsonb,
  payment_id       text,
  idempotency_key  text,
  shipping_address jsonb,
  placed_at        timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_brand_placed_idx ON orders (brand, placed_at DESC, id DESC);
CREATE INDEX orders_user_idx ON orders (brand, user_email, placed_at DESC);
CREATE INDEX orders_status_idx ON orders (brand, status);
CREATE UNIQUE INDEX orders_idempotency_idx ON orders (brand, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE order_lines (
  order_id   uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  position   integer NOT NULL DEFAULT 0,
  sku        text NOT NULL,
  name       text NOT NULL,
  quantity   integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12, 2) NOT NULL,
  line_total numeric(12, 2) NOT NULL,
  warehouse  text NOT NULL,
  PRIMARY KEY (order_id, position)
);

CREATE TABLE order_events (
  id          uuid PRIMARY KEY,
  order_id    uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  type        text NOT NULL,
  from_status text,
  to_status   text,
  source      text,
  detail      text,
  at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_events_order_idx ON order_events (order_id, at);

-- Transactional outbox: written in the same transaction as the business change, drained by the worker.
CREATE TABLE outbox (
  id           uuid PRIMARY KEY,
  topic        text NOT NULL,
  payload      jsonb NOT NULL,
  order_id     uuid,
  created_at   timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  attempts     integer NOT NULL DEFAULT 0
);
CREATE INDEX outbox_unprocessed_idx ON outbox (created_at) WHERE processed_at IS NULL;

-- PayGate webhook inbox. event_id is deliberately NOT unique: delivery is at-least-once and the
-- consumer (fulfilment-worker) owns de-duplication.
CREATE TABLE webhook_inbox (
  id           uuid PRIMARY KEY,
  event_id     text NOT NULL,
  type         text NOT NULL,
  occurred_at  timestamptz,
  attempt      integer NOT NULL DEFAULT 1,
  signature    text,
  payload      jsonb NOT NULL,
  received_at  timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  result       text
);
-- Emails the fulfilment worker "sent" (fixture outbox, read by labs).
CREATE TABLE sent_emails (
  id       bigserial PRIMARY KEY,
  to_email text NOT NULL,
  subject  text NOT NULL,
  body     text NOT NULL,
  order_id uuid,
  sent_at  timestamptz,
  meta     jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX webhook_inbox_pending_idx ON webhook_inbox (received_at) WHERE processed_at IS NULL;
CREATE INDEX webhook_inbox_event_idx ON webhook_inbox (event_id);

-- Down Migration
DROP TABLE IF EXISTS sent_emails;
DROP TABLE IF EXISTS webhook_inbox;
DROP TABLE IF EXISTS outbox;
DROP TABLE IF EXISTS order_events;
DROP TABLE IF EXISTS order_lines;
DROP TABLE IF EXISTS orders;
DROP SEQUENCE IF EXISTS order_number_seq;
DROP TABLE IF EXISTS cart_lines;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS price_list_entries;
DROP TABLE IF EXISTS price_lists;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS variants;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS collections;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS brands;
