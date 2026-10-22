---
lab: 05-code-scans
variant: mediocre
learner: dryrun
planted_fillers: 6
planted_omissions: [mm6, mm8]
planted_long_pauses: ["02:20"]
---
# Dry-run transcript — mediocre

Fixture for `@skills:coach-05-code-scans dryrun --dry-run labs/05-code-scans/coaching/dryrun/mediocre.md`.
Planted: six fillers (actually ×2, basically ×2, so yeah ×1, you know ×1), one tag question, one 12-second pause at [02:20], and two omitted must-mention points: the dismissal with a reason (mm6) and the SARIF export (mm8).

--- segment: framing ---
[00:00] COACH: I'm Dana. You have read my note. Sixty seconds: what are you going to run, and what will I have at the end? Go.
[00:04] LEARNER: So, basically, because the brands share a database, and because the webhook is from a partner, and because Lamp Week is coming, I think we need scans.
[00:26] LEARNER: I will run Security Swarm for the brand leak and the webhook, a performance scan for the catalog, and an accessibility scan for the admin console. It is the scans feature, basically.
[00:50] LEARNER: The order detail lookup ignores the caller's brand header, I think, so a Lumen user can see Trailhead orders. At the end you get the findings list.
[01:14] LEARNER: Done.
--- segment: checkpoint-20 ---
[01:30] COACH: Twenty minutes in. What are you looking at right now, and what will you check next?
[01:34] LEARNER: I am looking at the findings, actually. There are a lot of them. I'll check the high ones first.
[01:55] LEARNER: The PayGate webhook signature is computed but never compared. That's the second one, right?
[02:24] LEARNER: Done.
[02:20] (pause 12 s)
--- segment: checkpoint-90 ---
[02:40] COACH: Ninety minutes in. Which finding are you giving to Devin, which are you throwing out, and why?
[02:44] LEARNER: I'll give the brand one to Devin because it is the most serious. The others I will look at later, you know, when there is time.
[03:30] LEARNER: Done.
--- segment: update ---
[03:40] COACH: Give me the update as if I were paying for it. Go.
[03:43] LEARNER: So we found the leak and the webhook problem, and the catalog. The Lamp Week collection runs three queries per product, 27 for the eight lamps, so it is slow when there are many products.
[04:15] COACH: How many findings in total?
[04:18] LEARNER: Around seven, I think, maybe more in performance.
[04:30] LEARNER: One finding assigned to Devin produced a pull request that was closed unmerged, because we can't merge into main. Then I ran Scan new commits on the unchanged branch and it found nothing new, as expected, actually.
[05:10] LEARNER: Next step is to fix the rest. So yeah, that is the update.
[07:10] LEARNER: Done.
--- segment: objection-1 ---
[07:20] COACH: Our SAST already does this. Why do we need a second scanner?
[07:24] LEARNER: Devin is smarter than pattern tools, it understands the code. It found the brand leak.
[08:20] LEARNER: Done.
--- segment: objection-2 ---
[08:30] COACH: How many false positives will my platform team have to triage every week?
[08:34] LEARNER: Not many. Some findings will be wrong but the team can ignore them. We can tune it later.
[09:44] LEARNER: Done.
--- segment: objection-3 ---
[09:50] COACH: Who approved Devin opening pull requests against our repository?
[09:54] LEARNER: I assigned it, so I approved it. It only opened one, and we closed it. I think that is fine for a pilot.
[11:00] LEARNER: Done.
