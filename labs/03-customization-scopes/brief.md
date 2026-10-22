## Customer brief

Hi — I'm Dana Okafor, platform engineering lead at **Kadé Commerce**. Both brands run on one checkout service, and every team now reviews checkout changes with Devin. The trouble is that every team taught Devin its own way: one checklist in a PR template, another in somebody's notes, a third pasted into chat. Last month a review that followed the Lumen Home habit asked a Trailhead change to show tax "as its own line, added on top". It reached staging before QA noticed that every Trailhead basket was 19% more expensive than the price on the product page. Two engineers spent two days unpicking it.

I want **one checkout-review practice for both brands**, kept in the repository, that I can review in a pull request and that Devin picks up without anyone pasting it in.

I'm Jonas Becker, Trailhead Supply's engineering lead. I am fine with Dana's checklist on one condition: **our VAT rules win wherever they apply, and my team can change them without opening a ticket with Platform.** Trailhead prices include 19% VAT, shipping is free from €80 gross, and our totals must match what the fulfilment worker computes to the cent. Last quarter we filed six requests to edit a shared instruction file; I do not want a seventh.

Between us: show which instructions Devin will have in front of it when it touches `services/api/src/money.ts`, prove the two layers do not contradict each other, and tell us who is allowed to change which layer. Personal habits are fine, as long as they stay personal.

## Stakeholders and constraints

- **In the room:** Dana (Platform lead, owns the shared checklist), Jonas (Trailhead lead, owns the VAT rules) and a reviewer from each team who will use the checklist daily.
- **Forbidden:** no change to `main` — everything happens on a throwaway branch; no change to application code under `services/` or `apps/`; do not fix any planted defect (the rounding drift in `money.ts` stays); no edits to the existing `.devin/rules/repo-conventions.md`, `.devin/rules/money-and-brands.md` or root `AGENTS.md`.
- **Your own machine:** never write to your real home directory for this lab; the global layer is simulated under `/tmp/kade-home`.
- **Shared settings:** do not change organization or enterprise settings; describe what would live there instead.
- **Ownership:** Trailhead must be able to change its rules without a Platform approver, and Platform must be able to change the shared checklist without a Trailhead approver.
- **Decision deadline:** both leads sign off at the end of this session.
- **Budget:** one Devin session plus your own verification; no paid integrations.
