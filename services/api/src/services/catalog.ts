import type { Availability, BrandId, Money, Product, Variant } from "@kade/contracts";
import { now } from "../config.js";
import type { Queryable } from "../db.js";
import { notFound } from "../errors.js";
import { money } from "../money.js";

export interface ProductRow {
  sku: string;
  brand: BrandId;
  name: string;
  description: string | null;
  collection: string;
  preorder: boolean;
  bundle: string[] | null;
  safety_stock: number;
  low_stock: boolean;
}

interface PriceRow {
  price: string;
  base_price: string | null;
  price_list_id: string;
}

/**
 * Current price of a sellable SKU: the active promotion price list wins over the base list.
 * `compareAtPrice` is the base price when a promotion applies.
 */
export async function currentPrice(
  db: Queryable,
  brand: BrandId,
  sku: string,
  currency: "USD" | "EUR",
): Promise<{ price: Money; compareAtPrice?: Money; priceListId: string }> {
  const { rows } = await db.query<PriceRow>(
    `SELECT e.price, b.price AS base_price, e.price_list_id
       FROM price_list_entries e
       JOIN price_lists pl ON pl.id = e.price_list_id
       LEFT JOIN price_list_entries b ON b.sku = e.sku AND b.price_list_id = $4
      WHERE e.sku = $1 AND pl.brand = $2
        AND (pl.active_from IS NULL OR pl.active_from <= $3)
        AND (pl.active_to IS NULL OR pl.active_to > $3)
      ORDER BY (pl.active_from IS NOT NULL) DESC, pl.active_from DESC NULLS LAST
      LIMIT 1`,
    [sku, brand, now(), `${brand}-base`],
  );
  const row = rows[0];
  if (!row) throw notFound(`SKU ${sku} has no price in brand ${brand}`);
  const price = money(row.price, currency);
  const out: { price: Money; compareAtPrice?: Money; priceListId: string } = {
    price,
    priceListId: row.price_list_id,
  };
  if (row.base_price !== null && Number(row.base_price) !== Number(row.price)) {
    out.compareAtPrice = money(row.base_price, currency);
  }
  return out;
}

export async function getProductRow(db: Queryable, brand: BrandId, sku: string) {
  const { rows } = await db.query<ProductRow>(
    "SELECT sku, brand, name, description, collection, preorder, bundle, safety_stock, low_stock FROM products WHERE sku = $1 AND brand = $2",
    [sku, brand],
  );
  return rows[0] ?? null;
}

/** Resolves a sellable SKU (product or variant) to its product row within the brand. */
export async function resolveSellable(db: Queryable, brand: BrandId, sku: string) {
  const { rows } = await db.query<
    ProductRow & { sellable_sku: string; is_variant: boolean; has_variants: boolean }
  >(
    `SELECT p.sku, p.brand, p.name, p.description, p.collection, p.preorder, p.bundle, p.safety_stock, p.low_stock,
            COALESCE(v.sku, p.sku) AS sellable_sku, (v.sku IS NOT NULL) AS is_variant,
            EXISTS (SELECT 1 FROM variants pv WHERE pv.product_sku = p.sku) AS has_variants
       FROM products p
       LEFT JOIN variants v ON v.sku = $1 AND v.product_sku = p.sku
      WHERE p.brand = $2 AND (p.sku = $1 OR v.sku = $1)
      LIMIT 1`,
    [sku, brand],
  );
  return rows[0] ?? null;
}

async function variantsOf(db: Queryable, productSku: string) {
  const { rows } = await db.query<{ sku: string; attributes: Record<string, string> }>(
    "SELECT sku, attributes FROM variants WHERE product_sku = $1 ORDER BY position",
    [productSku],
  );
  return rows;
}

async function availableFor(
  db: Queryable,
  sku: string,
): Promise<{ onHand: number; available: number }> {
  const { rows } = await db.query<{ on_hand: number; available: number }>(
    "SELECT COALESCE(SUM(on_hand), 0)::int AS on_hand, COALESCE(SUM(on_hand - reserved), 0)::int AS available FROM inventory WHERE sku = $1",
    [sku],
  );
  return { onHand: rows[0]?.on_hand ?? 0, available: rows[0]?.available ?? 0 };
}

function availability(p: ProductRow, available: number): Availability {
  if (p.preorder) return "preorder";
  if (available <= 0) return "out_of_stock";
  if (p.low_stock || available <= p.safety_stock) return "low_stock";
  return "in_stock";
}

/**
 * Builds the API Product. Every call issues its own price, variant and inventory queries —
 * the collection page calls this once per product (PLANTED.md `n-plus-one`).
 */
export async function buildProduct(
  db: Queryable,
  p: ProductRow,
  currency: "USD" | "EUR",
): Promise<Product> {
  const priced = await currentPrice(db, p.brand, p.sku, currency);
  const variantRows = await variantsOf(db, p.sku);
  const variants: Variant[] = [];
  let available = 0;
  if (variantRows.length) {
    for (const v of variantRows) {
      const stock = await availableFor(db, v.sku);
      available += stock.available;
      variants.push({
        sku: v.sku,
        attributes: v.attributes,
        onHand: stock.onHand,
        price: priced.price,
      });
    }
  } else if (p.bundle && p.bundle.length) {
    let min = Number.POSITIVE_INFINITY;
    for (const component of p.bundle) {
      const stock = await availableFor(db, component);
      min = Math.min(min, stock.available);
    }
    available = Number.isFinite(min) ? min : 0;
  } else {
    available = (await availableFor(db, p.sku)).available;
  }
  return {
    sku: p.sku,
    name: p.name,
    brand: p.brand,
    ...(p.description ? { description: p.description } : {}),
    collection: p.collection,
    price: priced.price,
    ...(priced.compareAtPrice ? { compareAtPrice: priced.compareAtPrice } : {}),
    ...(p.bundle && p.bundle.length ? { bundle: p.bundle } : {}),
    preorder: p.preorder,
    variants,
    availability: availability(p, available),
  };
}
