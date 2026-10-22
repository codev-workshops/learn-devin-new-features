import { randomUUID } from "node:crypto";
import { Router } from "express";
import type { Db } from "../db.js";
import { now } from "../config.js";
import { conflict, notFound } from "../errors.js";
import { requireCaller } from "../middleware/auth.js";
import { Validator } from "../middleware/validate.js";
import { getBrandRow } from "../services/brands.js";
import { getCartRow, loadCart } from "../services/carts.js";
import { currentPrice, resolveSellable } from "../services/catalog.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function cartsRouter(db: Db): Router {
  const r = Router();
  r.use(requireCaller);

  r.param("cartId", (_req, _res, next, value) => {
    next(UUID.test(value) ? undefined : notFound(`cart ${value} not found`));
  });

  r.post("/", async (req, res) => {
    const brand = await getBrandRow(db, req.caller.brand);
    const id = randomUUID();
    const t = now();
    await db.query(
      "INSERT INTO carts (id, brand, user_email, status, created_at, updated_at) VALUES ($1, $2, $3, 'open', $4, $4)",
      [id, brand.id, req.caller.user, t],
    );
    res.status(201).json(await loadCart(db, brand, id));
  });

  r.get("/:cartId", async (req, res) => {
    const brand = await getBrandRow(db, req.caller.brand);
    res.json(await loadCart(db, brand, req.params.cartId));
  });

  r.delete("/:cartId", async (req, res) => {
    const cart = await getCartRow(db, req.caller.brand, req.params.cartId);
    await db.query("DELETE FROM carts WHERE id = $1", [cart.id]);
    res.status(204).end();
  });

  r.post("/:cartId/lines", async (req, res) => {
    const brand = await getBrandRow(db, req.caller.brand);
    const v = new Validator(req.body);
    const sku = v.sku("sku");
    const quantity = v.integer("quantity", { min: 1, max: 99 });
    v.throwIfInvalid();
    const cart = await getCartRow(db, brand.id, req.params.cartId);
    if (cart.status !== "open") throw conflict(`cart ${cart.id} is ${cart.status}`);
    const sellable = await resolveSellable(db, brand.id, sku!);
    if (!sellable) throw conflict(`SKU ${sku} is not sold by ${brand.id}`);
    const priced = await currentPrice(db, brand.id, sellable.sku, brand.currency);
    const t = now();
    const existing = await db.query<{ id: string; quantity: number }>(
      "SELECT id, quantity FROM cart_lines WHERE cart_id = $1 AND sku = $2",
      [cart.id, sellable.sellable_sku],
    );
    if (existing.rows[0]) {
      const total = Math.min(99, existing.rows[0].quantity + quantity!);
      await db.query("UPDATE cart_lines SET quantity = $2 WHERE id = $1", [
        existing.rows[0].id,
        total,
      ]);
    } else {
      await db.query(
        "INSERT INTO cart_lines (id, cart_id, sku, name, quantity, unit_price, currency, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [
          randomUUID(),
          cart.id,
          sellable.sellable_sku,
          sellable.name,
          quantity,
          priced.price.amount,
          brand.currency,
          t,
        ],
      );
    }
    await db.query("UPDATE carts SET updated_at = $2 WHERE id = $1", [cart.id, t]);
    res.json(await loadCart(db, brand, cart.id));
  });

  r.patch("/:cartId/lines/:lineId", async (req, res) => {
    const brand = await getBrandRow(db, req.caller.brand);
    const v = new Validator(req.body);
    const quantity = v.integer("quantity", { min: 0, max: 99 });
    v.throwIfInvalid();
    const cart = await getCartRow(db, brand.id, req.params.cartId);
    if (cart.status !== "open") throw conflict(`cart ${cart.id} is ${cart.status}`);
    if (!UUID.test(req.params.lineId)) throw notFound(`line ${req.params.lineId} not found`);
    const line = await db.query<{ id: string }>(
      "SELECT id FROM cart_lines WHERE id = $1 AND cart_id = $2",
      [req.params.lineId, cart.id],
    );
    if (!line.rows[0]) throw notFound(`line ${req.params.lineId} not found in cart ${cart.id}`);
    if (quantity === 0) await db.query("DELETE FROM cart_lines WHERE id = $1", [line.rows[0].id]);
    else
      await db.query("UPDATE cart_lines SET quantity = $2 WHERE id = $1", [
        line.rows[0].id,
        quantity,
      ]);
    await db.query("UPDATE carts SET updated_at = $2 WHERE id = $1", [cart.id, now()]);
    res.json(await loadCart(db, brand, cart.id));
  });

  return r;
}
