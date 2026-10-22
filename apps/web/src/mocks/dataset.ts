/**
 * Deterministic in-memory dataset derived from packages/contracts/seed-spec.yaml
 * (via src/mocks/generated/seed.json). Mirrors what db/seed produces so the storefront
 * and the admin console behave the same against the mocks and against services/api.
 */
import type {
  Brand,
  BrandId,
  Cart,
  CartLine,
  Collection,
  Currency,
  InventoryRow,
  Order,
  OrderEvent,
  OrderLine,
  OrderStatus,
  PriceList,
  Product,
  SeedSku,
  Totals,
  Variant,
} from "@kade/contracts";
import { BRAND_IDS } from "@kade/contracts";
import seedJson from "./generated/seed.json";
import { fromCents, roundHalfUp, toCents } from "../lib/money";

type SeedBrand = (typeof seedJson.brands)["lumen-home"] & {
  free_shipping_over: string | null;
  collections: { slug: string; name: string; promotion?: string; description?: string }[];
};
type SeedPriceList = {
  id: string;
  brand: BrandId;
  name: string;
  active_from?: string;
  active_to?: string;
  rule?: string;
};

export const SEED = seedJson;
export const AS_OF = new Date(seedJson.asOf);
export const HOUR = 3_600_000;

/** mulberry32 — small, deterministic PRNG. */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    uuid(): string {
      const hex = () => Math.floor(next() * 16).toString(16);
      const seg = (n: number) => Array.from({ length: n }, hex).join("");
      return `${seg(8)}-${seg(4)}-4${seg(3)}-a${seg(3)}-${seg(12)}`;
    },
  };
}

export interface MockProduct extends Product {
  basePrice: Product["price"];
  safetyStock: number;
}

export interface MockOrder extends Order {
  events: OrderEvent[];
}

export interface MockCart extends Cart {
  pendingPaymentId?: string;
}

export interface Dataset {
  brands: Brand[];
  seedBrands: Record<BrandId, SeedBrand>;
  collections: Record<BrandId, Collection[]>;
  products: MockProduct[];
  priceLists: PriceList[];
  inventory: InventoryRow[];
  orders: MockOrder[];
  carts: MockCart[];
  nextOrderNumber: Record<BrandId, number>;
}

export function brandOf(sku: string): BrandId {
  return sku.startsWith("TS-") ? "trailhead-supply" : "lumen-home";
}

export function brandFromSeed(id: BrandId, b: SeedBrand): Brand {
  return {
    id,
    name: b.name,
    currency: b.currency as Currency,
    pricing: b.pricing as Brand["pricing"],
    taxRate: b.tax_rate,
    locale: b.locale,
    warehouses: b.warehouses,
    ...(b.free_shipping_over
      ? { freeShippingOver: { amount: b.free_shipping_over, currency: b.currency as Currency } }
      : {}),
  };
}

function expandVariants(sku: SeedSku, warehouses: string[]): Variant[] {
  if (!sku.variants) return [];
  const axes = Object.entries(sku.variants);
  let combos: Record<string, string>[] = [{}];
  for (const [axis, values] of axes) {
    combos = combos.flatMap((c) => values.map((v) => ({ ...c, [axis]: v })));
  }
  const share = Math.floor(sku.on_hand / combos.length);
  let remainder = sku.on_hand - share * combos.length;
  return combos.map((attributes) => {
    const onHand = share + (remainder-- > 0 ? 1 : 0);
    const suffix = Object.values(attributes).join("-");
    void warehouses;
    return { sku: `${sku.sku}-${suffix}`, attributes, onHand };
  });
}

export function availabilityFor(
  onHand: number,
  safetyStock: number,
  preorder?: boolean,
): Product["availability"] {
  if (preorder) return "preorder";
  if (onHand <= 0) return "out_of_stock";
  if (onHand <= safetyStock) return "low_stock";
  return "in_stock";
}

function promotionActive(list: SeedPriceList, at: Date): boolean {
  if (list.active_from && new Date(list.active_from) > at) return false;
  if (list.active_to && new Date(list.active_to) <= at) return false;
  return true;
}

