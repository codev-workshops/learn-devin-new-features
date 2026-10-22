/**
 * Shared TypeScript types for Harbourline, mirroring packages/contracts/openapi.yaml.
 * Hand-maintained and frozen in W0; keep field names identical to the OpenAPI schemas.
 */

export const BRAND_IDS = ["lumen-home", "trailhead-supply"] as const;
export type BrandId = (typeof BRAND_IDS)[number];

export const CURRENCIES = ["USD", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "chargeback",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const WEBHOOK_EVENT_TYPES = [
  "payment.succeeded",
  "payment.failed",
  "payment.refunded",
  "chargeback.opened",
] as const;
export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

/** Fake-login headers. There is no token; the headers are the whole auth story. */
export const HEADERS = {
  brand: "X-Harbourline-Brand",
  user: "X-Harbourline-User",
  role: "X-Harbourline-Role",
  paygateSignature: "X-PayGate-Signature",
  paygateEventId: "X-PayGate-Event-Id",
} as const;

export type Role = "customer" | "merchandiser" | "admin";

/** Decimal string in major units with two fractional digits, e.g. "12.50". */
export type DecimalString = `${number}.${number}` | string;

export interface Money {
  amount: DecimalString;
  currency: Currency;
}

export interface Brand {
  id: BrandId;
  name: string;
  currency: Currency;
  pricing: "tax_exclusive" | "tax_inclusive";
  taxRate?: number;
  freeShippingOver?: Money;
  locale: string;
  warehouses?: string[];
}

export interface Collection {
  slug: string;
  name: string;
  description?: string;
  promotion?: string;
  productCount: number;
}

export interface Variant {
  sku: string;
  attributes: Record<string, string>;
  onHand: number;
  price?: Money;
}

export type Availability = "in_stock" | "low_stock" | "preorder" | "out_of_stock";

export interface Product {
  sku: string;
  name: string;
  brand: BrandId;
  description?: string;
  collection?: string;
  price: Money;
  compareAtPrice?: Money;
  bundle?: string[];
  preorder?: boolean;
  variants: Variant[];
  availability: Availability;
}

export interface CollectionPage extends Collection {
  products: Product[];
}

export interface CartLineInput {
  sku: string;
  quantity: number;
}

export interface CartLine {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
}

export interface Totals {
  subtotal: Money;
  discount?: Money;
  tax: Money;
  shipping: Money;
  total: Money;
  currency: Currency;
  taxIncluded?: boolean;
}

export type CartStatus = "open" | "checked_out" | "abandoned";

export interface Cart {
  id: string;
  brand: BrandId;
  user: string;
  status: CartStatus;
  lines: CartLine[];
  totals: Totals;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
}

export interface CheckoutInput {
  cartId: string;
  email: string;
  shippingAddress: Address;
  idempotencyKey?: string;
}

export interface OrderLine {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
  warehouse: string;
}

export interface Order {
  id: string;
  number: string;
  brand: BrandId;
  user: string;
  cartId?: string;
  status: OrderStatus;
  lines: OrderLine[];
  totals: Totals;
  paymentId?: string;
  shippingAddress?: Address;
  placedAt: string;
  updatedAt: string;
}

export interface CheckoutResult {
  order: Order;
  payment: {
    paymentId: string;
    provider: "paygate-fake";
    redirectUrl: string;
    expiresAt: string;
  };
}

export type OrderEventType =
  | "status_changed"
  | "payment_received"
  | "payment_failed"
  | "reservation_made"
  | "reservation_released"
  | "email_queued"
  | "note";

export interface OrderEvent {
  id: string;
  orderId: string;
  type: OrderEventType;
  from?: OrderStatus;
  to?: OrderStatus;
  source?: "api" | "worker" | "webhook" | "admin" | "seed";
  detail?: string;
  at: string;
}

export interface OrderPage {
  items: Order[];
  nextCursor?: string;
}

export interface InventoryRow {
  sku: string;
  warehouse: string;
  onHand: number;
  reserved: number;
  available: number;
  safetyStock: number;
  updatedAt?: string;
}

export interface InventoryAdjustment {
  warehouse: string;
  delta: number;
  reason: "receipt" | "count_correction" | "write_off" | "return";
  note?: string;
}

export interface PriceListEntry {
  sku: string;
  price: Money;
  compareAtPrice?: Money;
}

export interface PriceList {
  id: string;
  brand: BrandId;
  name: string;
  currency: Currency;
  activeFrom?: string;
  activeTo?: string;
  entries: PriceListEntry[];
}

export interface AbandonedCart {
  cart: Cart;
  ageHours: number;
  pendingPaymentId?: string;
}

export interface PaymentWebhookEvent {
  event_id: string;
  type: WebhookEventType;
  occurred_at: string;
  attempt?: number;
  data: {
    payment_id: string;
    order_id: string;
    cart_id?: string;
    amount: DecimalString;
    currency: Currency;
    reason?: string;
  };
}

export type ErrorCode =
  | "bad_request"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "out_of_stock"
  | "invalid_signature"
  | "validation_failed"
  | "internal";

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: { path?: string; message?: string }[];
}

/** Shape of packages/contracts/seed-spec.yaml (the parts tooling reads). */
export interface SeedSku {
  sku: string;
  name: string;
  collection: string;
  price: DecimalString;
  on_hand: number;
  safety_stock: number;
  low_stock?: boolean;
  preorder?: boolean;
  bundle?: string[];
  variants?: Record<string, string[]>;
  note?: string;
  ships?: string;
}

export interface SeedBrand {
  name: string;
  currency: Currency;
  pricing: "tax_exclusive" | "tax_inclusive";
  tax_rate: number;
  locale: string;
  warehouses: string[];
  free_shipping_over: DecimalString | null;
  shipping_flat: DecimalString;
  order_number_prefix: "LH" | "TS";
  sku_count: number;
  collections: { slug: string; name: string; promotion?: string; description?: string }[];
}

export interface PlantedEdgeCase {
  id: string;
  owner: string;
  where: string;
  symptom: string;
  labs: number[];
}

export interface SeedSpec {
  version: number;
  seed: number;
  as_of: string;
  brands: Record<BrandId, SeedBrand>;
  skus: Record<BrandId, SeedSku[]>;
  planted_edge_cases: PlantedEdgeCase[];
}

export const SKU_PATTERN = /^(LH|TS)-[A-Z]{3,6}-\d{2}(-[A-Z0-9]{1,4})*$/;
export const MONEY_PATTERN = /^-?\d+\.\d{2}$/;
