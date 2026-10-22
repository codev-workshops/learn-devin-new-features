import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MONEY_PATTERN } from "@harbourline/contracts";
import { signPayload } from "../src/routes/webhooks.js";
import {
  ADDRESS,
  LUMEN,
  LUMEN_CUSTOMER,
  LUMEN_MERCH,
  TRAILHEAD,
  TRAILHEAD_CUSTOMER,
  TRAILHEAD_MERCH,
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

const isMoney = (m: unknown) =>
  typeof m === "object" && m !== null && MONEY_PATTERN.test((m as { amount: string }).amount);

describe("system", () => {
  it("GET /health reports the database", async () => {
    const res = await h.api.get("/health").expect(200);
    expect(res.body).toMatchObject({ status: "ok", database: "ok" });
  });
  it("GET /brands lists both brands with their pricing rules", async () => {
    const res = await h.api.get("/brands").expect(200);
    expect(res.body.map((b: { id: string }) => b.id)).toEqual([LUMEN, TRAILHEAD]);
    expect(res.body[1].freeShippingOver).toEqual({ amount: "80.00", currency: "EUR" });
    expect(res.body[0].pricing).toBe("tax_exclusive");
  });
  it("rejects a missing or unknown brand header", async () => {
    await h.api.get("/catalog/collections").expect(400);
    await h.api
      .get("/catalog/collections")
      .set(as("nope" as never, LUMEN_CUSTOMER))
      .expect(400);
  });
});

describe("catalog", () => {
  it("lists the brand's collections in order", async () => {
    const res = await h.api.get("/catalog/collections").set(as(LUMEN, LUMEN_CUSTOMER)).expect(200);
    expect(res.body.map((c: { slug: string }) => c.slug)).toEqual([
      "lamp-week",
      "living",
      "kitchen",
      "bundles",
    ]);
    expect(res.body[0]).toMatchObject({ promotion: "lamp-week-2026" });
    expect(res.body.reduce((n: number, c: { productCount: number }) => n + c.productCount, 0)).toBe(
      30,
    );
  });
  it("renders Lamp Week with promo prices, compareAt and low-stock flags", async () => {
    const res = await h.api
      .get("/catalog/collections/lamp-week")
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .expect(200);
    const lamp1 = res.body.products.find((p: { sku: string }) => p.sku === "LH-LAMP-01");
    expect(lamp1.price).toEqual({ amount: "103.20", currency: "USD" });
    expect(lamp1.compareAtPrice).toEqual({ amount: "129.00", currency: "USD" });
    const lamp3 = res.body.products.find((p: { sku: string }) => p.sku === "LH-LAMP-03");
    expect(lamp3.availability).toBe("low_stock");
  });
  it("derives bundle availability from components and preorder from the flag", async () => {
    const bundle = await h.api
      .get("/catalog/products/LH-BNDL-01")
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .expect(200);
    expect(bundle.body.bundle).toEqual(["LH-LAMP-03", "LH-PILLOW-01", "LH-THROW-01"]);
    expect(["low_stock", "in_stock"]).toContain(bundle.body.availability);
    const pre = await h.api
      .get("/catalog/products/TS-TENT-03")
      .set(as(TRAILHEAD, TRAILHEAD_CUSTOMER))
      .expect(200);
    expect(pre.body).toMatchObject({ preorder: true, availability: "preorder" });
  });
  it("expands Trailhead variants with per-variant stock", async () => {
    const res = await h.api
      .get("/catalog/products/TS-JKT-01")
      .set(as(TRAILHEAD, TRAILHEAD_CUSTOMER))
      .expect(200);
    expect(res.body.variants).toHaveLength(8);
    expect(res.body.variants[0]).toMatchObject({
      sku: "TS-JKT-01-S-BLK",
      attributes: { size: "S", colour: "BLK" },
    });
    expect(res.body.variants.reduce((n: number, v: { onHand: number }) => n + v.onHand, 0)).toBe(
      48,
    );
  });
  it("does not leak products across brands", async () => {
    await h.api
      .get("/catalog/products/LH-LAMP-01")
      .set(as(TRAILHEAD, TRAILHEAD_CUSTOMER))
      .expect(404);
    await h.api
      .get("/catalog/collections/lamp-week")
      .set(as(TRAILHEAD, TRAILHEAD_CUSTOMER))
      .expect(404);
  });
});

describe("carts", () => {
  it("creates, fills, edits and deletes a cart with brand-correct totals", async () => {
    const created = await h.api.post("/carts").set(as(LUMEN, LUMEN_CUSTOMER)).expect(201);
    expect(created.body).toMatchObject({
      brand: LUMEN,
      user: LUMEN_CUSTOMER,
      status: "open",
      lines: [],
    });
    const id = created.body.id;
    const added = await h.api
      .post(`/carts/${id}/lines`)
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .send({ sku: "LH-LAMP-01", quantity: 2 })
      .expect(200);
    expect(added.body.lines[0]).toMatchObject({
      sku: "LH-LAMP-01",
      quantity: 2,
      unitPrice: { amount: "103.20", currency: "USD" },
    });
    expect(added.body.totals).toMatchObject({
      subtotal: { amount: "206.40" },
      tax: { amount: "17.03" },
      shipping: { amount: "7.95" },
      total: { amount: "231.38" },
      taxIncluded: false,
    });
    const lineId = added.body.lines[0].id;
    const patched = await h.api
      .patch(`/carts/${id}/lines/${lineId}`)
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .send({ quantity: 0 })
      .expect(200);
    expect(patched.body.lines).toEqual([]);
    await h.api.delete(`/carts/${id}`).set(as(LUMEN, LUMEN_CUSTOMER)).expect(204);
    await h.api.get(`/carts/${id}`).set(as(LUMEN, LUMEN_CUSTOMER)).expect(404);
  });
  it("prices Trailhead carts VAT-inclusive with free shipping over €80", async () => {
    const id = await cartWith(h, TRAILHEAD, TRAILHEAD_CUSTOMER, [
      { sku: "TS-SOCK-01-M", quantity: 1 },
    ]);
    const small = await h.api
      .get(`/carts/${id}`)
      .set(as(TRAILHEAD, TRAILHEAD_CUSTOMER))
      .expect(200);
    expect(small.body.totals).toMatchObject({
      subtotal: { amount: "19.90" },
      shipping: { amount: "5.90" },
      total: { amount: "25.80" },
      taxIncluded: true,
    });
    await h.api
      .post(`/carts/${id}/lines`)
      .set(as(TRAILHEAD, TRAILHEAD_CUSTOMER))
      .send({ sku: "TS-FLC-01-M", quantity: 1 })
      .expect(200);
    const big = await h.api.get(`/carts/${id}`).set(as(TRAILHEAD, TRAILHEAD_CUSTOMER)).expect(200);
    expect(big.body.totals).toMatchObject({
      subtotal: { amount: "108.90" },
      shipping: { amount: "0.00" },
      total: { amount: "108.90" },
      tax: { amount: "17.39" },
    });
  });
  it("rejects cross-brand SKUs and invalid quantities", async () => {
    const id = await cartWith(h, LUMEN, LUMEN_CUSTOMER, []);
    await h.api
      .post(`/carts/${id}/lines`)
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .send({ sku: "TS-SOCK-01-M", quantity: 1 })
      .expect(409);
    await h.api
      .post(`/carts/${id}/lines`)
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .send({ sku: "LH-LAMP-01", quantity: 100 })
      .expect(422);
    expect(
      isMoney((await h.api.get(`/carts/${id}`).set(as(LUMEN, LUMEN_CUSTOMER))).body.totals.total),
    ).toBe(true);
  });
});

describe("checkout and orders", () => {
  it("places a pending_payment order, reserves stock and is idempotent", async () => {
    const before = await h.api
      .get("/admin/inventory?sku=LH-LAMP-05")
      .set(as(LUMEN, LUMEN_MERCH, "merchandiser"))
      .expect(200);
    const cartId = await cartWith(h, LUMEN, LUMEN_CUSTOMER, [{ sku: "LH-LAMP-05", quantity: 2 }]);
    const body = {
      cartId,
      email: LUMEN_CUSTOMER,
      shippingAddress: ADDRESS,
      idempotencyKey: `test-${cartId}`,
    };
    const first = await h.api
      .post("/checkout")
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .send(body)
      .expect(201);
    expect(first.body.order).toMatchObject({ status: "pending_payment", brand: LUMEN, cartId });
    expect(first.body.order.number).toMatch(/^LH-\d{6}$/);
    expect(first.body.payment).toMatchObject({
      provider: "paygate-fake",
      paymentId: first.body.order.paymentId,
    });
    const again = await h.api
      .post("/checkout")
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .send(body)
      .expect(201);
    expect(again.body.order.id).toBe(first.body.order.id);
    const after = await h.api
      .get("/admin/inventory?sku=LH-LAMP-05")
      .set(as(LUMEN, LUMEN_MERCH, "merchandiser"))
      .expect(200);
    expect(after.body[0].reserved - before.body[0].reserved).toBe(2);
    const events = await h.api
      .get(`/orders/${first.body.order.id}/events`)
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .expect(200);
    expect(events.body.map((e: { type: string }) => e.type).sort()).toEqual([
      "reservation_made",
      "status_changed",
    ]);
    const outbox = await h.db.query("SELECT topic FROM outbox WHERE order_id = $1", [
      first.body.order.id,
    ]);
    expect(outbox.rows).toEqual([{ topic: "order.placed" }]);
  });
  it("returns out_of_stock when the cart exceeds available units", async () => {
    const cartId = await cartWith(h, LUMEN, LUMEN_CUSTOMER, [{ sku: "LH-LAMP-04", quantity: 2 }]);
    const res = await h.api
      .post("/checkout")
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .send({ cartId, email: LUMEN_CUSTOMER, shippingAddress: ADDRESS })
      .expect(409);
    expect(res.body.code).toBe("out_of_stock");
  });
  it("validates the checkout body", async () => {
    const res = await h.api
      .post("/checkout")
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .send({ cartId: "nope" })
      .expect(422);
    expect(res.body.code).toBe("validation_failed");
    expect(res.body.details.map((d: { path: string }) => d.path)).toEqual(
      expect.arrayContaining(["cartId", "email", "shippingAddress"]),
    );
  });
  it("lists a customer's own orders with cursor pagination and lets staff see everything", async () => {
    const mine = await h.api.get("/orders").set(as(LUMEN, LUMEN_CUSTOMER)).expect(200);
    expect(mine.body.items.every((o: { user: string }) => o.user === LUMEN_CUSTOMER)).toBe(true);
    const page1 = await h.api
      .get("/orders?limit=5")
      .set(as(LUMEN, LUMEN_MERCH, "merchandiser"))
      .expect(200);
    expect(page1.body.items).toHaveLength(5);
    const page2 = await h.api
      .get(`/orders?limit=5&cursor=${page1.body.nextCursor}`)
      .set(as(LUMEN, LUMEN_MERCH, "merchandiser"))
      .expect(200);
    expect(page2.body.items[0].id).not.toBe(page1.body.items[0].id);
    expect(page1.body.items.every((o: { brand: string }) => o.brand === LUMEN)).toBe(true);
    await h.api.get("/orders?status=bogus").set(as(LUMEN, LUMEN_CUSTOMER)).expect(400);
  });
  it("cancels a pending order once and releases the reservation", async () => {
    const cartId = await cartWith(h, TRAILHEAD, TRAILHEAD_CUSTOMER, [
      { sku: "TS-BTL-01-BLK", quantity: 1 },
    ]);
    const placed = await h.api
      .post("/checkout")
      .set(as(TRAILHEAD, TRAILHEAD_CUSTOMER))
      .send({ cartId, email: TRAILHEAD_CUSTOMER, shippingAddress: { ...ADDRESS, country: "DE" } })
      .expect(201);
    const id = placed.body.order.id;
    const cancelled = await h.api
      .post(`/orders/${id}/cancel`)
      .set(as(TRAILHEAD, TRAILHEAD_CUSTOMER))
      .expect(200);
    expect(cancelled.body.status).toBe("cancelled");
    await h.api.post(`/orders/${id}/cancel`).set(as(TRAILHEAD, TRAILHEAD_CUSTOMER)).expect(409);
    const events = await h.api
      .get(`/orders/${id}/events`)
      .set(as(TRAILHEAD, TRAILHEAD_CUSTOMER))
      .expect(200);
    expect(events.body.map((e: { type: string }) => e.type)).toContain("reservation_released");
  });
  it("hides other customers' orders", async () => {
    const other = await h.db.query<{ id: string }>(
      "SELECT id FROM orders WHERE brand = $1 AND user_email <> $2 LIMIT 1",
      [LUMEN, LUMEN_CUSTOMER],
    );
    await h.api.get(`/orders/${other.rows[0]!.id}`).set(as(LUMEN, LUMEN_CUSTOMER)).expect(403);
    await h.api
      .get(`/orders/00000000-0000-0000-0000-000000000000`)
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .expect(404);
  });
});

describe("admin", () => {
  it("requires a staff role", async () => {
    await h.api.get("/admin/inventory").set(as(LUMEN, LUMEN_CUSTOMER)).expect(403);
    await h.api
      .get("/admin/inventory")
      .set(as(LUMEN, LUMEN_CUSTOMER, "customer"))
      .expect(403);
  });
  it("lists inventory, filters below safety stock and applies adjustments", async () => {
    const all = await h.api
      .get("/admin/inventory")
      .set(as(LUMEN, LUMEN_MERCH, "merchandiser"))
      .expect(200);
    expect(all.body.every((r: { sku: string }) => r.sku.startsWith("LH-"))).toBe(true);
    const low = await h.api
      .get("/admin/inventory?belowSafety=true")
      .set(as(LUMEN, LUMEN_MERCH, "merchandiser"))
      .expect(200);
    expect(low.body.map((r: { sku: string }) => r.sku)).toEqual(
      expect.arrayContaining(["LH-LAMP-02", "LH-LAMP-03", "LH-LAMP-04"]),
    );
    const adjusted = await h.api
      .patch("/admin/inventory/LH-LAMP-06")
      .set(as(LUMEN, LUMEN_MERCH, "merchandiser"))
      .send({ warehouse: "US-NJ", delta: 5, reason: "receipt" })
      .expect(200);
    expect(adjusted.body).toMatchObject({
      sku: "LH-LAMP-06",
      onHand: 80,
      available: adjusted.body.onHand - adjusted.body.reserved,
    });
    await h.api
      .patch("/admin/inventory/LH-LAMP-06")
      .set(as(LUMEN, LUMEN_MERCH, "merchandiser"))
      .send({ warehouse: "DE-HAM", delta: 1, reason: "receipt" })
      .expect(422);
    await h.api
      .patch("/admin/inventory/TS-BTL-01-BLK")
      .set(as(LUMEN, LUMEN_MERCH, "merchandiser"))
      .send({ warehouse: "US-NJ", delta: 1, reason: "receipt" })
      .expect(404);
  });
  it("lists and replaces price lists", async () => {
    const lists = await h.api
      .get("/admin/price-lists")
      .set(as(LUMEN, LUMEN_MERCH, "merchandiser"))
      .expect(200);
    expect(lists.body.map((l: { id: string }) => l.id)).toEqual([
      "lumen-home-base",
      "lamp-week-2026",
    ]);
    const promo = lists.body[1];
    expect(promo.entries.find((e: { sku: string }) => e.sku === "LH-LAMP-01")).toEqual({
      sku: "LH-LAMP-01",
      price: { amount: "103.20", currency: "USD" },
      compareAtPrice: { amount: "129.00", currency: "USD" },
    });
    const updated = await h.api
      .put("/admin/price-lists/lamp-week-2026")
      .set(as(LUMEN, LUMEN_MERCH, "merchandiser"))
      .send({
        ...promo,
        entries: [{ sku: "LH-LAMP-01", price: { amount: "99.00", currency: "USD" } }],
      })
      .expect(200);
    expect(updated.body.entries).toHaveLength(1);
    const product = await h.api
      .get("/catalog/products/LH-LAMP-01")
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .expect(200);
    expect(product.body.price.amount).toBe("99.00");
    await h.api
      .put("/admin/price-lists/lamp-week-2026")
      .set(as(LUMEN, LUMEN_MERCH, "merchandiser"))
      .send(promo)
      .expect(200);
    await h.api
      .put("/admin/price-lists/lamp-week-2026")
      .set(as(TRAILHEAD, TRAILHEAD_MERCH, "merchandiser"))
      .send(promo)
      .expect(422);
  });
  it("filters admin orders by status and date window", async () => {
    const res = await h.api
      .get(
        "/admin/orders?status=delivered&from=2026-09-01T00:00:00Z&to=2026-10-01T00:00:00Z&limit=200",
      )
      .set(as(TRAILHEAD, TRAILHEAD_MERCH, "merchandiser"))
      .expect(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(
      res.body.items.every(
        (o: { status: string; placedAt: string }) =>
          o.status === "delivered" && o.placedAt >= "2026-09-01" && o.placedAt < "2026-10-01",
      ),
    ).toBe(true);
  });
  it("reports abandoned carts older than the threshold with their pending payments", async () => {
    const res = await h.api
      .get("/admin/carts/abandoned?olderThanHours=48")
      .set(as(LUMEN, LUMEN_MERCH, "merchandiser"))
      .expect(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(
      res.body.every(
        (a: { ageHours: number; cart: { brand: string } }) =>
          a.ageHours >= 48 && a.cart.brand === LUMEN,
      ),
    ).toBe(true);
    const everything = await h.api
      .get("/admin/carts/abandoned?olderThanHours=0")
      .set(as(LUMEN, LUMEN_MERCH, "merchandiser"))
      .expect(200);
    const pending = everything.body.filter(
      (a: { pendingPaymentId?: string }) => a.pendingPaymentId,
    );
    expect(pending.length).toBeGreaterThan(0);
  });
});

describe("review follow-ups", () => {
  const OTHER = "customer-002@lumen-home.test";
  it("keeps carts private to their owner (staff may still read them)", async () => {
    const id = await cartWith(h, LUMEN, LUMEN_CUSTOMER, [{ sku: "LH-LAMP-05", quantity: 1 }]);
    await h.api.get(`/carts/${id}`).set(as(LUMEN, OTHER)).expect(404);
    await h.api
      .patch(`/carts/${id}/lines/${id}`)
      .set(as(LUMEN, OTHER))
      .send({ quantity: 2 })
      .expect(404);
    await h.api.delete(`/carts/${id}`).set(as(LUMEN, OTHER)).expect(404);
    await h.api
      .get(`/carts/${id}`)
      .set(as(LUMEN, LUMEN_MERCH, "merchandiser"))
      .expect(200);
  });
  it("rejects a variant parent SKU as a cart line", async () => {
    const id = await cartWith(h, TRAILHEAD, TRAILHEAD_CUSTOMER, []);
    const res = await h.api
      .post(`/carts/${id}/lines`)
      .set(as(TRAILHEAD, TRAILHEAD_CUSTOMER))
      .send({ sku: "TS-JKT-01", quantity: 1 })
      .expect(409);
    expect(res.body.message).toMatch(/variant/);
  });
  it("checks out pre-orders without reserving stock", async () => {
    const cartId = await cartWith(h, TRAILHEAD, TRAILHEAD_CUSTOMER, [
      { sku: "TS-TENT-03", quantity: 1 },
    ]);
    const res = await h.api
      .post("/checkout")
      .set(as(TRAILHEAD, TRAILHEAD_CUSTOMER))
      .send({ cartId, email: TRAILHEAD_CUSTOMER, shippingAddress: { ...ADDRESS, country: "DE" } })
      .expect(201);
    expect(res.body.order.lines[0].sku).toBe("TS-TENT-03");
    expect(res.body.payment.redirectUrl).toMatch(/\/checkout\//);
  });
  it("checks out bundles by reserving their components", async () => {
    const before = await h.db.query<{ reserved: number }>(
      "SELECT reserved FROM inventory WHERE sku = 'LH-POT-01'",
    );
    const cartId = await cartWith(h, LUMEN, LUMEN_CUSTOMER, [{ sku: "LH-BNDL-02", quantity: 1 }]);
    await h.api
      .post("/checkout")
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .send({ cartId, email: LUMEN_CUSTOMER, shippingAddress: ADDRESS })
      .expect(201);
    const after = await h.db.query<{ reserved: number }>(
      "SELECT reserved FROM inventory WHERE sku = 'LH-POT-01'",
    );
    expect(after.rows[0]!.reserved - before.rows[0]!.reserved).toBe(1);
  });
  it("splits an order line across warehouses when one cannot cover it", async () => {
    await h.db.query("UPDATE inventory SET on_hand = 1, reserved = 0 WHERE sku = 'TS-PACK-01-L'");
    const cartId = await cartWith(h, TRAILHEAD, TRAILHEAD_CUSTOMER, [
      { sku: "TS-PACK-01-L", quantity: 2 },
    ]);
    const res = await h.api
      .post("/checkout")
      .set(as(TRAILHEAD, TRAILHEAD_CUSTOMER))
      .send({ cartId, email: TRAILHEAD_CUSTOMER, shippingAddress: { ...ADDRESS, country: "DE" } })
      .expect(201);
    expect(
      res.body.order.lines.map((l: { warehouse: string; quantity: number }) => [
        l.warehouse,
        l.quantity,
      ]),
    ).toEqual([
      ["DE-HAM", 1],
      ["NL-RTM", 1],
    ]);
  });
  it("does not let another customer replay an idempotency key, and closes a cart exactly once", async () => {
    const cartId = await cartWith(h, LUMEN, LUMEN_CUSTOMER, [{ sku: "LH-LAMP-05", quantity: 1 }]);
    const body = {
      cartId,
      email: LUMEN_CUSTOMER,
      shippingAddress: ADDRESS,
      idempotencyKey: `shared-${cartId}`,
    };
    await h.api.post("/checkout").set(as(LUMEN, LUMEN_CUSTOMER)).send(body).expect(201);
    await h.api.post("/checkout").set(as(LUMEN, OTHER)).send(body).expect(404);
    const again = await h.api
      .post("/checkout")
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .send({ ...body, idempotencyKey: undefined })
      .expect(409);
    expect(again.body.code).toBe("conflict");
  });
  it("owns the order by the caller even when the contact email differs, so idempotent retries work", async () => {
    const cartId = await cartWith(h, LUMEN, LUMEN_CUSTOMER, [{ sku: "LH-LAMP-05", quantity: 1 }]);
    const body = {
      cartId,
      email: "gift-recipient@example.test",
      shippingAddress: ADDRESS,
      idempotencyKey: `contact-${cartId}`,
    };
    const first = await h.api
      .post("/checkout")
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .send(body)
      .expect(201);
    expect(first.body.order.user).toBe(LUMEN_CUSTOMER);
    const retry = await h.api
      .post("/checkout")
      .set(as(LUMEN, LUMEN_CUSTOMER))
      .send(body)
      .expect(201);
    expect(retry.body.order.id).toBe(first.body.order.id);
    const mine = await h.api.get("/orders").set(as(LUMEN, LUMEN_CUSTOMER)).expect(200);
    expect(mine.body.items.map((o: { id: string }) => o.id)).toContain(first.body.order.id);
  });
  it("rejects variant SKUs in price lists instead of failing on the foreign key", async () => {
    const lists = await h.api
      .get("/admin/price-lists")
      .set(as(TRAILHEAD, TRAILHEAD_MERCH, "merchandiser"))
      .expect(200);
    const res = await h.api
      .put("/admin/price-lists/trailhead-supply-base")
      .set(as(TRAILHEAD, TRAILHEAD_MERCH, "merchandiser"))
      .send({
        ...lists.body[0],
        entries: [{ sku: "TS-JKT-01-M-BLK", price: { amount: "1.00", currency: "EUR" } }],
      })
      .expect(400);
    expect(res.body.message).toMatch(/per product/);
  });
});

describe("webhooks", () => {
  const event = {
    event_id: "evt_test_1",
    type: "payment.succeeded",
    occurred_at: "2026-10-22T08:00:00Z",
    data: {
      payment_id: "pay_test",
      order_id: "11111111-1111-4111-8111-111111111111",
      amount: "10.00",
      currency: "USD",
    },
  };
  it("accepts a signed PayGate event into the inbox", async () => {
    const raw = JSON.stringify(event);
    await h.api
      .post("/webhooks/payments")
      .set("Content-Type", "application/json")
      .set("X-PayGate-Event-Id", event.event_id)
      .set("X-PayGate-Signature", signPayload(raw))
      .send(raw)
      .expect(202);
    const row = await h.db.query(
      "SELECT type, processed_at FROM webhook_inbox WHERE event_id = $1",
      [event.event_id],
    );
    expect(row.rows).toEqual([{ type: "payment.succeeded", processed_at: null }]);
  });
  it("rejects a missing signature header and malformed payloads", async () => {
    const res = await h.api
      .post("/webhooks/payments")
      .set("X-PayGate-Event-Id", "evt_x")
      .send(event)
      .expect(401);
    expect(res.body.code).toBe("invalid_signature");
    await h.api
      .post("/webhooks/payments")
      .set("X-PayGate-Event-Id", "evt_x")
      .set("X-PayGate-Signature", "sha256=00")
      .send({ event_id: "evt_x" })
      .expect(400);
  });
});

describe("seed dataset", () => {
  it("matches the frozen seed-spec counts", async () => {
    const counts = await h.db.query<{ k: string; n: number }>(
      `SELECT 'orders:' || brand AS k, COUNT(*)::int AS n FROM orders WHERE idempotency_key LIKE 'seed-%' GROUP BY brand
       UNION ALL SELECT 'carts:' || brand, COUNT(*)::int FROM carts WHERE created_at < '2026-10-22T00:00:00Z' GROUP BY brand
       UNION ALL SELECT 'skus:' || brand, COUNT(*)::int FROM products GROUP BY brand
       UNION ALL SELECT 'pending-webhooks', COUNT(*)::int FROM webhook_inbox WHERE processed_at IS NULL
       UNION ALL SELECT 'duplicate-event-ids', COUNT(*)::int FROM (SELECT event_id FROM webhook_inbox GROUP BY event_id HAVING COUNT(*) > 1) d
       UNION ALL SELECT 'pending-carts', COUNT(*)::int FROM carts WHERE pending_payment_id IS NOT NULL AND created_at < '2026-10-22T00:00:00Z'`,
    );
    expect(Object.fromEntries(counts.rows.map((r) => [r.k, r.n]))).toMatchObject({
      "orders:lumen-home": 220,
      "orders:trailhead-supply": 180,
      "carts:lumen-home": 16,
      "carts:trailhead-supply": 14,
      "skus:lumen-home": 30,
      "skus:trailhead-supply": 30,
      "pending-webhooks": 13,
      "duplicate-event-ids": 3,
      "pending-carts": 6,
    });
  });
});
