import { HEADERS } from "@kade/contracts";
import type { BrandId, Role } from "@kade/contracts";
import { http, HttpResponse, type HttpHandler } from "msw";
import routes from "./generated/routes.json";
import { createStore, StoreError, type Caller, type Store } from "./store";

export const store: Store = createStore();

function caller(req: Request): Caller {
  return {
    brand: (req.headers.get(HEADERS.brand) as BrandId | null) ?? undefined,
    user: req.headers.get(HEADERS.user) ?? undefined,
    role: (req.headers.get(HEADERS.role) as Role | null) ?? undefined,
  };
}

const json = (body: unknown, status = 200) =>
  HttpResponse.json(body as Record<string, unknown>, { status });

function guard<T>(fn: () => T | Promise<T>, status = 200) {
  return async () => {
    try {
      const body = await fn();
      return status === 204 ? new HttpResponse(null, { status }) : json(body, status);
    } catch (e) {
      if (e instanceof StoreError) return json(e.body, e.status);
      return json(
        { code: "internal", message: e instanceof Error ? e.message : "mock failure" },
        500,
      );
    }
  };
}

const num = (v: string | null) => (v === null ? undefined : Number(v));
const str = (v: string | null) => v ?? undefined;

/**
 * One handler per operationId in packages/contracts/openapi.yaml. The `*` prefix lets the same
 * handlers serve same-origin requests in the browser and absolute URLs under Vitest.
 */
export const operationHandlers: Record<string, (path: string) => HttpHandler> = {
  getHealth: (p) =>
    http.get(
      p,
      guard(() => store.health()),
    ),
  listBrands: (p) =>
    http.get(
      p,
      guard(() => store.listBrands()),
    ),
  listCollections: (p) =>
    http.get(p, ({ request }) => guard(() => store.listCollections(caller(request)))()),
  getCollection: (p) =>
    http.get(p, ({ request, params }) =>
      guard(() => store.getCollection(caller(request), String(params.slug)))(),
    ),
  getProduct: (p) =>
    http.get(p, ({ request, params }) =>
      guard(() => store.getProduct(caller(request), String(params.sku)))(),
    ),
  createCart: (p) =>
    http.post(p, ({ request }) => guard(() => store.createCart(caller(request)), 201)()),
  getCart: (p) =>
    http.get(p, ({ request, params }) =>
      guard(() => store.getCart(caller(request), String(params.cartId)))(),
    ),
  abandonCart: (p) =>
    http.delete(p, ({ request, params }) =>
      guard(() => store.abandonCart(caller(request), String(params.cartId)), 204)(),
    ),
  addCartLine: (p) =>
    http.post(p, async ({ request, params }) => {
      const body = (await request.json()) as { sku: string; quantity: number };
      return guard(() => store.addCartLine(caller(request), String(params.cartId), body))();
    }),
  updateCartLine: (p) =>
    http.patch(p, async ({ request, params }) => {
      const body = (await request.json()) as { quantity: number };
      return guard(() =>
        store.updateCartLine(
          caller(request),
          String(params.cartId),
          String(params.lineId),
          body.quantity,
        ),
      )();
    }),
  checkout: (p) =>
    http.post(p, async ({ request }) => {
      const body = await request.json();
      return guard(
        () => store.checkout(caller(request), body as Parameters<Store["checkout"]>[1]),
        201,
      )();
    }),
  listOrders: (p) =>
    http.get(p, ({ request }) => {
      const q = new URL(request.url).searchParams;
      return guard(() =>
        store.listOrders(caller(request), {
          status: str(q.get("status")),
          limit: num(q.get("limit")),
          cursor: str(q.get("cursor")),
        }),
      )();
    }),
  getOrder: (p) =>
    http.get(p, ({ request, params }) =>
      guard(() => store.getOrder(caller(request), String(params.orderId)))(),
    ),
  listOrderEvents: (p) =>
    http.get(p, ({ request, params }) =>
      guard(() => store.listOrderEvents(caller(request), String(params.orderId)))(),
    ),
  cancelOrder: (p) =>
    http.post(p, ({ request, params }) =>
      guard(() => store.cancelOrder(caller(request), String(params.orderId)))(),
    ),
  listInventory: (p) =>
    http.get(p, ({ request }) => {
      const q = new URL(request.url).searchParams;
      return guard(() => store.listInventory(caller(request), q.get("belowSafety") === "true"))();
    }),
  adjustInventory: (p) =>
    http.patch(p, async ({ request, params }) => {
      const body = await request.json();
      return guard(() =>
        store.adjustInventory(
          caller(request),
          String(params.sku),
          body as Parameters<Store["adjustInventory"]>[2],
        ),
      )();
    }),
  listPriceLists: (p) =>
    http.get(p, ({ request }) => guard(() => store.listPriceLists(caller(request)))()),
  replacePriceList: (p) =>
    http.put(p, async ({ request, params }) => {
      const body = await request.json();
      return guard(() =>
        store.replacePriceList(
          caller(request),
          String(params.priceListId),
          body as Parameters<Store["replacePriceList"]>[2],
        ),
      )();
    }),
  listAdminOrders: (p) =>
    http.get(p, ({ request }) => {
      const q = new URL(request.url).searchParams;
      return guard(() =>
        store.listAdminOrders(caller(request), {
          status: str(q.get("status")),
          from: str(q.get("from")),
          to: str(q.get("to")),
          limit: num(q.get("limit")),
          cursor: str(q.get("cursor")),
        }),
      )();
    }),
  listAbandonedCarts: (p) =>
    http.get(p, ({ request }) => {
      const q = new URL(request.url).searchParams;
      return guard(() => store.listAbandonedCarts(caller(request), num(q.get("olderThanHours"))))();
    }),
  receivePaymentWebhook: (p) =>
    http.post(p, ({ request }) =>
      guard(
        () =>
          store.receiveWebhook(
            request.headers.get(HEADERS.paygateSignature),
            request.headers.get(HEADERS.paygateEventId),
          ),
        202,
      )(),
    ),
};

/** Handlers that exist only in the mock: the local PayGate hosted-checkout stub and a reset hook. */
export const mockOnlyHandlers: HttpHandler[] = [
  http.post("*/__mock/payments/:paymentId/:outcome", ({ params }) =>
    guard(() =>
      store.settlePayment(
        String(params.paymentId),
        params.outcome === "failed" ? "failed" : "succeeded",
      ),
    )(),
  ),
  http.post("*/__mock/reset", () => {
    store.reset();
    return new HttpResponse(null, { status: 204 });
  }),
];

export const contractRoutes = routes;

const paramCount = (path: string) => (path.match(/\{/g) ?? []).length;

/** Literal paths first so `*\/admin/carts/abandoned` is never swallowed by `*\/carts/:cartId`. */
const orderedRoutes = [...routes].sort((x, y) => paramCount(x.path) - paramCount(y.path));

export const handlers: HttpHandler[] = [
  ...orderedRoutes.map((r) => {
    const make = operationHandlers[r.operationId];
    if (!make) throw new Error(`No mock handler for ${r.operationId} (${r.method} ${r.path})`);
    return make(`*${r.mswPath}`);
  }),
  ...mockOnlyHandlers,
];
