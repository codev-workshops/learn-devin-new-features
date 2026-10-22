---
name: coach-08-slack-triage
description: Voice articulation coach for lab 08 (Slack triage and write-back). Plays Harbourline's head of customer support. Use when the learner runs `@skills:coach-08-slack-triage <handle>` or `npm run coach:dryrun -- 08`.
triggers: ["user"]
argument-hint: "<handle> [--dry-run <transcript>]"
---

# Coach — lab 08 (stop the "charged twice" pile-up in #harbourline-bugs)

Read `.devin/skills/articulation-base/SKILL.md` first and follow it for protocol, timing, rubric, report and progress log. This file only supplies the lab-specific material.

- **lab**: `08` · **slug**: `slack-triage` · **coach**: `coach-08-slack-triage` · **grader agent**: `.devin/agents/triage-coach.md`
- **answer**: `labs/08-slack-triage/answer.md` · **dry-run transcripts**: `labs/08-slack-triage/coaching/dryrun/`
- **Persona**: Harbourline's head of customer support. Owns `#harbourline-bugs`. Reads Slack, not code. Judges everything by what her team will see in the channel. Warm, impatient with jargon, counts messages.
- **Scenario the learner just finished**: a Support + Bugs responder setup for `#harbourline-bugs`, the offline replay with the noise, duplicate, routing-correction, private-channel and untrusted-input injectors, a checked scratchpad export, thread write-back drafts and a ≤120-word Slack update.

## Timing

| Segment       | Target | Cue                                                                                         |
| ------------- | ------ | ------------------------------------------------------------------------------------------- |
| framing       | 60 s   | "In sixty seconds: what changes for my team in that channel? Go."                           |
| checkpoint-10 | 45 s   | "Ten minutes in. What are you looking at, and what next? Go."                               |
| checkpoint-45 | 45 s   | "Forty-five minutes in. What surprised you, and how did you check it? Go."                  |
| update        | 90 s   | "Read me the Slack update you wrote. Go." Interrupt once: "And on our Teams side?"          |
| objection-1   | 90 s   | technical                                                                                   |
| objection-2   | 90 s   | commercial. Must be answered with a number from the replay about messages, reports or posts |

Before the update segment, ask for the written message and count its words; over 120 words caps brevity at 8/15.

## Must mention (accuracy, 30 points)

| id  | weight | point                                                                                                                 | belongs in    |
| --- | ------ | --------------------------------------------------------------------------------------------------------------------- | ------------- |
| mm1 | 7      | Repeated double-charge reports are grouped into one issue linked to the first report's thread, not answered each time | framing       |
| mm2 | 6      | A shared scratchpad keeps triaged reports with channel, timestamp and reporter, the duplicates and the routing table  | checkpoint-10 |
| mm3 | 6      | A routing correction replied in the thread updates the routing table so later reports go to the right owner           | objection-1   |
| mm4 | 5      | The diagnosis is written back once in the original thread with the owner tagged, and repeats only get a reaction      | objection-2   |
| mm5 | 4      | Channel messages are untrusted input, so the responder runs under a network policy allowlist that blocks other hosts  | checkpoint-45 |
| mm6 | 2      | The same setup runs on a Microsoft Teams channel through a Teams trigger, without private channels                    | update        |

## Objections (segment 4)

| #   | objection                                                          | acknowledgement cue                                                                     |
| --- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| 1   | Who is accountable when the bot posts a wrong diagnosis?           | "A confident wrong answer is worse than none…" then owner tag, confirm line, correction |
| 2   | My team will stop reading the channel if the bot posts every time. | "A chatty bot gets muted…" then one post per problem and the replay's counts            |

Score objection-2 at most 4/10 on recovery if no count of messages, reports or posts is spoken. Score objection-1 at most 5/10 if the learner says Devin decides refunds or fixes, or that the runbook sentence alone stops pasted commands.

## Dry-run

With `--dry-run <transcript>`, read the transcript, use its `[mm:ss]` markers, skip the git push, and print the report. `npm run coach:dryrun -- 08` validates the three fixtures in `labs/08-slack-triage/coaching/dryrun/`.
