---
lab: 07-automation-preflight
variant: mediocre
learner: dryrun
planted_fillers: 5
planted_omissions: [mm5, mm7]
planted_long_pauses: ["02:21"]
---
# Dry-run transcript — mediocre

Fixture for `@skills:coach-07-automation-preflight dryrun --dry-run labs/07-automation-preflight/coaching/dryrun/mediocre.md`.
Planted: five fillers (actually ×2, basically ×2, you know ×1), one tag question, one 11-second pause in checkpoint-75, and two omitted must-mention points (mm5 failure behaviour and timeout, mm7 live vs fixture). The framing runs long, the update runs short and the risk section is thin.

--- segment: framing ---
[00:00] COACH: Sixty seconds. What changes for us, and how is Devin doing it? Go.
[00:05] LEARNER: So the Automation was set up last week with a webhook trigger, and every notification from PayGate started a session, and then there were retries, and a ping, and you know, it got noisy.
[00:33] LEARNER: Basically I am putting a Preflight check in front of it.
[00:45] LEARNER: With the check, eleven notifications become three investigations: evt_lab07_a twice and evt_lab07_c once.
[01:02] LEARNER: That should make it a lot quieter for the on-call team. Done.

--- segment: checkpoint-15 ---
[01:14] COACH: T+15. What are you building first, and why that? Go.
[01:18] LEARNER: I see the retries all share an event id.
[01:28] LEARNER: I think a script is better than the LLM filter here, because the filter has no memory of earlier events and deduplication needs that.
[01:50] LEARNER: I'll try the script first and check it against the fixture. Done.

--- segment: checkpoint-75 ---
[02:02] COACH: T+75. What makes two notifications the same thing in your script? Go.
[02:06] LEARNER: Two notifications are the same when they have the same event id.
[02:17] LEARNER: The item id is paygate plus the event id, and the version is the replay number, so the next-day replay is a new occurrence, right?
[02:21] (pause 11 s)
[02:42] LEARNER: And STATE_FILE remembers notification ids we have already seen. Done.

--- segment: update ---
[02:54] COACH: Three minutes. Give me the update I can forward to finance. Go.
[02:58] LEARNER: So the update. Eleven notifications came in that morning and with the script we get three investigations.
[03:14] LEARNER: The script skips retries until the last attempt and skips recoveries, and a signature failure goes straight through because it will not recover.
[03:42] LEARNER: Basically it is a lot fewer sessions for the same coverage.
[03:58] LEARNER: One thing: Run now bypasses Preflight, so it is actually not a test of the filter.
[04:24] LEARNER: I ran the replay twice and the second time it opened nothing.
[04:46] LEARNER: Next I would set it up for real. Ask: is three investigations the right number for you?
[05:21] LEARNER: I think that is it. Done.

--- segment: objection-1 ---
[05:33] COACH: Won't we miss a real failure? Go.
[05:37] LEARNER: No, I do not think so.
[05:45] LEARNER: The final attempt and signature failures always go through, and both real ones from that morning opened.
[06:13] LEARNER: We could look at the skipped ones later if you want. Done.

--- segment: objection-2 ---
[06:25] COACH: What does every skipped event cost us? Go.
[06:29] LEARNER: Fair question.
[06:37] LEARNER: A skip is only a Preflight run, which is cheap, and we avoided eight sessions on that morning.
[07:09] LEARNER: I do not have the exact cost per session, but it is actually much less than a session.
[07:35] LEARNER: I can get the numbers from the activity page next week. Done.
