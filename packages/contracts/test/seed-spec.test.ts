import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { BRAND_IDS, MONEY_PATTERN, SKU_PATTERN, type SeedSpec } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const spec = parse(readFileSync(join(here, "..", "seed-spec.yaml"), "utf8")) as SeedSpec & {
  orders: { total: number; split: Record<string, number>; status_mix: Record<string, number> };
  carts: { total: number; split: Record<string, number>; with_pending_payment: number };
  pending_webhooks: { total: number; mix: { count: number }[] };
};

describe("seed-spec.yaml", () => {
  it("defines both brands with the agreed currency and pricing model", () => {
    expect(Object.keys(spec.brands).sort()).toEqual([...BRAND_IDS].sort());
    expect(spec.brands["lumen-home"]).toMatchObject({
      currency: "USD",
      pricing: "tax_exclusive",
      tax_rate: 0.0825,
    });
    expect(spec.brands["trailhead-supply"]).toMatchObject({
      currency: "EUR",
      pricing: "tax_inclusive",
      tax_rate: 0.19,
      free_shipping_over: "80.00",
    });
    expect(spec.brands["trailhead-supply"].warehouses).toEqual(["DE-HAM", "NL-RTM"]);
  });

  it("lists exactly 30 well-formed, unique SKUs per brand in known collections", () => {
    const all = new Set<string>();
    for (const brand of BRAND_IDS) {
      const skus = spec.skus[brand];
      const collections = new Set(spec.brands[brand].collections.map((c) => c.slug));
      expect(skus.length, brand).toBe(spec.brands[brand].sku_count);
      expect(skus.length, brand).toBe(30);
      for (const s of skus) {
        expect(s.sku, s.sku).toMatch(SKU_PATTERN);
        expect(s.sku.startsWith(spec.brands[brand].order_number_prefix), s.sku).toBe(true);
        expect(s.price, s.sku).toMatch(MONEY_PATTERN);
        expect(collections.has(s.collection), `${s.sku} collection ${s.collection}`).toBe(true);
        expect(all.has(s.sku), `duplicate ${s.sku}`).toBe(false);
        all.add(s.sku);
      }
    }
  });

  it("plants the Lamp Week low-stock SKUs, bundles and pre-orders", () => {
    const lh = spec.skus["lumen-home"];
    const lowStock = lh.filter((s) => s.low_stock);
    expect(lowStock.map((s) => s.sku)).toEqual(["LH-LAMP-02", "LH-LAMP-03", "LH-LAMP-04"]);
    expect(lowStock.every((s) => s.collection === "lamp-week" && s.on_hand <= s.safety_stock)).toBe(
      true,
    );
    expect(lh.find((s) => s.sku === "LH-LAMP-03")?.on_hand).toBe(3);
    const skuSet = new Set(lh.map((s) => s.sku));
    for (const b of lh.filter((s) => s.bundle))
      for (const c of b.bundle!) expect(skuSet.has(c), `${b.sku} → ${c}`).toBe(true);
    const ts = spec.skus["trailhead-supply"];
    const preorders = ts.filter((s) => s.preorder);
    expect(preorders.length).toBe(3);
    expect(preorders.every((s) => s.on_hand === 0 && s.collection === "pre-order")).toBe(true);
    expect(ts.some((s) => s.variants?.size && s.variants?.colour)).toBe(true);
  });

  it("sizes orders, carts and pending webhooks as the plan requires", () => {
    expect(spec.orders.total).toBe(400);
    expect(Object.values(spec.orders.split).reduce((a, b) => a + b, 0)).toBe(400);
    const mix = Object.values(spec.orders.status_mix).reduce((a, b) => a + b, 0);
    expect(Math.abs(mix - 1)).toBeLessThan(1e-9);
    expect(spec.orders.status_mix.refunded).toBe(0.05);
    expect(spec.orders.status_mix.chargeback).toBe(0.02);
    expect(spec.carts.total).toBe(30);
    expect(Object.values(spec.carts.split).reduce((a, b) => a + b, 0)).toBe(30);
    expect(spec.pending_webhooks.total).toBe(12);
    expect(spec.pending_webhooks.mix.reduce((a, m) => a + m.count, 0)).toBe(12);
  });

  it("names all ten planted edge cases with an owner and the labs that use them", () => {
    const ids = spec.planted_edge_cases.map((p) => p.id).sort();
    expect(ids).toEqual(
      [
        "abandoned-cart-sweeper",
        "admin-a11y",
        "bad-migration",
        "cross-brand-leak",
        "currency-rounding",
        "duplicate-webhook",
        "n-plus-one",
        "oversell",
        "price-drift",
        "unverified-signature",
      ].sort(),
    );
    for (const p of spec.planted_edge_cases) {
      expect(p.owner).toMatch(/^W1-/);
      expect(p.labs.length).toBeGreaterThan(0);
    }
  });
});
