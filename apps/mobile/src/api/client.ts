import type {
  ApiError,
  Brand,
  BrandId,
  Cart,
  CheckoutInput,
  CheckoutResult,
  Collection,
  CollectionPage,
  Order,
  OrderEvent,
  OrderPage,
  OrderStatus,
  Product,
  Role,
} from "./types";
import { HEADERS } from "./types";

export interface Session {
  brand: BrandId;
  user: string;
  role?: Role;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class KadeApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError,
  ) {
    super(`${body.code}: ${body.message}`);
    this.name = "KadeApiError";
  }
}

/** Typed client for the frozen OpenAPI contract (packages/contracts/openapi.yaml). */
export interface KadeApi {
  listBrands(): Promise<Brand[]>;
  listCollections(s: Session): Promise<Collection[]>;
  getCollection(s: Session, slug: string): Promise<CollectionPage>;
  getProduct(s: Session, sku: string): Promise<Product>;
  createCart(s: Session): Promise<Cart>;
  getCart(s: Session, cartId: string): Promise<Cart>;
  addCartLine(s: Session, cartId: string, sku: string, quantity: number): Promise<Cart>;
  updateCartLine(s: Session, cartId: string, lineId: string, quantity: number): Promise<Cart>;
  checkout(s: Session, input: CheckoutInput): Promise<CheckoutResult>;
  listOrders(
    s: Session,
    opts?: { status?: OrderStatus; limit?: number; cursor?: string },
  ): Promise<OrderPage>;
  getOrder(s: Session, orderId: string): Promise<Order>;
  listOrderEvents(s: Session, orderId: string): Promise<OrderEvent[]>;
  cancelOrder(s: Session, orderId: string): Promise<Order>;
}

export function sessionHeaders(s?: Session): Record<string, string> {
  const h: Record<string, string> = { accept: "application/json" };
  if (s) {
    h[HEADERS.brand] = s.brand;
    h[HEADERS.user] = s.user;
    if (s.role) h[HEADERS.role] = s.role;
  }
  return h;
}

export function createHttpApi(baseUrl: string, fetchImpl: FetchLike): KadeApi {
  const base = baseUrl.replace(/\/$/, "");

  async function call<T>(method: string, path: string, s?: Session, body?: unknown): Promise<T> {
    const headers = sessionHeaders(s);
    if (body !== undefined) headers["content-type"] = "application/json";
    const res = await fetchImpl(`${base}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const err: ApiError = json ?? { code: "internal", message: `HTTP ${res.status}` };
      throw new KadeApiError(res.status, err);
    }
    return json as T;
  }

  return {
    listBrands: () => call("GET", "/brands"),
    listCollections: (s) => call("GET", "/catalog/collections", s),
    getCollection: (s, slug) => call("GET", `/catalog/collections/${encodeURIComponent(slug)}`, s),
    getProduct: (s, sku) => call("GET", `/catalog/products/${encodeURIComponent(sku)}`, s),
    createCart: (s) => call("POST", "/carts", s),
    getCart: (s, cartId) => call("GET", `/carts/${cartId}`, s),
    addCartLine: (s, cartId, sku, quantity) =>
      call("POST", `/carts/${cartId}/lines`, s, { sku, quantity }),
    updateCartLine: (s, cartId, lineId, quantity) =>
      call("PATCH", `/carts/${cartId}/lines/${lineId}`, s, { quantity }),
    checkout: (s, input) => call("POST", "/checkout", s, input),
    listOrders: (s, opts = {}) => {
      const q = new URLSearchParams();
      if (opts.status) q.set("status", opts.status);
      if (opts.limit) q.set("limit", String(opts.limit));
      if (opts.cursor) q.set("cursor", opts.cursor);
      const qs = q.toString();
      return call("GET", `/orders${qs ? `?${qs}` : ""}`, s);
    },
    getOrder: (s, orderId) => call("GET", `/orders/${orderId}`, s),
    listOrderEvents: (s, orderId) => call("GET", `/orders/${orderId}/events`, s),
    cancelOrder: (s, orderId) => call("POST", `/orders/${orderId}/cancel`, s),
  };
}
