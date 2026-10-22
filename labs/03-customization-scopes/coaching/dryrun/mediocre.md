---
lab: 03-customization-scopes
variant: mediocre
learner: dryrun
planted_fillers: 6
planted_omissions: [sc2, sc4]
planted_long_pauses: ["10:20"]
---
# Dry-run transcript — mediocre

Fixture for `@skills:coach-03-customization-scopes dryrun --dry-run labs/03-customization-scopes/coaching/dryrun/mediocre.md`.
Planted: six fillers (actually ×2, basically ×2, so yeah ×1, you know ×1), one tag question, one 12-second pause at [10:20], and two omitted must-mention points: glob triggers and the dead rule (sc2) and global versus repo skills (sc4).

--- segment: framing ---
[00:00] COACH: Dana: Before you start — where will the checklist live, and how will Jonas's VAT rules survive it? Sixty seconds. Go.
[00:04] LEARNER: So, because the staging basket was wrong, and because both teams review checkout, and because everybody has their own checklist, basically I am making a rule file.
[00:30] LEARNER: The checklist goes in .devin/rules and the Trailhead VAT goes in its own rule; all the layers are loaded together, so the checklist defers on tax.
[00:55] LEARNER: You will know it works when Devin follows it. That's the plan, right?
[01:14] LEARNER: Done.
--- segment: checkpoint-10 ---
[10:00] COACH: Jonas: What are you looking at right now, and what will you check next?
[10:04] LEARNER: I see the resolver output. I think both rules are there.
[10:20] (pause 12 s)
[10:32] LEARNER: Sorry, I was reading the JSON. I'll check the conflicts next.
[10:56] LEARNER: Done.
--- segment: checkpoint-45 ---
[45:00] COACH: Dana: Forty-five minutes in. What are you looking at right now, and what will you check next?
[45:04] LEARNER: I see the injector with the globs. The VAT rule did not show up, so I copied my old file back.
[45:22] LEARNER: I'll check the skill one after this, you know, the last injector.
[45:43] LEARNER: Done.
--- segment: update ---
[70:00] COACH: Give us both the update before we sign off. Go.
[70:04] LEARNER: So the outcome is that the rules are working on my branch, basically.
[70:25] LEARNER: Evidence: for money.ts the resolver has no unresolved conflicts, and the nested file now defers.
[70:55] COACH: Jonas: Which file owns VAT?
[70:59] LEARNER: The Trailhead one, I think, actually the trailhead-vat file.
[71:25] LEARNER: The local file is git-ignored, so it only changes the sessions of the person who has it.
[72:00] LEARNER: Risk: so yeah, people can still add things. CODEOWNERS gives Platform the checklist and Trailhead the VAT file, and org settings need admin access.
[72:45] LEARNER: Ask: can you both review it this week?
[73:21] LEARNER: Done.
--- segment: objection-1 ---
[75:00] COACH: Jonas: Platform's checklist will override Trailhead's VAT rule.
[75:04] LEARNER: It will not, because the checklist defers to your file.
[75:30] LEARNER: Both files are in context.
[76:02] LEARNER: Done.
--- segment: objection-2 ---
[78:00] COACH: Dana: Governance by markdown — who audits it?
[78:05] LEARNER: The pull requests, and CODEOWNERS actually.
[78:40] COACH: Dana: And the private overrides nobody reviews?
[78:44] LEARNER: I would have to look at that more. We could add a check later.
[79:47] LEARNER: Done.
