import { randomUUID } from "node:crypto";
import { Router } from "express";
import type { Address, CheckoutResult } from "@kade/contracts";
import type { Db } from "../db.js";
import { config, now } from "../config.js";
import { conflict, outOfStock, validationFailed } from "../errors.js";
import { requireCaller } from "../middleware/auth.js";
import { Validator } from "../middleware/validate.js";
import { brandPricing, getBrandRow } from "../services/brands.js";
import { getCartLines, getCartRow } from "../services/carts.js";
import { computeTotals } from "../money.js";
import { ORDER_COLUMNS, ordersToApi, type OrderRow } from "../services/orders.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAYMENT_TTL_MS = 30 * 60_000;

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

function paymentFor(order: {
  payment_id: string | null;
  placed_at: Date;
}): CheckoutResult["payment"] {
  const paymentId = order.payment_id ?? "";
  return {
    paymentId,
    provider: "paygate-fake",
    redirectUrl: `${config.paygateUrl}/pay/${paymentId}`,
    expiresAt: new Date(order.placed_at.getTime() + PAYMENT_TTL_MS).toISOString(),
  };
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
        `SELECT ${ORDER_COLUMNS} FROM orders WHERE brand = $1 AND idempotency_key = $2`,
        [brandRow.id, idempotencyKey],
      );
      if (existing.rows[0]) {
        const [order] = await ordersToApi(db, existing.rows);
        res
          .status(201)
          .json({ order, payment: paymentFor(existing.rows[0]) } satisfies CheckoutResult);
        return;
      }
    }

    const cart = await getCartRow(db, brandRow.id, cartId!);
    if (cart.user_email !== req.caller.user)
      throw conflict(`cart ${cart.id} belongs to another user`);
    if (cart.status !== "open") throw conflict(`cart ${cart.id} is ${cart.status}`);
    const lines = await getCartLines(db, cart.id);
    if (!lines.length) throw validationFailed([{ path: "cartId", message: "cart is empty" }]);

    const pricing = brandPricing(brandRow);
    const t = now();
    const result = await db.withTransaction(async (tx) => {
      const reservations: { sku: string; warehouse: string; qty: number }[] = [];
      for (const line of lines) {
        // Read-then-write reservation without row locks (PLANTED.md `oversell`).
        const stock = await tx.query<{ warehouse: string; available: number }>(
          "SELECT warehouse, (on_hand - reserved)::int AS available FROM inventory WHERE sku = $1 ORDER BY warehouse",
          [line.sku],
        );
        const total = stock.rows.reduce((s, w) => s + w.available, 0);
        if (total < line.quantity) {
          throw outOfStock(`SKU ${line.sku}: requested ${line.quantity}, available ${total}`);
        }
        let remaining = line.quantity;
        for (const w of stock.rows) {
          if (remaining <= 0) break;
          const take = Math.min(remaining, Math.max(w.available, 0));
          if (take <= 0) continue;
          await tx.query(
            "UPDATE inventory SET reserved = reserved + $3, updated_at = $4 WHERE sku = $1 AND warehouse = $2",
            [line.sku, w.warehouse, take, t],
          );
          reservations.push({ sku: line.sku, warehouse: w.warehouse, qty: take });
          remaining -= take;
        }
      }

      // Totals from the cart's stored unit prices, not the current price list (PLANTED.md `stale-cart-prices`).
      const totals = computeTotals(
        lines.map((l) => ({ unitPrice: Number(l.unit_price), quantity: l.quantity })),
        pricing,
      );
      const id = randomUUID();
      const numberRow = await tx.query<{ n: number }>("SELECT nextval('order_number_seq') AS n");
      const number = `${brandRow.order_number_prefix}-${numberRow.rows[0]!.n}`;
      const paymentId = `pay_${id.replace(/-/g, "").slice(0, 20)}`;
      await tx.query(
        `INSERT INTO orders (id, number, brand, user_email, cart_id, status, subtotal, discount, tax, shipping, total, currency, tax_included,
                             payment_id, idempotency_key, shipping_address, placed_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,'pending_payment',$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$16)`,
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
        ],
      );
      let position = 0;
      for (const line of lines) {
        const warehouse =
          reservations.find((rsv) => rsv.sku === line.sku)?.warehouse ?? brandRow.warehouses[0]!;
        await tx.query(
          "INSERT INTO order_lines (id, order_id, position, sku, name, quantity, unit_price, line_total, warehouse) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
          [
            randomUUID(),
            id,
            position++,
            line.sku,
            line.name,
            line.quantity,
            line.unit_price,
            (Number(line.unit_price) * line.quantity).toFixed(2),
            warehouse,
          ],
        );
      }
      await tx.query(
        "INSERT INTO order_events (id, order_id, type, from_status, to_status, source, detail, at) VALUES ($1,$2,'status_changed',NULL,'pending_payment','api','checkout',$3)",
        [randomUUID(), id, t],
      );
      await tx.query(
        "INSERT INTO order_events (id, order_id, type, source, detail, at) VALUES ($1,$2,'reservation_made','api',$3,$4)",
        [
          randomUUID(),
          id,
          reservations.map((rsv) => `${rsv.sku}@${rsv.warehouse}x${rsv.qty}`).join(", "),
          t,
        ],
      );
      await tx.query(
        "UPDATE carts SET status = 'checked_out', pending_payment_id = $2, updated_at = $3 WHERE id = $1",
        [cart.id, paymentId, t],
      );
      await tx.query(
        "INSERT INTO outbox (id, aggregate_type, aggregate_id, type, payload, created_at) VALUES ($1,'order',$2,'order.placed',$3,$4)",
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
      const [order] = await ordersToApi(tx, row.rows);
      return { order: order!, payment: paymentFor(row.rows[0]!) } satisfies CheckoutResult;
    });
    res.status(201).json(result);
  });

  return r;
}
