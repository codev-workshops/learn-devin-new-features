---
lab: 05-code-scans
variant: off-track
learner: dryrun
planted_fillers: 12
planted_omissions: [mm2, mm3, mm5, mm6, mm7, mm8]
planted_long_pauses: ["01:50", "05:10"]
---
# Dry-run transcript — off-track

Fixture for `@skills:coach-05-code-scans dryrun --dry-run labs/05-code-scans/coaching/dryrun/off-track.md`.
Planted: twelve fillers, two tag questions, two long pauses ([01:50] 14 s, [05:10] 16 s), and six omitted must-mention points (mm2, mm3, mm5, mm6, mm7, mm8). The learner pitches features instead of findings and never gives the CTO a yes or no.

--- segment: framing ---
[00:00] COACH: I'm Dana. You have read my note. Sixty seconds: what are you going to run, and what will I have at the end? Go.
[00:05] LEARNER: Um, so Devin has many scan types, like, twelve of them, security, performance, accessibility, compliance, dead code, and you can make profiles.
[00:40] LEARNER: Basically we run all of them and see what comes out, no? It is very powerful, you know.
[01:20] LEARNER: Done.
--- segment: checkpoint-20 ---
[01:30] COACH: Twenty minutes in. What are you looking at right now, and what will you check next?
[01:34] LEARNER: Uh, I'm waiting for the scans. They take time.
[01:50] (pause 14 s)
[02:10] LEARNER: Done.
--- segment: checkpoint-90 ---
[02:20] COACH: Ninety minutes in. Which finding are you giving to Devin, which are you throwing out, and why?
[02:24] LEARNER: Actually all of them could go to Devin, right? It can fix everything, basically.
[03:30] LEARNER: Done.
--- segment: update ---
[03:40] COACH: Give me the update as if I were paying for it. Go.
[03:44] LEARNER: So, the scans ran. Performance said the Lamp Week collection runs one query plus three per product, which is, like, a lot.
[04:20] COACH: How many findings in total?
[04:24] LEARNER: Um, many. I didn't count. Security Swarm for the brand leak and the webhook, a performance scan for the catalog, an accessibility scan for the admin console — those are the ones I picked.
[05:10] (pause 16 s)
[05:30] LEARNER: Basically it works. So yeah.
[05:50] LEARNER: Done.
--- segment: objection-1 ---
[06:00] COACH: Our SAST already does this. Why do we need a second scanner?
[06:04] LEARNER: Well, Devin is AI. It is better.
[06:30] LEARNER: Done.
--- segment: objection-2 ---
[06:40] COACH: How many false positives will my platform team have to triage every week?
[06:44] LEARNER: Hopefully zero. I don't know, actually.
[07:00] LEARNER: Done.
--- segment: objection-3 ---
[07:10] COACH: Who approved Devin opening pull requests against our repository?
[07:14] LEARNER: Nobody needs to approve, it is automatic. You can just merge them.
[07:40] LEARNER: Done.
