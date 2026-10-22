import { randomUUID } from "node:crypto";
import { Router } from "express";
import type { Address, CheckoutResult } from "@kade/contracts";
import type { Db } from "../db.js";
import { config, now } from "../config.js";
import { conflict, outOfStock, validationFailed } from "../errors.js";
import { requireCaller } from "../middleware/auth.js";
import { Validator } from "../middleware/validate.js";
import { brandPricing, getBrandRow, type BrandRow } from "../services/brands.js";
import { getCartLines, getCartRow, type CartLineRow } from "../services/carts.js";
import { computeTotals, totalsToApi } from "../money.js";
import { ORDER_COLUMNS, ordersToApi, type OrderRow } from "../services/orders.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAYMENT_TTL_MS = 30 * 60_000;
const PAYGATE_TIMEOUT_MS = 1_500;

function parseAddress(v: Validator): Address | undefined {
  const a = v.object("shippingAddress");
  if (!a) return undefined;
  const name = a.string("name");
  const line1 = a.string("line1");
  const line2 = a.string("line2", { required: false });
  const city = a.string("city");
  const postalCode = a.string("postalCode");
  const country = a.string("country", { pattern: /^[A-Z]{2}$/ });
  v.details.push(
    ...a.details.map((d) => ({ path: `shippingAddress.${d.path}`, message: d.message })),
  );
  if (a.details.length) return undefined;
  return {
    name: name!,
    line1: line1!,
    ...(line2 ? { line2 } : {}),
    city: city!,
    postalCode: postalCode!,
    country: country!,
  };
}

interface PaygateSession {
  paymentId: string;
  provider: "paygate-fake";
  redirectUrl: string;
  expiresAt: string;
}

/**
 * Opens a hosted-payment session on PayGate (`POST /checkout/sessions`). When PayGate is not running
 * (unit tests, API-only bring-up) the order still exists and the redirect points at where the
 * session would have lived, so the client flow is unchanged.
 */
