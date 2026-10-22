import { setTimeout as sleep } from "node:timers/promises";

import type { PaymentWebhookEvent } from "./events.js";
import { sign } from "./signing.js";

/**
 * Delivery knobs. They model what a real PSP does to you in production:
 *  - duplicate:   every event is delivered twice with the SAME event_id (attempt 1 and 2)
 *  - outOfOrder:  the batch is delivered in reverse order (e.g. refund before success)
 *  - delayMs:     wait before the first delivery (late webhook after a cart was swept)
 *  - gapMs:       pause between deliveries (default 0)
 */
export interface Knobs {
  duplicate?: boolean;
  outOfOrder?: boolean;
  delayMs?: number;
  gapMs?: number;
}

export interface Target {
  webhookUrl: string;
  secret: string;
  timeoutMs?: number;
}

export interface Delivery {
  event_id: string;
  type: string;
  attempt: number;
  status: number | null;
  error?: string;
  sent_at: string;
  body: string;
}

export interface Fetcher {
  (
    url: string,
    init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal },
  ): Promise<{
    status: number;
  }>;
}

/** Pure: turn a batch of events into the ordered list of deliveries the knobs demand. */
export function plan(events: PaymentWebhookEvent[], knobs: Knobs = {}): PaymentWebhookEvent[] {
  const ordered = knobs.outOfOrder ? [...events].reverse() : [...events];
  if (!knobs.duplicate) return ordered;
  const out: PaymentWebhookEvent[] = [];
  for (const event of ordered) {
    out.push({ ...event, attempt: 1 });
    out.push({ ...event, attempt: 2 });
  }
  return out;
}

export async function deliverOne(
  event: PaymentWebhookEvent,
  target: Target,
  fetcher: Fetcher = fetch as unknown as Fetcher,
): Promise<Delivery> {
  const body = JSON.stringify(event);
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "paygate-fake/0.1",
    "X-PayGate-Event-Id": event.event_id,
    "X-PayGate-Signature": sign(target.secret, body),
    "X-PayGate-Attempt": String(event.attempt),
  };
  const record: Delivery = {
    event_id: event.event_id,
    type: event.type,
    attempt: event.attempt,
    status: null,
    sent_at: new Date().toISOString(),
    body,
  };
  try {
    const res = await fetcher(target.webhookUrl, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(target.timeoutMs ?? 5000),
    });
    record.status = res.status;
  } catch (err) {
    record.error = err instanceof Error ? err.message : String(err);
  }
  return record;
}

export async function deliver(
  events: PaymentWebhookEvent[],
  target: Target,
  knobs: Knobs = {},
  fetcher?: Fetcher,
): Promise<Delivery[]> {
  const sequence = plan(events, knobs);
  if (knobs.delayMs && knobs.delayMs > 0) await sleep(knobs.delayMs);
  const out: Delivery[] = [];
  for (const [i, event] of sequence.entries()) {
    if (i > 0 && knobs.gapMs && knobs.gapMs > 0) await sleep(knobs.gapMs);
    out.push(await deliverOne(event, target, fetcher));
  }
  return out;
}
