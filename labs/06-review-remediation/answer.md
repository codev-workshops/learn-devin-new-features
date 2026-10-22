## Feature fit

- **Devin Review** reviews the PR diff and sorts what it finds into **Bugs** (actionable; Severe or Non-severe), **Flags** (*Investigate*: verify it yourself; *Informational*: explains how the code works) and a **Security** section. Security scanning runs on every review and cannot be turned off; the posting settings only control what is posted to GitHub. That is why the self-declared-role override appears even though nobody asked for a security review.
- **Effort level.** Trigger actions can set a review effort level and enterprise admins pick the default. For a change to totals and tax a week before Black Friday, pick the highest level your org offers and say why: the expensive failure is a missed one-cent bug, not a slower review. A docs-only PR gets the default.
- **Quote a finding into chat.** The copy button on a finding copies its location, explanation and suggested change. You can also ask Devin from any comment, bug or flag. Paste the finding and ask a question you can check: "Which inputs make `toCents` differ from `roundHalfUp`? Give one seeded SKU and quantity."
- **Re-review.** New commits on the PR get a new review. When the diff against the base branch is unchanged (an empty commit, a merge of an unmoved `main`, a restack), Devin Review skips the re-review — it has nothing new to say, and that is not a failure.
- **Review rules.** By default Devin Review reads `**/REVIEW.md` as review context. Review settings now has a rules editor: review rules and exclusions sit in one list of rule cards, each with its target picked inline. A rule is only as good as its target and its wording.

## Worked sequence

1. Open PR #26 (`lab06/price-drift-fix`). Before you run anything, read the diff for two minutes and write down what you expect a reviewer to find. That gives you something to compare with Devin's findings.
2. Run Devin Review at the effort level you chose; note the level in your evidence.
3. Sort the findings (`fixtures/review-findings.json` is the reference). F1 and F2 are Bugs; F3 is an Investigate flag; F4 is informational; F5 is the rule problem.
4. Copy F2 into the chat. Ask for a seeded SKU and quantity that break it, then confirm with the test below. Two €19.90 socks: `19.90 * 2 * 100` is `3979.9999999999995`, so `Math.floor` gives 39.79. Three socks happen to come out right (59.70), so a quick spot check misses it.
5. Cut `lab06/<handle>` from the PR branch. Add the test first and run it: both cases fail on the PR's code.
6. Fix: remove `priceOverrides` (no client-controlled field may change a price, and `X-Kade-Role` is self-declared), drop `toCents` and pass `unitPrice` and `quantity` to `computeTotals` unchanged, and move re-pricing before the transaction opens (this resolves F3). Do not touch `money.ts`: `currency-rounding` is a separate plant and stays as it is.
7. Replace the review rule (F5): target every money computation under `services/api/src/**`, not one file. Ban rounding outside `money.ts` and client-controlled price inputs. If you have admin access, add it as a rule card in the rules editor too, so a PR cannot weaken it by editing `REVIEW.md`.
8. Push and open your remediation PR against `main`, marked do-not-merge. Re-review: F1, F2, F3 and F5 should be gone. F4 remains as informational.
9. Unchanged-diff injector: push an empty commit and request a review. Expect the skip, and say why.
10. Reply on the F3 thread: "Moved re-pricing out of the transaction in <commit>; the transaction now issues the same statements as main." Close both PRs unmerged.

Regression test used as evidence (`services/api/test/review-remediation.test.ts` on your branch):

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ADDRESS, LUMEN, LUMEN_CUSTOMER, TRAILHEAD, TRAILHEAD_CUSTOMER, as, cartWith, harness, type Harness } from "./helpers.js";

let h: Harness;
beforeAll(() => { h = harness(); });
afterAll(() => h.close());

