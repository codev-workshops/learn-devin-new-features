import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

import { deliver, type Delivery, type Knobs, type Target } from "./deliver.js";
import { buildEvent, isEventType, type Currency, type PaymentWebhookEvent } from "./events.js";
import { checkoutPage } from "./html.js";
import { SessionError, SessionStore } from "./sessions.js";

export interface ServerOptions {
  port: number;
  webhookUrl: string;
  secret: string;
  knobs: Knobs;
  publicUrl?: string;
  log?: (line: string) => void;
}

export interface PayGateServer {
  server: Server;
  sessions: SessionStore;
  deliveries: Delivery[];
  knobs: Knobs;
  port: number;
  url: string;
  close(): Promise<void>;
}

function json(res: ServerResponse, status: number, body: unknown): void {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  });
  res.end(data);
}

function html(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(body);
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  const type = req.headers["content-type"] ?? "";
  if (type.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new SessionError(400, "body is not JSON");
  }
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export function startServer(opts: ServerOptions): Promise<PayGateServer> {
  const sessions = new SessionStore();
  const deliveries: Delivery[] = [];
  const knobs: Knobs = { ...opts.knobs };
  const log = opts.log ?? ((line: string) => console.log(line));
  const target: Target = { webhookUrl: opts.webhookUrl, secret: opts.secret };

  const fire = async (events: PaymentWebhookEvent[], override?: Knobs) => {
    const result = await deliver(events, target, { ...knobs, ...override });
    deliveries.push(...result);
    for (const d of result) {
      log(`webhook ${d.type} ${d.event_id} attempt=${d.attempt} -> ${d.status ?? d.error}`);
    }
    return result;
  };

  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const parts = url.pathname.split("/").filter(Boolean);
    try {
      if (req.method === "GET" && url.pathname === "/health") {
        return json(res, 200, {
          ok: true,
          knobs,
          sessions: sessions.list().length,
          deliveries: deliveries.length,
        });
      }
      if (req.method === "GET" && url.pathname === "/deliveries")
        return json(res, 200, { deliveries });
      if (req.method === "GET" && url.pathname === "/sessions")
        return json(res, 200, { sessions: sessions.list() });
      if (req.method === "GET" && url.pathname === "/knobs") return json(res, 200, knobs);
      if (req.method === "PUT" && url.pathname === "/knobs") {
        const body = await readBody(req);
        if (typeof body.duplicate === "boolean") knobs.duplicate = body.duplicate;
        if (typeof body.outOfOrder === "boolean") knobs.outOfOrder = body.outOfOrder;
        if (typeof body.delayMs === "number") knobs.delayMs = body.delayMs;
        if (typeof body.gapMs === "number") knobs.gapMs = body.gapMs;
        return json(res, 200, knobs);
      }

      if (req.method === "POST" && url.pathname === "/checkout/sessions") {
        const body = await readBody(req);
        const orderId = str(body.orderId ?? body.order_id);
        const amount = str(body.amount);
        const currency = str(body.currency) as Currency | undefined;
        const brand = str(body.brand) ?? "kade";
        if (!orderId || !amount || !currency) {
          return json(res, 400, {
            code: "bad_request",
            message: "orderId, amount and currency are required",
          });
        }
        const session = sessions.create({
          orderId,
          cartId: str(body.cartId ?? body.cart_id),
          brand,
          amount,
          currency,
          customerEmail: str(body.customerEmail),
          returnUrl: str(body.returnUrl),
          paymentId: str(body.paymentId ?? body.payment_id),
        });
        const base = opts.publicUrl ?? `http://localhost:${opts.port}`;
        return json(res, 201, {
          paymentId: session.paymentId,
          provider: "paygate-fake",
          redirectUrl: `${base}/checkout/${session.id}`,
          expiresAt: session.expiresAt,
          sessionId: session.id,
        });
      }

      if (parts[0] === "checkout" && parts[1]) {
        const session = sessions.get(parts[1]);
        if (!session)
          return json(res, 404, { code: "not_found", message: `unknown session ${parts[1]}` });
        if (req.method === "GET" && parts.length === 2)
          return html(res, 200, checkoutPage(session, knobs));
        if (req.method === "POST" && parts[2] === "complete") {
          const body = await readBody(req);
          const outcome = str(body.outcome) === "failed" ? "failed" : "succeeded";
          const event = sessions.complete(session.id, outcome, str(body.reason));
          const result = await fire([event]);
          if ((req.headers.accept ?? "").includes("text/html")) {
            res.writeHead(303, { Location: session.returnUrl ?? `/checkout/${session.id}` });
            return res.end();
          }
          return json(res, 200, { session, event, deliveries: result });
        }
        if (req.method === "POST" && (parts[2] === "refund" || parts[2] === "chargeback")) {
          const body = await readBody(req);
          const event =
            parts[2] === "refund"
              ? sessions.refund(session.id, str(body.reason))
              : sessions.chargeback(session.id, str(body.reason));
          const result = await fire([event]);
          return json(res, 200, { session, event, deliveries: result });
        }
      }

      if (req.method === "POST" && url.pathname === "/admin/fire") {
        const body = await readBody(req);
        const type = str(body.type) ?? "payment.succeeded";
        const amount = str(body.amount);
        const orderId = str(body.orderId ?? body.order_id);
        const currency = str(body.currency) as Currency | undefined;
        if (!isEventType(type) || !amount || !orderId || !currency) {
          return json(res, 400, {
            code: "bad_request",
            message: "type, orderId, amount, currency required",
          });
        }
        const event = buildEvent({
          type,
          paymentId: str(body.paymentId ?? body.payment_id) ?? `pay_${orderId.slice(0, 8)}`,
          orderId,
          cartId: str(body.cartId ?? body.cart_id),
          amount,
          currency,
          reason: str(body.reason),
          eventId: str(body.eventId ?? body.event_id),
          occurredAt: str(body.occurredAt ?? body.occurred_at),
        });
        const override: Knobs = {};
        if (typeof body.duplicate === "boolean") override.duplicate = body.duplicate;
        if (typeof body.outOfOrder === "boolean") override.outOfOrder = body.outOfOrder;
        if (typeof body.delayMs === "number") override.delayMs = body.delayMs;
        const result = await fire([event], override);
        return json(res, 200, { event, deliveries: result });
      }

      return json(res, 404, { code: "not_found", message: url.pathname });
    } catch (err) {
      if (err instanceof SessionError)
        return json(res, err.status, { code: "conflict", message: err.message });
      const message = err instanceof Error ? err.message : String(err);
      return json(res, 500, { code: "internal", message });
    }
  };

  const server = createServer((req, res) => {
    void handler(req, res);
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(opts.port, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : opts.port;
      resolve({
        server,
        sessions,
        deliveries,
        knobs,
        port,
        url: `http://localhost:${port}`,
        close: () => new Promise<void>((done, fail) => server.close((e) => (e ? fail(e) : done()))),
      });
    });
  });
}
