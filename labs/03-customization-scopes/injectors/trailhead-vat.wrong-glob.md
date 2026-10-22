---
trigger: glob
globs: ["service/api/src/money.ts", "src/routes/*.ts"]
description: Trailhead Supply VAT rules (owned by the Trailhead team)
---

# Trailhead Supply — VAT (Trailhead team)

- [brand.applies] Path globs cannot tell the brands apart (these files serve Lumen Home too), so every statement below applies only to `trailhead-supply` baskets and orders (`X-Harbourline-Brand: trailhead-supply`); Lumen Home keeps its 8.25% tax-exclusive rules.
- [tax.presentation] Trailhead list prices include 19% VAT: the order total is the sum of the lines plus shipping, VAT is shown as "incl. 19% VAT" and is never added on top.
- [tax.rounding] VAT is extracted from the gross amount and must match the fulfilment worker's Decimal result to the cent; a one-cent difference is a reconciliation defect, not a display choice.
