## Customer brief

Hi — I'm Priya, the database administrator for **Harbourline**. Lumen Home and Trailhead Supply share one PostgreSQL database in every environment, and last quarter a well-meaning session ran `pnpm db:seed -- --reset` against the shared staging database the afternoon before Lamp Week. We lost two days of merchandiser price-list edits for both brands and spent a weekend replaying about 400 orders from the payment provider. Nobody was careless; the command was simply allowed.

We now want Devin working in this repo every day, and I am fine with that on one condition: **Devin must never reset or migrate anything except the lab database, and every `psql` it runs must go through our read-only wrapper.** I do not want a paragraph in a README that the agent may or may not read. I want the tool call itself stopped, or quietly rewritten, before it reaches the database, and I want a log that shows me what was stopped and why.

Next week a contractor also proposes a migration that "just relaxes" `orders.currency` for multi-currency carts. On our side the fulfilment worker reads that column on every new order. If Devin is asked to apply that patch, I expect the policy to refuse it with a reason Devin can read, not to discover it at 2 a.m. when orders stop flowing.

Show me a policy that lives in the repository, that I can review in a pull request, and that I can trust when it breaks: if the policy file itself is wrong, I need to know whether we are locked out or wide open.

## Stakeholders and constraints

- **In the room:** Priya (DBA, the customer), the platform lead who owns `.devin/` configuration, and the on-call engineer who will read the audit log during an incident.
- **Forbidden:** no change to `main` — hooks are demonstrated on a throwaway branch only; no schema change; no command may touch any database other than the lab database at `localhost:5432/harbourline`; do not fix any planted defect in the services.
- **Policy shape:** project-level configuration only (`.devin/hooks.v1.json` plus scripts in the repo); no user-level config, no edits to `.devin/config.json` permissions.
- **Read-only access:** a `psql` session that Devin opens must be unable to write, even if the SQL it sends is a `DELETE`.
- **Decision deadline:** Priya signs off before the contractor's migration PR is reviewed — end of this session.
- **Budget:** one Devin session plus your own verification; no paid integrations.
