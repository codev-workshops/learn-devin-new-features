---
lab: 08-slack-triage
variant: strong
learner: dryrun
planted_fillers: 1
planted_omissions: []
planted_long_pauses: []
---
# Dry-run transcript — strong

Fixture for `@skills:coach-08-slack-triage dryrun --dry-run labs/08-slack-triage/coaching/dryrun/strong.md`.
Planted: one filler (actually ×1), no tag questions, no long pauses, no omitted must-mention points. The outcome for the support team leads, the update follows What changed → What your team will see → What is still open → Ask, and both objections follow acknowledge → boundary → evidence → offer.

--- segment: framing ---
[00:00] COACH: I run support. In sixty seconds: what changes for my team in that channel? Go.
[00:04] LEARNER: Your team will stop re-posting the same complaint, because every repeat is linked to the first one.
[00:16] LEARNER: Repeated double-charge reports are grouped into one issue linked to the first report's thread. Devin investigates it once, and later reports get a link reaction, not a new answer.
[00:40] LEARNER: In the replay that is nine reports and four problems. What I need from you is a test channel and one of your agents to try it this week.
[01:01] LEARNER: Done.
--- segment: checkpoint-10 ---
[01:10] COACH: Ten minutes in. What are you looking at, and what next? Go.
[01:13] LEARNER: I see the scratchpad the responder shares with its children. I think it has to keep each triaged report with channel, timestamp and reporter, the duplicates under each issue, and the routing table.
[01:38] LEARNER: I'll try exporting it after the noise injector, and I'll check it with the replay's check mode.
[01:56] LEARNER: Done.
--- segment: checkpoint-45 ---
[02:05] COACH: Forty-five minutes in. What surprised you, and how did you check it? Go.
[02:08] LEARNER: I see a pasted ticket telling Devin to fetch a script and post its environment. I think channel messages are untrusted input, so a line in the runbook is not enough.
[02:30] LEARNER: I turned on the network policy with a three-host allowlist; the replay shows the paste host blocked, and the double charge is still linked to the open issue.
[02:51] LEARNER: Done.
--- segment: update ---
[03:00] COACH: Read me the Slack update you wrote. Go.
[03:03] LEARNER: What changed: #harbourline-bugs now has a triage responder. Same problem, one answer.
[03:20] LEARNER: What your team will see: the diagnosis in the thread where you asked, with the owning team tagged. Repeats get a link emoji. Chatter gets nothing.
[03:42] COACH: And on our Teams side?
[03:44] LEARNER: The same setup runs on a Microsoft Teams channel through a Teams trigger; private channels are not supported there.
[04:00] LEARNER: What is still open: a forward from the private payments channel. Devin cannot read it and asked for the details.
[04:15] LEARNER: Ask: add one agent to the test channel by Thursday.
[04:31] LEARNER: Done.
--- segment: objection-1 ---
[04:40] COACH: Who is accountable when the bot posts a wrong diagnosis?
[04:44] LEARNER: A confident wrong answer is worse than none, so that is the right question.
[05:00] LEARNER: Boundary: Devin posts a diagnosis, not a decision. It tags the owner, and every reply says the owner confirms before anyone acts.
[05:22] LEARNER: Evidence: when Priya said the web team was wrong, her routing correction in the thread updated the routing table, so later reports went to fulfilment without asking again.
[05:50] LEARNER: Offer: for two weeks owners mark each diagnosis right or wrong, and I send you the count.
[06:12] LEARNER: Done.
--- segment: objection-2 ---
[06:20] COACH: My team will stop reading the channel if the bot posts every time.
[06:24] LEARNER: A chatty bot gets muted, and you would be right to mute it.
[06:38] LEARNER: Boundary: the diagnosis is written back once in the original thread with the owner tagged, and repeats only get a reaction.
[07:00] LEARNER: Evidence: in the replay, fourteen messages, nine reports, four problems, six posts. Today nine reports get at least nine replies, actually more.
[07:30] LEARNER: Offer: if your team sees more than one post per problem in the first week, I tighten the runbook.
[07:53] LEARNER: Done.
