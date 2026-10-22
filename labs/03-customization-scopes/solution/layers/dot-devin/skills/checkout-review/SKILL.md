---
name: checkout-review
description: Platform checkout-review checklist for Harbourline PRs that touch checkout, carts, orders or money. Applies the brand's own rule file before the shared checklist.
triggers: ["user"]
---

# Checkout review (Platform, repo skill)

1. List the brand rule files that apply to the changed paths (`.devin/rules/<brand>-*.md`, nested `AGENTS.md`) and quote the statement each one makes about tax and rounding.
2. Walk the shared checklist in `.devin/rules/checkout-review.md`; where a statement defers, cite the brand rule instead.
3. Run `pnpm gates`; for money changes also run the planted-defect tests on a throwaway branch only.
4. Paste the checklist with one line of evidence per item into the PR description.