export function lineTotals(brand: Brand, lines: { lineTotal: { amount: string } }[]): Totals {
  const currency = brand.currency;
  const subtotal = lines.reduce((sum, l) => sum + toCents(l.lineTotal.amount), 0);
  const seed = SEED.brands[brand.id] as SeedBrand;
  const flat = toCents(seed.shipping_flat);
  let shipping = lines.length === 0 ? 0 : flat;
  if (brand.freeShippingOver && subtotal >= toCents(brand.freeShippingOver.amount)) shipping = 0;
  const rate = brand.taxRate ?? 0;
  if (brand.pricing === "tax_inclusive") {
    const tax = roundHalfUp(subtotal - subtotal / (1 + rate));
    return {
      subtotal: { amount: fromCents(subtotal), currency },
      tax: { amount: fromCents(tax), currency },
      shipping: { amount: fromCents(shipping), currency },
      total: { amount: fromCents(subtotal + shipping), currency },
      currency,
      taxIncluded: true,
    };
  }
  const tax = roundHalfUp(subtotal * rate);
  return {
    subtotal: { amount: fromCents(subtotal), currency },
    tax: { amount: fromCents(tax), currency },
    shipping: { amount: fromCents(shipping), currency },
    total: { amount: fromCents(subtotal + tax + shipping), currency },
    currency,
    taxIncluded: false,
  };
}