async function openPaygateSession(order: OrderRow, brand: BrandRow): Promise<PaygateSession> {
  const fallback: PaygateSession = {
    paymentId: order.payment_id ?? "",
    provider: "paygate-fake",
    redirectUrl: `${config.paygateUrl}/checkout/${order.payment_id ?? order.id}`,
    expiresAt: new Date(order.placed_at.getTime() + PAYMENT_TTL_MS).toISOString(),
  };
  try {
    const res = await fetch(`${config.paygateUrl}/checkout/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        cartId: order.cart_id,
        brand: brand.id,
        amount: Number(order.total).toFixed(2),
        currency: order.currency,
        customerEmail: order.user_email,
        paymentId: order.payment_id,
      }),
      signal: AbortSignal.timeout(PAYGATE_TIMEOUT_MS),
    });
    if (!res.ok) return fallback;
    const body = (await res.json()) as Partial<PaygateSession>;
    return {
      paymentId: body.paymentId ?? fallback.paymentId,
      provider: "paygate-fake",
      redirectUrl: body.redirectUrl ?? fallback.redirectUrl,
      expiresAt: body.expiresAt ?? fallback.expiresAt,
    };
  } catch {
    return fallback;
  }
}

interface SellableInfo {
  sku: string;
  preorder: boolean;
  /** Physical SKUs to reserve, one per unit of the cart line (a bundle expands to its components). */
  components: string[];
}

async function describeLines(db: Db, lines: CartLineRow[]): Promise<Map<string, SellableInfo>> {
  const { rows } = await db.query<{ sku: string; preorder: boolean; bundle: string[] | null }>(
    `SELECT s.sku, p.preorder, p.bundle
       FROM unnest($1::text[]) AS s(sku)
       JOIN products p ON p.sku = s.sku OR p.sku = (SELECT v.product_sku FROM variants v WHERE v.sku = s.sku)`,
    [lines.map((l) => l.sku)],
  );
  return new Map(
    rows.map((r) => [
      r.sku,
      {
        sku: r.sku,
        preorder: r.preorder,
        components: r.bundle && r.bundle.length ? r.bundle : [r.sku],
      },
    ]),
  );
}

interface Reservation {
  sku: string;
  warehouse: string;
  qty: number;
}

export function checkoutRouter(db: Db): Router {
  const r = Router();
  r.use(requireCaller);

  r.post("/", async (req, res) => {
    const brandRow = await getBrandRow(db, req.caller.brand);
    const v = new Validator(req.body);
    const cartId = v.string("cartId", { pattern: UUID });
    const email = v.string("email", { pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/ });
    const idempotencyKey = v.string("idempotencyKey", { required: false, max: 64 });
    const shippingAddress = parseAddress(v);
    v.throwIfInvalid();

    if (idempotencyKey) {
      const existing = await db.query<OrderRow>(
        `SELECT ${ORDER_COLUMNS} FROM orders WHERE brand = $1 AND idempotency_key = $2 AND cart_id = $3 AND user_email = $4`,
        [brandRow.id, idempotencyKey, cartId, email],
      );
      if (existing.rows[0]) {
        const [order] = await ordersToApi(db, existing.rows);
        res.status(201).json({
          order,
          payment: await openPaygateSession(existing.rows[0], brandRow),
        } satisfies CheckoutResult);
        return;
      }
    }

    const cart = await getCartRow(db, brandRow.id, cartId!, req.caller);
    if (cart.user_email !== req.caller.user)
      throw conflict(`cart ${cart.id} belongs to another user`);
    if (cart.status !== "open") throw conflict(`cart ${cart.id} is ${cart.status}`);
    const lines = await getCartLines(db, cart.id);
    if (!lines.length) throw validationFailed([{ path: "cartId", message: "cart is empty" }]);
    const sellables = await describeLines(db, lines);

    const pricing = brandPricing(brandRow);
    const t = now();
    const id = randomUUID();
    const paymentId = `pay_${id.replace(/-/g, "").slice(0, 20)}`;
    const placed = await db.withTransaction(async (tx) => {
      // Flip the cart first so a second concurrent checkout of the same cart sees it closed and stops.
      const flipped = await tx.query(
        "UPDATE carts SET status = 'checked_out', pending_payment_id = $2, updated_at = $3 WHERE id = $1 AND status = 'open'",
        [cart.id, paymentId, t],
      );
      if (flipped.rowCount === 0) throw conflict(`cart ${cart.id} is already checked out`);

      const reservationsByLine = new Map<string, Reservation[]>();
      for (const line of lines) {
        const info = sellables.get(line.sku) ?? {
          sku: line.sku,
          preorder: false,
          components: [line.sku],
        };
        const taken: Reservation[] = [];
        if (!info.preorder) {
          for (const component of info.components) {
            // Read-then-write reservation without row locks (PLANTED.md `oversell`).
            const stock = await tx.query<{ warehouse: string; available: number }>(
              "SELECT warehouse, (on_hand - reserved)::int AS available FROM inventory WHERE sku = $1 ORDER BY warehouse",
              [component],
            );
            const total = stock.rows.reduce((s, w) => s + w.available, 0);
            if (total < line.quantity) {
              throw outOfStock(`SKU ${component}: requested ${line.quantity}, available ${total}`);
            }
            let remaining = line.quantity;
            for (const w of stock.rows) {
              if (remaining <= 0) break;
              const take = Math.min(remaining, Math.max(w.available, 0));
              if (take <= 0) continue;
              await tx.query(
                "UPDATE inventory SET reserved = reserved + $3, updated_at = $4 WHERE sku = $1 AND warehouse = $2",
                [component, w.warehouse, take, t],
              );
              taken.push({ sku: component, warehouse: w.warehouse, qty: take });
              remaining -= take;
            }
          }
        }
        reservationsByLine.set(line.id, taken);
      }

      // Totals from the cart's stored unit prices, not the current price list (PLANTED.md `stale-cart-prices`).
      const totals = computeTotals(
        lines.map((l) => ({ unitPrice: Number(l.unit_price), quantity: l.quantity })),
        pricing,
      );
      const numberRow = await tx.query<{ n: number }>("SELECT nextval('order_number_seq') AS n");
      const number = `${brandRow.order_number_prefix}-${numberRow.rows[0]!.n}`;
      await tx.query(
        `INSERT INTO orders (id, number, brand, user_email, cart_id, status, subtotal, discount, tax, shipping, total, currency, tax_included,
                             totals, payment_id, idempotency_key, shipping_address, placed_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,'pending_payment',$6,$7,$8,$9,$10,$11,$12,$17,$13,$14,$15,$16,$16)`,
        [
          id,
          number,
          brandRow.id,
          email,
          cart.id,
          totals.subtotal.toFixed(2),
          totals.discount.toFixed(2),
          totals.tax.toFixed(2),
          totals.shipping.toFixed(2),
          totals.total.toFixed(2),
          pricing.currency,
          totals.taxIncluded,
          paymentId,
          idempotencyKey ?? null,
          JSON.stringify(shippingAddress),
          t,
          JSON.stringify(totalsToApi(totals)),
        ],
      );
      // One order line per (cart line, warehouse) so the worker commits stock where it was actually held.
      let position = 0;
      for (const line of lines) {
        const taken = reservationsByLine.get(line.id) ?? [];
        const own = taken.filter((rsv) => rsv.sku === line.sku);
        const splits = own.length
          ? own.map((rsv) => ({ warehouse: rsv.warehouse, qty: rsv.qty }))
          : [{ warehouse: taken[0]?.warehouse ?? brandRow.warehouses[0]!, qty: line.quantity }];
        for (const split of splits) {
          await tx.query(
            "INSERT INTO order_lines (order_id, position, sku, name, quantity, unit_price, line_total, warehouse) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
            [
              id,
              position++,
              line.sku,
              line.name,
              split.qty,
              line.unit_price,
              (Number(line.unit_price) * split.qty).toFixed(2),
              split.warehouse,
            ],
          );
        }
      }
      await tx.query(
        "INSERT INTO order_events (id, order_id, type, from_status, to_status, source, detail, at) VALUES ($1,$2,'status_changed',NULL,'pending_payment','api','checkout',$3)",
        [randomUUID(), id, t],
      );
      const allReservations = [...reservationsByLine.values()].flat();
      await tx.query(
        "INSERT INTO order_events (id, order_id, type, source, detail, at) VALUES ($1,$2,'reservation_made','api',$3,$4)",
        [
          randomUUID(),
          id,
          allReservations.length
            ? allReservations.map((rsv) => `${rsv.sku}@${rsv.warehouse}x${rsv.qty}`).join(", ")
            : "preorder: nothing to reserve",
          t,
        ],
      );
      await tx.query(
        "INSERT INTO outbox (id, topic, order_id, payload, created_at) VALUES ($1,'order.placed',$2,$3,$4)",
        [
          randomUUID(),
          id,
          JSON.stringify({ orderId: id, number, brand: brandRow.id, email, paymentId }),
          t,
        ],
      );
      const row = await tx.query<OrderRow>(`SELECT ${ORDER_COLUMNS} FROM orders WHERE id = $1`, [
        id,
      ]);
      return row.rows[0]!;
    });
    const [order] = await ordersToApi(db, [placed]);
    res.status(201).json({
      order: order!,
      payment: await openPaygateSession(placed, brandRow),
    } satisfies CheckoutResult);
  });

  return r;
}
