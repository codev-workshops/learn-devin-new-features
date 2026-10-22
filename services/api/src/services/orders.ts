import type {
  Address,
  BrandId,
  Order,
  OrderEvent,
  OrderLine,
  OrderStatus,
} from "@harbourline/contracts";
import type { Queryable } from "../db.js";
import { money } from "../money.js";

export interface OrderRow {
  id: string;
  number: string;
  brand: BrandId;
  user_email: string;
  cart_id: string | null;
  status: OrderStatus;
  subtotal: string;
  discount: string;
  tax: string;
  shipping: string;
  total: string;
  currency: "USD" | "EUR";
  tax_included: boolean;
  payment_id: string | null;
  shipping_address: Address | null;
  placed_at: Date;
  updated_at: Date;
}

export interface OrderLineRow {
  order_id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  warehouse: string;
}

export const ORDER_COLUMNS =
  "id, number, brand, user_email, cart_id, status, subtotal, discount, tax, shipping, total, currency, tax_included, payment_id, shipping_address, placed_at, updated_at";

export async function linesFor(
  db: Queryable,
  orderIds: string[],
): Promise<Map<string, OrderLineRow[]>> {
  const out = new Map<string, OrderLineRow[]>();
  if (!orderIds.length) return out;
  const { rows } = await db.query<OrderLineRow>(
    "SELECT order_id, sku, name, quantity, unit_price, line_total, warehouse FROM order_lines WHERE order_id = ANY($1::uuid[]) ORDER BY order_id, position",
    [orderIds],
  );
  for (const l of rows) {
    const list = out.get(l.order_id) ?? [];
    list.push(l);
    out.set(l.order_id, list);
  }
  return out;
}

export function orderToApi(o: OrderRow, lines: OrderLineRow[]): Order {
  const c = o.currency;
  const apiLines: OrderLine[] = lines.map((l) => ({
    sku: l.sku,
    name: l.name,
    quantity: l.quantity,
    unitPrice: money(l.unit_price, c),
    lineTotal: money(l.line_total, c),
    warehouse: l.warehouse,
  }));
  return {
    id: o.id,
    number: o.number,
    brand: o.brand,
    user: o.user_email,
    ...(o.cart_id ? { cartId: o.cart_id } : {}),
    status: o.status,
    lines: apiLines,
    totals: {
      subtotal: money(o.subtotal, c),
      discount: money(o.discount, c),
      tax: money(o.tax, c),
      shipping: money(o.shipping, c),
      total: money(o.total, c),
      currency: c,
      taxIncluded: o.tax_included,
    },
    ...(o.payment_id ? { paymentId: o.payment_id } : {}),
    ...(o.shipping_address ? { shippingAddress: o.shipping_address } : {}),
    placedAt: o.placed_at.toISOString(),
    updatedAt: o.updated_at.toISOString(),
  };
}

export async function ordersToApi(db: Queryable, rows: OrderRow[]): Promise<Order[]> {
  const lines = await linesFor(
    db,
    rows.map((r) => r.id),
  );
  return rows.map((r) => orderToApi(r, lines.get(r.id) ?? []));
}

interface EventRow {
  id: string;
  order_id: string;
  type: OrderEvent["type"];
  from_status: OrderStatus | null;
  to_status: OrderStatus | null;
  source: NonNullable<OrderEvent["source"]>;
  detail: string | null;
  at: Date;
}

export async function eventsFor(db: Queryable, orderId: string): Promise<OrderEvent[]> {
  const { rows } = await db.query<EventRow>(
    "SELECT * FROM order_events WHERE order_id = $1 ORDER BY at, id",
    [orderId],
  );
  return rows.map((e) => ({
    id: e.id,
    orderId: e.order_id,
    type: e.type,
    ...(e.from_status ? { from: e.from_status } : {}),
    ...(e.to_status ? { to: e.to_status } : {}),
    source: e.source,
    ...(e.detail ? { detail: e.detail } : {}),
    at: e.at.toISOString(),
  }));
}

/** Opaque cursor over (placed_at DESC, id DESC). */
export function encodeCursor(o: OrderRow): string {
  return Buffer.from(`${o.placed_at.toISOString()}|${o.id}`).toString("base64url");
}

export function decodeCursor(cursor: string | undefined): { placedAt: Date; id: string } | null {
  if (!cursor) return null;
  const [at, id] = Buffer.from(cursor, "base64url").toString("utf8").split("|");
  if (!at || !id || Number.isNaN(Date.parse(at))) return null;
  return { placedAt: new Date(at), id };
}

export function parseLimit(raw: unknown): number {
  const n = Number(raw ?? 50);
  if (!Number.isInteger(n) || n < 1 || n > 200) return -1;
  return n;
}
