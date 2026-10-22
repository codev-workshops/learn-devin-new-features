// A `fetch`-shaped transport over MockStore so the typed HTTP client is exercised end to end
// (URL building, headers, JSON, error mapping) without a network or a running services/api.
import { HEADERS } from "../api/types";
import type { BrandId, OrderStatus } from "../api/types";
import { MockError, MockStore } from "./store";

type Handler = (ctx: {
  params: Record<string, string>;
  query: URLSearchParams;
  brand: BrandId;
  user: string;
  body: unknown;
}) => { status?: number; body?: unknown };

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

function compile(path: string): { pattern: RegExp; keys: string[] } {
  const keys: string[] = [];
  const source = path.replace(/\{(\w+)\}/g, (_, k: string) => {
    keys.push(k);
    return "([^/]+)";
  });
  return { pattern: new RegExp(`^${source}$`), keys };
}

export function buildRoutes(store: MockStore): Route[] {
  const def = (method: string, path: string, handler: Handler): Route => ({
    method,
    ...compile(path),
    handler,
  });
  const asBody = (b: unknown) => (b && typeof b === "object" ? (b as Record<string, unknown>) : {});
  return [
    def("GET", "/brands", () => ({ body: store.listBrands() })),
    def("GET", "/catalog/collections", ({ brand }) => ({ body: store.listCollections(brand) })),
    def("GET", "/catalog/collections/{slug}", ({ brand, params }) => ({
      body: store.getCollection(brand, params.slug),
    })),
    def("GET", "/catalog/products/{sku}", ({ brand, params }) => ({
      body: store.getProduct(brand, params.sku),
    })),
    def("POST", "/carts", ({ brand, user }) => ({
      status: 201,
      body: store.createCart(brand, user),
    })),
    def("GET", "/carts/{cartId}", ({ brand, user, params }) => ({
      body: store.getCart(brand, user, params.cartId),
    })),
    def("POST", "/carts/{cartId}/lines", ({ brand, user, params, body }) => {
      const b = asBody(body);
      return {
        body: store.addCartLine(brand, user, params.cartId, String(b.sku), Number(b.quantity)),
      };
    }),
    def("PATCH", "/carts/{cartId}/lines/{lineId}", ({ brand, user, params, body }) => ({
      body: store.updateCartLine(
        brand,
        user,
        params.cartId,
        params.lineId,
        Number(asBody(body).quantity),
      ),
    })),
    def("DELETE", "/carts/{cartId}", ({ brand, user, params }) => {
      store.abandonCart(brand, user, params.cartId);
      return { status: 204 };
    }),
    def("POST", "/checkout", ({ brand, user, body }) => ({
      status: 201,
      body: store.checkout(brand, user, asBody(body) as never),
    })),
    def("GET", "/orders", ({ brand, user, query }) => ({
      body: store.listOrders(brand, user, {
        status: (query.get("status") as OrderStatus | null) ?? undefined,
        limit: query.get("limit") ? Number(query.get("limit")) : undefined,
        cursor: query.get("cursor") ?? undefined,
      }),
    })),
    def("GET", "/orders/{orderId}", ({ brand, user, params }) => ({
      body: store.getOrder(brand, user, params.orderId),
    })),
    def("GET", "/orders/{orderId}/events", ({ brand, user, params }) => ({
      body: store.listOrderEvents(brand, user, params.orderId),
    })),
    def("POST", "/orders/{orderId}/cancel", ({ brand, user, params }) => ({
      body: store.cancelOrder(brand, user, params.orderId),
    })),
  ];
}

function headerValue(init: RequestInit | undefined, name: string): string | undefined {
  const h = init?.headers;
  if (!h) return undefined;
  if (h instanceof Headers) return h.get(name) ?? undefined;
  const entries = Array.isArray(h) ? h : Object.entries(h);
  const hit = entries.find(([k]) => k.toLowerCase() === name.toLowerCase());
  return hit?.[1];
}

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: body === undefined ? {} : { "content-type": "application/json" },
  });
}

export function createMockFetch(store: MockStore = new MockStore()) {
  const routes = buildRoutes(store);
  return async function mockFetch(input: string, init?: RequestInit): Promise<Response> {
    const url = new URL(input, "http://mock.local");
    const method = (init?.method ?? "GET").toUpperCase();
    const brand = headerValue(init, HEADERS.brand) as BrandId | undefined;
    const user = headerValue(init, HEADERS.user);
    for (const route of routes) {
      if (route.method !== method) continue;
      const m = route.pattern.exec(url.pathname);
      if (!m) continue;
      if (url.pathname !== "/brands" && (!brand || !user)) {
        return jsonResponse(401, {
          code: "unauthorized",
          message: "X-Kade-Brand and X-Kade-User are required",
        });
      }
      const params: Record<string, string> = {};
      route.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      let body: unknown = undefined;
      if (typeof init?.body === "string" && init.body.length > 0) body = JSON.parse(init.body);
      try {
        const out = route.handler({
          params,
          query: url.searchParams,
          brand: brand!,
          user: user!,
          body,
        });
        return jsonResponse(out.status ?? 200, out.body);
      } catch (err) {
        if (err instanceof MockError) return jsonResponse(err.status, err.body);
        throw err;
      }
    }
    return jsonResponse(404, {
      code: "not_found",
      message: `no route for ${method} ${url.pathname}`,
    });
  };
}