export function buildDataset(now: Date = AS_OF): Dataset {
  const random = rng(SEED.seed);
  const seedBrands = SEED.brands as unknown as Record<BrandId, SeedBrand>;
  const brands = BRAND_IDS.map((id) => brandFromSeed(id, seedBrands[id]));
  const products: MockProduct[] = [];
  const inventory: InventoryRow[] = [];
  const priceLists: PriceList[] = [];
  const collections = {} as Record<BrandId, Collection[]>;

  for (const brand of brands) {
    const seed = seedBrands[brand.id];
    const skus = (SEED.skus as Record<BrandId, SeedSku[]>)[brand.id];
    const promo = (SEED.priceLists as SeedPriceList[]).find(
      (p) => p.brand === brand.id && p.id !== `${brand.id}-base`,
    );
    const promoCollection = seed.collections.find((c) => c.promotion === promo?.id)?.slug;
    const promoOn = promo ? promotionActive(promo, now) : false;
    const bySku = new Map(skus.map((s) => [s.sku, s]));

    for (const s of skus) {
      const base = { amount: s.price, currency: brand.currency };
      const onHand = s.bundle
        ? Math.min(...s.bundle.map((c) => bySku.get(c)?.on_hand ?? 0))
        : s.on_hand;
      let price = base;
      let compareAtPrice: Product["compareAtPrice"];
      if (promoOn && s.collection === promoCollection) {
        price = {
          amount: fromCents(roundHalfUp(toCents(s.price) * 0.8)),
          currency: brand.currency,
        };
        compareAtPrice = base;
      }
      const variants = expandVariants(s, seed.warehouses);
      products.push({
        sku: s.sku,
        name: s.name,
        brand: brand.id,
        description: s.note ?? `${s.name} from ${brand.name}.`,
        collection: s.collection,
        price,
        ...(compareAtPrice ? { compareAtPrice } : {}),
        ...(s.bundle ? { bundle: s.bundle } : {}),
        preorder: Boolean(s.preorder),
        variants,
        availability: availabilityFor(onHand, s.safety_stock, s.preorder),
        basePrice: base,
        safetyStock: s.safety_stock,
      });
      if (!s.bundle) {
        const splits = seed.warehouses.length === 2 ? [0.6, 0.4] : [1];
        let left = s.on_hand;
        seed.warehouses.forEach((warehouse, i) => {
          const qty = i === seed.warehouses.length - 1 ? left : Math.round(s.on_hand * splits[i]);
          left -= qty;
          inventory.push({
            sku: s.sku,
            warehouse,
            onHand: qty,
            reserved: 0,
            available: qty,
            safetyStock: s.safety_stock,
            updatedAt: now.toISOString(),
          });
        });
      }
    }

    collections[brand.id] = seed.collections.map((c) => ({
      slug: c.slug,
      name: c.name,
      ...(c.description ? { description: c.description } : {}),
      ...(c.promotion ? { promotion: c.promotion } : {}),
      productCount: skus.filter((s) => s.collection === c.slug).length,
    }));

    priceLists.push({
      id: `${brand.id}-base`,
      brand: brand.id,
      name:
        (SEED.priceLists as SeedPriceList[]).find((p) => p.id === `${brand.id}-base`)?.name ??
        "Base",
      currency: brand.currency,
      entries: skus.map((s) => ({
        sku: s.sku,
        price: { amount: s.price, currency: brand.currency },
      })),
    });
    if (promo) {
      priceLists.push({
        id: promo.id,
        brand: brand.id,
        name: promo.name,
        currency: brand.currency,
        activeFrom: promo.active_from,
        activeTo: promo.active_to,
        entries: skus
          .filter((s) => s.collection === promoCollection)
          .map((s) => ({
            sku: s.sku,
            price: {
              amount: fromCents(roundHalfUp(toCents(s.price) * 0.8)),
              currency: brand.currency,
            },
            compareAtPrice: { amount: s.price, currency: brand.currency },
          })),
      });
    }
  }

  // Orders: 400 split 220/180, statuses by the seed mix, lines weighted to the two cheapest collections.
  const orders: MockOrder[] = [];
  const nextOrderNumber: Record<BrandId, number> = {
    "lumen-home": 100001,
    "trailhead-supply": 100001,
  };
  const statusMix = Object.entries(SEED.orders.statusMix) as [OrderStatus, number][];
  const pickStatus = (): OrderStatus => {
    let r = random.next();
    for (const [status, weight] of statusMix) {
      r -= weight;
      if (r <= 0) return status;
    }
    return "delivered";
  };
  const warehouseFor = (brand: Brand, sku: string): string => {
    const rows = inventory.filter(
      (r) =>
        r.sku === sku.split("-").slice(0, 3).join("-") && brand.warehouses?.includes(r.warehouse),
    );
    return rows.length ? random.pick(rows).warehouse : (brand.warehouses?.[0] ?? "US-NJ");
  };
  for (const brand of brands) {
    const seed = seedBrands[brand.id];
    const count = (SEED.orders.split as Record<BrandId, number>)[brand.id];
    const brandProducts = products.filter((p) => p.brand === brand.id && !p.preorder && !p.bundle);
    const collectionCost = seed.collections
      .map((c) => ({
        slug: c.slug,
        avg:
          brandProducts
            .filter((p) => p.collection === c.slug)
            .reduce((s, p) => s + toCents(p.basePrice.amount), 0) /
          Math.max(1, brandProducts.filter((p) => p.collection === c.slug).length),
      }))
      .filter((c) => brandProducts.some((p) => p.collection === c.slug))
      .sort((a, b) => a.avg - b.avg);
    const cheap = new Set(collectionCost.slice(0, 2).map((c) => c.slug));
    const weighted = brandProducts.flatMap((p) =>
      cheap.has(p.collection ?? "") ? [p, p, p] : [p],
    );

    for (let i = 0; i < count; i += 1) {
      const placedAt = new Date(now.getTime() - random.int(1, 180 * 24) * HOUR);
      const status = pickStatus();
      const lineCount = random.int(1, 4);
      const lines: OrderLine[] = [];
      const used = new Set<string>();
      for (let l = 0; l < lineCount; l += 1) {
        const p = random.pick(weighted);
        if (used.has(p.sku)) continue;
        used.add(p.sku);
        const variant = p.variants.length ? random.pick(p.variants) : null;
        const quantity = random.int(1, 3);
        const sku = variant ? variant.sku : p.sku;
        lines.push({
          sku,
          name: variant ? `${p.name} (${Object.values(variant.attributes).join("/")})` : p.name,
          quantity,
          unitPrice: p.basePrice,
          lineTotal: {
            amount: fromCents(toCents(p.basePrice.amount) * quantity),
            currency: brand.currency,
          },
          warehouse: warehouseFor(brand, sku),
        });
      }
      const id = random.uuid();
      const user = `customer-${String(random.int(1, SEED.users.customersPerBrand)).padStart(3, "0")}@${brand.id}.test`;
      const paymentId = `pay_${random.uuid().slice(0, 12)}`;
      const number = `${seed.order_number_prefix}-${nextOrderNumber[brand.id]++}`;
      const events = orderEvents(random, id, status, placedAt, paymentId);
      orders.push({
        id,
        number,
        brand: brand.id,
        user,
        status,
        lines,
        totals: lineTotals(brand, lines),
        paymentId,
        shippingAddress: {
          name: "Seed Customer",
          line1: "1 Fixture Street",
          city: brand.id === "lumen-home" ? "Newark" : "Hamburg",
          postalCode: brand.id === "lumen-home" ? "07102" : "20095",
          country: brand.id === "lumen-home" ? "US" : "DE",
        },
        placedAt: placedAt.toISOString(),
        updatedAt: events.at(-1)?.at ?? placedAt.toISOString(),
        events,
      });
    }
  }
  orders.sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1));

  // Carts: 30 split 16/14, ages 1 h … 9 d on a log scale, 6 with a pending PayGate session (4 older than 48 h).
  const carts: MockCart[] = [];
  const minAge = 1;
  const maxAge = 9 * 24;
  let cartIndex = 0;
  const totalCarts = SEED.carts.total;
  for (const brand of brands) {
    const count = (SEED.carts.split as Record<BrandId, number>)[brand.id];
    const brandProducts = products.filter((p) => p.brand === brand.id && !p.preorder && !p.bundle);
    for (let i = 0; i < count; i += 1) {
      const t = cartIndex / (totalCarts - 1);
      const ageHours = minAge * Math.pow(maxAge / minAge, t);
      const createdAt = new Date(now.getTime() - ageHours * HOUR);
      const lines: CartLine[] = [];
      const used = new Set<string>();
      for (let l = 0, n = random.int(1, 3); l < n; l += 1) {
        const p = random.pick(brandProducts);
        if (used.has(p.sku)) continue;
        used.add(p.sku);
        const variant = p.variants.length ? random.pick(p.variants) : null;
        const quantity = random.int(1, 2);
        lines.push({
          id: random.uuid(),
          sku: variant ? variant.sku : p.sku,
          name: variant ? `${p.name} (${Object.values(variant.attributes).join("/")})` : p.name,
          quantity,
          unitPrice: p.price,
          lineTotal: {
            amount: fromCents(toCents(p.price.amount) * quantity),
            currency: brand.currency,
          },
        });
      }
      // Pending-payment carts: 6 in total, 4 of them older than 48 h (indices chosen deterministically).
      const pending = [5, 8, 17, 21, 25, 28].includes(cartIndex);
      carts.push({
        id: random.uuid(),
        brand: brand.id,
        user: `customer-${String(random.int(1, SEED.users.customersPerBrand)).padStart(3, "0")}@${brand.id}.test`,
        status: "open",
        lines,
        totals: lineTotals(brand, lines),
        createdAt: createdAt.toISOString(),
        updatedAt: createdAt.toISOString(),
        ...(pending ? { pendingPaymentId: `pay_${random.uuid().slice(0, 12)}` } : {}),
      });
      cartIndex += 1;
    }
  }

  // Reservations held by orders that are not yet packed.
  for (const o of orders) {
    if (!["pending_payment", "paid", "confirmed"].includes(o.status)) continue;
    for (const l of o.lines) {
      const row = inventory.find((r) => r.sku === baseSku(l.sku) && r.warehouse === l.warehouse);
      if (row) {
        row.reserved += l.quantity;
        row.available = row.onHand - row.reserved;
      }
    }
  }

  return {
    brands,
    seedBrands,
    collections,
    products,
    priceLists,
    inventory,
    orders,
    carts,
    nextOrderNumber,
  };
}

