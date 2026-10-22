#!/usr/bin/env node
// Contract stub for the scenario tests: an in-memory implementation of the parts of
// packages/contracts/openapi.yaml the injectors touch, WITH the planted defects the
// injectors are meant to expose (read-then-write reservation, event_id ignored, sweeper
// ghost orders, float half-up totals). It plays both services/api and the fulfilment
// worker (webhooks are processed synchronously) so the injectors can be exercised with no
// database, no PayGate and no credentials. It is a test double, not a reference implementation.
//
//   node scenarios/test/contract-stub.mjs [port]     prints the port it listens on
import { createServer } from "node:http";
import { randomUUID, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";
import { parse as parseYaml } from "yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const spec = parseYaml(readFileSync(join(root, "packages/contracts/seed-spec.yaml"), "utf8"));
const SECRET = process.env.PAYGATE_SECRET ?? "harbourline-local-paygate-secret";
const AS_OF = Date.parse(spec.as_of);

const brands = Object.fromEntries(
  Object.entries(spec.brands).map(([id, b]) => [
    id,
    {
      id,
      name: b.name,
      currency: b.currency,
      pricing: b.pricing,
      taxRate: b.tax_rate,
      locale: b.locale,
      warehouses: b.warehouses,
      shippingFlat: Number(b.shipping_flat),
      freeShippingOver: b.free_shipping_over === null ? null : Number(b.free_shipping_over),
      prefix: b.order_number_prefix,
    },
  ]),
);

// SKU table: base SKUs plus expanded variants (`<sku>-<SIZE>-<COL>`), on_hand on the base row.
const products = new Map();
for (const [brand, rows] of Object.entries(spec.skus)) {
  for (const r of rows) {
    const variants = [];
    if (r.variants) {
      const sizes = r.variants.size ?? [null];
      const colours = r.variants.colour ?? [null];
      for (const s of sizes)
        for (const c of colours) variants.push([s, c].filter(Boolean).join("-"));
    }
    products.set(r.sku, { ...r, brand, variants, price: Number(r.price) });
    for (const v of variants)
      products.set(`${r.sku}-${v}`, {
        ...r,
        sku: `${r.sku}-${v}`,
        brand,
        variants: [],
        price: Number(r.price),
        base: r.sku,
      });
  }
}
const stockKey = (sku) => products.get(sku)?.base ?? sku;
const money = (n, currency) => ({ amount: n.toFixed(2), currency });
const nowIso = () => new Date().toISOString();

const carts = new Map();
const orders = new Map();
const events = new Map(); // orderId → OrderEvent[]
let orderSeq = 100400;

function addEvent(orderId, type, extra = {}) {
  const list = events.get(orderId) ?? [];
  list.push({ id: randomUUID(), orderId, type, at: nowIso(), ...extra });
  events.set(orderId, list);
}

// PLANT currency-rounding: JS floats, half-up, tax per line then summed.
function totals(brand, lines) {
  const b = brands[brand];
  const r2 = (x) => Math.round(x * 100) / 100;
  let subtotal = 0;
  let tax = 0;
  for (const l of lines) {
    const lineTotal = r2(Number(l.unitPrice.amount) * l.quantity);
    subtotal = r2(subtotal + lineTotal);
    tax = r2(
      tax +
        (b.pricing === "tax_inclusive"
          ? r2(lineTotal - lineTotal / (1 + b.taxRate))
          : r2(lineTotal * b.taxRate)),
    );
  }
  const shipping =
    b.freeShippingOver !== null && subtotal >= b.freeShippingOver ? 0 : b.shippingFlat;
  const total = r2(b.pricing === "tax_inclusive" ? subtotal + shipping : subtotal + tax + shipping);
  return {
    subtotal: money(subtotal, b.currency),
    tax: money(tax, b.currency),
    shipping: money(shipping, b.currency),
    total: money(total, b.currency),
    currency: b.currency,
    taxIncluded: b.pricing === "tax_inclusive",
  };
}
const cartView = (c) => ({ ...c, totals: totals(c.brand, c.lines) });

// Seed: a few >48 h pending carts with pending_payment orders (seed-spec carts.with_pending_payment).
function seedPendingCarts() {
  const specs = [
    ["lumen-home", "LH-MUG-01", 72],
    ["lumen-home", "LH-CANDLE-01", 96],
    ["trailhead-supply", "TS-MAP-01", 60],
    ["trailhead-supply", "TS-FLTR-01", 120],
  ];
  for (const [brand, sku, ageH] of specs) {
    const createdAt = new Date(AS_OF - ageH * 3600e3).toISOString();
    const user = `customer-0${specs.indexOf(specs.find((s) => s[1] === sku)) + 1}@${brand}.test`;
    const p = products.get(sku);
    const line = {
      id: randomUUID(),
      sku,
      name: p.name,
      quantity: 1,
      unitPrice: money(p.price, brands[brand].currency),
      lineTotal: money(p.price, brands[brand].currency),
    };
    const cart = {
      id: randomUUID(),
      brand,
      user,
      status: "open",
      lines: [line],
      createdAt,
      updatedAt: createdAt,
    };
    carts.set(cart.id, cart);
    const paymentId = `pay_seed_${cart.id.slice(0, 8)}`;
    const order = {
      id: randomUUID(),
      number: `${brands[brand].prefix}-${orderSeq++}`,
      brand,
      user,
      cartId: cart.id,
      status: "pending_payment",
      lines: [{ ...line, warehouse: brands[brand].warehouses[0] }],
      totals: totals(brand, [line]),
      paymentId,
      placedAt: createdAt,
      updatedAt: createdAt,
    };
    orders.set(order.id, order);
    cart.pendingPaymentId = paymentId;
    addEvent(order.id, "reservation_made", { source: "seed" });
  }
}
seedPendingCarts();

const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(body === undefined ? "" : JSON.stringify(body));
};
const err = (res, status, code, message) => json(res, status, { code, message });

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8");
}

