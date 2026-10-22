---
name: flash-sale-release
description: The one Harbourline flash-sale release checklist. Use before shipping any change that a brand's flash sale depends on (prices, stock, checkout, banners).
argument-hint: "<brand> <sale-start-iso>"
---

# Flash-sale release checklist

Run every step in order and report each as done / skipped (with the reason) / blocked.

1. **Window.** Confirm the sale start time and brand from the argument. If the sale starts in under two hours, stop and ask for a release owner's go-ahead.
2. **Gates.** `pnpm gates` on the release branch with the latest `origin/main` merged in. Any red gate blocks the release.
3. **Sale SKUs.** For each SKU in the sale, read on-hand and reserved stock through the API (`GET /catalog/products/:sku` with the brand header). Flag any SKU with fewer than 10 units on hand.
4. **Money.** Check each sale price against the `sale-pricing` rule: decimal string, brand currency, tax treatment.
5. **Checkout smoke.** One cart and one checkout per brand against the lab database, with the fake payment provider.
6. **Release-checker.** Ask the `harbourline-flash-sale:release-checker` subagent to review the diff for stock and money changes. Its "block" verdict blocks the release.
7. **Freeze.** Record the freeze window and confirm `HARBOURLINE_SALE_FREEZE=1` will be set for it.
8. **Hand-off.** Post the checklist result and the on-call contact for the window.
