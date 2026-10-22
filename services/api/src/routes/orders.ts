import { randomUUID } from "node:crypto";
import { Router } from "express";
import { ORDER_STATUSES, type OrderStatus } from "@kade/contracts";
import type { Db } from "../db.js";
import { now } from "../config.js";
import { badRequest, conflict, forbidden, notFound } from "../errors.js";
import { isStaff, requireCaller } from "../middleware/auth.js";
import {
  ORDER_COLUMNS,
  decodeCursor,
  encodeCursor,
  eventsFor,
  ordersToApi,
  parseLimit,
  type OrderRow,
} from "../services/orders.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CANCELLABLE: OrderStatus[] = ["pending_payment", "paid"];

export async function listOrders(
  db: Db,
  where: string[],
  params: unknown[],
  query: Record<string, unknown>,
) {
  const limit = parseLimit(query.limit);
  if (limit < 0) throw badRequest("limit must be an integer between 1 and 200");
  const cursor = decodeCursor(typeof query.cursor === "string" ? query.cursor : undefined);
  if (query.cursor && !cursor) throw badRequest("cursor is malformed");
  if (cursor) {
    params.push(cursor.placedAt, cursor.id);
    where.push(`(placed_at, id) < ($${params.length - 1}, $${params.length}::uuid)`);
  }
  params.push(limit + 1);
  const { rows } = await db.query<OrderRow>(
    `SELECT ${ORDER_COLUMNS} FROM orders WHERE ${where.join(" AND ")} ORDER BY placed_at DESC, id DESC LIMIT $${params.length}`,
    params,
  );
  const page = rows.slice(0, limit);
  const items = await ordersToApi(db, page);
  return {
    items,
    ...(rows.length > limit ? { nextCursor: encodeCursor(page[page.length - 1]!) } : {}),
  };
}

export function ordersRouter(db: Db): Router {
  const r = Router();
  r.use(requireCaller);

  r.param("orderId", (_req, _res, next, value) => {
    next(UUID.test(value) ? undefined : notFound(`order ${value} not found`));
  });

  r.get("/", async (req, res) => {
    const where = ["brand = $1"];
    const params: unknown[] = [req.caller.brand];
    if (!isStaff(req.caller)) {
      params.push(req.caller.user);
      where.push(`user_email = $${params.length}`);
    }
    if (typeof req.query.status === "string") {
      if (!(ORDER_STATUSES as readonly string[]).includes(req.query.status)) {
        throw badRequest(`status must be one of ${ORDER_STATUSES.join(", ")}`);
      }
      params.push(req.query.status);
      where.push(`status = $${params.length}`);
    }
    res.json(await listOrders(db, where, params, req.query as Record<string, unknown>));
  });

  r.get("/:orderId", async (req, res) => {
    // Looks the order up by id alone — the caller's brand header is not part of the predicate (PLANTED.md `cross-brand-order-read`).
    const { rows } = await db.query<OrderRow>(`SELECT ${ORDER_COLUMNS} FROM orders WHERE id = $1`, [
      req.params.orderId,
    ]);
    const order = rows[0];
    if (!order) throw notFound(`order ${req.params.orderId} not found`);
    if (!isStaff(req.caller) && order.user_email !== req.caller.user) {
      throw forbidden("orders are visible to their owner or to staff");
    }
    const [api] = await ordersToApi(db, [order]);
    res.json(api);
  });

  r.get("/:orderId/events", async (req, res) => {
    const { rows } = await db.query<OrderRow>(
      `SELECT ${ORDER_COLUMNS} FROM orders WHERE id = $1 AND brand = $2`,
      [req.params.orderId, req.caller.brand],
    );
    const order = rows[0];
    if (!order) throw notFound(`order ${req.params.orderId} not found`);
    if (!isStaff(req.caller) && order.user_email !== req.caller.user) {
      throw forbidden("orders are visible to their owner or to staff");
    }
    res.json(await eventsFor(db, order.id));
  });

  r.post("/:orderId/cancel", async (req, res) => {
    const reason = typeof req.body?.reason === "string" ? req.body.reason.slice(0, 500) : null;
    const api = await db.withTransaction(async (tx) => {
      const { rows } = await tx.query<OrderRow>(
        `SELECT ${ORDER_COLUMNS} FROM orders WHERE id = $1 AND brand = $2 FOR UPDATE`,
        [req.params.orderId, req.caller.brand],
      );
      const order = rows[0];
      if (!order) throw notFound(`order ${req.params.orderId} not found`);
      if (!isStaff(req.caller) && order.user_email !== req.caller.user) {
        throw forbidden("orders are visible to their owner or to staff");
      }
      if (!CANCELLABLE.includes(order.status)) {
        throw conflict(`order ${order.number} is ${order.status} and can no longer be cancelled`);
      }
      const t = now();
      await tx.query("UPDATE orders SET status = 'cancelled', updated_at = $2 WHERE id = $1", [
        order.id,
        t,
      ]);
      await tx.query(
        "UPDATE inventory i SET reserved = GREATEST(i.reserved - l.quantity, 0), updated_at = $2 FROM order_lines l WHERE l.order_id = $1 AND l.sku = i.sku AND l.warehouse = i.warehouse",
        [order.id, t],
      );
      await tx.query(
        "INSERT INTO order_events (id, order_id, type, from_status, to_status, source, detail, at) VALUES ($1,$2,'status_changed',$3,'cancelled',$4,$5,$6)",
        [randomUUID(), order.id, order.status, isStaff(req.caller) ? "admin" : "api", reason, t],
      );
      await tx.query(
        "INSERT INTO order_events (id, order_id, type, source, detail, at) VALUES ($1,$2,'reservation_released',$3,'cancel',$4)",
        [randomUUID(), order.id, isStaff(req.caller) ? "admin" : "api", t],
      );
      await tx.query(
        "INSERT INTO outbox (id, topic, order_id, payload, created_at) VALUES ($1,'order.cancelled',$2,$3,$4)",
        [
          randomUUID(),
          order.id,
          JSON.stringify({ orderId: order.id, number: order.number, brand: order.brand, reason }),
          t,
        ],
      );
      const fresh = await tx.query<OrderRow>(`SELECT ${ORDER_COLUMNS} FROM orders WHERE id = $1`, [
        order.id,
      ]);
      return (await ordersToApi(tx, fresh.rows))[0]!;
    });
    res.json(api);
  });

  return r;
}
