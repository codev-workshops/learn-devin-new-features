import type pg from "pg";
import type { Dataset } from "./generate.js";

const TABLES = [
  "webhook_inbox",
  "outbox",
  "order_events",
  "order_lines",
  "orders",
  "cart_lines",
  "carts",
  "price_list_entries",
  "price_lists",
  "inventory",
  "variants",
  "products",
  "collections",
  "users",
  "brands",
];

export async function resetSchema(client: pg.PoolClient): Promise<void> {
  await client.query(`TRUNCATE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`);
}

export async function isSeeded(client: pg.PoolClient): Promise<boolean> {
  const { rows } = await client.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM brands");
  return (rows[0]?.n ?? 0) > 0;
}

async function insertMany(
  client: pg.PoolClient,
  table: string,
  rows: Record<string, unknown>[],
  jsonColumns: string[] = [],
): Promise<void> {
  if (!rows.length) return;
  const columns = Object.keys(rows[0]!);
  const chunk = Math.max(1, Math.floor(60_000 / columns.length));
  for (let start = 0; start < rows.length; start += chunk) {
    const slice = rows.slice(start, start + chunk);
    const values: unknown[] = [];
    const tuples = slice.map(
      (row) =>
        `(${columns
          .map((c) => {
            const v = row[c];
            values.push(jsonColumns.includes(c) ? JSON.stringify(v) : v);
            return `$${values.length}`;
          })
          .join(", ")})`,
    );
    await client.query(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${tuples.join(", ")}`,
      values,
    );
  }
}

export async function loadDataset(client: pg.PoolClient, ds: Dataset): Promise<void> {
  const rows = (list: object[]) => list as Record<string, unknown>[];
  await insertMany(client, "brands", rows(ds.brands));
  await insertMany(client, "users", rows(ds.users));
  await insertMany(client, "collections", rows(ds.collections));
  await insertMany(client, "products", rows(ds.products));
  await insertMany(client, "variants", rows(ds.variants), ["attributes"]);
  await insertMany(client, "inventory", rows(ds.inventory));
  await insertMany(client, "price_lists", rows(ds.priceLists));
  await insertMany(client, "price_list_entries", rows(ds.priceEntries));
  await insertMany(client, "carts", rows(ds.carts));
  await insertMany(client, "cart_lines", rows(ds.cartLines));
  await insertMany(client, "orders", rows(ds.orders), ["shipping_address"]);
  await insertMany(client, "order_lines", rows(ds.orderLines));
  await insertMany(client, "order_events", rows(ds.orderEvents));
  await insertMany(client, "outbox", rows(ds.outbox), ["payload"]);
  await insertMany(client, "webhook_inbox", rows(ds.inbox), ["payload"]);
  await client.query("SELECT setval('order_number_seq', $1, false)", [ds.nextOrderNumber]);
}

export interface SeedSummary {
  brands: number;
  products: number;
  variants: number;
  orders: Record<string, number>;
  carts: Record<string, number>;
  pendingCarts: number;
  pendingCartsOver48h: number;
  pendingWebhooks: Record<string, number>;
  inventoryNegative: number;
}

export async function summarize(client: pg.Pool | pg.PoolClient, asOf: Date): Promise<SeedSummary> {
  const one = async <T extends pg.QueryResultRow>(sql: string, params: unknown[] = []) =>
    (await client.query<T>(sql, params)).rows;
  const counts = (list: { k: string; n: number }[]) =>
    Object.fromEntries(list.map((r) => [r.k, r.n]));
  return {
    brands: (await one<{ n: number }>("SELECT COUNT(*)::int AS n FROM brands"))[0]!.n,
    products: (await one<{ n: number }>("SELECT COUNT(*)::int AS n FROM products"))[0]!.n,
    variants: (await one<{ n: number }>("SELECT COUNT(*)::int AS n FROM variants"))[0]!.n,
    orders: counts(
      await one("SELECT brand AS k, COUNT(*)::int AS n FROM orders GROUP BY brand ORDER BY brand"),
    ),
    carts: counts(
      await one("SELECT brand AS k, COUNT(*)::int AS n FROM carts GROUP BY brand ORDER BY brand"),
    ),
    pendingCarts: (
      await one<{ n: number }>(
        "SELECT COUNT(*)::int AS n FROM carts WHERE pending_payment_id IS NOT NULL",
      )
    )[0]!.n,
    pendingCartsOver48h: (
      await one<{ n: number }>(
        "SELECT COUNT(*)::int AS n FROM carts WHERE pending_payment_id IS NOT NULL AND updated_at < $1",
        [new Date(asOf.getTime() - 48 * 3_600_000)],
      )
    )[0]!.n,
    pendingWebhooks: counts(
      await one(
        "SELECT type AS k, COUNT(*)::int AS n FROM webhook_inbox WHERE processed_at IS NULL GROUP BY type ORDER BY type",
      ),
    ),
    inventoryNegative: (
      await one<{ n: number }>(
        "SELECT COUNT(*)::int AS n FROM inventory WHERE on_hand - reserved < 0",
      )
    )[0]!.n,
  };
}
