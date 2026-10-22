# AGENTS.md — services/paygate-fake (owner: W1-worker)

- Node 22, TypeScript (ESM, `NodeNext`), no runtime dependencies. Gates: `pnpm lint`, `pnpm test`, `pnpm build`
  in this workspace; the root `pnpm gates` runs them too.
- Webhook bodies must stay byte-compatible with `PaymentWebhookEvent` in `packages/contracts/openapi.yaml`;
  signatures are `sha256=<hex HMAC-SHA256 of the raw body>` under `PAYGATE_SECRET`, verified by
  `services/fulfilment-worker/src/fulfilment_worker/signing.py`.
- The knobs (`--duplicate`, `--out-of-order`, `--delay`) are the product: labs rely on them to trigger the planted
  defects described in `services/fulfilment-worker/PLANTED.md`. Do not make delivery idempotent or ordered.
- This service never persists anything; sessions live in memory for the lifetime of the process.
