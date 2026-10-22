---
lab: 03-customization-scopes
variant: strong
learner: dryrun
planted_fillers: 1
planted_omissions: []
planted_long_pauses: []
---
# Dry-run transcript — strong

Fixture for `@skills:coach-03-customization-scopes dryrun --dry-run labs/03-customization-scopes/coaching/dryrun/strong.md`.
Planted: one filler (um ×1), no omissions, no long pauses. Every segment within ±5 s of target.

--- segment: framing ---
[00:00] COACH: Dana: Before you start — where will the checklist live, and how will Jonas's VAT rules survive it? Sixty seconds. Go.
[00:03] LEARNER: You get one checklist for both brands, and Trailhead keeps the last word on VAT.
[00:12] LEARNER: Devin does not pick a winner between instruction files; every layer that applies is in context at the same time. So the shared checklist never states tax: it defers to the brand's own rule file, and the Trailhead rule owns tax presentation and rounding.
[00:38] LEARNER: The checklist is a Platform rule, the VAT rule is a Trailhead rule, and CODEOWNERS gives each team its own file.
[00:50] LEARNER: You will see it working when the resolver for money.ts shows tax resolved, with the Trailhead file as the only owner.
[01:01] LEARNER: Done.
--- segment: checkpoint-10 ---
[10:00] COACH: Jonas: What are you looking at right now, and what will you check next?
[10:03] LEARNER: I see the resolver output for services, slash, api, slash, src, slash, money.ts: six files loaded, including both new rules.
[10:20] LEARNER: I think the tax keys are resolved because the checklist statements carry the defer marker. I'll try catalog.ts next and I'll check that the VAT rule is skipped there, with a reason.
[10:49] LEARNER: Done.
--- segment: checkpoint-45 ---
[45:00] COACH: Dana: Forty-five minutes in. What are you looking at right now, and what will you check next?
[45:03] LEARNER: I see the wrong-glob injector result. The VAT rule is in the skipped list for money.ts.
[45:15] LEARNER: I think that is the dangerous case: a glob rule loads only when a file it matches is touched, and the misspelt globs meant the VAT rule never loaded at all, so the conflict list looked clean. I'll try the corrected globs and I'll check that it loads again.
[45:47] LEARNER: Done.
--- segment: update ---
[70:00] COACH: Give us both the update before we sign off. Go.
[70:03] LEARNER: Outcome: Dana, you have one checklist in .devin/rules and one review skill; Jonas, your VAT rule owns tax wherever Trailhead money is touched.
[70:30] LEARNER: Evidence: for money.ts the resolver loads six files and reports zero unresolved conflicts; for catalog.ts the VAT rule is skipped with the reason.
[70:55] COACH: Jonas: Which file owns VAT?
[70:58] LEARNER: Only trailhead-vat.md; the checklist and the nested notes both defer to it.
[71:15] LEARNER: The nested-conflict injector produced one unresolved conflict; I changed the deeper statements to defer and kept the file.
[71:40] LEARNER: AGENTS.local.md is git-ignored: git status stays silent, and it only changes the sessions of the person whose checkout it sits in.
[72:00] LEARNER: Risk: a personal global skill had the same name as the team skill. A global skill follows one person across projects; the repo skill is shared and reviewed in pull requests, so I renamed the personal one.
[72:25] LEARNER: Next action: CODEOWNERS sends the checklist to Platform and the VAT rule to Trailhead; org and enterprise scopes need settings access, so nothing changes there today.
[72:48] LEARNER: Ask: approve the two CODEOWNERS lines this week.
[73:02] LEARNER: Done.
--- segment: objection-1 ---
[75:00] COACH: Jonas: Platform's checklist will override Trailhead's VAT rule.
[75:04] LEARNER: I understand the worry; with two files saying opposite things, nothing documented would decide between them.
[75:25] LEARNER: That is exactly why the checklist says nothing about tax. Rules add up; they do not replace each other, so the checklist points at your file instead.
[75:50] LEARNER: Evidence: the resolver shows tax presentation resolved with trailhead-vat.md as the only owner, and the nested injector showed the failure and its fix.
[76:15] LEARNER: And CODEOWNERS means Platform cannot change your file without your team.
[76:33] LEARNER: Done.
--- segment: objection-2 ---
[78:00] COACH: Dana: Governance by markdown — who audits it?
[78:04] LEARNER: Fair: markdown is guidance, not enforcement.
[78:15] LEARNER: Every shared layer is a file in this repo, so it has pull request review, a CODEOWNERS approver and git history. Personal layers only affect their owner.
[78:45] LEARNER: Um, the evidence is the CODEOWNERS split and the resolver's conflict list.
[79:00] LEARNER: Offer: run the resolver in CI on the checkout paths so a conflict or a dead glob fails the PR, and move anything that must be enforced into an enterprise-required plugin or a hook.
[79:35] LEARNER: Done.
