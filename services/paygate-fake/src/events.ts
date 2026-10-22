import { randomBytes } from "node:crypto";

export const EVENT_TYPES = [
  "payment.succeeded",
  "payment.failed",
  "payment.refunded",
  "chargeback.opened",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type Currency = "USD" | "EUR";

/** Mirrors `PaymentWebhookEvent` in packages/contracts/openapi.yaml. */
export interface PaymentWebhookEvent {
  event_id: string;
  type: EventType;
  occurred_at: string;
  attempt: number;
  data: {
    payment_id: string;
    order_id: string;
    cart_id?: string;
    amount: string;
    currency: Currency;
    reason?: string;
  };
}

export const MONEY = /^-?\d+\.\d{2}$/;

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export function isEventType(value: string): value is EventType {
  return (EVENT_TYPES as readonly string[]).includes(value);
}

export interface EventInput {
  type: EventType;
  paymentId: string;
  orderId: string;
  cartId?: string;
  amount: string;
  currency: Currency;
  reason?: string;
  eventId?: string;
  occurredAt?: string;
}

export function buildEvent(input: EventInput): PaymentWebhookEvent {
  if (!MONEY.test(input.amount)) {
    throw new Error(`amount must be a two-fractional-digit decimal string, got ${input.amount}`);
  }
  if (input.currency !== "USD" && input.currency !== "EUR") {
    throw new Error(`unsupported currency ${String(input.currency)}`);
  }
  const data: PaymentWebhookEvent["data"] = {
    payment_id: input.paymentId,
    order_id: input.orderId,
    amount: input.amount,
    currency: input.currency,
  };
  if (input.cartId) data.cart_id = input.cartId;
  if (input.reason) data.reason = input.reason;
  return {
    event_id: input.eventId ?? newId("evt"),
    type: input.type,
    occurred_at: input.occurredAt ?? new Date().toISOString(),
    attempt: 1,
    data,
  };
}
