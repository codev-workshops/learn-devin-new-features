---
trigger: glob
globs: ["services/api/src/money.ts", "services/api/src/routes/{checkout,orders,carts}.ts", "services/api/src/services/{brands,orders,carts}.ts", "apps/web/src/**"]
description: Trailhead Supply VAT rules (owned by the Trailhead team)
---

# Trailhead Supply — VAT (Trailhead team)

Owner: Trailhead team (`.github/CODEOWNERS`). Platform reviews this file only if it touches another brand.

- [brand.applies] Path globs cannot tell the brands apart (these files serve Lumen Home too), so every statement below applies only to `trailhead-supply` baskets and orders (`X-Kade-Brand: trailhead-supply`); Lumen Home keeps its 8.25% tax-exclusive rules.
- [tax.presentation] Trailhead list prices include 19% VAT: the order total is the sum of the lines plus shipping, VAT is shown as "incl. 19% VAT" and is never added on top.
- [tax.rounding] VAT is extracted from the gross amount and must match the fulfilment worker's Decimal result to the cent; a one-cent difference is a reconciliation defect, not a display choice.
- [shipping.threshold] Shipping is free from €80.00 gross; the threshold compares the VAT-inclusive subtotal.
