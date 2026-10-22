## Customer brief

I run engineering for **Harbourline** — the platform behind Lumen Home and Trailhead Supply. We hire two engineers a month, and every one of them loses their **first week** to getting the store running locally: the setup page points at a service we deleted months ago, the per-service notes disagree with each other, and nobody can say which instructions are current. That is roughly **40 engineer-days a year** spent before anyone ships anything.

Worse: on day two of her first week, our last hire followed a "reset the database" line from an old note and **wiped the shared development database** that three brand teams were demoing from. We lost an afternoon of merchandising work and a customer demo slipped a week.

We have just connected Devin to the repository. Before Monday's new starter arrives, I want Devin to be the thing that makes Harbourline safe and fast to set up — for Devin itself and for a human. Concretely: the machine Devin works on should come up ready to run every gate without anyone typing setup commands; the instructions Devin reads should be the right ones, in the right place, and short enough that it actually reads them; and nobody — human or Devin — should be able to reset a database that is not their own lab database by following our docs.

I am not an engineer by background any more. When you report back, explain what you changed in words I can repeat to our hiring manager, and tell me what you would *not* hand to Devin.

## Stakeholders and constraints

- **In the room:** me (Head of Engineering); Priya Nair, the hiring manager who owns the onboarding checklist; Jonas Weber, Trailhead's tech lead, who still has a personal setup note he trusts more than the repo; the new starter, who joins Monday and will be watching.
- **Forbidden:** no change to any planted defect (`packages/contracts/seed-spec.yaml#planted_edge_cases`) and no change to frozen files (`packages/contracts/*`, `.devin/skills/articulation-base/`). Proposals for shared files go in your PR description, not in the file.
- **Never** run `db:seed -- --reset`, a migration or `docker compose down -v` against anything except the local lab database; never write a secret value into a blueprint, an `AGENTS.md` or a skill — names of variables only.
- **One source of truth:** when two documents disagree you must say which one wins and why, and remove or correct the loser on a throwaway branch — not by adding a third document.
- **Deadline:** Friday 17:00, so Monday's starter uses the result. A 3-minute update to Priya at the end.
- **Budget:** one Devin session for the work; you decide where Ask Devin is enough and where you need an Agent session.
