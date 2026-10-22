/** Mutable in-memory backend behind the MSW handlers. One instance per page / test file. */
import type {
  AbandonedCart,
  ApiError,
  Brand,
  BrandId,
  Cart,
  CartLine,
  CheckoutInput,
  CheckoutResult,
  Collection,
  CollectionPage,
  InventoryAdjustment,
  InventoryRow,
  Order,
  OrderEvent,
  OrderLine,
  OrderPage,
  OrderStatus,
  PriceList,
  Product,
  Role,
} from "@kade/contracts";
import { ORDER_STATUSES } from "@kade/contracts";
import { fromCents, toCents } from "../lib/money";
import {
  AS_OF,
  HOUR,
  availabilityFor,
  baseSku,
  buildDataset,
  lineTotals,
  rng,
  type Dataset,
  type MockCart,
  type MockOrder,
} from "./dataset";

export class StoreError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiError,
  ) {
    super(body.message);
  }
}

const fail = (status: number, code: ApiError["code"], message: string): never => {
  throw new StoreError(status, { code, message });
};

export interface Caller {
  brand?: BrandId;
  user?: string;
  role?: Role;
}

export function createStore(now: () => Date = () => new Date()) {
  let data: Dataset = buildDataset(AS_OF);
  const ids = rng(Date.now() % 2147483647);
  const iso = () => now().toISOString();

  const brand = (id: BrandId): Brand =>
    data.brands.find((b) => b.id === id) ?? fail(400, "bad_request", `Unknown brand ${id}`);

  const requireBrand = (c: Caller): BrandId => {
    if (!c.brand || !data.brands.some((b) => b.id === c.brand))
      fail(400, "bad_request", "Missing or unknown X-Kade-Brand header");
    return c.brand as BrandId;
  };
  const requireUser = (c: Caller): string =>
    c.user ?? fail(400, "bad_request", "Missing X-Kade-User header");
  const requireStaff = (c: Caller): BrandId => {
    const b = requireBrand(c);
    requireUser(c);
    if (c.role !== "merchandiser" && c.role !== "admin")
      fail(403, "forbidden", "X-Kade-Role must be merchandiser or admin");
    return b;
  };

  const productFor = (brandId: BrandId, sku: string) => {
    const p = data.products.find((x) => x.brand === brandId && x.sku === baseSku(sku));
    if (!p) return null;
    if (sku !== p.sku && !p.variants.some((v) => v.sku === sku)) return null;
    return p;
  };
  const onHandFor = (brandId: BrandId, sku: string): number => {
    const p = productFor(brandId, sku);
    if (!p) return 0;
    if (p.bundle) return Math.min(...p.bundle.map((c) => onHandFor(brandId, c)));
    const variant = p.variants.find((v) => v.sku === sku);
    if (variant) return variant.onHand;
    return data.inventory.filter((r) => r.sku === p.sku).reduce((s, r) => s + r.available, 0);
  };
  const refreshAvailability = (p: Product & { safetyStock: number }) => {
    p.availability = availabilityFor(onHandFor(p.brand, p.sku), p.safetyStock, p.preorder);
  };
  const warehouseFor = (b: Brand, sku: string): string =>
    data.inventory.find(
      (r) => r.sku === baseSku(sku) && r.available > 0 && b.warehouses?.includes(r.warehouse),
    )?.warehouse ??
    b.warehouses?.[0] ??
    "US-NJ";

  const addEvent = (o: MockOrder, e: Omit<OrderEvent, "id" | "orderId" | "at">) => {
    o.events.push({ id: ids.uuid(), orderId: o.id, at: iso(), ...e });
    o.updatedAt = iso();
  };
  const transition = (
    o: MockOrder,
    to: OrderStatus,
    source: OrderEvent["source"],
    detail?: string,
  ) => {
    addEvent(o, { type: "status_changed", from: o.status, to, source, detail });
    o.status = to;
  };
  const adjustReservation = (o: Order, sign: 1 | -1) => {
    for (const l of o.lines) {
      const row = data.inventory.find(
        (r) => r.sku === baseSku(l.sku) && r.warehouse === l.warehouse,
      );
      if (!row) continue;
      row.reserved += sign * l.quantity;
      row.available = row.onHand - row.reserved;
      row.updatedAt = iso();
    }
  };
  const decrementStock = (o: Order) => {
    for (const l of o.lines) {
      const row = data.inventory.find(
        (r) => r.sku === baseSku(l.sku) && r.warehouse === l.warehouse,
      );
      if (row) {
        row.onHand -= l.quantity;
        row.reserved -= l.quantity;
        row.available = row.onHand - row.reserved;
        row.updatedAt = iso();
      }
      const p = productFor(o.brand, l.sku);
      const v = p?.variants.find((x) => x.sku === l.sku);
      if (v) v.onHand -= l.quantity;
      if (p) refreshAvailability(p);
    }
  };
  const publicOrder = ({ events: _events, ...o }: MockOrder): Order => o;
  const publicCart = ({ pendingPaymentId: _p, ...c }: MockCart): Cart => c;
  const recompute = (c: MockCart) => {
    c.totals = lineTotals(brand(c.brand), c.lines);
    c.updatedAt = iso();
  };
  const page = (items: Order[], limit = 50, cursor?: string): OrderPage => {
    const start = cursor ? Number(cursor) : 0;
    const slice = items.slice(start, start + limit);
    return start + limit < items.length
      ? { items: slice, nextCursor: String(start + limit) }
      : { items: slice };
  };

  return {
    reset() {
      data = buildDataset(AS_OF);
    },
    get data() {
      return data;
    },
    health: () => ({ status: "ok" as const, database: "ok" as const, version: "mock" }),
    listBrands: (): Brand[] => data.brands,
    listCollections: (c: Caller): Collection[] => data.collections[requireBrand(c)],
    getCollection(c: Caller, slug: string): CollectionPage {
      const b = requireBrand(c);
      const col =
        data.collections[b].find((x) => x.slug === slug) ??
        fail(404, "not_found", `No collection ${slug}`);
      return {
        ...col,
        products: data.products.filter((p) => p.brand === b && p.collection === slug),
      };
    },
    getProduct(c: Caller, sku: string): Product {
      return productFor(requireBrand(c), sku) ?? fail(404, "not_found", `No product ${sku}`);
    },
    createCart(c: Caller): Cart {
      const b = requireBrand(c);
      const cart: MockCart = {
        id: ids.uuid(),
        brand: b,
        user: requireUser(c),
        status: "open",
        lines: [],
        totals: lineTotals(brand(b), []),
        createdAt: iso(),
        updatedAt: iso(),
      };
      data.carts.push(cart);
      return publicCart(cart);
    },
    getCart(c: Caller, cartId: string): Cart {
      const b = requireBrand(c);
      return publicCart(
        data.carts.find((x) => x.id === cartId && x.brand === b) ??
          fail(404, "not_found", "No such cart"),
      );
    },
    abandonCart(c: Caller, cartId: string): void {
      const b = requireBrand(c);
      const i = data.carts.findIndex((x) => x.id === cartId && x.brand === b);
      if (i === -1) fail(404, "not_found", "No such cart");
      data.carts.splice(i, 1);
    },
    addCartLine(c: Caller, cartId: string, input: { sku: string; quantity: number }): Cart {
      const b = requireBrand(c);
      const cart =
        data.carts.find((x) => x.id === cartId && x.brand === b) ??
        fail(404, "not_found", "No such cart");
      if (cart.status !== "open") fail(409, "conflict", "Cart is not open");
      const p = productFor(b, input.sku) ?? fail(404, "not_found", `No product ${input.sku}`);
      if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 99)
        fail(422, "validation_failed", "quantity must be 1..99");
      const available = onHandFor(b, input.sku);
      const existing = cart.lines.find((l) => l.sku === input.sku);
      const wanted = (existing?.quantity ?? 0) + input.quantity;
      if (!p.preorder && wanted > available)
        fail(409, "out_of_stock", `Only ${available} of ${input.sku} available`);
      if (existing) {
        existing.quantity = wanted;
        existing.lineTotal = {
          amount: fromCents(toCents(existing.unitPrice.amount) * wanted),
          currency: p.price.currency,
        };
      } else {
        const variant = p.variants.find((v) => v.sku === input.sku);
        const line: CartLine = {
          id: ids.uuid(),
          sku: input.sku,
          name: variant ? `${p.name} (${Object.values(variant.attributes).join("/")})` : p.name,
          quantity: input.quantity,
          unitPrice: p.price,
          lineTotal: {
            amount: fromCents(toCents(p.price.amount) * input.quantity),
            currency: p.price.currency,
          },
        };
        cart.lines.push(line);
      }
      recompute(cart);
      return publicCart(cart);
    },
    updateCartLine(c: Caller, cartId: string, lineId: string, quantity: number): Cart {
      const b = requireBrand(c);
      const cart =
        data.carts.find((x) => x.id === cartId && x.brand === b) ??
        fail(404, "not_found", "No such cart");
      const line =
        cart.lines.find((l) => l.id === lineId) ?? fail(404, "not_found", "No such line");
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99)
        fail(422, "validation_failed", "quantity must be 0..99");
      if (quantity === 0) cart.lines = cart.lines.filter((l) => l.id !== lineId);
      else {
        line.quantity = quantity;
        line.lineTotal = {
          amount: fromCents(toCents(line.unitPrice.amount) * quantity),
          currency: line.unitPrice.currency,
        };
      }
      recompute(cart);
      return publicCart(cart);
    },
    checkout(c: Caller, input: CheckoutInput): CheckoutResult {
      const b = requireBrand(c);
      const bb = brand(b);
      const cart =
        data.carts.find((x) => x.id === input.cartId && x.brand === b) ??
        fail(404, "not_found", "No such cart");
      if (cart.status !== "open") fail(409, "conflict", "Cart already checked out");
      if (cart.lines.length === 0) fail(422, "validation_failed", "Cart is empty");
      if (
        !input.email ||
        !input.shippingAddress?.line1 ||
        !/^[A-Z]{2}$/.test(input.shippingAddress?.country ?? "")
      )
        fail(422, "validation_failed", "email and a complete shipping address are required");
      for (const l of cart.lines) {
        const p = productFor(b, l.sku);
        if (p && !p.preorder && onHandFor(b, l.sku) < l.quantity)
          fail(409, "out_of_stock", `${l.sku} is out of stock`);
      }
      const lines: OrderLine[] = cart.lines.map((l) => ({
        sku: l.sku,
        name: l.name,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        lineTotal: l.lineTotal,
        warehouse: warehouseFor(bb, l.sku),
      }));
      const paymentId = `pay_${ids.uuid().slice(0, 12)}`;
      const order: MockOrder = {
        id: ids.uuid(),
        number: `${data.seedBrands[b].order_number_prefix}-${data.nextOrderNumber[b]++}`,
        brand: b,
        user: cart.user,
        cartId: cart.id,
        status: "pending_payment",
        lines,
        totals: lineTotals(bb, lines),
        paymentId,
        shippingAddress: input.shippingAddress,
        placedAt: iso(),
        updatedAt: iso(),
        events: [],
      };
      adjustReservation(order, 1);
      addEvent(order, {
        type: "reservation_made",
        source: "api",
        detail: "Stock reserved per line",
      });
      addEvent(order, {
        type: "email_queued",
        source: "api",
        detail: "Awaiting PayGate confirmation",
      });
      cart.status = "checked_out";
      cart.pendingPaymentId = paymentId;
      recompute(cart);
      data.orders.unshift(order);
      const origin =
        typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
      return {
        order: publicOrder(order),
        payment: {
          paymentId,
          provider: "paygate-fake",
          redirectUrl: `${origin}/shop/${b}/pay/${paymentId}`,
          expiresAt: new Date(now().getTime() + 30 * 60_000).toISOString(),
        },
      };
    },
    listOrders(c: Caller, q: { status?: string; limit?: number; cursor?: string }): OrderPage {
      const b = requireBrand(c);
      const user = requireUser(c);
      const staff = c.role === "merchandiser" || c.role === "admin";
      if (q.status && !ORDER_STATUSES.includes(q.status as OrderStatus))
        fail(400, "bad_request", `Unknown status ${q.status}`);
      const items = data.orders
        .filter(
          (o) =>
            o.brand === b && (staff || o.user === user) && (!q.status || o.status === q.status),
        )
        .map(publicOrder);
      return page(items, q.limit, q.cursor);
    },
    getOrder(c: Caller, orderId: string): Order {
      const b = requireBrand(c);
      const o =
        data.orders.find((x) => x.id === orderId) ?? fail(404, "not_found", "No such order");
      if (o.brand !== b) fail(403, "forbidden", "Order belongs to another brand");
      return publicOrder(o);
    },
    listOrderEvents(c: Caller, orderId: string): OrderEvent[] {
      const b = requireBrand(c);
      const o =
        data.orders.find((x) => x.id === orderId && x.brand === b) ??
        fail(404, "not_found", "No such order");
      return [...o.events].sort((x, y) => (x.at < y.at ? -1 : 1));
    },
    cancelOrder(c: Caller, orderId: string): Order {
      const b = requireBrand(c);
      const o =
        data.orders.find((x) => x.id === orderId && x.brand === b) ??
        fail(404, "not_found", "No such order");
      if (o.status !== "pending_payment" && o.status !== "paid")
        fail(409, "conflict", `Cannot cancel an order that is ${o.status}`);
      adjustReservation(o, -1);
      transition(o, "cancelled", "api", "Cancelled by customer");
      addEvent(o, { type: "reservation_released", source: "api" });
      return publicOrder(o);
    },
    listInventory(c: Caller, belowSafety?: boolean): InventoryRow[] {
      const b = requireStaff(c);
      const skus = new Set(data.products.filter((p) => p.brand === b).map((p) => p.sku));
      return data.inventory.filter(
        (r) => skus.has(r.sku) && (!belowSafety || r.available <= r.safetyStock),
      );
    },
    adjustInventory(c: Caller, sku: string, adj: InventoryAdjustment): InventoryRow {
      const b = requireStaff(c);
      const row = data.inventory.find(
        (r) =>
          r.sku === sku &&
          r.warehouse === adj.warehouse &&
          brand(b).warehouses?.includes(r.warehouse),
      );
      if (!row || !productFor(b, sku))
        return fail(404, "not_found", `No inventory row for ${sku} at ${adj.warehouse}`);
      if (!Number.isInteger(adj.delta)) fail(422, "validation_failed", "delta must be an integer");
      row.onHand += adj.delta;
      row.available = row.onHand - row.reserved;
      row.updatedAt = iso();
      const p = productFor(b, sku);
      if (p) refreshAvailability(p);
      return row;
    },
    listPriceLists: (c: Caller): PriceList[] =>
      data.priceLists.filter((p) => p.brand === requireStaff(c)),
    replacePriceList(c: Caller, priceListId: string, list: PriceList): PriceList {
      const b = requireStaff(c);
      const i = data.priceLists.findIndex((p) => p.id === priceListId && p.brand === b);
      if (i === -1) fail(404, "not_found", `No price list ${priceListId}`);
      if (list.id !== priceListId || list.brand !== b)
        fail(422, "validation_failed", "id and brand must match the path and caller");
      for (const e of list.entries) {
        if (!/^-?\d+\.\d{2}$/.test(e.price.amount))
          fail(422, "validation_failed", `${e.sku}: amount must have two decimals`);
        if (!productFor(b, e.sku)) fail(422, "validation_failed", `${e.sku}: unknown SKU`);
      }
      data.priceLists[i] = list;
      const active = !list.activeFrom || new Date(list.activeFrom) <= AS_OF;
      for (const e of list.entries) {
        const p = productFor(b, e.sku);
        if (!p) continue;
        if (priceListId.endsWith("-base")) p.basePrice = e.price;
        if (active && (!priceListId.endsWith("-base") || !p.compareAtPrice)) {
          p.price = e.price;
          if (e.compareAtPrice) p.compareAtPrice = e.compareAtPrice;
        }
      }
      return list;
    },
    listAdminOrders(
      c: Caller,
      q: { status?: string; from?: string; to?: string; limit?: number; cursor?: string },
    ): OrderPage {
      const b = requireStaff(c);
      if (q.status && !ORDER_STATUSES.includes(q.status as OrderStatus))
        fail(400, "bad_request", `Unknown status ${q.status}`);
      const items = data.orders
        .filter(
          (o) =>
            o.brand === b &&
            (!q.status || o.status === q.status) &&
            (!q.from || o.placedAt >= `${q.from}T00:00:00Z`) &&
            (!q.to || o.placedAt <= `${q.to}T23:59:59Z`),
        )
        .map(publicOrder);
      return page(items, q.limit, q.cursor);
    },
    listAbandonedCarts(c: Caller, olderThanHours = 24): AbandonedCart[] {
      const b = requireStaff(c);
      const cutoff = now().getTime() - olderThanHours * HOUR;
      return data.carts
        .filter(
          (x) => x.brand === b && x.status === "open" && new Date(x.updatedAt).getTime() <= cutoff,
        )
        .map((x) => ({
          cart: publicCart(x),
          ageHours:
            Math.round(((now().getTime() - new Date(x.updatedAt).getTime()) / HOUR) * 10) / 10,
          ...(x.pendingPaymentId ? { pendingPaymentId: x.pendingPaymentId } : {}),
        }))
        .sort((x, y) => y.ageHours - x.ageHours);
    },
    receiveWebhook(signature: string | null, eventId: string | null): void {
      if (!eventId) fail(400, "bad_request", "X-PayGate-Event-Id is required");
      if (!signature || !/^sha256=[0-9a-f]{64}$/.test(signature))
        fail(401, "invalid_signature", "Signature missing or invalid");
    },
    /** Mock-only: what the fulfilment worker does when PayGate reports the outcome. */
    settlePayment(paymentId: string, outcome: "succeeded" | "failed"): Order {
      const o =
        data.orders.find((x) => x.paymentId === paymentId) ??
        fail(404, "not_found", "No order for that payment");
      if (o.status !== "pending_payment") fail(409, "conflict", `Order is already ${o.status}`);
      if (outcome === "failed") {
        addEvent(o, {
          type: "payment_failed",
          source: "webhook",
          detail: `payment.failed for ${paymentId}`,
        });
        adjustReservation(o, -1);
        transition(o, "cancelled", "worker");
        addEvent(o, { type: "reservation_released", source: "worker" });
        return publicOrder(o);
      }
      addEvent(o, {
        type: "payment_received",
        source: "webhook",
        detail: `payment.succeeded for ${paymentId}`,
      });
      transition(o, "paid", "worker");
      decrementStock(o);
      transition(o, "confirmed", "worker");
      addEvent(o, { type: "email_queued", source: "worker", detail: "Order confirmation queued" });
      return publicOrder(o);
    },
  };
}

export type Store = ReturnType<typeof createStore>;
