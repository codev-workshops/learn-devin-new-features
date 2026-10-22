// Deterministic in-memory implementation of the OpenAPI contract, built from the seed-spec
// fixture. Shared by the in-app mock transport (apiMode=mock) and the MSW handlers used in Jest.
import type {
  Address,
  ApiError,
  Brand,
  BrandId,
  Cart,
  CartLine,
  CheckoutInput,
  CheckoutResult,
  Collection,
  CollectionPage,
  Currency,
  Order,
  OrderEvent,
  OrderLine,
  OrderPage,
  OrderStatus,
  Product,
  Totals,
  Variant,
} from "../api/types";
import { fromMinor, money, mulRoundHalfUp, toMinor } from "../api/money";
import seed from "./fixtures/seed.json";

interface SeedCollection {
  slug: string;
  name: string;
  description?: string;
  promotion?: string;
}
interface SeedBrand {
  id: string;
  name: string;
  currency: string;
  pricing: string;
  taxRate: number;
  locale: string;
  warehouses: string[];
  freeShippingOver?: string | null;
  shippingFlat: string;
  orderNumberPrefix: string;
  collections: SeedCollection[];
}
type SeedSku = {
  sku: string;
  name: string;
  collection: string;
  price: string;
  onHand: number;
  safetyStock: number;
  lowStock: boolean;
  preorder: boolean;
  bundle?: string[];
  variants?: Record<string, string[]>;
};

export class MockError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError,
  ) {
    super(body.message);
  }
}

const notFound = (what: string) =>
  new MockError(404, { code: "not_found", message: `${what} not found` });
const badRequest = (message: string) => new MockError(400, { code: "bad_request", message });

