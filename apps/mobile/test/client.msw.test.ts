import { setupServer } from "msw/node";

import { createHttpApi, KadeApiError, sessionHeaders } from "@/api/client";
import { API_BASE, createHandlers } from "@/mocks/handlers";
import { MockStore } from "@/mocks/store";

const store = new MockStore({ now: new Date("2026-10-22T00:00:00Z") });
const server = setupServer(...createHandlers(store));
const api = createHttpApi(API_BASE, (input, init) => fetch(input, init));
const session = {
  brand: "lumen-home" as const,
  user: "customer-001@lumen-home.test",
  role: "customer" as const,
};

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("typed client over MSW", () => {
  it("sends the three fake-auth headers from the contract", () => {
    expect(sessionHeaders(session)).toMatchObject({
      "X-Kade-Brand": "lumen-home",
      "X-Kade-User": "customer-001@lumen-home.test",
      "X-Kade-Role": "customer",
    });
  });

  it("GET /brands and /catalog/collections/{slug}", async () => {
    const brands = await api.listBrands();
    expect(brands).toHaveLength(2);
    const page = await api.getCollection(session, "lamp-week");
    expect(page.slug).toBe("lamp-week");
    expect(page.products.length).toBeGreaterThan(0);
    expect(page.products.every((p) => p.price.currency === "USD")).toBe(true);
  });

  it("POST /carts, POST lines, PATCH line, GET cart", async () => {
    const cart = await api.createCart(session);
    const withLine = await api.addCartLine(session, cart.id, "LH-LAMP-01", 1);
    expect(withLine.lines[0].sku).toBe("LH-LAMP-01");
    const updated = await api.updateCartLine(session, cart.id, withLine.lines[0].id, 3);
    expect(updated.lines[0].quantity).toBe(3);
    const fetched = await api.getCart(session, cart.id);
    expect(fetched.totals.total.amount).toBe(updated.totals.total.amount);
  });

  it("maps API error envelopes to KadeApiError", async () => {
    await expect(api.getProduct(session, "NOPE-1")).rejects.toBeInstanceOf(KadeApiError);
    const err = await api.getProduct(session, "NOPE-1").catch((e: KadeApiError) => e);
    expect(err).toMatchObject({ status: 404, body: { code: "not_found" } });
  });

  it("rejects unauthenticated catalog calls with 401", async () => {
    const anon = createHttpApi(API_BASE, (input, init) => fetch(input, init));
    const err = await anon
      .getCart({ brand: "" as never, user: "" }, "x")
      .catch((e: KadeApiError) => e);
    expect(err).toMatchObject({ status: 401 });
  });

  it("GET /orders, /orders/{id}/events and POST cancel", async () => {
    const page = await api.listOrders(session, { status: "pending_payment" });
    expect(page.items.length).toBeGreaterThan(0);
    const order = page.items[0];
    const events = await api.listOrderEvents(session, order.id);
    expect(events[0].type).toBe("reservation_made");
    const cancelled = await api.cancelOrder(session, order.id);
    expect(cancelled.status).toBe("cancelled");
  });
});
