---
id: double-charge-audit
brand: both
customer: Marcus Lindqvist
role: Group Finance Director, Harbourline, with the external auditor on the line
---
# Sealed scenario — double charges, partial refunds and the audit

## Envelope

> Marcus Lindqvist, group finance. Our auditor, Ms Hale, is on the call with me.

**Incident** — Customers on both brands report being "charged twice". Finance can see orders confirmed twice and stock taken twice for one payment. Reconciliation is off and the auditor has noticed.

**Feature request** — Trailhead's support team needs a partial-refund action in the admin console so they stop refunding by hand in the PayGate dashboard.

**Governance constraint** — Before any new endpoint ships, Ms Hale wants evidence that no existing endpoint lets one brand read another brand's data. And every Devin session on this work may reach only the package registry and the PayGate sandbox — nothing else on the network.

## Requirement change at T+60

> Marcus. Ms Hale needs the isolation evidence by five tonight, not next week. And the refund action must be limited to merchandisers of the same brand as the order. If you have to choose, the evidence comes first.

## Injected blocker

The fulfilment worker's Python dependencies cannot be installed because the network profile allows only the package registry and the PayGate sandbox. A learner who widens the allow-list to reach PyPI breaks the constraint; acceptable moves are a pre-built environment (blueprint), a vendored wheel already in the image, or reasoning from the worker code and its existing tests.

## Must-mention

| id  | weight | belonged_in    | point                                                                                                    |
| --- | ------ | -------------- | -------------------------------------------------------------------------------------------------------- |
| mm1 | 6      | framing        | The worker processes the same payment webhook twice because it ignores the event id, so it must dedupe on it |
| mm2 | 5      | checkpoint-30  | Reproduced with the duplicate-webhook injector: one payment, two confirmations, stock taken twice          |
| mm3 | 4      | checkpoint-90  | After the change the isolation evidence goes first and the refund is limited to same-brand merchandisers   |
| mm4 | 5      | update         | Brand isolation checked on every endpoint, and the order-by-id endpoint leaks across brands                |
| mm5 | 4      | update         | Sessions ran under a profile allowing only the package registry and the PayGate sandbox, and the blocked Python install did not widen it |
| mm6 | 3      | update         | How many orders and customers were double-charged and need a refund                                       |
| mm7 | 3      | objection-2    | The payment webhook signature is read but never verified, which is a second risk                           |

## Objections

1. **Cost** — "An audit of every endpoint sounds expensive. Why not sample ten?" Follow-up: "What would a sample of ten have missed?"
2. **Payment risk** — "You let an AI agent work on our payment webhooks. What stops it from breaking the signature check?" Follow-up: "Is the signature checked today?"
3. **Auditability** — "I am the auditor. How do I verify your evidence without trusting Devin?" Follow-up: "Name one artefact I can re-run myself."

## Facilitator answer key

- Incident: plant `duplicate-webhook` (`services/fulfilment-worker` ignores `event_id`). `scenarios/duplicate-webhook.sh` shows two confirmations; the fix is an idempotency key on the PSP event id. PR left open, never merged.
- Constraint 1: a Code Scan or a dynamic workflow fanned out per endpoint (labs 05, 09) finds `cross-brand-leak` on `GET /orders/{orderId}`; the evidence is a table the auditor can re-run with `curl` and the three fake-auth headers.
- Constraint 2: Security Profiles / network allow-list (lab 10). The pip block is the injected blocker.
- Second risk: plant `unverified-signature` on `POST /webhooks/payments`; naming it is expected, fixing it is a separate PR.
- Refund: same-brand `merchandiser` role check, money as decimal strings, refund ≤ captured amount.