describe("lab06 remediation", () => {
  it("rounding: 2 x TS-SOCK-01-M checks out at 39.80 EUR", async () => {
    const cartId = await cartWith(h, TRAILHEAD, TRAILHEAD_CUSTOMER, [{ sku: "TS-SOCK-01-M", quantity: 2 }]);
    const res = await h.api.post("/checkout").set(as(TRAILHEAD, TRAILHEAD_CUSTOMER)).send({ cartId, email: TRAILHEAD_CUSTOMER, shippingAddress: ADDRESS }).expect(201);
    console.log("PROBE order", JSON.stringify({ ...res.body.order, lines: undefined }));
    expect(res.body.order.totals.subtotal.amount).toBe("39.80");
  });
  it("security: a customer cannot pin a price by self-declaring a staff role", async () => {
    const cartId = await cartWith(h, LUMEN, LUMEN_CUSTOMER, [{ sku: "LH-LAMP-05", quantity: 1 }]);
    const res = await h.api.post("/checkout").set(as(LUMEN, LUMEN_CUSTOMER, "merchandiser")).send({ cartId, email: LUMEN_CUSTOMER, shippingAddress: ADDRESS, priceOverrides: { "LH-LAMP-05": "0.01" } });
    console.log("PROBE status", res.status, JSON.stringify(res.body.order?.lines?.[0]?.unitPrice), JSON.stringify(res.body.order?.totals?.total));
    expect(res.body.order?.lines?.[0]?.unitPrice?.amount).not.toBe("0.01");
  });
});
```

Reference remediation (applied on top of the PR branch; 36 API tests pass, 5 plants still skipped):

```diff
diff --git a/services/api/REVIEW.md b/services/api/REVIEW.md
index d07c649..bc07411 100644
--- a/services/api/REVIEW.md
+++ b/services/api/REVIEW.md
@@ -1,4 +1,6 @@
 # Review rules — services/api
 
-- Money arithmetic lives in `src/money.ts`. Any change to `src/money.ts` must come with a test in `test/` that pins the rounded amounts for both brands.
-- Do not merge changes to checkout totals without a second reviewer from payments.
+- Any change under `src/**` that computes, rounds or overrides a price, tax or total needs a test in `test/` that pins the amounts for both brands (Lumen tax-exclusive, Trailhead VAT-inclusive), including a quantity of 2.
+- Rounding only through the helpers in `src/money.ts`; a new `Math.floor`, `Math.round` or `toFixed` on money elsewhere is a Bug.
+- No request field or header the client controls may change a price; `X-Kade-Role` is self-declared.
+- Changes to this file need a second reviewer from payments.
diff --git a/services/api/src/routes/checkout.ts b/services/api/src/routes/checkout.ts
index 560babc..581dce0 100644
--- a/services/api/src/routes/checkout.ts
+++ b/services/api/src/routes/checkout.ts
@@ -4,7 +4,7 @@ import type { Address, CheckoutResult } from "@kade/contracts";
 import type { Db } from "../db.js";
 import { config, now } from "../config.js";
 import { conflict, outOfStock, validationFailed } from "../errors.js";
-import { isStaff, requireCaller } from "../middleware/auth.js";
+import { requireCaller } from "../middleware/auth.js";
 import { Validator } from "../middleware/validate.js";
 import { brandPricing, getBrandRow, type BrandRow } from "../services/brands.js";
 import { getCartLines, getCartRow, type CartLineRow } from "../services/carts.js";
