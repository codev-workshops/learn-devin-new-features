import { createHmac, randomUUID } from "node:crypto";
import { Router } from "express";
import {
  CURRENCIES,
  HEADERS,
  MONEY_PATTERN,
  WEBHOOK_EVENT_TYPES,
  type PaymentWebhookEvent,
} from "@harbourline/contracts";
import type { Db } from "../db.js";
import { config, now } from "../config.js";
import { badRequest, invalidSignature } from "../errors.js";
import { Validator } from "../middleware/validate.js";

export function signPayload(raw: Buffer | string, secret = config.paygateSecret): string {
  return `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function webhooksRouter(db: Db): Router {
  const r = Router();

  r.post("/payments", async (req, res) => {
    const signature = req.header(HEADERS.paygateSignature);
    const headerEventId = req.header(HEADERS.paygateEventId);
    if (!signature) throw invalidSignature(`${HEADERS.paygateSignature} header is required`);
    if (!headerEventId) throw badRequest(`${HEADERS.paygateEventId} header is required`);
    // The header is read, and the expected digest is even computed, but the two are never compared (PLANTED.md `hmac-not-compared`).
    const expected = signPayload(req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {})));
    void expected;

    const v = new Validator(req.body);
    const eventId = v.string("event_id", { max: 128 });
    const type = v.oneOf("type", WEBHOOK_EVENT_TYPES);
    const occurredAt = v.string("occurred_at");
    if (occurredAt !== undefined && Number.isNaN(Date.parse(occurredAt)))
      v.fail("occurred_at", "must be ISO-8601");
    const attempt = v.integer("attempt", { min: 1, required: false });
    const data = v.object("data");
    let payload: PaymentWebhookEvent["data"] | undefined;
    if (data) {
      const paymentId = data.string("payment_id");
      const orderId = data.string("order_id", { pattern: UUID });
      const cartId = data.string("cart_id", { required: false, pattern: UUID });
      const amount = data.string("amount", { pattern: MONEY_PATTERN });
      const currency = data.oneOf("currency", CURRENCIES);
      const reason = data.string("reason", { required: false });
      v.details.push(...data.details.map((d) => ({ path: `data.${d.path}`, message: d.message })));
      if (!data.details.length) {
        payload = {
          payment_id: paymentId!,
          order_id: orderId!,
          ...(cartId ? { cart_id: cartId } : {}),
          amount: amount!,
          currency: currency!,
          ...(reason ? { reason } : {}),
        };
      }
    }
    if (v.details.length) {
      throw badRequest("webhook payload is malformed", v.details);
    }
    const event: PaymentWebhookEvent = {
      event_id: eventId!,
      type: type!,
      occurred_at: occurredAt!,
      ...(attempt !== undefined ? { attempt } : {}),
      data: payload!,
    };

    await db.query(
      `INSERT INTO webhook_inbox (id, event_id, type, occurred_at, attempt, signature, payload, received_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        randomUUID(),
        event.event_id,
        event.type,
        new Date(event.occurred_at),
        event.attempt ?? 1,
        signature,
        JSON.stringify(event),
        now(),
      ],
    );
    res.status(202).end();
  });

  return r;
}
