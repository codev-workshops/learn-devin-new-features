import { describe, expect, it } from "vitest";
import routes from "./generated/routes.json";
import { operationHandlers } from "./handlers";
import { createStore } from "./store";

const lumen = { brand: "lumen-home", user: "customer-001@lumen-home.test" } as const;
const trail = { brand: "trailhead-supply", user: "customer-001@trailhead-supply.test" } as const;
const maya = { brand: "lumen-home", user: "maya@lumenhome.test", role: "merchandiser" } as const;

describe("mock handlers cover the contract", () => {
  it("has exactly one handler per operationId in openapi.yaml", () => {
    const ids = routes.map((r) => r.operationId).sort();
    expect(Object.keys(operationHandlers).sort()).toEqual(ids);
    expect(ids).toHaveLength(22);
  });
});

describe("seed dataset", () => {
  const store = createStore(() => new Date("2026-10-22T12:00:00Z"));
  it("matches the seed-spec counts", () => {
    expect(store.data.products.filter((p) => p.brand === "lumen-home")).toHaveLength(30);
    expect(store.data.products.filter((p) => p.brand === "trailhead-supply")).toHaveLength(30);
    expect(store.data.orders).toHaveLength(400);
    expect(store.data.orders.filter((o) => o.brand === "lumen-home")).toHaveLength(220);
    expect(store.data.carts).toHaveLength(30);
    expect(store.data.carts.filter((c) => c.pendingPaymentId)).toHaveLength(6);
  });
  it("is deterministic", () => {
    const again = createStore();
    expect(again.data.orders.map((o) => o.id)).toEqual(store.data.orders.map((o) => o.id));
  });
  it("applies Lamp Week at 20% off, half-up", () => {
    const lamp = store.getProduct(lumen, "LH-LAMP-06");
    expect(lamp.price.amount).toBe("27.60");
    expect(lamp.compareAtPrice?.amount).toBe("34.50");
    expect(store.getProduct(lumen, "LH-LAMP-04").availability).toBe("low_stock");
    expect(store.getProduct(trail, "TS-TENT-03").availability).toBe("preorder");
  });
  it("expands Trailhead variants and splits stock 60/40 across warehouses", () => {
    const jacket = store.getProduct(trail, "TS-JKT-01");
    expect(jacket.variants).toHaveLength(8);
    expect(jacket.variants[0].sku).toBe("TS-JKT-01-S-BLK");
    const rows = store
      .listInventory({ ...trail, user: "lena@trailheadsupply.test", role: "merchandiser" })
      .filter((r) => r.sku === "TS-JKT-01");
    expect(rows.map((r) => [r.warehouse, r.onHand])).toEqual([
      ["DE-HAM", 29],
      ["NL-RTM", 19],
    ]);
  });
});

describe("totals", () => {
  it("adds 8.25% tax and flat shipping for Lumen Home", () => {
    const store = createStore();
    const cart = store.createCart(lumen);
    const updated = store.addCartLine(lumen, cart.id, { sku: "LH-MUG-01", quantity: 2 });
    expect(updated.totals).toMatchObject({
      subtotal: { amount: "72.00" },
      tax: { amount: "5.94" },
      shipping: { amount: "7.95" },
      total: { amount: "85.89" },
      taxIncluded: false,
    });
  });
  it("treats Trailhead prices as VAT-inclusive with free shipping over €80", () => {
    const store = createStore();
    const cart = store.createCart(trail);
    const small = store.addCartLine(trail, cart.id, { sku: "TS-MAP-01", quantity: 1 });
    expect(small.totals.shipping.amount).toBe("5.90");
    const big = store.addCartLine(trail, cart.id, { sku: "TS-FLC-01-M", quantity: 1 });
    expect(big.totals).toMatchObject({
      subtotal: { amount: "103.90" },
      shipping: { amount: "0.00" },
      total: { amount: "103.90" },
      taxIncluded: true,
    });
    expect(big.totals.tax.amount).toBe("16.59");
  });
});

describe("checkout and payment", () => {
  it("reserves stock, creates a pending order and settles through the stub", () => {
    const store = createStore();
    const cart = store.createCart(lumen);
    store.addCartLine(lumen, cart.id, { sku: "LH-LAMP-03", quantity: 2 });
    const before = { ...store.listInventory(maya).find((r) => r.sku === "LH-LAMP-03")! };
    const result = store.checkout(lumen, {
      cartId: cart.id,
      email: lumen.user,
      shippingAddress: {
        name: "A",
        line1: "1 St",
        city: "Newark",
        postalCode: "07102",
        country: "US",
      },
    });
    expect(result.order.status).toBe("pending_payment");
    expect(result.order.number).toMatch(/^LH-\d{6}$/);
    expect(result.payment.redirectUrl).toContain(`/pay/${result.payment.paymentId}`);
    const reserved = store.listInventory(maya).find((r) => r.sku === "LH-LAMP-03")!;
    expect(reserved.reserved).toBe(before.reserved + 2);
    expect(() =>
      store.addCartLine(lumen, store.createCart(lumen).id, { sku: "LH-LAMP-03", quantity: 2 }),
    ).toThrow(/available/);
    const settled = store.settlePayment(result.payment.paymentId, "succeeded");
    expect(settled.status).toBe("confirmed");
    const after = store.listInventory(maya).find((r) => r.sku === "LH-LAMP-03")!;
    expect(after.onHand).toBe(before.onHand - 2);
    expect(store.listOrderEvents(lumen, result.order.id).map((e) => e.type)).toEqual([
      "reservation_made",
      "email_queued",
      "payment_received",
      "status_changed",
      "status_changed",
      "email_queued",
    ]);
  });
  it("scopes orders to the caller's brand and role", () => {
    const store = createStore();
    const trailOrder = store.data.orders.find((o) => o.brand === "trailhead-supply")!;
    expect(() => store.getOrder(lumen, trailOrder.id)).toThrow(/another brand/);
    expect(() => store.listInventory(lumen)).toThrow(/X-Harbourline-Role/);
    expect(store.listAdminOrders(maya, { limit: 10 }).items).toHaveLength(10);
    const lena = {
      brand: "trailhead-supply",
      user: "lena@trailheadsupply.test",
      role: "merchandiser",
    } as const;
    expect(store.listAbandonedCarts(lena, 48).every((c) => c.ageHours >= 48)).toBe(true);
    expect(store.listAbandonedCarts(lena, 48).some((c) => c.pendingPaymentId)).toBe(true);
  });
});
