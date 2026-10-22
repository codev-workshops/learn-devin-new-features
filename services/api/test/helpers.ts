import request from "supertest";
import { HEADERS, type BrandId, type Role } from "@kade/contracts";
import { createApp } from "../src/app.js";
import { createDb, type Db } from "../src/db.js";

process.env.KADE_NOW ??= "2026-10-22T09:00:00Z";

export const LUMEN: BrandId = "lumen-home";
export const TRAILHEAD: BrandId = "trailhead-supply";
export const LUMEN_CUSTOMER = "customer-001@lumen-home.test";
export const TRAILHEAD_CUSTOMER = "customer-001@trailhead-supply.test";
export const LUMEN_MERCH = "maya@lumenhome.test";
export const TRAILHEAD_MERCH = "lena@trailheadsupply.test";

export function as(brand: BrandId, user: string, role?: Role): Record<string, string> {
  return {
    [HEADERS.brand]: brand,
    [HEADERS.user]: user,
    ...(role ? { [HEADERS.role]: role } : {}),
  };
}

export interface Harness {
  db: Db;
  api: ReturnType<typeof request>;
  close(): Promise<void>;
}

export function harness(): Harness {
  const db = createDb(undefined, 25);
  const app = createApp(db);
  return { db, api: request(app), close: () => db.close() };
}

export const ADDRESS = {
  name: "Test Buyer",
  line1: "1 Test St",
  city: "Newark",
  postalCode: "07102",
  country: "US",
};

export async function cartWith(
  h: Harness,
  brand: BrandId,
  user: string,
  lines: { sku: string; quantity: number }[],
) {
  const created = await h.api.post("/carts").set(as(brand, user)).expect(201);
  for (const line of lines)
    await h.api.post(`/carts/${created.body.id}/lines`).set(as(brand, user)).send(line).expect(200);
  return created.body.id as string;
}
