## Customer brief

Hi — I run the platform team at **Kadé Commerce**. We operate two online brands on one codebase and one PostgreSQL database: **Lumen Home** (USD, lighting and home goods, tax added at checkout) and **Trailhead Supply** (EUR, outdoor gear, VAT-inclusive prices, free shipping over €80). Together they process roughly 400 orders a week in the quiet season and several times that during Lumen's "Lamp Week" flash sale.

We have just been given a Devin seat and I have a list of things that hurt: a new engineer takes a week to run the store locally and someone reset the shared database on day two; a merchandiser once saw another brand's order; the Trailhead reconciliation report is off by a few cents on about 3% of orders; and during the last flash sale we sold lamps we did not have. I do not expect you to fix any of that today.

What I want from you in the next twenty minutes is a **one-page plan**: which problem you would put in front of Devin first, which Devin capability you would use for it, why that one and not the others, and how you — and I — would know it worked. I will read the plan, then ask you to explain it to me out loud as if I were paying for it.

## Stakeholders and constraints

- **In the room:** the platform lead (me), one merchandiser from each brand, the on-call engineer who was paged during Lamp Week.
- **Forbidden this week:** no schema changes, no changes on `main`, nothing that touches the production database. Demos happen on throwaway branches.
- **Decision deadline:** the Lamp Week flash sale starts in four weeks; whatever you pick first must show evidence before then.
- **Budget:** one Devin seat; assume a modest ACU allowance, so the first task must be small enough to finish in one session.
- **Output:** a Markdown file, `labs/00-sample/PLAN.md`, no longer than one printed page. Do not commit it.
