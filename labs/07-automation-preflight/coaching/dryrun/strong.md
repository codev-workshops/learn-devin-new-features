---
lab: 07-automation-preflight
variant: strong
learner: dryrun
planted_fillers: 1
planted_omissions: []
planted_long_pauses: []
---
# Dry-run transcript — strong

Fixture for `@skills:coach-07-automation-preflight dryrun --dry-run labs/07-automation-preflight/coaching/dryrun/strong.md`.
Planted: one filler (actually ×1), no tag questions, no long pauses, no omitted must-mention points. The outcome leads, the update follows Outcome → Evidence → Risk → Next action → Ask, and both objections follow acknowledge → boundary → evidence → offer.

--- segment: framing ---
[00:00] COACH: Sixty seconds. What changes for us, and how is Devin doing it? Go.
[00:04] LEARNER: Today, eleven PayGate notifications from one morning started eleven Devin sessions. After this change they start three: evt_lab07_a twice, once for the morning and once for the next-day replay, and evt_lab07_c once.
[00:30] LEARNER: The problem is not the Automation, it is what reaches it. I am adding a Preflight check that skips retries, recoveries and noise before Devin starts.
[00:58] LEARNER: You will know it works when the replay of that morning prints three investigations, and running it again prints zero. Done.

--- segment: checkpoint-15 ---
[01:10] COACH: T+15. What are you building first, and why that? Go.
[01:13] LEARNER: I see that every retry of evt_lab07_a looks identical apart from the attempt number.
[01:25] LEARNER: I think the LLM filter cannot catch that, because it judges each event alone. So I'll try a Preflight script, because deduplication needs memory across events.
[01:54] LEARNER: I'll check the naive version first to get a baseline: eight sessions. Done.

--- segment: checkpoint-75 ---
[02:06] COACH: T+75. What makes two notifications the same thing in your script? Go.
[02:09] LEARNER: Two notifications are the same thing when they share the PayGate event id and the replay number.
[02:20] LEARNER: The script keeps the notification ids it has seen in STATE_FILE, and emits an item with id paygate colon event id and version equal to replay_seq.
[02:52] LEARNER: So a manual replay the next morning is version two, a new occurrence, and it opens a new investigation. Done.

--- segment: update ---
[03:04] COACH: Three minutes. Give me the update I can forward to finance. Go.
[03:08] LEARNER: Outcome: eleven notifications in, three investigations out, and both real failures from that morning were caught.
[03:24] LEARNER: Evidence: the replay prints events 11, sessions 3, skipped 8, failed 0, and a second run against the same state opens nothing.
[03:44] LEARNER: The rules: transient retries that are not the last attempt are skipped, and so are recoveries. The final attempt goes through, and a signature failure goes through on its first attempt because it will never recover.
[04:14] LEARNER: Risk: if the script times out, exits non-zero or writes an invalid decision, the event stops before any action and there is no automatic retry. I set the timeout to 30 seconds, inside the 1 to 300 allowed, because the script only reads two small files.
[04:48] LEARNER: One more risk: Run now bypasses Preflight, so clicking it does not test the filter. Test it with the replay or one fixture notification instead.
[05:30] LEARNER: Integrations: everything today ran on the offline fixture replay; no live Automation received a notification, and PayGate was a fixture.
[06:00] LEARNER: Next action: I create the live Automation from the script and send the fixture once. Ask: can I turn on queueing with three concurrent runs? Done.

--- segment: objection-1 ---
[06:12] COACH: Won't we miss a real failure? Go.
[06:16] LEARNER: That is the right worry, and missing one is worse than an extra session.
[06:28] LEARNER: The script skips exactly four things: retries that are not the last attempt, deliveries that recovered, notifications it has already seen, and events that are not delivery failures.
[06:54] LEARNER: On the fixture morning both real failures still opened, the signature failure on its first attempt, and if the script breaks the event fails loudly, it is never a silent skip.
[07:40] LEARNER: I can keep every skip reason visible and review a week of them with you before we tighten anything. Done.

--- segment: objection-2 ---
[07:52] COACH: What does every skipped event cost us? Go.
[07:56] LEARNER: Fair question, and finance should ask it.
[08:05] LEARNER: A skip costs a short Preflight run, not a Devin session. A session costs agent time and an on-call reader.
[08:29] LEARNER: That morning eleven notifications became three sessions, so we avoided eight sessions, and the on-call read three focused investigations instead of eleven.
[09:23] LEARNER: I can compare a week of Automation activity before and after, sessions and ACUs, and bring it to next Thursday. That is actually the number finance wants. Done.
