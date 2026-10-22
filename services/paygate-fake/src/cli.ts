#!/usr/bin/env node
import { parseArgs } from "node:util";

import { deliver, type Knobs } from "./deliver.js";
import { buildEvent, isEventType, type Currency } from "./events.js";
import { startServer } from "./server.js";

const USAGE = `paygate-fake — fake PSP for Kadé Commerce

  paygate-fake serve [--port 3002] [--webhook-url URL] [--secret S] [--duplicate] [--out-of-order] [--delay MS]
  paygate-fake fire  --order-id UUID --amount 59.04 --currency USD [--type payment.succeeded]
                     [--payment-id ID] [--cart-id UUID] [--event-id ID] [--reason TEXT]
                     [--webhook-url URL] [--secret S] [--duplicate] [--out-of-order] [--delay MS]
                     [--then TYPE]   (fire a second event after the first; with --out-of-order it arrives first)

Environment: PAYGATE_PORT, PAYGATE_SECRET, PAYGATE_WEBHOOK_URL, PAYGATE_PUBLIC_URL.
Knobs:
  --duplicate     deliver every event twice with the same event_id (attempt 1 and 2)
  --out-of-order  reverse the delivery order of a batch
  --delay MS      wait MS before the first delivery (a late webhook)
`;

const options = {
  port: { type: "string" },
  "webhook-url": { type: "string" },
  "public-url": { type: "string" },
  secret: { type: "string" },
  duplicate: { type: "boolean", default: false },
  "out-of-order": { type: "boolean", default: false },
  delay: { type: "string" },
  gap: { type: "string" },
  type: { type: "string" },
  then: { type: "string" },
  "order-id": { type: "string" },
  "payment-id": { type: "string" },
  "cart-id": { type: "string" },
  "event-id": { type: "string" },
  amount: { type: "string" },
  currency: { type: "string" },
  reason: { type: "string" },
  json: { type: "boolean", default: false },
  help: { type: "boolean", short: "h", default: false },
} as const;

export async function main(argv = process.argv.slice(2), env = process.env): Promise<number> {
  const { values, positionals } = parseArgs({ args: argv, options, allowPositionals: true });
  const command = positionals[0];
  if (values.help || !command) {
    console.log(USAGE);
    return values.help ? 0 : 2;
  }
  const knobs: Knobs = {
    duplicate: values.duplicate,
    outOfOrder: values["out-of-order"],
    delayMs: values.delay ? Number(values.delay) : 0,
    gapMs: values.gap ? Number(values.gap) : 0,
  };
  const secret = values.secret ?? env.PAYGATE_SECRET ?? "kade-local-paygate-secret";
  const webhookUrl =
    values["webhook-url"] ?? env.PAYGATE_WEBHOOK_URL ?? "http://localhost:3001/webhooks/payments";

  if (command === "serve") {
    const port = Number(values.port ?? env.PAYGATE_PORT ?? 3002);
    const server = await startServer({
      port,
      webhookUrl,
      secret,
      knobs,
      publicUrl: values["public-url"] ?? env.PAYGATE_PUBLIC_URL,
    });
    console.log(
      `paygate-fake listening on ${server.url} -> ${webhookUrl} knobs=${JSON.stringify(knobs)}`,
    );
    await new Promise<void>((resolve) => {
      for (const sig of ["SIGINT", "SIGTERM"] as const) process.once(sig, () => resolve());
    });
    await server.close();
    return 0;
  }

  if (command === "fire") {
    const type = values.type ?? "payment.succeeded";
    const orderId = values["order-id"];
    const amount = values.amount;
    const currency = values.currency as Currency | undefined;
    if (!isEventType(type) || !orderId || !amount || !currency) {
      console.error("fire needs --order-id, --amount, --currency and a valid --type\n" + USAGE);
      return 2;
    }
    const input = {
      type,
      paymentId: values["payment-id"] ?? `pay_${orderId.slice(0, 8)}`,
      orderId,
      cartId: values["cart-id"],
      amount,
      currency,
      reason: values.reason,
      eventId: values["event-id"],
    };
    const events = [buildEvent(input)];
    if (values.then) {
      if (!isEventType(values.then)) {
        console.error(`--then must be one of the webhook event types, got ${values.then}`);
        return 2;
      }
      events.push(buildEvent({ ...input, type: values.then, eventId: undefined }));
    }
    const result = await deliver(events, { webhookUrl, secret }, knobs);
    if (values.json) console.log(JSON.stringify(result, null, 2));
    else
      for (const d of result)
        console.log(`${d.type} ${d.event_id} attempt=${d.attempt} -> ${d.status ?? d.error}`);
    return result.every((d) => d.status !== null && d.status < 300) ? 0 : 1;
  }

  console.error(`unknown command ${command}\n` + USAGE);
  return 2;
}

const invokedDirectly =
  typeof process.argv[1] === "string" && /[\\/]cli\.(js|ts)$/.test(process.argv[1]);
if (invokedDirectly) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(err);
      process.exit(1);
    },
  );
}
