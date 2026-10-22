import { BRAND_IDS, type BrandId, type Currency, type OrderStatus } from "@harbourline/contracts";
import { computeTotals, roundHalfUp, totalsToApi, type BrandPricing } from "../money.js";
import { Rng, apportion, uuidFor } from "./random.js";
import type { SeedSpec, SpecSku } from "./spec.js";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const ORDER_NUMBER_START = 100001;
const CUSTOMERS_PER_BRAND = 120;
const STATUS_CHAIN: OrderStatus[] = [
  "pending_payment",
  "paid",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
];

export interface BrandRecord {
  id: BrandId;
  name: string;
  currency: Currency;
  pricing: "tax_exclusive" | "tax_inclusive";
  tax_rate: number;
  locale: string;
  warehouses: string[];
  free_shipping_over: string | null;
  shipping_flat: string;
  order_number_prefix: string;
}
export interface CollectionRecord {
  brand: BrandId;
  slug: string;
  name: string;
  description: string | null;
  promotion: string | null;
  position: number;
}
export interface UserRecord {
  email: string;
  brand: BrandId | null;
  role: "customer" | "merchandiser" | "admin";
  name: string;
}
export interface ProductRecord {
  sku: string;
  brand: BrandId;
  name: string;
  description: string | null;
  collection: string;
  preorder: boolean;
  ships_on: string | null;
  bundle: string[] | null;
  safety_stock: number;
  low_stock: boolean;
  position: number;
}
export interface VariantRecord {
  sku: string;
  product_sku: string;
  attributes: Record<string, string>;
  position: number;
}
export interface InventoryRecord {
  sku: string;
  warehouse: string;
  brand: BrandId;
  product_sku: string;
  on_hand: number;
  reserved: number;
  safety_stock: number;
  updated_at: Date;
}
export interface PriceListRecord {
  id: string;
  brand: BrandId;
  name: string;
  currency: Currency;
  active_from: Date | null;
  active_to: Date | null;
}
export interface PriceEntryRecord {
  price_list_id: string;
  sku: string;
  price: string;
  compare_at_price: string | null;
}
export interface CartRecord {
  id: string;
  brand: BrandId;
  user_email: string;
  status: "open";
  pending_payment_id: string | null;
  created_at: Date;
  updated_at: Date;
}
export interface CartLineRecord {
  id: string;
  cart_id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: string;
  currency: Currency;
  created_at: Date;
}
export interface OrderRecord {
  id: string;
  number: string;
  brand: BrandId;
  user_email: string;
  cart_id: string | null;
  status: OrderStatus;
  subtotal: string;
  discount: string;
  tax: string;
  shipping: string;
  total: string;
  currency: Currency;
  tax_included: boolean;
  totals: unknown;
  payment_id: string;
  idempotency_key: string;
  shipping_address: Record<string, string>;
  placed_at: Date;
  updated_at: Date;
}
export interface OrderLineRecord {
  order_id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  warehouse: string;
  position: number;
}
export interface OrderEventRecord {
  id: string;
  order_id: string;
  type: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus | null;
  source: "api" | "worker" | "webhook" | "admin" | "seed";
  detail: string | null;
  at: Date;
}
export interface OutboxRecord {
  id: string;
  topic: string;
  payload: unknown;
  order_id: string | null;
  created_at: Date;
  processed_at: Date | null;
  attempts: number;
}
export interface InboxRecord {
  id: string;
  event_id: string;
  type: string;
  occurred_at: Date;
  attempt: number;
  signature: string | null;
  payload: unknown;
  received_at: Date;
  processed_at: Date | null;
}

export interface Dataset {
  asOf: Date;
  brands: BrandRecord[];
  collections: CollectionRecord[];
  users: UserRecord[];
  products: ProductRecord[];
  variants: VariantRecord[];
  inventory: InventoryRecord[];
  priceLists: PriceListRecord[];
  priceEntries: PriceEntryRecord[];
  carts: CartRecord[];
  cartLines: CartLineRecord[];
  orders: OrderRecord[];
  orderLines: OrderLineRecord[];
  orderEvents: OrderEventRecord[];
  outbox: OutboxRecord[];
  inbox: InboxRecord[];
  nextOrderNumber: number;
}

