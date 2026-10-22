import { createServer, type Server } from "node:http";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startServer, type PayGateServer } from "../src/server.js";
import { verify } from "../src/signing.js";

const SECRET = "harbourline-local-paygate-secret";
const received: Array<{ headers: Record<string, string | string[] | undefined>; body: string }> =
  [];

let receiver: Server;
let receiverUrl: string;
let paygate: PayGateServer;

beforeAll(async () => {
  receiver = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      received.push({ headers: req.headers, body: Buffer.concat(chunks).toString() });
      res.writeHead(202).end("{}");
    });
  });
  await new Promise<void>((r) => receiver.listen(0, r));
  const addr = receiver.address();
  receiverUrl = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}/webhooks/payments`;
  paygate = await startServer({
    port: 0,
    webhookUrl: receiverUrl,
    secret: SECRET,
    knobs: {},
    log: () => {},
  });
});

afterAll(async () => {
  await paygate.close();
  await new Promise<void>((r) => receiver.close(() => r()));
});

async function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(`${paygate.url}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return {
    status: res.status,
    json: res.headers.get("content-type")?.includes("json") ? await res.json() : null,
    res,
  };
}

describe("hosted checkout", () => {
  it("creates a session shaped like CheckoutResult.payment", async () => {
    const { status, json } = await post("/checkout/sessions", {
      orderId: "11111111-1111-4111-8111-111111111111",
      cartId: "22222222-2222-4222-8222-222222222222",
      brand: "lumen-home",
      amount: "59.04",
      currency: "USD",
      paymentId: "pay_lampweek_0001",
    });
    expect(status).toBe(201);
    expect(json.provider).toBe("paygate-fake");
    expect(json.paymentId).toBe("pay_lampweek_0001");
    expect(json.redirectUrl).toMatch(/\/checkout\/cs_[0-9a-f]+$/);
    const page = await fetch(json.redirectUrl.replace(/^http:\/\/localhost:\d+/, paygate.url));
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("Pay $59.04");
  });

  it("rejects incomplete sessions", async () => {
    expect((await post("/checkout/sessions", { amount: "1.00" })).status).toBe(400);
  });

  it("completing the checkout fires one signed payment.succeeded webhook", async () => {
    received.length = 0;
    const session = (
      await post("/checkout/sessions", {
        orderId: "o-1",
        brand: "x",
        amount: "10.00",
        currency: "EUR",
      })
    ).json;
    const { status, json } = await post(`/checkout/${session.sessionId}/complete`, {
      outcome: "succeeded",
    });
    expect(status).toBe(200);
    expect(json.event.type).toBe("payment.succeeded");
    expect(json.deliveries.map((d: { status: number }) => d.status)).toEqual([202]);
    expect(received).toHaveLength(1);
    expect(received[0].headers["x-paygate-event-id"]).toBe(json.event.event_id);
    expect(
      verify(SECRET, received[0].body, received[0].headers["x-paygate-signature"] as string),
    ).toBe(true);
    expect(JSON.parse(received[0].body).data).toMatchObject({
      order_id: "o-1",
      amount: "10.00",
      currency: "EUR",
    });
    expect(
      (await post(`/checkout/${session.sessionId}/complete`, { outcome: "succeeded" })).status,
    ).toBe(409);
  });

  it("a browser form post redirects back to the return URL", async () => {
    const session = (
      await post("/checkout/sessions", {
        orderId: "o-2",
        brand: "x",
        amount: "10.00",
        currency: "EUR",
        returnUrl: "http://shop.test/orders/o-2",
      })
    ).json;
    const res = await fetch(`${paygate.url}/checkout/${session.sessionId}/complete`, {
      method: "POST",
      redirect: "manual",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "text/html" },
      body: "outcome=failed",
    });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://shop.test/orders/o-2");
    expect(paygate.sessions.get(session.sessionId)?.status).toBe("failed");
  });

  it("refund and chargeback only follow a success", async () => {
    const session = (
      await post("/checkout/sessions", {
        orderId: "o-3",
        brand: "x",
        amount: "10.00",
        currency: "EUR",
      })
    ).json;
    expect((await post(`/checkout/${session.sessionId}/refund`, {})).status).toBe(409);
    await post(`/checkout/${session.sessionId}/complete`, { outcome: "succeeded" });
    const { json } = await post(`/checkout/${session.sessionId}/refund`, {
      reason: "customer_request",
    });
    expect(json.event.type).toBe("payment.refunded");
    expect(json.event.data.reason).toBe("customer_request");
  });
});

describe("knobs", () => {
  it("--duplicate delivers the same event_id twice", async () => {
    received.length = 0;
    await fetch(`${paygate.url}/knobs`, {
      method: "PUT",
      body: JSON.stringify({ duplicate: true }),
    });
    const { json } = await post("/admin/fire", {
      type: "payment.succeeded",
      orderId: "11111111-1111-4111-8111-111111111111",
      amount: "59.04",
      currency: "USD",
      eventId: "evt_dup_001",
    });
    expect(
      json.deliveries.map((d: { event_id: string; attempt: number }) => [d.event_id, d.attempt]),
    ).toEqual([
      ["evt_dup_001", 1],
      ["evt_dup_001", 2],
    ]);
    expect(received.map((r) => r.headers["x-paygate-event-id"])).toEqual([
      "evt_dup_001",
      "evt_dup_001",
    ]);
    await fetch(`${paygate.url}/knobs`, {
      method: "PUT",
      body: JSON.stringify({ duplicate: false }),
    });
  });

  it("per-request --delay is honoured and reported on /health and /deliveries", async () => {
    const started = Date.now();
    await post("/admin/fire", { orderId: "o", amount: "1.00", currency: "USD", delayMs: 150 });
    expect(Date.now() - started).toBeGreaterThanOrEqual(130);
    const health = await (await fetch(`${paygate.url}/health`)).json();
    expect(health.ok).toBe(true);
    const { deliveries } = await (await fetch(`${paygate.url}/deliveries`)).json();
    expect(deliveries.length).toBeGreaterThanOrEqual(1);
  });
});
