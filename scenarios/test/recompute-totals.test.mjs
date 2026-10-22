import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { recompute } from "../lib/recompute-totals.mjs";

const order = (brand, lines) => ({
  brand,
  lines: lines.map(([amount, quantity]) => ({
    unitPrice: { amount, currency: brand === "lumen-home" ? "USD" : "EUR" },
    quantity,
  })),
});

describe("recompute-totals", () => {
  it("computes VAT-inclusive EUR tax from the gross with banker's rounding and free shipping over 80", () => {
    const t = recompute(order("trailhead-supply", [["119.00", 1]]));
    assert.deepEqual(t, { subtotal: "119.00", tax: "19.00", shipping: "0.00", total: "119.00" });
    const small = recompute(order("trailhead-supply", [["24.90", 1]]));
    assert.equal(small.shipping, "5.90");
    assert.equal(small.total, "30.80");
    assert.equal(small.tax, "3.98"); // 24.90 * 19/119 = 3.9756…
  });
  it("adds 8.25% tax and flat shipping for tax-exclusive USD", () => {
    const t = recompute(order("lumen-home", [["59.00", 1]]));
    assert.deepEqual(t, { subtotal: "59.00", tax: "4.87", shipping: "7.95", total: "71.82" });
  });
  it("rounds exact halves to even (the worker's Decimal behaviour), not up", () => {
    // 10.00 * 8.25% = 0.825 → banker's 0.82, half-up would give 0.83
    assert.equal(recompute(order("lumen-home", [["10.00", 1]])).tax, "0.82");
    // 30.00 * 8.25% = 2.475 → 2.48 (7 is odd → rounds up to even 8)
    assert.equal(recompute(order("lumen-home", [["30.00", 1]])).tax, "2.48");
  });
  it("never uses floats: a 99-line basket of 0.01 items sums exactly", () => {
    const t = recompute(
      order(
        "trailhead-supply",
        Array.from({ length: 99 }, () => ["0.01", 1]),
      ),
    );
    assert.equal(t.subtotal, "0.99");
  });
});
