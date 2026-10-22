---
lab: 05-code-scans
variant: strong
learner: dryrun
planted_fillers: 1
planted_omissions: []
planted_long_pauses: []
---
# Dry-run transcript — strong

Fixture for `@skills:coach-05-code-scans dryrun --dry-run labs/05-code-scans/coaching/dryrun/strong.md`.
Timings come from the `[mm:ss]` markers; the clock for each segment runs from the coach's "Go" (or the learner's first line) to the learner's "Done."

--- segment: framing ---
[00:00] COACH: I'm Dana. You have read my note. Sixty seconds: what are you going to run, and what will I have at the end? Go.
[00:03] LEARNER: The risk is that one brand's staff can read the other brand's orders, and that we accept payment webhooks nobody signed. The second problem is a slow Lamp Week page in our busiest week.
[00:20] LEARNER: I will run three scans on main, not one. Security Swarm for the brand leak and the webhook, because it reasons about trust boundaries; a performance scan for the catalog, because it counts queries per request; an accessibility scan for the admin console, because one of your merchandisers uses a screen reader.
[00:44] LEARNER: You will get a yes or no on cross-brand access, the statement count for the Lamp Week page, one fix proposed by Devin, and an export your security team can load.
[00:58] LEARNER: Done.
--- segment: checkpoint-20 ---
[01:10] COACH: Twenty minutes in. What are you looking at right now, and what will you check next?
[01:14] LEARNER: I see the Findings tab for the security scan, filtered to open and sorted by severity. The top finding points at the order detail route in orders.ts.
[01:32] LEARNER: I think it is real: the lookup uses only the order ID. I'll try reading the line it cites before I believe the title. I'll check whether the webhook finding is the same root cause or a separate one.
[01:58] LEARNER: Done.
--- segment: checkpoint-90 ---
[02:10] COACH: Ninety minutes in. Which finding are you giving to Devin, which are you throwing out, and why?
[02:14] LEARNER: I see seven findings across three scans. I think the brand leak is the one to assign: one file, one clear test, and the highest severity.
[02:34] LEARNER: I'll try dismissing the hard-coded secret finding, because the PayGate value in the example env file is the documented local fake. I'll check that the dismissal note says that in one sentence a reviewer would accept.
[02:58] LEARNER: Done.
--- segment: update ---
[03:10] COACH: Give me the update as if I were paying for it. Go.
[03:13] LEARNER: Outcome: yes, we are leaking across brands. The order detail lookup ignores the caller's brand header, so Lumen staff can read Trailhead orders by ID. That is one high-severity finding, in one file.
[03:38] LEARNER: Evidence: the PayGate webhook signature is computed but never compared, so anyone who can reach the endpoint can mark an order paid — the second high finding. And the Lamp Week collection runs three queries per product, 27 for the eight lamps: forty products means a hundred and twenty-one statements per page load.
[04:08] COACH: How many findings in total?
[04:11] LEARNER: Seven: two high in security, two medium in performance, two in accessibility, and one false positive.
[04:26] LEARNER: Next action, actually done already: one finding assigned to Devin produced a pull request that was closed unmerged, because this course keeps the defect on main; the fix and its test are reviewable. One false positive dismissed with a written reason — the fake PayGate secret in the example env file.
[05:00] LEARNER: After closing the PR I ran Scan new commits on the unchanged branch; it found nothing new, as expected, because nothing had landed on main. And the findings are exported as SARIF for the existing security dashboard, so your team triages in one place.
[05:36] LEARNER: Risk: we have only scanned main once; the scan is current only until the next merge. Ask: thirty minutes with the security lead to load the SARIF file and agree who fixes the brand leak for real.
[06:08] LEARNER: Done.
--- segment: objection-1 ---
[06:20] COACH: Our SAST already does this. Why do we need a second scanner?
[06:24] LEARNER: That's fair, and your SAST should stay. The boundary is what each tool knows: a pattern rule sees a lookup by ID and has nothing to object to, because it does not know that the brand header is our trust boundary.
[06:52] LEARNER: The evidence is the brand-leak finding itself: it cites the route, explains why the brand is missing from the query, and names the test that would prove it.
[07:20] LEARNER: What I'd offer is one queue, not two: the SARIF export loads into the same dashboard, and after a month you compare which findings each tool caught.
[07:52] LEARNER: Done.
--- segment: objection-2 ---
[08:00] COACH: How many false positives will my platform team have to triage every week?
[08:04] LEARNER: Triage time is the scarce resource, agreed. The boundary: findings are validated before they are reported, and duplicates are grouped, so the team sees causes, not lines.
[08:30] LEARNER: The evidence from this run: seven findings, one false positive, dismissed in two minutes with a note that stays on the record.
[08:58] LEARNER: The offer is to tune the profile after the first week — scope globs and triage guidance — and measure the dismissal rate. If it stays above one in five, we narrow the scope.
[09:30] LEARNER: Done.
--- segment: objection-3 ---
[09:40] COACH: Who approved Devin opening pull requests against our repository?
[09:44] LEARNER: Good question, and it should have an owner. Nothing opened a pull request until I assigned that one finding; Devin did not choose to.
[10:08] LEARNER: The pull request then went through normal review and branch protection, and nothing merges itself. The evidence is the closed demo PR: reviewed, not merged, and main unchanged.
[10:40] LEARNER: What I'd propose is that assigning findings stays with people who hold the Use permission, and managing profiles stays with your security lead.
[11:12] LEARNER: Done.
