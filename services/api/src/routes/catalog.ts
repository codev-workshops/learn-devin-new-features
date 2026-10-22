import { Router } from "express";
import type { Collection } from "@harbourline/contracts";
import type { Db } from "../db.js";
import { notFound } from "../errors.js";
import { requireCaller } from "../middleware/auth.js";
import { getBrandRow } from "../services/brands.js";
import { buildProduct, getProductRow, type ProductRow } from "../services/catalog.js";

interface CollectionRow {
  slug: string;
  name: string;
  description: string | null;
  promotion: string | null;
  product_count: number;
}

function collectionToApi(c: CollectionRow): Collection {
  return {
    slug: c.slug,
    name: c.name,
    ...(c.description ? { description: c.description } : {}),
    ...(c.promotion ? { promotion: c.promotion } : {}),
    productCount: c.product_count,
  };
}

export function catalogRouter(db: Db): Router {
  const r = Router();
  r.use(requireCaller);

  r.get("/collections", async (req, res) => {
    const { rows } = await db.query<CollectionRow>(
      `SELECT c.slug, c.name, c.description, c.promotion,
              (SELECT COUNT(*) FROM products p WHERE p.brand = c.brand AND p.collection = c.slug)::int AS product_count
         FROM collections c WHERE c.brand = $1 ORDER BY c.position`,
      [req.caller.brand],
    );
    res.json(rows.map(collectionToApi));
  });

  r.get("/collections/:slug", async (req, res) => {
    const brand = await getBrandRow(db, req.caller.brand);
    const { rows } = await db.query<CollectionRow>(
      `SELECT c.slug, c.name, c.description, c.promotion,
              (SELECT COUNT(*) FROM products p WHERE p.brand = c.brand AND p.collection = c.slug)::int AS product_count
         FROM collections c WHERE c.brand = $1 AND c.slug = $2`,
      [brand.id, req.params.slug],
    );
    const collection = rows[0];
    if (!collection) throw notFound(`collection ${req.params.slug} not found in ${brand.id}`);
    const products = await db.query<ProductRow>(
      "SELECT sku, brand, name, description, collection, preorder, bundle, safety_stock, low_stock FROM products WHERE brand = $1 AND collection = $2 ORDER BY position",
      [brand.id, collection.slug],
    );
    // One product at a time, each with its own price/variant/stock round-trips (PLANTED.md `n-plus-one`).
    const page = [];
    for (const p of products.rows) page.push(await buildProduct(db, p, brand.currency));
    res.json({ ...collectionToApi(collection), products: page });
  });

  r.get("/products/:sku", async (req, res) => {
    const brand = await getBrandRow(db, req.caller.brand);
    const row = await getProductRow(db, brand.id, req.params.sku);
    if (!row) throw notFound(`product ${req.params.sku} not found in ${brand.id}`);
    res.json(await buildProduct(db, row, brand.currency));
  });

  return r;
}
