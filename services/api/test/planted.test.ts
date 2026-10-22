/**
 * One skipped test per planted defect (see PLANTED.md). Each test states the *correct* behaviour and fails
 * on `main` on purpose. Un-skip one on a throwaway branch to prove a remediation; never merge the fix.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  ADDRESS,
  LUMEN,
  LUMEN_CUSTOMER,
  LUMEN_MERCH,
  TRAILHEAD,
  TRAILHEAD_CUSTOMER,
  as,
  cartWith,
  harness,
  type Harness,
} from "./helpers.js";

let h: Harness;
beforeAll(() => {
  h = harness();
});
afterAll(() => h.close());

describe("planted defects (skipped: each one fails on main by design)", () => {
  it.skip("oversell: 20 concurrent checkouts of LH-LAMP-03 (3 units) never drive available below zero", async () => {
    const carts = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        cartWith(h, LUMEN, `customer-${String(i + 50).padStart(3, "0")}@lumen-home.test`, [
          { sku: "LH-LAMP-03", quantity: 1 },
        ]),
      ),
    );
    const results = await Promise.all(
      carts.map((cartId, i) =>
        h.api
          .post("/checkout")
          .set(as(LUMEN, `customer-${String(i + 50).padStart(3, "0")}@lumen-home.test`))
          .send({
            cartId,
            email: `customer-${String(i + 50).padStart(3, "0")}@lumen-home.test`,
            shippingAddress: ADDRESS,
          }),
      ),
    );
    const created = results.filter((r) => r.status === 201).length;
    const stock = await h.db.query<{ available: number }>(
      "SELECT (on_hand - reserved)::int AS available FROM inventory WHERE sku = 'LH-LAMP-03'",
    );
    expect(created).toBeLessThanOrEqual(3);
    expect(stock.rows[0]!.available).toBeGreaterThanOrEqual(0);
  });

  it.skip("cross-brand-leak: GET /orders/:id returns 404 when the order belongs to another brand", async () => {
    const trailhead = await h.db.query<{ id: string }>(
      "SELECT id FROM orders WHERE brand = $1 LIMIT 1",
      [TRAILHEAD],
    );
    await h.api
      .get(`/orders/${trailhead.rows[0]!.id}`)
      .set(as(LUMEN, LUMEN_MERCH, "merchandiser"))
      .expect(404);
  });

  it.skip("unverified-signature: POST /webhooks/payments rejects a forged X-PayGate-Signature", async () => {
    const event = {
      event_id: "evt_forged",
      type: "payment.succeeded",
      occurred_at: "2026-10-22T08:00:00Z",
      data: {
        payment_id: "pay_forged",
        order_id: "11111111-1111-4111-8111-111111111111",
        amount: "1.00",
        currency: "USD",
      },
    };
    const res = await h.api
      .post("/webhooks/payments")
      .set("X-PayGate-Event-Id", event.event_id)
      .set("X-PayGate-Signature", "sha256=deadbeef")
      .send(event);
    expect(res.status).toBe(401);
    const stored = await h.db.query("SELECT 1 FROM webhook_inbox WHERE event_id = 'evt_forged'");
    expect(stored.rowCount).toBe(0);
  });

  it.skip("n-plus-one: a Lamp Week page view needs a bounded number of SQL statements", async () => {
    await h.api.get("/catalog/collections/lamp-week").set(as(LUMEN, LUMEN_CUSTOMER)).expect(200);
    const before = h.db.queryCount;
    await h.api.get("/catalog/collections/lamp-week").set(as(LUMEN, LUMEN_CUSTOMER)).expect(200);
    expect(h.db.queryCount - before).toBeLessThanOrEqual(6);
  });

  it("price-drift: checkout re-prices cart lines from the current price list", async () => {
    const cartId = await cartWith(h, LUMEN, LUMEN_CUSTOMER, [{ sku: "LH-LAMP-05", quantity: 1 }]);
    await h.db.query("UPDATE cart_lines SET unit_price = 1.00 WHERE cart_id = $1", [cartId]);
    const res = await h.api
      .post("/checkout")
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .send({ cartId, email: LUMEN_CUSTOMER, shippingAddress: ADDRESS })
      .expect(201);
    const current = await h.api
      .get("/catalog/products/LH-LAMP-05")
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .expect(200);
    expect(res.body.order.lines[0].unitPrice).toEqual(current.body.price);
  });

  it.skip("currency-rounding: VAT equals the worker's per-line Decimal + banker's-rounding figure", async () => {
    // 3 × €19.90 socks: per-line VAT 19.90 × 19/119 = 3.1773… → 3.18 each → 9.54 (worker, Decimal, banker's rounding, per line).
    // The API computes VAT once on the float subtotal with half-up: 59.70 - 59.70/1.19 = 9.5319… → 9.53. One cent of drift.
    const cartId = await cartWith(h, TRAILHEAD, TRAILHEAD_CUSTOMER, [
      { sku: "TS-SOCK-01-M", quantity: 3 },
    ]);
    const cart = await h.api
      .get(`/carts/${cartId}`)
      .set(as(TRAILHEAD, TRAILHEAD_CUSTOMER))
      .expect(200);
    const bankers = (cents: number) => {
      const floor = Math.floor(cents);
      const diff = cents - floor;
      if (Math.abs(diff - 0.5) < 1e-9) return floor % 2 === 0 ? floor : floor + 1;
      return Math.round(cents);
    };
    const perLineVatCents = bankers((1990 * 19) / 119) * 3;
    expect(cart.body.totals.tax.amount).toBe((perLineVatCents / 100).toFixed(2));
  });
});
