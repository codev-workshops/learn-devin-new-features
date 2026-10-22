# @kade/contracts

Frozen W0 contracts for Kadé Commerce. Every W1 child builds against these files without waiting for the others.

| File             | What it fixes                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `openapi.yaml`   | Catalog, cart, checkout, orders, admin and `POST /webhooks/payments`; fake brand-header auth; errors    |
| `seed-spec.yaml` | Lumen Home (USD) and Trailhead Supply (EUR): 60 SKUs, 400 orders, 30 carts, 12 webhooks, planted plants |
| `src/index.ts`   | TypeScript types and constants mirroring the schemas (`HEADERS`, `ORDER_STATUSES`, `SeedSpec`, …)       |

Change requests go through the parent session as a W1-api follow-up PR (see root `AGENTS.md`).
