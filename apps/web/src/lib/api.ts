import { HEADERS } from "@harbourline/contracts";
import type {
  AbandonedCart,
  ApiError,
  Brand,
  BrandId,
  Cart,
  CartLineInput,
  CheckoutInput,
  CheckoutResult,
  Collection,
  CollectionPage,
  InventoryAdjustment,
  InventoryRow,
  Order,
  OrderEvent,
  OrderPage,
  OrderStatus,
  PriceList,
  Product,
  Role,
} from "@harbourline/contracts";

export type ApiMode = "mock" | "live";

/**
 * `VITE_API_MODE=mock` (default) intercepts same-origin requests with MSW handlers generated
 * from packages/contracts. `VITE_API_MODE=live` talks to `VITE_API_URL` (services/api, :3001).
 */
export function apiMode(): ApiMode {
  return import.meta.env.VITE_API_MODE === "live" ? "live" : "mock";
}

export function apiBaseUrl(): string {
  if (apiMode() === "live")
    return (import.meta.env.VITE_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
  return import.meta.env.VITE_MOCK_ORIGIN ?? "";
}

export interface Identity {
  brand: BrandId;
  user: string;
  role?: Role;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: ApiError;
  constructor(status: number, body: ApiError) {
    super(body.message);
    this.name = "ApiRequestError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  method: string,
  path: string,
  identity: Partial<Identity> | null,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (identity?.brand) headers[HEADERS.brand] = identity.brand;
  if (identity?.user) headers[HEADERS.user] = identity.user;
  if (identity?.role) headers[HEADERS.role] = identity.role;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${apiBaseUrl()}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const json = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const err: ApiError =
      json && typeof json === "object" && "code" in json
        ? (json as ApiError)
        : { code: "internal", message: `HTTP ${res.status}` };
    throw new ApiRequestError(res.status, err);
  }
  return json as T;
}

function query(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const api = {
  listBrands: () => request<Brand[]>("GET", "/brands", null),
  listCollections: (id: Identity) => request<Collection[]>("GET", "/catalog/collections", id),
  getCollection: (id: Identity, slug: string) =>
    request<CollectionPage>("GET", `/catalog/collections/${encodeURIComponent(slug)}`, id),
  getProduct: (id: Identity, sku: string) =>
    request<Product>("GET", `/catalog/products/${encodeURIComponent(sku)}`, id),
  createCart: (id: Identity) => request<Cart>("POST", "/carts", id),
  getCart: (id: Identity, cartId: string) => request<Cart>("GET", `/carts/${cartId}`, id),
  abandonCart: (id: Identity, cartId: string) => request<void>("DELETE", `/carts/${cartId}`, id),
  addCartLine: (id: Identity, cartId: string, line: CartLineInput) =>
    request<Cart>("POST", `/carts/${cartId}/lines`, id, line),
  updateCartLine: (id: Identity, cartId: string, lineId: string, quantity: number) =>
    request<Cart>("PATCH", `/carts/${cartId}/lines/${lineId}`, id, { quantity }),
  checkout: (id: Identity, input: CheckoutInput) =>
    request<CheckoutResult>("POST", "/checkout", id, input),
  listOrders: (
    id: Identity,
    params: { status?: OrderStatus; limit?: number; cursor?: string } = {},
  ) => request<OrderPage>("GET", `/orders${query(params)}`, id),
  getOrder: (id: Identity, orderId: string) => request<Order>("GET", `/orders/${orderId}`, id),
  listOrderEvents: (id: Identity, orderId: string) =>
    request<OrderEvent[]>("GET", `/orders/${orderId}/events`, id),
  cancelOrder: (id: Identity, orderId: string) =>
    request<Order>("POST", `/orders/${orderId}/cancel`, id),
  listInventory: (id: Identity, belowSafety?: boolean) =>
    request<InventoryRow[]>("GET", `/admin/inventory${query({ belowSafety })}`, id),
  adjustInventory: (id: Identity, sku: string, adjustment: InventoryAdjustment) =>
    request<InventoryRow>("PATCH", `/admin/inventory/${encodeURIComponent(sku)}`, id, adjustment),
  listPriceLists: (id: Identity) => request<PriceList[]>("GET", "/admin/price-lists", id),
  replacePriceList: (id: Identity, priceListId: string, list: PriceList) =>
    request<PriceList>("PUT", `/admin/price-lists/${encodeURIComponent(priceListId)}`, id, list),
  listAdminOrders: (
    id: Identity,
    params: {
      status?: OrderStatus;
      from?: string;
      to?: string;
      limit?: number;
      cursor?: string;
    } = {},
  ) => request<OrderPage>("GET", `/admin/orders${query(params)}`, id),
  listAbandonedCarts: (id: Identity, olderThanHours?: number) =>
    request<AbandonedCart[]>("GET", `/admin/carts/abandoned${query({ olderThanHours })}`, id),
  /** Mock-only helper backing the local PayGate hosted-checkout stub page. */
  mockSettlePayment: (paymentId: string, outcome: "succeeded" | "failed") =>
    request<Order>("POST", `/__mock/payments/${encodeURIComponent(paymentId)}/${outcome}`, null),
};

export type Api = typeof api;
