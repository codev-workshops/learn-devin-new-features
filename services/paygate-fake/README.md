# @harbourline/paygate-fake

A fake payment service provider for Harbourline. It stands in for "PayGate": a hosted-checkout page the
shopper is redirected to, plus HMAC-SHA256 signed webhooks (`X-PayGate-Signature: sha256=<hex>`,
`X-PayGate-Event-Id`) that follow `PaymentWebhookEvent` in `packages/contracts/openapi.yaml`.

The point of this service is to misbehave on demand, the way real PSPs do in production:

| Knob             | Effect                                                                     | Teaches                      |
| ---------------- | -------------------------------------------------------------------------- | ---------------------------- |
| `--duplicate`    | every event is delivered twice with the **same** `event_id` (attempt 1, 2) | duplicate-webhook plant      |
| `--out-of-order` | a batch is delivered in reverse (refund before success)                    | ordering / state machines    |
| `--delay MS`     | wait before the first delivery (a late webhook)                            | abandoned-cart-sweeper plant |

## Run

```sh
pnpm --filter @harbourline/paygate-fake run build
node services/paygate-fake/dist/cli.js serve --port 3002 --webhook-url http://localhost:3001/webhooks/payments [--duplicate] [--out-of-order] [--delay 5000]

# fire one event straight at a receiver (used by scripts/demo-duplicate-webhook.sh in the worker)
node services/paygate-fake/dist/cli.js fire --duplicate --order-id <uuid> --amount 59.04 --currency USD \
  --payment-id pay_lampweek_0001 --webhook-url http://localhost:3003/webhooks/payments
node services/paygate-fake/dist/cli.js fire --out-of-order --then payment.refunded --order-id <uuid> --amount 189.00 --currency EUR
```

Environment: `PAYGATE_PORT` (3002), `PAYGATE_SECRET` (`harbourline-local-paygate-secret`), `PAYGATE_WEBHOOK_URL`,
`PAYGATE_PUBLIC_URL` (what `redirectUrl` is built from).

## HTTP surface

| Method & path                                     | Purpose                                                                                                                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /checkout/sessions`                         | `{orderId, cartId?, brand, amount, currency, paymentId?, returnUrl?}` → `CheckoutResult.payment` shape (`paymentId`, `provider`, `redirectUrl`, `expiresAt`, `sessionId`) |
| `GET /checkout/:id`                               | Hosted checkout page with **Pay** / **Decline** buttons                                                                                                                   |
| `POST /checkout/:id/complete`                     | `{outcome: succeeded\|failed, reason?}` (JSON or form) → fires `payment.succeeded`/`failed`                                                                               |
| `POST /checkout/:id/refund`                       | fires `payment.refunded`                                                                                                                                                  |
| `POST /checkout/:id/chargeback`                   | fires `chargeback.opened`                                                                                                                                                 |
| `POST /admin/fire`                                | fire an arbitrary event; per-request `duplicate`, `outOfOrder`, `delayMs` overrides                                                                                       |
| `GET/PUT /knobs`                                  | read or change the delivery knobs at runtime                                                                                                                              |
| `GET /sessions`, `GET /deliveries`, `GET /health` | inspection                                                                                                                                                                |

Amounts are decimal strings with two fractional digits; the service refuses anything else (no floats cross a boundary).

## Gates

```sh
pnpm --filter @harbourline/paygate-fake run lint    # eslint (extends the root config) + prettier --check + tsc --noEmit
pnpm --filter @harbourline/paygate-fake test        # vitest: signing, delivery plan/knobs, HTTP surface against a local receiver
pnpm --filter @harbourline/paygate-fake run build
```

Docker: `docker build -f services/paygate-fake/Dockerfile -t harbourline-paygate-fake .` from the repo root (the build
needs the shared workspace lockfile); `docker-compose.services.yml` wires it to Postgres-side services.