interface Sellable {
  sku: string;
  product: SpecSku;
  brand: BrandId;
  name: string;
}

const money = (n: number) => roundHalfUp(n).toFixed(2);

/** Expands `{size:[S,M], colour:[BLK]}` into ordered attribute combinations. */
function combinations(variants: Record<string, string[]>): Record<string, string>[] {
  return Object.entries(variants).reduce<Record<string, string>[]>(
    (acc, [key, values]) => acc.flatMap((row) => values.map((v) => ({ ...row, [key]: v }))),
    [{}],
  );
}

function splitEvenly(total: number, parts: number): number[] {
  const base = Math.floor(total / parts);
  return Array.from({ length: parts }, (_, i) => base + (i < total - base * parts ? 1 : 0));
}

export function generateDataset(spec: SeedSpec): Dataset {
  const rng = new Rng(spec.seed);
  const asOf = new Date(spec.as_of);
  const ds: Dataset = {
    asOf,
    brands: [],
    collections: [],
    users: [],
    products: [],
    variants: [],
    inventory: [],
    priceLists: [],
    priceEntries: [],
    carts: [],
    cartLines: [],
    orders: [],
    orderLines: [],
    orderEvents: [],
    outbox: [],
    inbox: [],
    nextOrderNumber: ORDER_NUMBER_START,
  };
  const pricingOf: Record<string, BrandPricing> = {};
  const sellables: Record<BrandId, Sellable[]> = { "lumen-home": [], "trailhead-supply": [] };
  const basePrice = new Map<string, number>();
  const promoPrice = new Map<string, { price: number; from: Date; to: Date }>();
  const customers: Record<BrandId, string[]> = { "lumen-home": [], "trailhead-supply": [] };

  for (const brandId of BRAND_IDS) {
    const b = spec.brands[brandId];
    ds.brands.push({
      id: brandId,
      name: b.name,
      currency: b.currency,
      pricing: b.pricing,
      tax_rate: b.tax_rate,
      locale: b.locale,
      warehouses: b.warehouses,
      free_shipping_over: b.free_shipping_over,
      shipping_flat: b.shipping_flat,
      order_number_prefix: b.order_number_prefix,
    });
    pricingOf[brandId] = {
      currency: b.currency,
      pricing: b.pricing,
      taxRate: b.tax_rate,
      freeShippingOver: b.free_shipping_over === null ? null : Number(b.free_shipping_over),
      shippingFlat: Number(b.shipping_flat),
    };
    b.collections.forEach((c, i) =>
      ds.collections.push({
        brand: brandId,
        slug: c.slug,
        name: c.name,
        description: c.description ?? null,
        promotion: c.promotion ?? null,
        position: i,
      }),
    );
    for (let i = 1; i <= CUSTOMERS_PER_BRAND; i += 1) {
      const email = `customer-${String(i).padStart(3, "0")}@${brandId}.test`;
      customers[brandId].push(email);
      ds.users.push({
        email,
        brand: brandId,
        role: "customer",
        name: `Customer ${String(i).padStart(3, "0")}`,
      });
    }

    spec.skus[brandId].forEach((s, position) => {
      ds.products.push({
        sku: s.sku,
        brand: brandId,
        name: s.name,
        description: s.note ?? null,
        collection: s.collection,
        preorder: s.preorder ?? false,
        ships_on: s.ships ?? null,
        bundle: s.bundle ?? null,
        safety_stock: s.safety_stock,
        low_stock: s.low_stock ?? false,
        position,
      });
      basePrice.set(s.sku, Number(s.price));
      if (s.bundle) return; // bundle stock derives from its components
      const variantSkus: { sku: string; attributes: Record<string, string> }[] = s.variants
        ? combinations(s.variants).map((attributes) => ({
            sku: `${s.sku}-${Object.values(attributes).join("-")}`,
            attributes,
          }))
        : [{ sku: s.sku, attributes: {} }];
      if (s.variants) {
        variantSkus.forEach((v, i) =>
          ds.variants.push({
            sku: v.sku,
            product_sku: s.sku,
            attributes: v.attributes,
            position: i,
          }),
        );
      }
      const perVariant = splitEvenly(s.on_hand, variantSkus.length);
      variantSkus.forEach((v, vi) => {
        sellables[brandId].push({
          sku: v.sku,
          product: s,
          brand: brandId,
          name: s.variants ? `${s.name} (${Object.values(v.attributes).join("/")})` : s.name,
        });
        const perWarehouse = splitEvenly(perVariant[vi]!, b.warehouses.length);
        b.warehouses.forEach((warehouse, wi) =>
          ds.inventory.push({
            sku: v.sku,
            warehouse,
            brand: brandId,
            product_sku: s.sku,
            on_hand: perWarehouse[wi]!,
            reserved: 0,
            safety_stock: Math.ceil(s.safety_stock / variantSkus.length / b.warehouses.length),
            updated_at: new Date(asOf.getTime() - 30 * DAY),
          }),
        );
      });
    });
  }

  for (const u of [...spec.users.merchandisers, ...spec.users.admins])
    ds.users.push({ email: u.email, brand: u.brand, role: u.role, name: u.name });

  for (const pl of spec.price_lists) {
    const brand = spec.brands[pl.brand];
    const from = pl.active_from ? new Date(pl.active_from) : null;
    const to = pl.active_to ? new Date(pl.active_to) : null;
    ds.priceLists.push({
      id: pl.id,
      brand: pl.brand,
      name: pl.name,
      currency: brand.currency,
      active_from: from,
      active_to: to,
    });
    const promoCollection = brand.collections.find((c) => c.promotion === pl.id)?.slug;
    for (const s of spec.skus[pl.brand]) {
      if (!promoCollection) {
        ds.priceEntries.push({
          price_list_id: pl.id,
          sku: s.sku,
          price: money(Number(s.price)),
          compare_at_price: null,
        });
      } else if (s.collection === promoCollection) {
        const price = roundHalfUp(Number(s.price) * 0.8);
        ds.priceEntries.push({
          price_list_id: pl.id,
          sku: s.sku,
          price: money(price),
          compare_at_price: money(Number(s.price)),
        });
        promoPrice.set(s.sku, { price, from: from!, to: to! });
      }
    }
  }

  const priceAt = (productSku: string, at: Date): number => {
    const promo = promoPrice.get(productSku);
    if (promo && at >= promo.from && at < promo.to) return promo.price;
    return basePrice.get(productSku)!;
  };
  const inventoryFor = (sku: string) => ds.inventory.filter((i) => i.sku === sku);

  // ---- orders --------------------------------------------------------------------------------
  const statusCounts: Record<BrandId, Record<OrderStatus, number>> = {} as never;
  // 7 pending_payment orders in total: 6 with a fresh payment.succeeded waiting plus one Trailhead pre-order whose payment failed.
  const pendingPerBrand: Record<BrandId, number> = { "lumen-home": 3, "trailhead-supply": 4 };
  for (const brandId of BRAND_IDS) {
    const total = spec.orders.split[brandId];
    const mix = { ...spec.orders.status_mix } as Record<OrderStatus, number>;
    delete (mix as Partial<Record<OrderStatus, number>>).pending_payment;
    const counts = apportion(total - pendingPerBrand[brandId], mix);
    statusCounts[brandId] = {
      ...counts,
      pending_payment: pendingPerBrand[brandId],
      cancelled: 0,
    } as Record<OrderStatus, number>;
  }

  interface Draft {
    brand: BrandId;
    status: OrderStatus;
    placedAt: Date;
    forcePreorder: boolean;
  }
  const drafts: Draft[] = [];
  for (const brandId of BRAND_IDS) {
    const counts = statusCounts[brandId];
    for (const status of Object.keys(counts) as OrderStatus[]) {
      for (let i = 0; i < counts[status]; i += 1) {
        const ageDays =
          status === "pending_payment"
            ? rng.next() * 0.5
            : status === "paid" || status === "confirmed"
              ? rng.next() * 2
              : status === "packed"
                ? 1 + rng.next() * 3
                : status === "shipped"
                  ? 2 + rng.next() * 6
                  : 7 + rng.next() * 173;
        drafts.push({
          brand: brandId,
          status,
          placedAt: new Date(asOf.getTime() - ageDays * DAY),
          forcePreorder: false,
        });
      }
    }
  }
  const trailheadPending = drafts.filter(
    (d) => d.brand === "trailhead-supply" && d.status === "pending_payment",
  );
  trailheadPending[trailheadPending.length - 1]!.forcePreorder = true;
  drafts.sort(
    (a, b) => a.placedAt.getTime() - b.placedAt.getTime() || a.brand.localeCompare(b.brand),
  );

  const cheapestCollections: Record<BrandId, string[]> = {
    "lumen-home": [],
    "trailhead-supply": [],
  };
  for (const brandId of BRAND_IDS) {
    cheapestCollections[brandId] = [...spec.brands[brandId].collections]
      .map((c) => ({
        slug: c.slug,
        avg: spec.skus[brandId]
          .filter((s) => s.collection === c.slug)
          .reduce((a, s, _, arr) => a + Number(s.price) / arr.length, 0),
      }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 2)
      .map((c) => c.slug);
  }

  const addresses: Record<BrandId, Record<string, string>> = {
    "lumen-home": {
      name: "Seed Customer",
      line1: "1 Fixture Way",
      city: "Newark",
      postalCode: "07102",
      country: "US",
    },
    "trailhead-supply": {
      name: "Seed Customer",
      line1: "Fixturestraße 1",
      city: "Hamburg",
      postalCode: "20095",
      country: "DE",
    },
  };
  const paymentEventIds = new Map<string, string>();

  drafts.forEach((d, index) => {
    const seq = ORDER_NUMBER_START + index;
    const key = `order:${seq}`;
    const id = uuidFor(key);
    const brand = spec.brands[d.brand];
    const prefix = brand.order_number_prefix;
    const pool = sellables[d.brand].filter((s) => {
      if (d.forcePreorder) return s.product.preorder === true;
      if (s.product.preorder) return false;
      if (
        s.product.low_stock &&
        STATUS_CHAIN.indexOf(d.status) < STATUS_CHAIN.indexOf("shipped") &&
        d.status !== "refunded" &&
        d.status !== "chargeback"
      )
        return false;
      return true;
    });
    const lineCount = d.forcePreorder ? 1 : rng.int(1, 4);
    const chosen: Sellable[] = [];
    while (chosen.length < lineCount) {
      const s = rng.weighted(pool, (x) =>
        cheapestCollections[d.brand].includes(x.product.collection) ? 3 : 1,
      );
      if (!chosen.some((c) => c.sku === s.sku)) chosen.push(s);
    }
    const lines = chosen.map((s, position) => {
      const quantity = rng.int(1, s.product.price > "100" ? 1 : 3);
      const unitPrice = priceAt(s.product.sku, d.placedAt);
      const warehouse = rng.pick(brand.warehouses);
      return { s, position, quantity, unitPrice, warehouse };
    });
    const totals = computeTotals(
      lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
      pricingOf[d.brand]!,
    );
    const paymentId = `pay_${uuidFor(`${key}:payment`).replace(/-/g, "").slice(0, 20)}`;
    const customer = customers[d.brand][index % CUSTOMERS_PER_BRAND]!;
    const steps =
      d.status === "refunded" || d.status === "chargeback"
        ? [...STATUS_CHAIN, d.status]
        : STATUS_CHAIN.slice(0, STATUS_CHAIN.indexOf(d.status) + 1);
    const stepGap = ((asOf.getTime() - d.placedAt.getTime()) / Math.max(steps.length, 2)) * 0.6;
    let at = d.placedAt;
    const updatedAt = new Date(d.placedAt.getTime() + stepGap * (steps.length - 1));
    ds.orders.push({
      id,
      number: `${prefix}-${seq}`,
      brand: d.brand,
      user_email: customer,
      cart_id: uuidFor(`${key}:cart`),
      status: d.status,
      subtotal: money(totals.subtotal),
      discount: money(totals.discount),
      tax: money(totals.tax),
      shipping: money(totals.shipping),
      total: money(totals.total),
      currency: brand.currency,
      tax_included: totals.taxIncluded,
      totals: totalsToApi(totals),
      payment_id: paymentId,
      idempotency_key: `seed-${seq}`,
      shipping_address: addresses[d.brand],
      placed_at: d.placedAt,
      updated_at: updatedAt,
    });
    lines.forEach((l) =>
      ds.orderLines.push({
        order_id: id,
        sku: l.s.sku,
        name: l.s.name,
        quantity: l.quantity,
        unit_price: money(l.unitPrice),
        line_total: money(l.unitPrice * l.quantity),
        warehouse: l.warehouse,
        position: l.position,
      }),
    );
    const event = (type: OrderEventRecord["type"], extra: Partial<OrderEventRecord>, when: Date) =>
      ds.orderEvents.push({
        id: uuidFor(`${key}:event:${ds.orderEvents.length}`),
        order_id: id,
        type,
        from_status: null,
        to_status: null,
        source: "seed",
        detail: null,
        ...extra,
        at: when,
      });

    event(
      "status_changed",
      { to_status: "pending_payment", source: "api", detail: "checkout" },
      at,
    );
    event(
      "reservation_made",
      {
        source: "api",
        detail: lines.map((l) => `${l.s.sku}@${l.warehouse}x${l.quantity}`).join(", "),
      },
      at,
    );
    if (
      STATUS_CHAIN.indexOf(d.status) < STATUS_CHAIN.indexOf("shipped") &&
      d.status !== "refunded" &&
      d.status !== "chargeback"
    ) {
      for (const l of lines) {
        const inv = [...inventoryFor(l.s.sku)].sort(
          (a, b) => b.on_hand - b.reserved - (a.on_hand - a.reserved),
        )[0];
        if (inv) inv.reserved += Math.min(l.quantity, Math.max(inv.on_hand - inv.reserved, 0));
      }
    }
    const paymentEventId = `evt_${uuidFor(`${key}:payment-event`).replace(/-/g, "").slice(0, 24)}`;
    paymentEventIds.set(id, paymentEventId);
    if (d.status === "pending_payment") {
      event(
        "payment_failed",
        {
          source: "webhook",
          detail: d.forcePreorder
            ? "card declined: pre-order deposit"
            : "3DS challenge abandoned; customer retried",
        },
        new Date(at.getTime() + 5 * 60_000),
      );
    } else {
      const paidAt = new Date(at.getTime() + stepGap);
      event("payment_received", { source: "webhook", detail: paymentEventId }, paidAt);
      ds.inbox.push({
        id: uuidFor(`${key}:inbox:payment`),
        event_id: paymentEventId,
        type: "payment.succeeded",
        occurred_at: paidAt,
        attempt: 1,
        signature: null,
        payload: webhookPayload(
          paymentEventId,
          "payment.succeeded",
          paidAt,
          paymentId,
          id,
          totals.total,
          brand.currency,
        ),
        received_at: paidAt,
        processed_at: new Date(paidAt.getTime() + 2_000),
      });
    }
    for (let i = 1; i < steps.length; i += 1) {
      at = new Date(d.placedAt.getTime() + stepGap * i);
      event(
        "status_changed",
        {
          from_status: steps[i - 1]!,
          to_status: steps[i]!,
          source: steps[i] === "paid" ? "webhook" : "worker",
        },
        at,
      );
      if (steps[i] === "refunded" || steps[i] === "chargeback") {
        const type = steps[i] === "refunded" ? "payment.refunded" : "chargeback.opened";
        const evtId = `evt_${uuidFor(`${key}:${type}`).replace(/-/g, "").slice(0, 24)}`;
        ds.inbox.push({
          id: uuidFor(`${key}:inbox:${type}`),
          event_id: evtId,
          type,
          occurred_at: at,
          attempt: 1,
          signature: null,
          payload: webhookPayload(
            evtId,
            type,
            at,
            paymentId,
            id,
            totals.total,
            brand.currency,
            steps[i] === "refunded" ? "customer_request" : "fraudulent",
          ),
          received_at: at,
          processed_at: new Date(at.getTime() + 2_000),
        });
      }
    }
    const emailAt = new Date(d.placedAt.getTime() + 60_000);
    event("email_queued", { source: "worker", detail: "order_confirmation" }, emailAt);
    ds.outbox.push({
      id: uuidFor(`${key}:outbox:email`),
      topic: "email.order_confirmation",
      order_id: id,
      payload: { orderId: id, number: `${prefix}-${seq}`, to: customer, brand: d.brand },
      created_at: emailAt,
      processed_at: d.status === "pending_payment" ? null : new Date(emailAt.getTime() + 30_000),
      attempts: d.status === "pending_payment" ? 0 : 1,
    });
  });
  ds.nextOrderNumber = ORDER_NUMBER_START + drafts.length;

  // ---- carts ---------------------------------------------------------------------------------
  const pendingCarts: { cart: CartRecord; total: number; lines: CartLineRecord[] }[] = [];
  for (const brandId of BRAND_IDS) {
    const n = spec.carts.split[brandId];
    const brand = spec.brands[brandId];
    const pool = sellables[brandId].filter((s) => !s.product.preorder);
    for (let i = 0; i < n; i += 1) {
      const ageHours = Math.exp((Math.log(9 * 24) * i) / (n - 1)); // 1 h … 9 d on a log scale
      const updatedAt = new Date(asOf.getTime() - ageHours * HOUR);
      const createdAt = new Date(updatedAt.getTime() - rng.int(5, 40) * 60_000);
      const key = `cart:${brandId}:${i}`;
      const id = uuidFor(key);
      const lineCount = rng.int(1, 3);
      const chosen: Sellable[] = [];
      if (brandId === "lumen-home" && i === n - 3)
        chosen.push(sellables[brandId].find((s) => s.sku === "LH-LAMP-01")!); // pre-promo price captured (price-drift)
      while (chosen.length < lineCount) {
        const s = rng.pick(pool);
        if (!chosen.some((c) => c.sku === s.sku)) chosen.push(s);
      }
      const lines = chosen.map((s, li) => ({
        id: uuidFor(`${key}:line:${li}`),
        cart_id: id,
        sku: s.sku,
        name: s.name,
        quantity: rng.int(1, 2),
        unit_price: money(priceAt(s.product.sku, createdAt)),
        currency: brand.currency,
        created_at: createdAt,
      }));
      const cart: CartRecord = {
        id,
        brand: brandId,
        user_email: customers[brandId][(i * 7) % CUSTOMERS_PER_BRAND]!,
        status: "open",
        pending_payment_id: null,
        created_at: createdAt,
        updated_at: updatedAt,
      };
      ds.carts.push(cart);
      ds.cartLines.push(...lines);
      const totals = computeTotals(
        lines.map((l) => ({ unitPrice: Number(l.unit_price), quantity: l.quantity })),
        pricingOf[brandId]!,
      );
      pendingCarts.push({ cart, total: totals.total, lines });
    }
  }
  // 6 carts opened a PayGate session that never resolved; 4 of them are older than 48 h.
  const older = pendingCarts.filter(
    (c) => c.cart.updated_at.getTime() < asOf.getTime() - 48 * HOUR,
  );
  const younger = pendingCarts.filter(
    (c) => c.cart.updated_at.getTime() >= asOf.getTime() - 48 * HOUR,
  );
  const withPending = BRAND_IDS.flatMap((b) => [
    ...older.filter((c) => c.cart.brand === b).slice(-2),
    ...younger.filter((c) => c.cart.brand === b).slice(-1),
  ]);
  withPending.forEach((c) => {
    c.cart.pending_payment_id = `pay_${uuidFor(`${c.cart.id}:payment`).replace(/-/g, "").slice(0, 20)}`;
  });

  // ---- pending webhook inbox (12 rows) -------------------------------------------------------
  const pendingOrders = ds.orders.filter((o) => o.status === "pending_payment");
  const preorderPending = pendingOrders.find((o) =>
    ds.orderLines.some(
      (l) =>
        l.order_id === o.id &&
        spec.skus["trailhead-supply"].some((s) => s.preorder && l.sku.startsWith(s.sku)),
    ),
  )!;
  let n = 0;
  for (const o of pendingOrders) {
    const failed = o.id === preorderPending.id;
    const type = failed ? "payment.failed" : "payment.succeeded";
    const evtId = `evt_${uuidFor(`${o.id}:pending-webhook`).replace(/-/g, "").slice(0, 24)}`;
    const at = new Date(asOf.getTime() - rng.int(2, 30) * 60_000);
    ds.inbox.push({
      id: uuidFor(`inbox:pending:${n++}`),
      event_id: evtId,
      type,
      occurred_at: at,
      attempt: 1,
      signature: null,
      payload: webhookPayload(
        evtId,
        type,
        at,
        o.payment_id,
        o.id,
        Number(o.total),
        o.currency,
        failed ? "card_declined" : undefined,
      ),
      received_at: at,
      processed_at: null,
    });
  }
  const delivered = ds.orders.filter((o) => o.status === "delivered").slice(-3);
  for (const o of delivered) {
    const original = ds.inbox.find((r) => r.event_id === paymentEventIds.get(o.id))!;
    const at = new Date(asOf.getTime() - rng.int(31, 90) * 60_000);
    ds.inbox.push({
      ...original,
      id: uuidFor(`inbox:duplicate:${o.id}`),
      attempt: 2,
      received_at: at,
      processed_at: null,
    });
  }
  for (const c of withPending.filter((c) => older.includes(c)).slice(0, 2)) {
    const evtId = `evt_${uuidFor(`${c.cart.id}:late-webhook`).replace(/-/g, "").slice(0, 24)}`;
    const at = new Date(asOf.getTime() - rng.int(91, 150) * 60_000);
    const brand = spec.brands[c.cart.brand];
    ds.inbox.push({
      id: uuidFor(`inbox:late:${c.cart.id}`),
      event_id: evtId,
      type: "payment.succeeded",
      occurred_at: at,
      attempt: 1,
      signature: null,
      payload: webhookPayload(
        evtId,
        "payment.succeeded",
        at,
        c.cart.pending_payment_id!,
        uuidFor(`${c.cart.id}:ghost-order`),
        c.total,
        brand.currency,
        undefined,
        c.cart.id,
      ),
      received_at: at,
      processed_at: null,
    });
  }
  return ds;
}

function webhookPayload(
  eventId: string,
  type: string,
  at: Date,
  paymentId: string,
  orderId: string,
  amount: number,
  currency: Currency,
  reason?: string,
  cartId?: string,
) {
  return {
    event_id: eventId,
    type,
    occurred_at: at.toISOString(),
    attempt: 1,
    data: {
      payment_id: paymentId,
      order_id: orderId,
      ...(cartId ? { cart_id: cartId } : {}),
      amount: money(amount),
      currency,
      ...(reason ? { reason } : {}),
    },
  };
}
