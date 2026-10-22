import { Router } from "express";
import type { Db } from "../db.js";
import { config } from "../config.js";
import { brandToApi, listBrandRows } from "../services/brands.js";

export function systemRouter(db: Db): Router {
  const r = Router();
  r.get("/health", async (_req, res) => {
    let database: "ok" | "unavailable" = "ok";
    try {
      await db.query("SELECT 1");
    } catch {
      database = "unavailable";
    }
    res.json({ status: "ok", database, version: config.version });
  });
  r.get("/brands", async (_req, res) => {
    res.json((await listBrandRows(db)).map(brandToApi));
  });
  return r;
}
