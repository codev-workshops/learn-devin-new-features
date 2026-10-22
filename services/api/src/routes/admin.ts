import { Router } from "express";
import {
  ORDER_STATUSES,
  type AbandonedCart,
  type InventoryRow,
  type PriceList,
} from "@harbourline/contracts";
import type { Db } from "../db.js";
import { now } from "../config.js";
import { badRequest, notFound } from "../errors.js";
import { requireCaller, requireRole } from "../middleware/auth.js";
import { Validator } from "../middleware/validate.js";
import { getBrandRow } from "../services/brands.js";
import { cartToApi, getCartLines, type CartRow } from "../services/carts.js";
import { listOrders } from "./orders.js";

interface InventoryDbRow {
  sku: string;
  warehouse: string;
  on_hand: number;
  reserved: number;
  safety_stock: number;
  updated_at: Date;
}

function inventoryToApi(r: InventoryDbRow): InventoryRow {
  return {
    sku: r.sku,
    warehouse: r.warehouse,
    onHand: r.on_hand,
    reserved: r.reserved,
    available: r.on_hand - r.reserved,
    safetyStock: r.safety_stock,
    updatedAt: r.updated_at.toISOString(),
  };
}

interface PriceListDbRow {
  id: string;
  brand: PriceList["brand"];
  name: string;
  currency: PriceList["currency"];
  active_from: Date | null;
  active_to: Date | null;
  entries: { sku: string; price: string; compare_at: string | null }[];
}

function priceListToApi(r: PriceListDbRow): PriceList {
  return {
    id: r.id,
    brand: r.brand,
    name: r.name,
    currency: r.currency,
    ...(r.active_from ? { activeFrom: r.active_from.toISOString() } : {}),
    ...(r.active_to ? { activeTo: r.active_to.toISOString() } : {}),
    entries: r.entries.map((e) => ({
      sku: e.sku,
      price: { amount: Number(e.price).toFixed(2), currency: r.currency },
      ...(e.compare_at !== null && Number(e.compare_at) !== Number(e.price)
        ? { compareAtPrice: { amount: Number(e.compare_at).toFixed(2), currency: r.currency } }
        : {}),
    })),
  };
}

const PRICE_LIST_SQL = `
  SELECT pl.id, pl.brand, pl.name, pl.currency, pl.active_from, pl.active_to,
         COALESCE((SELECT json_agg(json_build_object('sku', e.sku, 'price', e.price, 'compare_at', b.price) ORDER BY e.sku)
                     FROM price_list_entries e
                     LEFT JOIN price_list_entries b ON b.sku = e.sku AND b.price_list_id = pl.brand || '-base' AND b.price_list_id <> pl.id
                    WHERE e.price_list_id = pl.id), '[]'::json) AS entries
    FROM price_lists pl`;

const BRAND_SKU_PREDICATE = "i.brand = $1";

