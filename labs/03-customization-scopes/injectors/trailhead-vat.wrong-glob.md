---
trigger: glob
globs: ["service/api/src/money.ts", "src/routes/*.ts"]
description: Trailhead Supply VAT rules (owned by the Trailhead team)
---

# Trailhead Supply — VAT (Trailhead team)

- [tax.presentation] Trailhead list prices include 19% VAT: the order total is the sum of the lines plus shipping, VAT is shown as "incl. 19% VAT" and is never added on top.
- [tax.rounding] VAT is extracted from the gross amount and must match the fulfilment worker's Decimal result to the cent; a one-cent difference is a reconciliation defect, not a display choice.