// PLANT duplicate-webhook + abandoned-cart-sweeper: the "worker" never looks at event_id and
// builds the paid order from the cart; when the cart is gone the order keeps no lines.
function processWebhook(evt) {
  const order = orders.get(evt.data.order_id);
  if (!order) return;
  if (evt.type !== "payment.succeeded") {
    order.status = "cancelled";
    addEvent(order.id, "payment_failed", { source: "webhook", detail: evt.event_id });
    return;
  }
  const cart = order.cartId ? carts.get(order.cartId) : null;
  const from = order.status;
  if (!cart) {
    order.lines = []; // ghost order
    addEvent(order.id, "note", {
      source: "worker",
      detail: `cart ${order.cartId} not found; order rebuilt with no lines`,
    });
  } else {
    for (const l of order.lines) {
      const p = products.get(stockKey(l.sku));
      p.on_hand -= l.quantity; // PLANT: decremented on every delivery
    }
  }
  order.status = "confirmed";
  order.updatedAt = nowIso();
  addEvent(order.id, "payment_received", { source: "webhook", detail: evt.event_id });
  addEvent(order.id, "status_changed", { from, to: "confirmed", source: "worker" });
  addEvent(order.id, "email_queued", { source: "worker", detail: "order_confirmed" });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;
  const brand = req.headers["x-harbourline-brand"];
  const role = req.headers["x-harbourline-role"] ?? "customer";
  const user = req.headers["x-harbourline-user"];
  const raw = ["POST", "PATCH", "PUT"].includes(req.method) ? await readBody(req) : "";
  const body = raw ? JSON.parse(raw) : {};
  let m;

  if (req.method === "GET" && path === "/health")
    return json(res, 200, { status: "ok", database: "ok", version: "contract-stub" });
  if (req.method === "GET" && path === "/brands") return json(res, 200, Object.values(brands));

  if (req.method === "POST" && path === "/webhooks/payments") {
    const sig = req.headers["x-paygate-signature"];
    const expected = `sha256=${createHmac("sha256", SECRET).update(raw).digest("hex")}`;
    // PLANT unverified-signature: header read, never compared (kept consistent with the API plant list).
    void expected;
    if (!sig || !req.headers["x-paygate-event-id"])
      return err(res, 400, "bad_request", "missing PayGate headers");
    if (!body.event_id || !body.data?.order_id)
      return err(res, 400, "bad_request", "malformed event");
    res.writeHead(202);
    res.end();
    setTimeout(() => processWebhook(body), 5);
    return;
  }

  if (!brand || !brands[brand]) return err(res, 400, "bad_request", "X-Harbourline-Brand required");
  const b = brands[brand];

  if (req.method === "GET" && (m = path.match(/^\/catalog\/products\/([^/]+)$/))) {
    const p = products.get(m[1]);
    if (!p || p.brand !== brand) return err(res, 404, "not_found", "no such product");
    return json(res, 200, {
      sku: p.sku,
      name: p.name,
      brand,
      collection: p.collection,
      price: money(p.price, b.currency),
      preorder: Boolean(p.preorder),
      variants: p.variants.map((v) => ({
        sku: `${p.sku}-${v}`,
        attributes: {},
        onHand: p.on_hand,
      })),
      availability: p.on_hand <= 0 ? "out_of_stock" : p.low_stock ? "low_stock" : "in_stock",
    });
  }

  if (req.method === "POST" && path === "/carts") {
    const cart = {
      id: randomUUID(),
      brand,
      user,
      status: "open",
      lines: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    carts.set(cart.id, cart);
    return json(res, 201, cartView(cart));
  }
  if ((m = path.match(/^\/carts\/([^/]+)$/))) {
    const cart = carts.get(m[1]);
    if (!cart || cart.brand !== brand) return err(res, 404, "not_found", "no such cart");
    if (req.method === "GET") return json(res, 200, cartView(cart));
    if (req.method === "DELETE") {
      carts.delete(cart.id);
      return json(res, 204);
    }
  }
  if (req.method === "POST" && (m = path.match(/^\/carts\/([^/]+)\/lines$/))) {
    const cart = carts.get(m[1]);
    if (!cart || cart.brand !== brand) return err(res, 404, "not_found", "no such cart");
    const p = products.get(body.sku);
    if (!p || p.brand !== brand) return err(res, 409, "conflict", `unknown sku ${body.sku}`);
    const unit = money(p.price, b.currency);
    cart.lines.push({
      id: randomUUID(),
      sku: p.sku,
      name: p.name,
      quantity: body.quantity,
      unitPrice: unit,
      lineTotal: money(p.price * body.quantity, b.currency),
    });
    cart.updatedAt = nowIso();
    return json(res, 200, cartView(cart));
  }

  if (req.method === "POST" && path === "/checkout") {
    const cart = carts.get(body.cartId);
    if (!cart || cart.brand !== brand) return err(res, 422, "validation_failed", "unknown cart");
    if (cart.status !== "open") return err(res, 409, "conflict", "cart already checked out");
    // PLANT oversell: read available, yield, then write — concurrent checkouts all pass the read.
    const snapshot = cart.lines.map((l) => [products.get(stockKey(l.sku)), l.quantity]);
    for (const [p, q] of snapshot)
      if (p.on_hand < q) return err(res, 409, "out_of_stock", `${p.sku} has ${p.on_hand} left`);
    await sleep(15 + Math.random() * 30);
    for (const [p, q] of snapshot) p.on_hand -= q;
    cart.status = "checked_out";
    const order = {
      id: randomUUID(),
      number: `${b.prefix}-${orderSeq++}`,
      brand,
      user,
      cartId: cart.id,
      status: "pending_payment",
      lines: cart.lines.map((l) => ({ ...l, warehouse: b.warehouses[0] })),
      totals: totals(brand, cart.lines),
      paymentId: `pay_${randomUUID().slice(0, 8)}`,
      shippingAddress: body.shippingAddress,
      placedAt: nowIso(),
      updatedAt: nowIso(),
    };
    orders.set(order.id, order);
    cart.pendingPaymentId = order.paymentId;
    addEvent(order.id, "reservation_made", { source: "api" });
    return json(res, 201, {
      order,
      payment: {
        paymentId: order.paymentId,
        provider: "paygate-fake",
        redirectUrl: `http://localhost:3002/checkout/${order.paymentId}`,
        expiresAt: new Date(Date.now() + 1800e3).toISOString(),
      },
    });
  }

  if (req.method === "GET" && (m = path.match(/^\/orders\/([^/]+)\/events$/))) {
    const order = orders.get(m[1]);
    if (!order) return err(res, 404, "not_found", "no such order");
    return json(res, 200, events.get(order.id) ?? []);
  }
  if (req.method === "GET" && (m = path.match(/^\/orders\/([^/]+)$/))) {
    const order = orders.get(m[1]);
    if (!order) return err(res, 404, "not_found", "no such order"); // PLANT cross-brand-leak: brand unchecked
    return json(res, 200, order);
  }

  if (path.startsWith("/admin/")) {
    if (!["merchandiser", "admin"].includes(role))
      return err(res, 403, "forbidden", "role required");
    if (req.method === "GET" && path === "/admin/inventory") {
      const rows = [];
      for (const p of products.values()) {
        if (p.brand !== brand || p.base) continue;
        if (url.searchParams.get("belowSafety") === "true" && p.on_hand > p.safety_stock) continue;
        rows.push({
          sku: p.sku,
          warehouse: b.warehouses[0],
          onHand: p.on_hand,
          reserved: 0,
          available: p.on_hand,
          safetyStock: p.safety_stock,
          updatedAt: nowIso(),
        });
      }
      return json(res, 200, rows);
    }
    if (req.method === "GET" && path === "/admin/orders") {
      const status = url.searchParams.get("status");
      const items = [...orders.values()].filter(
        (o) => o.brand === brand && (!status || o.status === status),
      );
      return json(res, 200, { items: items.slice(0, Number(url.searchParams.get("limit") ?? 50)) });
    }
    if (req.method === "GET" && path === "/admin/carts/abandoned") {
      const olderThan = Number(url.searchParams.get("olderThanHours") ?? 24);
      const out = [];
      for (const c of carts.values()) {
        if (c.brand !== brand || c.status !== "open") continue;
        const ageHours = (AS_OF - Date.parse(c.createdAt)) / 3600e3;
        if (ageHours >= olderThan)
          out.push({
            cart: cartView(c),
            ageHours,
            ...(c.pendingPaymentId ? { pendingPaymentId: c.pendingPaymentId } : {}),
          });
      }
      return json(res, 200, out);
    }
  }
  return err(res, 404, "not_found", `${req.method} ${path} is not part of the stub`);
});

const port = Number(process.argv[2] ?? process.env.PORT ?? 0);
server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`${server.address().port}\n`);
});
