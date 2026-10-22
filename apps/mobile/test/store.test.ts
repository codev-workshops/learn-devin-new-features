import { computeTotals, MockError, MockStore } from "@/mocks/store";

const now = new Date("2026-10-22T00:00:00Z");

describe("MockStore (seed-spec fixture)", () => {
  it("lists both brands with contract fields", () => {
    const store = new MockStore({ now });
    const brands = store.listBrands();
    expect(brands.map((b) => b.id)).toEqual(["lumen-home", "trailhead-supply"]);
    const ts = brands.find((b) => b.id === "trailhead-supply")!;
    expect(ts.currency).toBe("EUR");
    expect(ts.pricing).toBe("tax_inclusive");
    expect(ts.freeShippingOver).toEqual({ amount: "80.00", currency: "EUR" });
  });

  it("serves 30 SKUs per brand across collections", () => {
    const store = new MockStore({ now });
    for (const brand of ["lumen-home", "trailhead-supply"] as const) {
      const total = store.listCollections(brand).reduce((n, c) => n + c.productCount, 0);
      expect(total).toBe(30);
    }
  });

  it("applies Lamp Week pricing while the promotion is active and not after", () => {
    const during = new MockStore({ now }).getProduct("lumen-home", "LH-LAMP-01");
    expect(during.price).toEqual({ amount: "103.20", currency: "USD" });
    expect(during.compareAtPrice).toEqual({ amount: "129.00", currency: "USD" });
    const after = new MockStore({ now: new Date("2026-11-01T00:00:00Z") }).getProduct(
      "lumen-home",
      "LH-LAMP-01",
    );
    expect(after.price.amount).toBe("129.00");
    expect(after.compareAtPrice).toBeUndefined();
  });

  it("expands variant dimensions into variant SKUs", () => {
    const tent = new MockStore({ now }).getProduct("trailhead-supply", "TS-TENT-01");
    expect(tent.variants.map((v) => v.sku)).toEqual(["TS-TENT-01-GRN", "TS-TENT-01-ORG"]);
    expect(tent.variants[0].attributes).toEqual({ colour: "GRN" });
  });

  it("marks the oversell target low-stock and pre-orders as preorder", () => {
    const store = new MockStore({ now });
    expect(store.getProduct("lumen-home", "LH-LAMP-03").availability).toBe("low_stock");
    const pre = store.getProduct("trailhead-supply", "TS-JKT-03");
    expect(pre.availability).toBe("preorder");
    expect(pre.preorder).toBe(true);
  });

  it("computes USD tax-exclusive totals (8.25%, flat shipping)", () => {
    const totals = computeTotals("lumen-home", [{ lineTotal: { amount: "129.00" } }]);
    expect(totals).toMatchObject({
      subtotal: { amount: "129.00" },
      tax: { amount: "10.64" },
      shipping: { amount: "7.95" },
      total: { amount: "147.59" },
      taxIncluded: false,
    });
  });

  it("computes EUR VAT-inclusive totals with free shipping over €80", () => {
    const totals = computeTotals("trailhead-supply", [{ lineTotal: { amount: "119.00" } }]);
    expect(totals.tax.amount).toBe("19.00");
    expect(totals.shipping.amount).toBe("0.00");
    expect(totals.total.amount).toBe("119.00");
    expect(totals.taxIncluded).toBe(true);
    const small = computeTotals("trailhead-supply", [{ lineTotal: { amount: "24.00" } }]);
    expect(small.shipping.amount).toBe("5.90");
    expect(small.total.amount).toBe("29.90");
  });

  it("runs a cart through add / update / remove with recomputed totals", () => {
    const store = new MockStore({ now });
    let cart = store.createCart("lumen-home", "me@test");
    cart = store.addCartLine("lumen-home", "me@test", cart.id, "LH-LAMP-01", 2);
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0].lineTotal.amount).toBe("206.40");
    cart = store.updateCartLine("lumen-home", "me@test", cart.id, cart.lines[0].id, 1);
    expect(cart.totals.subtotal.amount).toBe("103.20");
    cart = store.updateCartLine("lumen-home", "me@test", cart.id, cart.lines[0].id, 0);
    expect(cart.lines).toHaveLength(0);
    expect(cart.totals.total.amount).toBe("0.00");
  });

  it("refuses to oversell LH-LAMP-03", () => {
    const store = new MockStore({ now });
    const cart = store.createCart("lumen-home", "me@test");
    expect(() => store.addCartLine("lumen-home", "me@test", cart.id, "LH-LAMP-03", 99)).toThrow(
      MockError,
    );
    try {
      store.addCartLine("lumen-home", "me@test", cart.id, "LH-LAMP-03", 99);
    } catch (e) {
      expect((e as MockError).status).toBe(409);
      expect((e as MockError).body.code).toBe("out_of_stock");
    }
  });

  it("seeds a deterministic order history per customer with a status timeline", () => {
    const a = new MockStore({ now });
    const b = new MockStore({ now });
    const pageA = a.listOrders("lumen-home", "customer-001@lumen-home.test");
    const pageB = b.listOrders("lumen-home", "customer-001@lumen-home.test");
    expect(pageA.items.length).toBeGreaterThan(0);
    expect(pageA.items.map((o) => o.number)).toEqual(pageB.items.map((o) => o.number));
    expect(pageA.items[0].number).toMatch(/^LH-\d{6}$/);
    const delivered = pageA.items.find((o) => o.status === "delivered")!;
    const events = a.listOrderEvents("lumen-home", delivered.user, delivered.id);
    const statuses = events.filter((e) => e.type === "status_changed").map((e) => e.to);
    expect(statuses).toEqual(["paid", "confirmed", "packed", "shipped", "delivered"]);
  });

  it("checks out an open cart and cancels a pending order", () => {
    const store = new MockStore({ now });
    const user = "me@test";
    const cart = store.createCart("trailhead-supply", user);
    store.addCartLine("trailhead-supply", user, cart.id, "TS-TARP-01", 1);
    const result = store.checkout("trailhead-supply", user, {
      cartId: cart.id,
      email: "me@test",
      shippingAddress: {
        name: "Me",
        line1: "1 Trail",
        city: "Hamburg",
        postalCode: "20095",
        country: "DE",
      },
    });
    expect(result.order.status).toBe("pending_payment");
    expect(result.payment.provider).toBe("paygate-fake");
    expect(store.getCart("trailhead-supply", user, cart.id).status).toBe("checked_out");
    const cancelled = store.cancelOrder("trailhead-supply", user, result.order.id);
    expect(cancelled.status).toBe("cancelled");
    expect(() => store.cancelOrder("trailhead-supply", user, result.order.id)).toThrow(
      /cannot cancel/,
    );
  });

  it("isolates brands: a Lumen order is forbidden for Trailhead", () => {
    const store = new MockStore({ now });
    const order = store.listOrders("lumen-home", "customer-001@lumen-home.test").items[0];
    expect(() =>
      store.getOrder("trailhead-supply", "customer-001@lumen-home.test", order.id),
    ).toThrow(/another brand/);
  });

  it("caps cart quantity at stock across add and update", () => {
    const store = new MockStore({ now });
    const cart = store.createCart("lumen-home", "me@test");
    const onHand = store.getProduct("lumen-home", "LH-LAMP-03").variants[0].onHand;
    const c1 = store.addCartLine("lumen-home", "me@test", cart.id, "LH-LAMP-03", onHand);
    expect(() => store.addCartLine("lumen-home", "me@test", cart.id, "LH-LAMP-03", 1)).toThrow(
      /on hand/,
    );
    expect(() =>
      store.updateCartLine("lumen-home", "me@test", cart.id, c1.lines[0].id, onHand + 1),
    ).toThrow(/on hand/);
  });

  it("rejects invented variant SKUs and base SKUs of variant products", () => {
    const store = new MockStore({ now });
    const withVariants = store
      .getCollection("trailhead-supply", "apparel")
      .products.find((p) => p.variants.length > 1);
    expect(withVariants).toBeDefined();
    const base = withVariants!.sku;
    expect(() => store.getProduct("trailhead-supply", `${base}-NOPE`)).toThrow(/not found/);
    const cart = store.createCart("trailhead-supply", "me@test");
    expect(() => store.addCartLine("trailhead-supply", "me@test", cart.id, base, 1)).toThrow(
      /variant/,
    );
    const ok = store.addCartLine(
      "trailhead-supply",
      "me@test",
      cart.id,
      withVariants!.variants[0].sku,
      1,
    );
    expect(ok.lines[0].sku).toBe(withVariants!.variants[0].sku);
  });

  it("derives bundle availability from its components", () => {
    const store = new MockStore({ now });
    const bundles = store.getCollection("lumen-home", "bundles").products;
    expect(bundles.length).toBeGreaterThan(0);
    for (const b of bundles) expect(b.availability).not.toBe("out_of_stock");
  });

  it("hides carts and orders from other customers and freezes checked-out carts", () => {
    const store = new MockStore({ now });
    const cart = store.createCart("lumen-home", "me@test");
    expect(() => store.getCart("lumen-home", "other@test", cart.id)).toThrow(/not found/);
    const mine = store.listOrders("lumen-home", "customer-001@lumen-home.test").items[0];
    expect(() => store.getOrder("lumen-home", "other@test", mine.id)).toThrow(/not found/);
    expect(() => store.cancelOrder("lumen-home", "other@test", mine.id)).toThrow(/not found/);
    const filled = store.addCartLine("lumen-home", "me@test", cart.id, "LH-LAMP-01", 1);
    store.checkout("lumen-home", "me@test", {
      cartId: cart.id,
      email: "me@test",
      shippingAddress: {
        name: "Me",
        line1: "1 Main",
        city: "Austin",
        postalCode: "78701",
        country: "US",
      },
    });
    expect(() =>
      store.updateCartLine("lumen-home", "me@test", cart.id, filled.lines[0].id, 2),
    ).toThrow(/not open/);
  });
});
