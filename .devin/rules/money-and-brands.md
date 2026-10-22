---
trigger: glob
globs: ["services/**", "apps/**", "db/**"]
---

# Money and brand scoping

- Money is a decimal string in major units with two fractional digits plus an ISO 4217 code (`Money` in `packages/contracts/openapi.yaml`). Lumen Home is USD and tax-exclusive (8.25% at checkout); Trailhead Supply is EUR with 19% VAT included in list prices.
- Every API read and write is scoped by `X-Harbourline-Brand`. When you add a route, check the caller's brand against the resource's brand, not just that the row exists.
- Use `@harbourline/contracts` constants (`HEADERS`, `ORDER_STATUSES`, `WEBHOOK_EVENT_TYPES`) instead of string literals.
