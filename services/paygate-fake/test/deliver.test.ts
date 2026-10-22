import { describe, expect, it } from "vitest";

import { deliver, plan, type Fetcher } from "../src/deliver.js";
import { buildEvent } from "../src/events.js";
import { verify } from "../src/signing.js";

const input = {
  type: "payment.succeeded",
  paymentId: "pay_1",
  orderId: "11111111-1111-4111-8111-111111111111",
  amount: "59.04",
  currency: "USD",
  eventId: "evt_a",
} as const;
const succeeded = buildEvent(input);
const refunded = buildEvent({ ...input, type: "payment.refunded", eventId: "evt_b" });

describe("plan", () => {
  it("delivers once, in order, by default", () => {
    expect(plan([succeeded, refunded]).map((e) => [e.event_id, e.attempt])).toEqual([
      ["evt_a", 1],
      ["evt_b", 1],
    ]);
  });

  it("--duplicate repeats every event with the same event_id", () => {
    expect(plan([succeeded], { duplicate: true }).map((e) => [e.event_id, e.attempt])).toEqual([
      ["evt_a", 1],
      ["evt_a", 2],
    ]);
  });

  it("--out-of-order reverses the batch (refund before success)", () => {
    expect(plan([succeeded, refunded], { outOfOrder: true }).map((e) => e.type)).toEqual([
      "payment.refunded",
      "payment.succeeded",
    ]);
  });
});

describe("deliver", () => {
  it("signs the exact body it sends and records statuses", async () => {
    const seen: Array<{ url: string; headers: Record<string, string>; body: string }> = [];
    const fetcher: Fetcher = async (url, init) => {
      seen.push({ url, headers: init.headers, body: init.body });
      return { status: 202 };
    };
    const target = { webhookUrl: "http://api/webhooks/payments", secret: "s3" };
    const result = await deliver([succeeded], target, { duplicate: true }, fetcher);
    expect(result.map((d) => d.status)).toEqual([202, 202]);
    expect(seen).toHaveLength(2);
    for (const call of seen) {
      expect(call.url).toBe(target.webhookUrl);
      expect(call.headers["X-PayGate-Event-Id"]).toBe("evt_a");
      expect(verify("s3", call.body, call.headers["X-PayGate-Signature"])).toBe(true);
    }
    expect(JSON.parse(seen[1].body).attempt).toBe(2);
  });

  it("--delay waits before the first delivery", async () => {
    const fetcher: Fetcher = async () => ({ status: 202 });
    const started = Date.now();
    await deliver([succeeded], { webhookUrl: "x", secret: "s" }, { delayMs: 120 }, fetcher);
    expect(Date.now() - started).toBeGreaterThanOrEqual(100);
  });

  it("records transport errors instead of throwing", async () => {
    const fetcher: Fetcher = async () => {
      throw new Error("ECONNREFUSED");
    };
    const [d] = await deliver([succeeded], { webhookUrl: "x", secret: "s" }, {}, fetcher);
    expect(d.status).toBeNull();
    expect(d.error).toContain("ECONNREFUSED");
  });
});

describe("buildEvent", () => {
  it("refuses float-ish money and unknown currencies", () => {
    expect(() => buildEvent({ ...input, amount: "59.0" })).toThrow(/two-fractional/);
    expect(() => buildEvent({ ...input, currency: "GBP" as never })).toThrow(/currency/);
  });
});
