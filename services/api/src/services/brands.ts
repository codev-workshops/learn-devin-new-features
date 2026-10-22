import type { Brand, BrandId } from "@harbourline/contracts";
import type { Queryable } from "../db.js";
import type { BrandPricing } from "../money.js";
import { money } from "../money.js";

export interface BrandRow {
  id: BrandId;
  name: string;
  currency: "USD" | "EUR";
  pricing: "tax_exclusive" | "tax_inclusive";
  tax_rate: string;
  locale: string;
  warehouses: string[];
  free_shipping_over: string | null;
  shipping_flat: string;
  order_number_prefix: string;
}

export async function listBrandRows(db: Queryable): Promise<BrandRow[]> {
  const { rows } = await db.query<BrandRow>("SELECT * FROM brands ORDER BY id");
  return rows;
}

export async function getBrandRow(db: Queryable, id: BrandId): Promise<BrandRow> {
  const { rows } = await db.query<BrandRow>("SELECT * FROM brands WHERE id = $1", [id]);
  if (!rows[0]) throw new Error(`brand ${id} is not seeded`);
  return rows[0];
}

export function brandPricing(row: BrandRow): BrandPricing {
  return {
    currency: row.currency,
    pricing: row.pricing,
    taxRate: Number(row.tax_rate),
    freeShippingOver: row.free_shipping_over === null ? null : Number(row.free_shipping_over),
    shippingFlat: Number(row.shipping_flat),
  };
}

export function brandToApi(row: BrandRow): Brand {
  return {
    id: row.id,
    name: row.name,
    currency: row.currency,
    pricing: row.pricing,
    taxRate: Number(row.tax_rate),
    locale: row.locale,
    warehouses: row.warehouses,
    ...(row.free_shipping_over !== null
      ? { freeShippingOver: money(row.free_shipping_over, row.currency) }
      : {}),
  };
}
