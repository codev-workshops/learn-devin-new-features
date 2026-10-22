---
trigger: glob
globs: ["services/api/src/**", "packages/contracts/**", "apps/web/src/**"]
---

# Sale pricing guard

- A sale price is a `Money` decimal string with two fractional digits and the brand's currency (Lumen Home USD, Trailhead Supply EUR). Never a float, never a percentage stored in place of a price.
- Lumen Home adds 8.25% tax at checkout; Trailhead Supply list prices already include 19% VAT. A discount applies to the list price before tax for Lumen and to the VAT-inclusive price for Trailhead.
- Stock for a sale SKU is reserved at checkout, not at add-to-cart. A sale must not change that order.
