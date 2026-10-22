Do not open this before you have finished the evidence table and the drill.

## Feature fit

The customers are asking for **layered guidance with clear owners**, which is what Devin's customization scopes give you. The key fact is that layers **add up**: every instruction file and rule that applies is put in front of the model together. Nothing in the docs says a deeper file or a later rule silently replaces an earlier one, so the design must never depend on load order — one file owns each topic and the others say they yield.

- **Root `AGENTS.md`** — read automatically at session start (the first 16 KiB are injected; longer files are read on demand).
- **Nested `AGENTS.md`** — discovered when the agent works in that directory, so it only adds context for that part of the tree.
- **`AGENTS.local.md`** — loaded alongside `AGENTS.md` with the same always-on behaviour, but meant to be git-ignored: it is personal and never reviewed. This repo's `.gitignore` already hides it at any depth.
- **`.devin/rules/*.md`** — frontmatter `trigger:` is `always_on`, `glob` (with `globs:`), `manual` (only when mentioned) or `model_decision` (the model decides from `description`). A glob rule that matches nothing is silently never loaded.
- **Skills** — repo skills in `.devin/skills/<name>/SKILL.md` or `.agents/skills/<name>/SKILL.md` are shared and reviewed in PRs; global skills in `~/.config/devin/skills/` (or `~/.agents/skills/`) follow one person on one machine. Only one skill is active at a time, so two skills with the same name are a trap.
- **Personal, organization and enterprise scopes** — plugins (which bundle skills, rules, MCP servers and hooks) installed at each scope. Higher authority wins for plugin policy: enterprise can require or forbid a plugin and lower scopes cannot override it. Scope changes apply to new sessions.

## Worked layout

The reference files live in `labs/03-customization-scopes/solution/layers/` as `dot-devin/` and `dot-github/` so nothing inside `labs/` is ever discovered as a live rule. On your throwaway branch run `node labs/03-customization-scopes/solution/apply.mjs .` to copy them into place:

- `.devin/rules/checkout-review.md` — Platform's checklist, `trigger: glob` on `services/api/src/**/*.ts` and `apps/web/src/**`. Its tax and rounding statements are written as `[tax.presentation:defer]` / `[tax.rounding:defer]`: "follows the brand's own rule file".
- `.devin/rules/trailhead-vat.md` — Trailhead's rule, `trigger: glob` on `money.ts`, the checkout/orders/carts routes and services, and `apps/web/src/**`. It owns `[tax.presentation]`, `[tax.rounding]` and `[shipping.threshold]`.
- `.devin/skills/checkout-review/SKILL.md` — the review procedure: list the brand rules for the changed paths, walk the checklist, cite the brand rule where the checklist defers, run the gates.
- `.github/CODEOWNERS` — the checklist and skill to `@kade/platform`, `.devin/rules/trailhead-*.md` to `@kade/trailhead`.

The bracketed keys are a lab convention, not a Devin feature: they make "who owns this topic" greppable and let `solution/resolve.mjs` flag two files stating the same key without one deferring.

| Layer | Lives in | Who can change it | Use it for |
| --- | --- | --- | --- |
| Enterprise | enterprise-scope plugins and settings | enterprise admins | policy nobody may opt out of |
| Organization | org-scope plugins, Knowledge | people with org settings access | conventions for every repo in the org |
| Personal | personal-scope plugins | the user | your own habits across repos |
| Repo root | `AGENTS.md`, `.devin/rules/`, `.devin/skills/` | anyone who can merge; CODEOWNERS decides the approver | the shared checklist |
| Nested | `services/api/src/AGENTS.md` and other directory files | owners of that directory | notes for one part of the tree |
| Local | `AGENTS.local.md` (git-ignored) | only you, on your checkout | personal overrides that must never reach others |
| Global (CLI) | `~/.config/devin/AGENTS.md`, `~/.config/devin/skills/` | only you, on your machine | personal skills across projects |

## Worked prompt sequence

```prompt
On branch lab/03-<handle>, add a Platform-owned rule .devin/rules/checkout-review.md with trigger: glob covering services/api/src/**/*.ts and apps/web/src/**. It holds the shared checkout-review checklist. Write tax presentation and rounding as statements that defer to the brand's own rule file. Do not edit the existing rules or root AGENTS.md.
```

```prompt
Add .devin/rules/trailhead-vat.md, owned by Trailhead, with trigger: glob on services/api/src/money.ts and the checkout, orders and carts routes and services. It states: prices include 19% VAT, VAT is shown as included and never added on top, VAT must match the fulfilment worker to the cent, shipping is free from €80 gross. Do not change money.ts.
```

```prompt
Add a repo skill .devin/skills/checkout-review/SKILL.md that applies the brand rule files for the changed paths before the shared checklist, and a .github/CODEOWNERS that sends the checklist and skill to @kade/platform and .devin/rules/trailhead-*.md to @kade/trailhead.
```

```prompt
Run node labs/03-customization-scopes/solution/resolve.mjs --file services/api/src/money.ts and again for services/api/src/routes/catalog.ts. Save both outputs. Tell me every conflict that is not resolved and which file should yield.
```

After each injector, ask Devin to rerun the resolver for `money.ts` and explain the difference before changing anything.

## Expected evidence

