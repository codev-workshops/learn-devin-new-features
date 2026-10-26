# Review rules — services/api

- Money arithmetic lives in `src/money.ts`. Any change to `src/money.ts` must come with a test in `test/` that pins the rounded amounts for both brands.
- Do not merge changes to checkout totals without a second reviewer from payments.
