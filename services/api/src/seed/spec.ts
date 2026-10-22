import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { BrandId, Currency, OrderStatus } from "@harbourline/contracts";
import { repoRoot } from "../config.js";

export interface SpecCollection {
  slug: string;
  name: string;
  description?: string;
  promotion?: string;
}

export interface SpecBrand {
  name: string;
  currency: Currency;
  pricing: "tax_exclusive" | "tax_inclusive";
  tax_rate: number;
  locale: string;
  warehouses: string[];
  free_shipping_over: string | null;
  shipping_flat: string;
  order_number_prefix: string;
  sku_count: number;
  collections: SpecCollection[];
}

export interface SpecSku {
  sku: string;
  name: string;
  collection: string;
  price: string;
  on_hand: number;
  safety_stock: number;
  low_stock?: boolean;
  note?: string;
  bundle?: string[];
  variants?: Record<string, string[]>;
  preorder?: boolean;
  ships?: string;
}

export interface SpecPriceList {
  id: string;
  brand: BrandId;
  name: string;
  active_from?: string;
  active_to?: string;
  rule?: string;
}

export interface SpecUser {
  email: string;
  brand: BrandId | null;
  role: "merchandiser" | "admin";
  name: string;
}

export interface SeedSpec {
  version: number;
  seed: number;
  as_of: string;
  brands: Record<BrandId, SpecBrand>;
  price_lists: SpecPriceList[];
  skus: Record<BrandId, SpecSku[]>;
  users: { merchandisers: SpecUser[]; admins: SpecUser[]; customers: { rule: string } };
  orders: {
    total: number;
    split: Record<BrandId, number>;
    status_mix: Partial<Record<OrderStatus, number>>;
  };
  carts: { total: number; split: Record<BrandId, number>; with_pending_payment: number };
  pending_webhooks: { total: number; mix: { count: number; type: string; note: string }[] };
}

export const SEED_SPEC_PATH = join(repoRoot, "packages", "contracts", "seed-spec.yaml");

export function loadSeedSpec(path = SEED_SPEC_PATH): SeedSpec {
  return parse(readFileSync(path, "utf8")) as SeedSpec;
}
