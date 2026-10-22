## Customer brief

Hi — this is Tomás, tech lead for checkout at **Harbourline**. During Lamp Week a **Lumen Home** customer added the Studio Clamp Lamp to her cart at the old price, the flash-sale price went live an hour later, and checkout still charged her the old one. That is the `price-drift` ticket, and a developer has opened a fix: PR #26, "re-price cart lines from the current price list at checkout".

The fix touches totals and tax for both brands. Trailhead Supply prices include 19% VAT, Lumen adds 8.25% sales tax, and our fulfilment worker recomputes every order with its own rounding. We cannot ship a rounding regression before Black Friday. A one-cent difference between the API and the worker leaves finance with a reconciliation queue, and a wrong VAT figure on an invoice causes much worse problems.

I am sceptical about AI review. Use Devin Review on this PR properly: choose the effort level on purpose, read what it finds, take one finding into the chat and get to the bottom of it, fix every finding that should be fixed, and show me the review again after your changes. Some of what it says will be noise; tell me which and why. Then convince me in three minutes that the totals are right — with a test, not with a promise.

## Stakeholders and constraints

- **Tomás (tech lead, checkout)** — sponsor and sceptic; wants evidence he can rerun, and a yes/no on "is rounding safe".
- **PR author** — believes the PR is ready; will push back on anything that is "only a flag".
- **Finance** — reconciles API totals against the worker's Decimal figures every night; one cent per order adds up.
- **Security** — wants to know about anything that lets a shopper change a price.
- **Forbidden:** merging anything into `main`. The PR and your remediation branch stay unmerged; `price-drift` and `currency-rounding` stay planted on `main`.
- **Forbidden:** Automations or scheduled reviews. Every review and re-review is started by you.
- **Budget:** one review at the effort level you choose, one re-review after your fixes, plus the unchanged-diff experiment; 90 minutes.
- **Deliverable:** evidence for each acceptance criterion collected in a local `labs/06-review-remediation/EVIDENCE.md` that you do not commit.
