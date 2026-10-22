Do not open this before you have written your plan and done the drill.

## Feature fit

The brief lists four problems. Three of them need code to exist first (cross-brand leak, rounding drift, oversell) and are the subjects of later labs. The one that pays back on day one with a Devin seat and no schema change is **onboarding**: a new engineer takes a week to run the store and someone reset the shared database. The capability is **environment setup plus repository instructions** — a blueprint that reproduces the local stack, an `AGENTS.md` under the 16 KiB injection limit that says where the lab database is and which commands are forbidden, and a `lab:reset` script so nobody touches the shared one.

Why not the others first: the oversell and the leak are real revenue and security risks, but both need the API code and a reproducible injector before Devin can show evidence, and both tempt you into a schema change during the freeze. Rounding drift is the cheapest to find but the most political to fix (two services disagree about money); it is a good second task once the reset script exists.

## Worked prompt sequence

The prompts below are the kind you would type once you move from planning to doing. They are hidden here on purpose.

```prompt
Read README.md and every AGENTS.md in this repo. Tell me, in a table, every command a new engineer must run to get the storefront and the API working locally, and which of those commands could touch a database other than the local one. Do not change anything yet.
```

```prompt
Write a root AGENTS.md under 16 KiB with: the local-only database rule, the lab reset command, and the list of files no session may edit. Then propose a blueprint YAML in docs/ that installs Node 20, Python 3.12 and PostgreSQL 16 and runs the gate scripts. Open a PR; do not touch main.
```

```prompt
Start a fresh session from the blueprint and follow only AGENTS.md to bring the stack up. Record the screen. Report every step where the instructions were wrong or missing.
```

## Pitfalls

- Picking the most exciting problem (oversell) instead of the one that unblocks every later lab.
- Writing evidence as commands ("run pnpm test") instead of observations ("a fresh session reaches the storefront in under 15 minutes, recorded").
- Forgetting the budget: one session, one PR. If your plan needs three sessions, it is not the first task.
- Ignoring the T+10 injector. Moving Lamp Week forward does not change the first task; it shortens the window before the oversell lab must start. Say so in one line.

## Recovery moves

- If you froze in the framing, restart with the headline: "The first task is onboarding, because every later fix needs a safe local stack."
- If the coach interrupts with "how many orders?", answer with one number from the brief (≈400 a week; 3% of Trailhead orders drift) and return to the skeleton.
- If you realise mid-update that your evidence is a command, convert it live: "Specifically, you would see…".

## Model answers to the objections

- **Technical — "How do you know Devin will respect our no-schema-change rule?"** Acknowledge: a markdown rule is not a lock. Boundary: the first task touches no migrations at all; the rule is written into AGENTS.md and the reset script only ever points at the lab database. Evidence: the PR diff contains no `db/` changes and the recording shows the stack coming up from the instructions alone. Offer: in lab 2 we turn the rule into a lifecycle hook that blocks the command outright, which is enforcement rather than advice.
- **Commercial — "Why pay for an agent to write a plan a senior engineer writes in ten minutes?"** Acknowledge: the plan itself is cheap. Boundary: what we buy is the fresh-session proof — a session with no memory of the codebase following the instructions and reporting every gap, which a senior engineer cannot do because they already know the answers. Evidence: the week-to-first-run drops to under an hour and the day-two database reset cannot recur because the reset script is the only path. Offer: run it once, measure the time, and decide on the second task with that number.

## Debrief

**Alternatives considered.** (a) Start with the cross-brand leak using a code scan: fastest security win, but the scan needs the API to exist and the fix tempts a data-model change. (b) Start with rounding drift using Devin Review on a reconciliation PR: cheap and concrete, but splits two teams on day one. (c) Start with oversell using an oncall investigation: the most impressive demo, the least reusable, and it needs fixtures that do not exist yet.

**When each would win.** (a) if a merchandiser has already seen another brand's order this week; (b) if finance is the sponsor; (c) if the flash sale is next week rather than in four weeks.

**Cost note.** The onboarding task is one session of roughly 3–6 ACU and one PR. Each alternative needs at least one prerequisite session before Devin can show evidence, so their true first-task cost is double.

**Self-score (offline path).** Accuracy 30 — did you name the brands, the shared database, the cost, one capability with one reason, the proof, and one thing you would not do? Structure 25 — four parts in order. Customer relevance 20 — numbers from the brief, not generic claims. Brevity and fluency 15 — framing within 60 s ± 5, fillers under 3 per minute. Recovery 10 — did the injector and the objections get an answer that followed acknowledge → boundary → evidence → offer?