/** Small deterministic PRNG (mulberry32) so every mock run shows the same orders. */
function prng(seedValue: number) {
  let a = seedValue >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function uuidFrom(rand: () => number): string {
  const hex = () => Math.floor(rand() * 16).toString(16);
  const part = (n: number) => Array.from({ length: n }, hex).join("");
  return `${part(8)}-${part(4)}-4${part(3)}-a${part(3)}-${part(12)}`;
}

function brandIds(): BrandId[] {
  return Object.keys(seed.brands) as BrandId[];
}

function seedBrand(id: BrandId): SeedBrand {
  const b = (seed.brands as unknown as Record<string, SeedBrand>)[id];
  if (!b) throw badRequest(`unknown brand ${id}`);
  return b;
}

export function toBrand(id: BrandId): Brand {
  const b = seedBrand(id);
  return {
    id,
    name: b.name,
    currency: b.currency as Currency,
    pricing: b.pricing as Brand["pricing"],
    taxRate: b.taxRate,
    locale: b.locale,
    warehouses: b.warehouses,
    freeShippingOver: b.freeShippingOver
      ? { amount: b.freeShippingOver, currency: b.currency as Currency }
      : undefined,
  };
}

function promotionActive(brand: BrandId, collectionSlug: string, now: Date): boolean {
  const col = seedBrand(brand).collections.find((c) => c.slug === collectionSlug);
  if (!col?.promotion) return false;
  const promo = (seed.promotions as Record<string, { activeFrom: string; activeTo: string }>)[
    col.promotion
  ];
  if (!promo) return false;
  return now >= new Date(promo.activeFrom) && now < new Date(promo.activeTo);
}

function expandVariants(s: SeedSku, perVariantOnHand: number): Variant[] {
  const dims = Object.entries(s.variants ?? {}) as [string, string[]][];
  if (dims.length === 0) return [{ sku: s.sku, attributes: {}, onHand: s.onHand }];
  let combos: Record<string, string>[] = [{}];
  for (const [dim, values] of dims) {
    combos = combos.flatMap((c) => values.map((v) => ({ ...c, [dim]: v })));
  }
  return combos.map((attributes) => ({
    sku: `${s.sku}-${Object.values(attributes).join("-")}`,
    attributes,
    onHand: perVariantOnHand,
  }));
}

function seedSkus(brand: BrandId): SeedSku[] {
  return (seed.skus as unknown as Record<string, SeedSku[]>)[brand] ?? [];
}

/** A bundle has no stock of its own: it can be assembled as often as its scarcest component allows. */
function effectiveOnHand(brand: BrandId, s: SeedSku): number {
  if (!s.bundle?.length) return s.onHand;
  const all = seedSkus(brand);
  return s.bundle.reduce((min, component) => {
    const c = all.find((x) => x.sku === component);
    return Math.min(min, c ? c.onHand : 0);
  }, Number.MAX_SAFE_INTEGER);
}

export function toProduct(brand: BrandId, s: SeedSku, now: Date): Product {
  const currency = seedBrand(brand).currency as Currency;
  const listMinor = toMinor(s.price);
  const onSale = promotionActive(brand, s.collection, now);
  const priceMinor = onSale ? mulRoundHalfUp(listMinor, 80, 100) : listMinor;
  const variantCount = Object.values(s.variants ?? {}).reduce((n, v) => n * v.length, 1);
  const onHand = effectiveOnHand(brand, s);
  const availability: Product["availability"] = s.preorder
    ? "preorder"
    : onHand <= 0
      ? "out_of_stock"
      : s.lowStock || onHand <= s.safetyStock
        ? "low_stock"
        : "in_stock";
  return {
    sku: s.sku,
    name: s.name,
    brand,
    collection: s.collection,
    price: money(priceMinor, currency),
    compareAtPrice: onSale ? money(listMinor, currency) : undefined,
    bundle: s.bundle,
    preorder: s.preorder ? true : undefined,
    variants: expandVariants({ ...s, onHand }, Math.floor(onHand / variantCount)),
    availability,
  };
}

/** Contract totals: USD adds 8.25% tax; EUR prices include 19% VAT; shipping flat or free over threshold. */
export function computeTotals(brand: BrandId, lines: { lineTotal: { amount: string } }[]): Totals {
  const b = seedBrand(brand);
  const currency = b.currency as Currency;
  const subtotal = lines.reduce((n, l) => n + toMinor(l.lineTotal.amount), 0);
  const taxBasis = Math.round(b.taxRate * 10000);
  let tax: number;
  let total: number;
  const freeOver = b.freeShippingOver ? toMinor(b.freeShippingOver) : null;
  const shipping =
    lines.length === 0
      ? 0
      : freeOver !== null && subtotal >= freeOver
        ? 0
        : toMinor(b.shippingFlat);
  if (b.pricing === "tax_exclusive") {
    tax = mulRoundHalfUp(subtotal, taxBasis, 10000);
    total = subtotal + tax + shipping;
  } else {
    tax = mulRoundHalfUp(subtotal, taxBasis, 10000 + taxBasis);
    total = subtotal + shipping;
  }
  return {
    subtotal: money(subtotal, currency),
    tax: money(tax, currency),
    shipping: money(shipping, currency),
    total: money(total, currency),
    currency,
    taxIncluded: b.pricing === "tax_inclusive",
  };
}

const STATUS_FLOW: OrderStatus[] = [
  "pending_payment",
  "paid",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
];

export interface MockStoreOptions {
  /** "Now" for promotions and order ages; defaults to the seed's as_of instant. */
  now?: Date;
  ordersPerCustomer?: number;
}

export class MockStore {
  readonly now: Date;
  private carts = new Map<string, Cart>();
  private orders = new Map<string, Order>();
  private events = new Map<string, OrderEvent[]>();
  private cartLineSeq = 0;
  private readonly rand: () => number;

  constructor(opts: MockStoreOptions = {}) {
    this.now = opts.now ?? new Date(seed.asOf);
    this.rand = prng(seed.seed);
    for (const brand of brandIds()) {
      this.seedOrders(brand, opts.ordersPerCustomer ?? 6);
    }
  }

  listBrands(): Brand[] {
    return brandIds().map(toBrand);
  }

  private skus(brand: BrandId): SeedSku[] {
    return (seed.skus as Record<string, SeedSku[]>)[brand] ?? [];
  }

  listCollections(brand: BrandId): Collection[] {
    return seedBrand(brand).collections.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      promotion: c.promotion,
      productCount: this.skus(brand).filter((s) => s.collection === c.slug).length,
    }));
  }

  getCollection(brand: BrandId, slug: string): CollectionPage {
    const col = this.listCollections(brand).find((c) => c.slug === slug);
    if (!col) throw notFound(`collection ${slug}`);
    return {
      ...col,
      products: this.skus(brand)
        .filter((s) => s.collection === slug)
        .map((s) => toProduct(brand, s, this.now)),
    };
  }

  getProduct(brand: BrandId, sku: string): Product {
    const base = sku.split("-").slice(0, 3).join("-");
    const s = this.skus(brand).find((x) => x.sku === sku || x.sku === base);
    if (!s) throw notFound(`product ${sku}`);
    const product = toProduct(brand, s, this.now);
    if (sku !== s.sku && !product.variants.some((v) => v.sku === sku)) {
      throw notFound(`product ${sku}`);
    }
    return product;
  }

  createCart(brand: BrandId, user: string): Cart {
    const id = uuidFrom(this.rand);
    const at = this.now.toISOString();
    const cart: Cart = {
      id,
      brand,
      user,
      status: "open",
      lines: [],
      totals: computeTotals(brand, []),
      createdAt: at,
      updatedAt: at,
    };
    this.carts.set(id, cart);
    return cart;
  }

  /** Carts are private to the customer who opened them; a foreign cart looks like it does not exist. */
  getCart(brand: BrandId, user: string, cartId: string): Cart {
    const cart = this.carts.get(cartId);
    if (!cart || cart.brand !== brand || cart.user !== user) throw notFound(`cart ${cartId}`);
    return cart;
  }

  private openCart(brand: BrandId, user: string, cartId: string): Cart {
    const cart = this.getCart(brand, user, cartId);
    if (cart.status !== "open")
      throw new MockError(409, { code: "conflict", message: "cart is not open" });
    return cart;
  }

  /** Stock check for `sku` at a total cart quantity of `wanted`; pre-orders are never limited. */
  private assertInStock(brand: BrandId, sku: string, wanted: number): Product {
    const product = this.getProduct(brand, sku);
    const variant = product.variants.find((v) => v.sku === sku);
    if (!variant) throw badRequest(`${sku} has variants; add a variant SKU`);
    if (variant.onHand < wanted && !product.preorder) {
      throw new MockError(409, {
        code: "out_of_stock",
        message: `${sku}: only ${variant.onHand} on hand`,
      });
    }
    return product;
  }

  addCartLine(brand: BrandId, user: string, cartId: string, sku: string, quantity: number): Cart {
    const cart = this.openCart(brand, user, cartId);
    if (!Number.isInteger(quantity) || quantity < 1) throw badRequest("quantity must be >= 1");
    const existing = cart.lines.find((l) => l.sku === sku);
    const product = this.assertInStock(brand, sku, (existing?.quantity ?? 0) + quantity);
    const unit = toMinor(product.price.amount);
    if (existing) {
      existing.quantity += quantity;
      existing.lineTotal = money(unit * existing.quantity, product.price.currency);
    } else {
      this.cartLineSeq += 1;
      const line: CartLine = {
        id: uuidFrom(this.rand),
        sku,
        name: product.name,
        quantity,
        unitPrice: product.price,
        lineTotal: money(unit * quantity, product.price.currency),
      };
      cart.lines.push(line);
    }
    return this.touch(cart);
  }

  updateCartLine(
    brand: BrandId,
    user: string,
    cartId: string,
    lineId: string,
    quantity: number,
  ): Cart {
    const cart = this.openCart(brand, user, cartId);
    const line = cart.lines.find((l) => l.id === lineId);
    if (!line) throw notFound(`line ${lineId}`);
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99)
      throw badRequest("quantity out of range");
    if (quantity === 0) {
      cart.lines = cart.lines.filter((l) => l.id !== lineId);
    } else {
      this.assertInStock(brand, line.sku, quantity);
      line.quantity = quantity;
      line.lineTotal = money(toMinor(line.unitPrice.amount) * quantity, line.unitPrice.currency);
    }
    return this.touch(cart);
  }

  abandonCart(brand: BrandId, user: string, cartId: string): void {
    this.getCart(brand, user, cartId);
    this.carts.delete(cartId);
  }

  private touch(cart: Cart): Cart {
    cart.totals = computeTotals(cart.brand, cart.lines);
    cart.updatedAt = new Date(this.now.getTime() + 1000).toISOString();
    return cart;
  }

  checkout(brand: BrandId, user: string, input: CheckoutInput): CheckoutResult {
    const cart = this.getCart(brand, user, input.cartId);
    if (cart.status !== "open")
      throw new MockError(409, { code: "conflict", message: "cart already checked out" });
    if (cart.lines.length === 0)
      throw new MockError(422, { code: "validation_failed", message: "cart is empty" });
    if (!input.email || !input.shippingAddress?.line1) {
      throw new MockError(422, {
        code: "validation_failed",
        message: "email and shippingAddress are required",
      });
    }
    const warehouse = seedBrand(brand).warehouses[0];
    const order = this.makeOrder(
      brand,
      user,
      cart.lines.map((l) => ({ ...l, warehouse })),
      "pending_payment",
      this.now,
      input.shippingAddress,
    );
    order.cartId = cart.id;
    cart.status = "checked_out";
    const paymentId = `pay_${order.id.slice(0, 8)}`;
    order.paymentId = paymentId;
    return {
      order,
      payment: {
        paymentId,
        provider: "paygate-fake",
        redirectUrl: `http://localhost:3002/checkout/${paymentId}`,
        expiresAt: new Date(this.now.getTime() + 30 * 60 * 1000).toISOString(),
      },
    };
  }

  listOrders(
    brand: BrandId,
    user: string,
    opts: { status?: OrderStatus; limit?: number; cursor?: string } = {},
  ): OrderPage {
    const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    const all = [...this.orders.values()]
      .filter(
        (o) => o.brand === brand && o.user === user && (!opts.status || o.status === opts.status),
      )
      .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
    const start = opts.cursor
      ? Math.max(
          all.findIndex((o) => o.id === opts.cursor),
          0,
        )
      : 0;
    const items = all.slice(start, start + limit);
    const next = all[start + limit];
    return { items, nextCursor: next?.id };
  }

  /** Orders are private to their customer; another customer's order is reported as not found. */
  getOrder(brand: BrandId, user: string, orderId: string): Order {
    const order = this.orders.get(orderId);
    if (!order) throw notFound(`order ${orderId}`);
    if (order.brand !== brand)
      throw new MockError(403, { code: "forbidden", message: "order belongs to another brand" });
    if (order.user !== user) throw notFound(`order ${orderId}`);
    return order;
  }

  listOrderEvents(brand: BrandId, user: string, orderId: string): OrderEvent[] {
    this.getOrder(brand, user, orderId);
    return this.events.get(orderId) ?? [];
  }

  cancelOrder(brand: BrandId, user: string, orderId: string): Order {
    const order = this.getOrder(brand, user, orderId);
    if (order.status !== "pending_payment" && order.status !== "paid") {
      throw new MockError(409, {
        code: "conflict",
        message: `cannot cancel an order in status ${order.status}`,
      });
    }
    this.pushEvent(
      order,
      "status_changed",
      order.status,
      "cancelled",
      "api",
      "cancelled by customer",
    );
    this.pushEvent(order, "reservation_released", undefined, undefined, "api");
    order.status = "cancelled";
    order.updatedAt = new Date(this.now.getTime() + 1000).toISOString();
    return order;
  }

  private pushEvent(
    order: Order,
    type: OrderEvent["type"],
    from?: OrderStatus,
    to?: OrderStatus,
    source: OrderEvent["source"] = "seed",
    detail?: string,
    at?: string,
  ) {
    const list = this.events.get(order.id) ?? [];
    list.push({
      id: uuidFrom(this.rand),
      orderId: order.id,
      type,
      from,
      to,
      source,
      detail,
      at: at ?? new Date(this.now.getTime() + 1000 * list.length).toISOString(),
    });
    this.events.set(order.id, list);
  }

  private makeOrder(
    brand: BrandId,
    user: string,
    lines: OrderLine[],
    status: OrderStatus,
    placedAt: Date,
    shippingAddress?: Address,
  ): Order {
    const b = seedBrand(brand);
    const id = uuidFrom(this.rand);
    const seq = this.orders.size + 1001;
    const order: Order = {
      id,
      number: `${b.orderNumberPrefix}-${String(seq).padStart(6, "0")}`,
      brand,
      user,
      status,
      lines,
      totals: computeTotals(brand, lines),
      shippingAddress,
      placedAt: placedAt.toISOString(),
      updatedAt: placedAt.toISOString(),
    };
    this.orders.set(id, order);
    this.pushEvent(
      order,
      "reservation_made",
      undefined,
      undefined,
      "api",
      undefined,
      order.placedAt,
    );
    return order;
  }

  /** Historical orders for the demo customer of each brand, walking the status flow with timestamps. */
  private seedOrders(brand: BrandId, count: number) {
    const user = demoCustomer(brand);
    const skus = this.skus(brand).filter((s) => !s.preorder && s.onHand > 0);
    const b = seedBrand(brand);
    const terminal: OrderStatus[] = [
      "delivered",
      "delivered",
      "shipped",
      "packed",
      "confirmed",
      "pending_payment",
    ];
    for (let i = 0; i < count; i += 1) {
      const ageDays = 2 + i * 9;
      const placedAt = new Date(this.now.getTime() - ageDays * 24 * 3600 * 1000);
      const lineCount = 1 + Math.floor(this.rand() * 3);
      const lines: OrderLine[] = [];
      for (let j = 0; j < lineCount; j += 1) {
        const s = skus[Math.floor(this.rand() * skus.length)];
        if (lines.some((l) => l.sku === s.sku)) continue;
        const product = toProduct(brand, s, placedAt);
        const quantity = 1 + Math.floor(this.rand() * 2);
        lines.push({
          sku: s.sku,
          name: s.name,
          quantity,
          unitPrice: product.price,
          lineTotal: money(toMinor(product.price.amount) * quantity, product.price.currency),
          warehouse: b.warehouses[j % b.warehouses.length],
        });
      }
      const target = terminal[i % terminal.length];
      const order = this.makeOrder(brand, user, lines, "pending_payment", placedAt);
      let cursor = placedAt.getTime();
      const steps = STATUS_FLOW.slice(0, STATUS_FLOW.indexOf(target) + 1);
      for (let k = 1; k < steps.length; k += 1) {
        cursor += (k === 1 ? 5 : 6 * 3600) * 60 * 1000;
        const at = new Date(cursor).toISOString();
        if (steps[k] === "paid")
          this.pushEvent(
            order,
            "payment_received",
            undefined,
            undefined,
            "webhook",
            "payment.succeeded",
            at,
          );
        this.pushEvent(
          order,
          "status_changed",
          steps[k - 1],
          steps[k],
          k === 1 ? "webhook" : "worker",
          undefined,
          at,
        );
        if (steps[k] === "confirmed")
          this.pushEvent(
            order,
            "email_queued",
            undefined,
            undefined,
            "worker",
            "order confirmation",
            at,
          );
        if (steps[k] === "shipped")
          this.pushEvent(
            order,
            "email_queued",
            undefined,
            undefined,
            "worker",
            "shipping notification",
            at,
          );
        order.status = steps[k];
        order.updatedAt = at;
      }
      order.paymentId = `pay_${order.id.slice(0, 8)}`;
    }
  }
}

export function demoCustomer(brand: BrandId): string {
  return `customer-001@${brand}.test`;
}

export { fromMinor };