export function adminRouter(db: Db): Router {
  const r = Router();
  r.use(requireCaller, requireRole("merchandiser", "admin"));

  r.get("/inventory", async (req, res) => {
    const where = [BRAND_SKU_PREDICATE];
    const params: unknown[] = [req.caller.brand];
    if (req.query.belowSafety === "true") where.push("(i.on_hand - i.reserved) <= i.safety_stock");
    if (typeof req.query.sku === "string") {
      params.push(req.query.sku);
      where.push(`i.sku = $${params.length}`);
    }
    if (typeof req.query.warehouse === "string") {
      params.push(req.query.warehouse);
      where.push(`i.warehouse = $${params.length}`);
    }
    const { rows } = await db.query<InventoryDbRow>(
      `SELECT i.sku, i.warehouse, i.on_hand, i.reserved, i.safety_stock, i.updated_at
         FROM inventory i WHERE ${where.join(" AND ")} ORDER BY i.sku, i.warehouse`,
      params,
    );
    res.json(rows.map(inventoryToApi));
  });

  r.patch("/inventory/:sku", async (req, res) => {
    const brand = await getBrandRow(db, req.caller.brand);
    const v = new Validator(req.body);
    const warehouse = v.oneOf("warehouse", brand.warehouses);
    const delta = v.integer("delta");
    const reason = v.oneOf("reason", [
      "receipt",
      "count_correction",
      "write_off",
      "return",
    ] as const);
    v.string("note", { required: false, max: 500 });
    v.throwIfInvalid();
    const { rows } = await db.query<InventoryDbRow>(
      `UPDATE inventory i SET on_hand = i.on_hand + $3, updated_at = $4
        WHERE i.sku = $2 AND i.warehouse = $5 AND ${BRAND_SKU_PREDICATE}
        RETURNING i.sku, i.warehouse, i.on_hand, i.reserved, i.safety_stock, i.updated_at`,
      [brand.id, req.params.sku, delta, now(), warehouse],
    );
    if (!rows[0])
      throw notFound(`inventory for ${req.params.sku} at ${warehouse} not found in ${brand.id}`);
    if (rows[0].on_hand < 0 && reason !== "write_off") {
      // keep the ledger honest for everything except explicit write-offs
      await db.query(
        "UPDATE inventory SET on_hand = on_hand - $3 WHERE sku = $1 AND warehouse = $2",
        [rows[0].sku, rows[0].warehouse, delta],
      );
      throw badRequest(`adjustment would take ${rows[0].sku}@${rows[0].warehouse} below zero`);
    }
    res.json(inventoryToApi(rows[0]));
  });

  r.get("/price-lists", async (req, res) => {
    const { rows } = await db.query<PriceListDbRow>(
      `${PRICE_LIST_SQL} WHERE pl.brand = $1 ORDER BY (pl.active_from IS NOT NULL), pl.id`,
      [req.caller.brand],
    );
    res.json(rows.map(priceListToApi));
  });

  r.put("/price-lists/:priceListId", async (req, res) => {
    const brand = await getBrandRow(db, req.caller.brand);
    const v = new Validator(req.body);
    const name = v.string("name", { max: 120 });
    const activeFrom = v.string("activeFrom", { required: false });
    const activeTo = v.string("activeTo", { required: false });
    const entries = v.array("entries");
    const parsed: { sku: string; price: string }[] = [];
    entries?.forEach((e, i) => {
      const sku = e.sku("sku");
      const price = e.money("price");
      v.details.push(
        ...e.details.map((d) => ({ path: `entries[${i}].${d.path}`, message: d.message })),
      );
      if (sku && price && price.currency !== brand.currency)
        v.fail(`entries[${i}].price.currency`, `must be ${brand.currency}`);
      else if (sku && price) parsed.push({ sku, price: price.amount });
    });
    for (const [path, ts] of [
      ["activeFrom", activeFrom],
      ["activeTo", activeTo],
    ] as const) {
      if (ts !== undefined && Number.isNaN(Date.parse(ts)))
        v.fail(path, "must be an ISO-8601 timestamp");
    }
    v.throwIfInvalid();
    const updated = await db.withTransaction(async (tx) => {
      const existing = await tx.query<{ id: string }>(
        "SELECT id FROM price_lists WHERE id = $1 AND brand = $2 FOR UPDATE",
        [req.params.priceListId, brand.id],
      );
      if (!existing.rows[0])
        throw notFound(`price list ${req.params.priceListId} not found in ${brand.id}`);
      const unknown = await tx.query<{ sku: string }>(
        `SELECT s.sku FROM unnest($1::text[]) AS s(sku)
          WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.sku = s.sku AND p.brand = $2)`,
        [parsed.map((p) => p.sku), brand.id],
      );
      if (unknown.rows.length) {
        throw badRequest(
          `unknown product SKUs for ${brand.id} (prices are set per product, not per variant): ${unknown.rows.map((u) => u.sku).join(", ")}`,
        );
      }
      await tx.query(
        "UPDATE price_lists SET name = $2, active_from = $3, active_to = $4 WHERE id = $1",
        [req.params.priceListId, name, activeFrom ?? null, activeTo ?? null],
      );
      await tx.query("DELETE FROM price_list_entries WHERE price_list_id = $1", [
        req.params.priceListId,
      ]);
      for (const e of parsed) {
        await tx.query(
          "INSERT INTO price_list_entries (price_list_id, sku, price) VALUES ($1, $2, $3)",
          [req.params.priceListId, e.sku, e.price],
        );
      }
      const { rows } = await tx.query<PriceListDbRow>(`${PRICE_LIST_SQL} WHERE pl.id = $1`, [
        req.params.priceListId,
      ]);
      return rows[0]!;
    });
    res.json(priceListToApi(updated));
  });

  r.get("/orders", async (req, res) => {
    const where = ["brand = $1"];
    const params: unknown[] = [req.caller.brand];
    if (typeof req.query.status === "string") {
      if (!(ORDER_STATUSES as readonly string[]).includes(req.query.status)) {
        throw badRequest(`status must be one of ${ORDER_STATUSES.join(", ")}`);
      }
      params.push(req.query.status);
      where.push(`status = $${params.length}`);
    }
    for (const [key, op] of [
      ["from", ">="],
      ["to", "<"],
    ] as const) {
      const raw = req.query[key];
      if (typeof raw !== "string") continue;
      if (Number.isNaN(Date.parse(raw))) throw badRequest(`${key} must be an ISO-8601 timestamp`);
      params.push(new Date(raw));
      where.push(`placed_at ${op} $${params.length}`);
    }
    res.json(await listOrders(db, where, params, req.query as Record<string, unknown>));
  });

  r.get("/carts/abandoned", async (req, res) => {
    const brand = await getBrandRow(db, req.caller.brand);
    const olderThanHours = Number(req.query.olderThanHours ?? 48);
    if (!Number.isFinite(olderThanHours) || olderThanHours < 0)
      throw badRequest("olderThanHours must be a non-negative number");
    const at = now();
    const cutoff = new Date(at.getTime() - olderThanHours * 3_600_000);
    const { rows } = await db.query<CartRow>(
      `SELECT c.* FROM carts c
        WHERE c.brand = $1 AND c.status = 'open' AND c.updated_at < $2
          AND EXISTS (SELECT 1 FROM cart_lines l WHERE l.cart_id = c.id)
        ORDER BY c.updated_at, c.id`,
      [brand.id, cutoff],
    );
    const out: AbandonedCart[] = [];
    for (const c of rows) {
      out.push({
        cart: cartToApi(c, await getCartLines(db, c.id), brand),
        ageHours: Math.round(((at.getTime() - c.updated_at.getTime()) / 3_600_000) * 10) / 10,
        ...(c.pending_payment_id ? { pendingPaymentId: c.pending_payment_id } : {}),
      });
    }
    res.json(out);
  });

  return r;
}
