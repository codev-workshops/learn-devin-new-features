## Customer brief

Hi — I lead platform engineering at Harbourline. We run two brands, **Lumen Home** (USD) and **Trailhead Supply** (EUR), and each brand team runs its own flash sales. Every one of them has re-invented the release checklist: Lumen keeps a three-line skill in a repo of its own, Trailhead pastes a long prompt into each session, and neither checks the things that hurt us last quarter (sale prices stored the wrong way, stock reserved too early, a push to `main` in the middle of a sale, an on-call engineer with no first-hour procedure).

What I need from you:

1. **One package, shipped once.** The flash-sale release checklist and the first-hour incident procedure, installable by any brand team, so every Devin session in the organization gets the same steps.
2. **It must carry more than text.** The pricing rule, a guard against pushing to `main` during a sale, a reviewer that checks a release diff, and the incident tools the incident procedure needs.
3. **Change without chaos.** Brand teams will want to tweak it. They must not be able to change what everyone else runs without someone on my team looking at the change first.
4. **Nobody's credentials inside it.** The incident tools need a PagerDuty connection. That connection must not live in the package.

You have one two-hour block. My security reviewer signs off before this reaches every session, and she will want a three-minute update at the end.

## Stakeholders and constraints

- **The security reviewer** signs off on anything that runs in every session. She reads files, install screens and approval cards, not prompts. She will ask what runs, where it came from, and who can change it.
- **Brand engineering leads** (one per brand) will install it and will want to change thresholds. They do not have admin rights on organization plugins.
- **Me (platform lead)** owns `main`. The planted defects stay in the baseline; any demonstration change goes on a throwaway `lab04/*` branch and is deleted without merging.
- **Forbidden:** real credentials in any file, changes on `main`, changes to `packages/contracts/`, and installing at Organization or Enterprise scope before the plugin has been checked at Personal scope.
- **Output:** the plugin folder (kept outside the repo or on a throwaway branch), the checker's clean report, a screenshot of the plugin's details panel after install, and a short note for the security reviewer. Keep the note out of commits.
