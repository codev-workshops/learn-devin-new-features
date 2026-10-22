import { buildEvent, newId, type Currency, type PaymentWebhookEvent } from "./events.js";

export type SessionStatus =
  "pending" | "succeeded" | "failed" | "refunded" | "chargeback" | "expired";

export interface CheckoutSession {
  id: string;
  paymentId: string;
  orderId: string;
  cartId?: string;
  brand: string;
  amount: string;
  currency: Currency;
  customerEmail?: string;
  returnUrl?: string;
  status: SessionStatus;
  createdAt: string;
  expiresAt: string;
  events: PaymentWebhookEvent[];
}

export interface CreateSessionInput {
  orderId: string;
  cartId?: string;
  brand: string;
  amount: string;
  currency: Currency;
  customerEmail?: string;
  returnUrl?: string;
  paymentId?: string;
}

export class SessionStore {
  private readonly byId = new Map<string, CheckoutSession>();

  constructor(private readonly ttlMinutes = 30) {}

  create(input: CreateSessionInput, now = new Date()): CheckoutSession {
    const session: CheckoutSession = {
      id: newId("cs"),
      paymentId: input.paymentId ?? newId("pay"),
      orderId: input.orderId,
      cartId: input.cartId,
      brand: input.brand,
      amount: input.amount,
      currency: input.currency,
      customerEmail: input.customerEmail,
      returnUrl: input.returnUrl,
      status: "pending",
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + this.ttlMinutes * 60_000).toISOString(),
      events: [],
    };
    this.byId.set(session.id, session);
    return session;
  }

  get(id: string): CheckoutSession | undefined {
    return this.byId.get(id);
  }

  byPayment(paymentId: string): CheckoutSession | undefined {
    for (const s of this.byId.values()) if (s.paymentId === paymentId) return s;
    return undefined;
  }

  list(): CheckoutSession[] {
    return [...this.byId.values()];
  }

  /** Resolve the hosted checkout. Returns the webhook event the PSP would emit. */
  complete(id: string, outcome: "succeeded" | "failed", reason?: string): PaymentWebhookEvent {
    const session = this.require(id);
    if (session.status !== "pending")
      throw new SessionError(409, `session ${id} is ${session.status}`);
    session.status = outcome;
    return this.record(
      session,
      outcome === "succeeded" ? "payment.succeeded" : "payment.failed",
      reason,
    );
  }

  refund(id: string, reason?: string): PaymentWebhookEvent {
    const session = this.require(id);
    if (session.status !== "succeeded")
      throw new SessionError(409, `cannot refund a ${session.status} session`);
    session.status = "refunded";
    return this.record(session, "payment.refunded", reason);
  }

  chargeback(id: string, reason?: string): PaymentWebhookEvent {
    const session = this.require(id);
    if (session.status !== "succeeded")
      throw new SessionError(409, `cannot charge back a ${session.status} session`);
    session.status = "chargeback";
    return this.record(session, "chargeback.opened", reason ?? "customer_dispute");
  }

  private record(session: CheckoutSession, type: PaymentWebhookEvent["type"], reason?: string) {
    const event = buildEvent({
      type,
      paymentId: session.paymentId,
      orderId: session.orderId,
      cartId: session.cartId,
      amount: session.amount,
      currency: session.currency,
      reason,
    });
    session.events.push(event);
    return event;
  }

  private require(id: string): CheckoutSession {
    const session = this.byId.get(id);
    if (!session) throw new SessionError(404, `unknown session ${id}`);
    return session;
  }
}

export class SessionError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
