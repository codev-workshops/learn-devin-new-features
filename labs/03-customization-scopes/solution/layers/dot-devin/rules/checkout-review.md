---
trigger: glob
globs: ["services/api/src/**/*.ts", "apps/web/src/**"]
description: Platform checkout-review checklist for both brands
---

# Checkout review checklist (Platform, both brands)

Owner: Platform team (`.github/CODEOWNERS`). Brand teams own their own rule files under `.devin/rules/<brand>-*.md` and never need to edit this one.

- [review.checklist] On every change to checkout, carts, orders or money, run the `checkout-review` skill and paste its checklist into the PR description.
- [money.boundary] Money crosses every boundary as a decimal string with two fractional digits plus a currency code; never a float.
- [brand.scope] Every read and write is scoped by `X-Kade-Brand`; check the caller's brand against the resource's brand.
- [tax.presentation:defer] Tax presentation follows the brand's own rule file; this checklist only asks that the brand rule was applied and cited.
- [tax.rounding:defer] Rounding follows the brand's own rule file.
- [planted.defects] Never fix a planted defect on `main`; demonstrate on a throwaway branch.