@@ -154,6 +154,18 @@ export function checkoutRouter(db: Db): Router {
     if (!lines.length) throw validationFailed([{ path: "cartId", message: "cart is empty" }]);
     const sellables = await describeLines(db, lines);
 
+    // Re-price every line from the current price list before the transaction opens, so flash-sale
+    // prices apply at checkout without holding inventory row changes while we query prices.
+    for (const line of lines) {
+      const sellable = await resolveSellable(db, brandRow.id, line.sku);
+      const current = await currentPrice(
+        db,
+        brandRow.id,
+        sellable?.sku ?? line.sku,
+        brandRow.currency,
+      );
+      line.unit_price = current.price.amount;
+    }
     const pricing = brandPricing(brandRow);
     const t = now();
     const id = randomUUID();
@@ -202,24 +214,8 @@ export function checkoutRouter(db: Db): Router {
         reservationsByLine.set(line.id, taken);
       }
 
-      // Re-price every line from the current price list so flash-sale prices apply at checkout.
-      // Staff may pin a goodwill price per SKU (customer-service requests) with `priceOverrides`.
-      const overrides = (req.body?.priceOverrides ?? {}) as Record<string, string>;
-      for (const line of lines) {
-        const sellable = await resolveSellable(tx, brandRow.id, line.sku);
-        const current = await currentPrice(
-          tx,
-          brandRow.id,
-          sellable?.sku ?? line.sku,
-          pricing.currency,
-        );
-        const pinned = isStaff(req.caller) ? overrides[line.sku] : undefined;
-        line.unit_price = pinned ?? current.price.amount;
-      }
-      // Round per line, like the fulfilment worker, so the API and the worker agree on totals.
-      const toCents = (value: number) => Math.floor(value * 100) / 100;
       const totals = computeTotals(
-        lines.map((l) => ({ unitPrice: toCents(Number(l.unit_price) * l.quantity), quantity: 1 })),
+        lines.map((l) => ({ unitPrice: Number(l.unit_price), quantity: l.quantity })),
         pricing,
       );
       const numberRow = await tx.query<{ n: number }>("SELECT nextval('order_number_seq') AS n");
```

## Reference run (22 Oct 2026, PR #26)

Devin Review ran automatically when PR #26 was opened (commit `42ad09b`, org default effort). It reported:

| Section | Title (as shown) | Matches |
| --- | --- | --- |
| Security | Customer-controlled role unlocks free checkout | F1 |
| Bugs | Checkout undercharges cent-priced items (`toCents` floors €19.90 to €19.89) | F2 |
| Bugs | Invalid goodwill prices reach orders (`"free"` gives a 500, `"-100.00"` a negative total) | new: not in the reference list |
| Bugs | Checkout rounding bypasses money module (contrary to the API review rule) | F5 |
| Flags | Payments review required before merge (`REVIEW.md` line 4) | the rule's second line |

What to learn from it:

- The security finding appeared without anyone asking for a security review.
- Review read `services/api/REVIEW.md` and cited it: the rule *did* fire, through its wording ("money arithmetic lives in `src/money.ts`"). But the test requirement in the rule is tied to `src/money.ts`, so the PR still shipped with no pinned-amount test. Rewriting the rule closes that gap; a PR that edits its own `REVIEW.md` is the bypass to watch for.
- It did not report the per-line query flag (F3). That is the disputed flag: open a review comment on the loop yourself so there is a thread, let the author reply there, and let the evidence decide. Your run may differ; compare yours with this table and with `fixtures/review-findings.json`.
- The "invalid goodwill prices" bug disappears with the same fix as F1: remove `priceOverrides`.

Tests run on throwaway branches confirm the findings:

- On the PR branch: `rounding` fails with `expected '39.79' to be '39.80'`; the role probe returns 201 with unit price 0.01 USD (total 7.96 USD). The un-skipped `price-drift` test passes.
- On `main`: the rounding test passes (39.80) and `priceOverrides` is ignored; `price-drift` fails by design (skipped).
- On the remediation branch: both new tests and `price-drift` pass; `contract.test.ts` stays green (33 tests).

## Pitfalls

- Treating "tests are green" as the proof. The PR's own tests never exercised a quantity of 2.
- Fixing `currency-rounding` while you are in there. That is a different plant, it stays on `main`, and fixing it would change every Trailhead total in this PR.
- Arguing about the flag instead of measuring it. "Only a flag" and "it is slow" are both claims.
- Strengthening the rule in `REVIEW.md` alone, in a file the next PR can edit.
- Reading the unchanged-diff skip as "Review is broken".
- Merging either PR because the re-review is clean.

## Recovery moves

- No Review permission: you can still open the PR and read existing findings; use the reference findings and say so in your update.
- The review does not report F2: quote the `toCents` line into chat yourself and ask; then the test decides, not the chat.
- The author will not accept your reply on F3: offer the statement count from `src/db.ts` statement counting, or keep the change and let the evidence decide.
- Running out of time at T+50: ship the test first. A failing test is evidence; an unfinished fix is not.

## Model answers to the objections

- **Technical (the author disputes the flag — who wins?):** Acknowledge that a flag is not a bug and the author knows the code. Boundary: neither of you wins by rank — the evidence does. Evidence: the loop ran inside the transaction after the inventory updates, so every extra statement kept reserved rows locked longer. Moving it out of the transaction costs nothing and keeps the statement count inside the transaction equal to main. Offer: if he still disagrees, measure checkout latency with the statement counter before and after, and decide on the number.
- **Commercial (review slows us down before Black Friday):** Acknowledge that the calendar is real. Boundary: the review took minutes; a one-cent error on every two-sock Trailhead order would take finance weeks to reconcile, and the price override is a free-discount hole. Evidence: two Severe findings, one test that failed before and passes now, and a re-review with nothing new. Offer: keep the highest effort level for money and tax paths only, and use the default for everything else.

## Debrief

- Which finding would you have missed if you had trusted the PR's green tests?
- What did the chat answer get right, and what did you still have to check with a test?
- Where should a rule live so that the PR it governs cannot change it?
