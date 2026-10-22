import type { BrandId, Cart, CartLine } from "@kade/contracts";
import type { Queryable } from "../db.js";
import { notFound } from "../errors.js";
import { computeTotals, money, totalsToApi } from "../money.js";
import { brandPricing, type BrandRow } from "./brands.js";

export interface CartRow {
  id: string;
  brand: BrandId;
  user_email: string;
  status: "open" | "checked_out" | "abandoned";
  pending_payment_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CartLineRow {
  id: string;
  cart_id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: string;
  currency: "USD" | "EUR";
}

export async function getCartRow(db: Queryable, brand: BrandId, cartId: string): Promise<CartRow> {
  const { rows } = await db.query<CartRow>("SELECT * FROM carts WHERE id = $1 AND brand = $2", [
    cartId,
    brand,
  ]);
  if (!rows[0]) throw notFound(`cart ${cartId} not found in ${brand}`);
  return rows[0];
}

export async function getCartLines(db: Queryable, cartId: string): Promise<CartLineRow[]> {
  const { rows } = await db.query<CartLineRow>(
    "SELECT * FROM cart_lines WHERE cart_id = $1 ORDER BY created_at, id",
    [cartId],
  );
  return rows;
}

export function cartToApi(cart: CartRow, lines: CartLineRow[], brand: BrandRow): Cart {
  const pricing = brandPricing(brand);
  const apiLines: CartLine[] = lines.map((l) => ({
    id: l.id,
    sku: l.sku,
    name: l.name,
    quantity: l.quantity,
    unitPrice: money(l.unit_price, pricing.currency),
    lineTotal: money(Number(l.unit_price) * l.quantity, pricing.currency),
  }));
  const totals = computeTotals(
    lines.map((l) => ({ unitPrice: Number(l.unit_price), quantity: l.quantity })),
    pricing,
  );
  return {
    id: cart.id,
    brand: cart.brand,
    user: cart.user_email,
    status: cart.status,
    lines: apiLines,
    totals: totalsToApi(totals),
    createdAt: cart.created_at.toISOString(),
    updatedAt: cart.updated_at.toISOString(),
  };
}

export async function loadCart(db: Queryable, brand: BrandRow, cartId: string): Promise<Cart> {
  const cart = await getCartRow(db, brand.id, cartId);
  return cartToApi(cart, await getCartLines(db, cartId), brand);
}