- **money.ts, solution applied:** `loaded` lists root `AGENTS.md`, `services/api/AGENTS.md`, `money-and-brands.md`, `repo-conventions.md`, `checkout-review.md` and `trailhead-vat.md`; `conflicts` shows `tax.presentation` and `tax.rounding` as `resolved` with winner `.devin/rules/trailhead-vat.md`; exit code 0.
- **catalog.ts:** `checkout-review.md` loaded; `trailhead-vat.md` in `skipped` with "no glob matched services/api/src/routes/catalog.ts".
- **nested-conflict:** `tax.presentation` becomes `unresolved` (the deeper file and the Trailhead rule both state it); exit code 1. Fix by rewriting the deeper statements as `[tax.presentation:defer]` / `[tax.rounding:defer]` — keep the file, because the engineer's Lumen context is still useful and deleting it would only hide the disagreement.
- **local-override:** `AGENTS.local.md` appears with `local: true, git_ignored: true`; `git status --short` is silent; `git check-ignore -v AGENTS.local.md` prints `.gitignore:<line>:AGENTS.local.md`. The `review.checklist` conflict is unresolved — but only in that person's sessions. The fix is a conversation, not a commit: the personal shortcut contradicts the team rule, so the owner deletes it or narrows it.
- **wrong-glob:** `trailhead-vat.md` moves to `skipped` ("service/api/…" is misspelt; "src/routes/*.ts" is relative to the service, not the repo root); the tax conflict disappears because the rule is not in context at all — the most dangerous result, because it looks clean. Restore the solution globs and the resolver loads it again.
- **global-skill:** `skill_collisions` lists `checkout-review` at `~/.config/devin/skills/…` and `.devin/skills/…`. Rename the personal one (for example `my-quick-review`); the shared name belongs to the reviewed procedure.

`npm test` in `labs/` runs the same table as `solution/resolve.test.mjs`.

## Pitfalls

- Assuming a glob scopes by brand. Globs scope by path, and Kadé's brands share `money.ts`, the routes and `apps/web`, so the Trailhead rule also loads for a Lumen change; it must say which brand it applies to (`[brand.applies]`).
- Expecting the deeper or later file to win. Both are in context; the model sees two instructions and may follow either.
- A glob written relative to a package instead of the repo root, or with a typo: the rule is dead and nothing warns you.
- Naming an injector or a sample file `AGENTS.md` inside `labs/` — it would itself become a nested instruction file. That is why the lab ships `nested-conflict.AGENTS.md` and `dot-devin/`.
- `git add -f AGENTS.local.md` publishes a personal override to everyone.
- Putting the Trailhead VAT text in root `AGENTS.md`: it then loads for every file, and Trailhead needs a Platform approver to change it.
- Changing org or enterprise settings to "test" a scope: it affects other people's new sessions.

## Recovery moves

- Rule not loading? Run the resolver for the exact path and read `skipped[].reason`; with a live session, ask Devin which rules it has for that file.
- Unresolved conflict? Decide the owner, then make every other statement defer and name the owner's file.
- Skill invoked the wrong procedure? List skills with the resolver (`--home` for your real global directory only if you choose to), rename the personal copy and start a new session.

## Model answers to the objections

- **Technical — "Platform's checklist will override Trailhead's VAT rule."** Acknowledge: if both stated tax, nothing documented would decide between them. Boundary: rules add up rather than override, so the shared checklist does not state tax at all — it defers and points at the brand file. Evidence: the resolver for `money.ts` shows `tax.presentation` resolved with `trailhead-vat.md` as the only owner, and the nested-conflict injector showed the failure mode and its fix. Offer: Trailhead owns its file through CODEOWNERS, so Platform cannot change it without Jonas's team.
- **Commercial / governance — "Governance by markdown — who audits it?"** Acknowledge: text instructions are guidance, not enforcement. Boundary: every shared layer is a file in the repo, so it has PR review, CODEOWNERS approval and git history; personal layers only affect their owner. Evidence: the CODEOWNERS split and the resolver's conflict list. Offer: run the resolver in CI on the checkout paths so an unresolved conflict or a dead glob fails the PR, and move anything that must be enforced to an enterprise-required plugin or a hook.
- **Follow-up the coach may ask — "And the private overrides nobody reviews?"** They only change that person's sessions; the shared checklist and the PR it produces are still reviewed, and CI checks the repo layers.

## Debrief

**Alternatives considered.** (a) One big root `AGENTS.md` with a Trailhead section — simple, always loaded, but Trailhead needs Platform approval for every edit and it loads for unrelated files. (b) A nested `AGENTS.md` owned by Trailhead — works where Trailhead has its own directory; Kadé's brands share `services/api/src/`, so the glob-triggered rule fits better. (c) An organization-scope plugin or Knowledge entry for the checklist — reaches every repo, but changes need org settings access and are not reviewed in the repo's PRs. (d) Repo rules per owner with explicit deferral and CODEOWNERS — reviewable, path-targeted and owned by the team that knows the domain.

**When each would win.** (a) for a small team with one owner; (b) when the brand or team owns a directory; (c) when the same checklist must apply to many repos; (d) when several teams share one codebase and each owns a topic. Anything that must be enforced rather than advised belongs in an enterprise-required plugin, a hook or CI — not only in markdown.

**Cost note.** Rules and instruction files cost context, not ACU of their own: a glob-triggered rule only spends tokens when its paths are touched, while root `AGENTS.md` is in every session (keep it under 16 KiB). The lab is one session of roughly 2–4 ACU plus your verification; the resolver and its tests are free to rerun.

**Self-score (offline path).** Accuracy 30 — layers add up and one owner per topic, glob triggers and the dead rule, the local file staying personal, global versus repo skills, who can change each scope. Structure 25 — Outcome → Evidence → Risk → Next action → Ask. Customer relevance 20 — the 19% staging overcharge, two days of rework, six edit requests. Brevity and fluency 15 — framing within 60 s ± 5, fillers under 3 per minute. Recovery 10 — both objections answered acknowledge → boundary → evidence → offer.
