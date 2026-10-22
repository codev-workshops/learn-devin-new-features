import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { BRAND_IDS, HEADERS, ORDER_STATUSES, WEBHOOK_EVENT_TYPES } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const doc = parse(readFileSync(join(here, "..", "openapi.yaml"), "utf8"));

const REQUIRED_PATHS = [
  "/health",
  "/brands",
  "/catalog/collections",
  "/catalog/collections/{slug}",
  "/catalog/products/{sku}",
  "/carts",
  "/carts/{cartId}",
  "/carts/{cartId}/lines",
  "/checkout",
  "/orders",
  "/orders/{orderId}",
  "/admin/inventory",
  "/admin/price-lists",
  "/admin/orders",
  "/admin/carts/abandoned",
  "/webhooks/payments",
];

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];

function operations() {
  const out: { path: string; method: string; op: Record<string, unknown> }[] = [];
  for (const [path, item] of Object.entries<Record<string, unknown>>(doc.paths)) {
    for (const method of HTTP_METHODS) {
      if (item[method]) out.push({ path, method, op: item[method] as Record<string, unknown> });
    }
  }
  return out;
}

function collectRefs(node: unknown, acc: Set<string>) {
  if (Array.isArray(node)) node.forEach((n) => collectRefs(n, acc));
  else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k === "$ref" && typeof v === "string") acc.add(v);
      else collectRefs(v, acc);
    }
  }
}

describe("openapi.yaml", () => {
  it("is OpenAPI 3.1 with the frozen path set", () => {
    expect(doc.openapi).toBe("3.1.0");
    for (const p of REQUIRED_PATHS) expect(Object.keys(doc.paths), p).toContain(p);
  });

  it("gives every operation a unique operationId, a tag and a success response", () => {
    const ids = new Set<string>();
    for (const { path, method, op } of operations()) {
      const id = op.operationId as string;
      expect(id, `${method} ${path}`).toBeTruthy();
      expect(ids.has(id), `duplicate operationId ${id}`).toBe(false);
      ids.add(id);
      expect((op.tags as string[])?.length, `${method} ${path} tags`).toBeGreaterThan(0);
      const success = Object.keys(op.responses as object).filter((c) => c.startsWith("2"));
      expect(success.length, `${method} ${path} 2xx`).toBeGreaterThan(0);
    }
  });

  it("resolves every $ref", () => {
    const refs = new Set<string>();
    collectRefs(doc, refs);
    for (const ref of refs) {
      expect(ref.startsWith("#/components/"), ref).toBe(true);
      const target = ref
        .slice(2)
        .split("/")
        .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], doc);
      expect(target, `unresolved ${ref}`).toBeDefined();
    }
  });

  it("uses brand-header auth everywhere except health, brands and the webhook", () => {
    const schemes = doc.components.securitySchemes;
    expect(schemes.brandHeader.name).toBe(HEADERS.brand);
    expect(schemes.userHeader.name).toBe(HEADERS.user);
    expect(schemes.roleHeader.name).toBe(HEADERS.role);
    expect(schemes.paygateSignature.name).toBe(HEADERS.paygateSignature);
    expect(doc.security).toEqual([{ brandHeader: [], userHeader: [] }]);
    for (const { path, method, op } of operations()) {
      const sec = (op.security ?? doc.security) as Record<string, unknown>[];
      const names = sec.flatMap((s) => Object.keys(s));
      if (path === "/health" || path === "/brands") expect(sec, path).toEqual([]);
      else if (path === "/webhooks/payments") expect(names, path).toEqual(["paygateSignature"]);
      else expect(names, `${method} ${path}`).toContain("brandHeader");
      if (path.startsWith("/admin/")) expect(names, `${method} ${path}`).toContain("roleHeader");
    }
  });

  it("keeps the enums in sync with the TypeScript constants", () => {
    const s = doc.components.schemas;
    expect(s.BrandId.enum).toEqual([...BRAND_IDS]);
    expect(s.OrderStatus.enum).toEqual([...ORDER_STATUSES]);
    expect(s.PaymentWebhookEvent.properties.type.enum).toEqual([...WEBHOOK_EVENT_TYPES]);
  });

  it("documents the webhook idempotency key and signature header", () => {
    const op = doc.paths["/webhooks/payments"].post;
    const headerNames = op.parameters.map((p: { name: string }) => p.name);
    expect(headerNames).toContain(HEADERS.paygateEventId);
    expect(headerNames).toContain(HEADERS.paygateSignature);
    expect(doc.components.schemas.PaymentWebhookEvent.required).toContain("event_id");
    expect(Object.keys(op.responses)).toContain("401");
  });
});