/** `TS-JKT-01-M-BLK` → `TS-JKT-01`. */
export function baseSku(sku: string): string {
  return sku.split("-").slice(0, 3).join("-");
}

const STATUS_CHAIN: OrderStatus[] = [
  "pending_payment",
  "paid",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
];

function orderEvents(
  random: ReturnType<typeof rng>,
  orderId: string,
  status: OrderStatus,
  placedAt: Date,
  paymentId: string,
): OrderEvent[] {
  const events: OrderEvent[] = [];
  let t = placedAt.getTime();
  const push = (e: Omit<OrderEvent, "id" | "orderId" | "at">, minutes = random.int(5, 240)) => {
    t += minutes * 60_000;
    events.push({ id: random.uuid(), orderId, at: new Date(t).toISOString(), ...e });
  };
  events.push({
    id: random.uuid(),
    orderId,
    type: "reservation_made",
    source: "api",
    detail: "Stock reserved per line",
    at: placedAt.toISOString(),
  });
  if (status === "pending_payment") {
    push({ type: "email_queued", source: "api", detail: "Awaiting PayGate confirmation" }, 1);
    return events;
  }
  const failed = status === "cancelled";
  if (failed) {
    push({ type: "payment_failed", source: "webhook", detail: `payment.failed for ${paymentId}` });
    push({ type: "status_changed", from: "pending_payment", to: "cancelled", source: "worker" }, 1);
    push({ type: "reservation_released", source: "worker" }, 1);
    return events;
  }
  push({
    type: "payment_received",
    source: "webhook",
    detail: `payment.succeeded for ${paymentId}`,
  });
  push({ type: "status_changed", from: "pending_payment", to: "paid", source: "worker" }, 1);
  push({ type: "email_queued", source: "worker", detail: "Order confirmation queued" }, 1);
  const terminalIndex = STATUS_CHAIN.indexOf(status);
  const walkTo = terminalIndex > 0 ? terminalIndex : STATUS_CHAIN.indexOf("delivered");
  for (let i = 2; i <= walkTo; i += 1) {
    push({
      type: "status_changed",
      from: STATUS_CHAIN[i - 1],
      to: STATUS_CHAIN[i],
      source: i === 2 ? "worker" : "admin",
    });
  }
  if (status === "refunded") {
    push({
      type: "status_changed",
      from: "delivered",
      to: "refunded",
      source: "webhook",
      detail: "payment.refunded",
    });
  } else if (status === "chargeback") {
    push({
      type: "status_changed",
      from: "delivered",
      to: "chargeback",
      source: "webhook",
      detail: "chargeback.opened",
    });
  }
  return events;
}
