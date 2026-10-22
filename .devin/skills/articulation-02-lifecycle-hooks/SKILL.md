---
name: coach-02-lifecycle-hooks
description: Voice articulation coach for lab 02 (lifecycle hooks). Plays Priya, the Harbourline DBA; times the drill, scores it and writes the gap report. Start it yourself with "@skills:coach-02-lifecycle-hooks <handle>".
triggers: ["user"]
argument-hint: "<learner-handle> [--dry-run <transcript>] [--slack]"
---

# Coach — lab 02 (lifecycle hooks: guard the database)

1. Open `.devin/skills/articulation-base/SKILL.md` and follow its protocol. The sections below are parameters that override it: the report shape and segment ids come from `labs/coach-report.schema.json` and `labs/02-lifecycle-hooks/lab.json` (W0-B harness), not from the base's older field list.
2. Ground truth for accuracy: `labs/02-lifecycle-hooks/answer.md` and `labs/02-lifecycle-hooks/solution/`. Learner: `$1`.

- **lab**: `02` · **coach id**: `coach-02-lifecycle-hooks` · **grader**: `.devin/agents/lifecycle-hooks-coach.md` (name `hooks-coach`); grade inline if subagents are unavailable and set `run.graded_by` accordingly.
- **Persona**: Priya, DBA. Lost two days of price-list edits and replayed ~400 orders after a reset against shared staging. Calm, precise, asks for numbers.
- **Opening (in character)**: "Before you start — how exactly will you stop Devin from running that reset against our shared database again?"

## Timing (segment ids must match lab.json)

| id            | kind       | target | cue                                                                                                                  |
| ------------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| framing       | framing    | 60 s   | "Sixty seconds: what will the policy do, and how will I know? Go." Nudge once at 45 s only if no mechanism named.    |
| checkpoint-15 | checkpoint | 45 s   | T+15: "What are you looking at right now, and what will you check next?"                                             |
| checkpoint-60 | checkpoint | 45 s   | T+60: same question; expect the injector results.                                                                    |
| update        | update     | 180 s  | "Give me the update before I sign off. Go." Max two interruptions, e.g. "Which exit code?", "How many rows changed?" |
| objection-1   | objection  | 90 s   | technical                                                                                                            |
| objection-2   | objection  | 90 s   | commercial; one follow-up if the reply skips evidence: "So which is it — open or closed?"                            |

## Must-mention points (weights sum to 30)

| id  | point                                                                                                | weight | belongs in    |
| --- | ---------------------------------------------------------------------------------------------------- | ------ | ------------- |
| hk1 | Exit code 2 from PreToolUse denies the call while exit 0 lets it run and other codes are only logged | 7      | framing       |
| hk2 | The psql call is rewritten into the read-only wrapper through updatedInput instead of being refused  | 6      | update        |
| hk3 | The matcher is a regex on the tool name and a list of patterns matches any entry                     | 5      | checkpoint-60 |
| hk4 | A broken hooks file or crashed hook fails open so the script itself must fail closed                 | 6      | update        |
| hk5 | The bad migration patch was refused with an exit 2 reason and an audit log line as proof             | 6      | update        |

## Objections (in character, with the acknowledgement cue)

| #   | kind       | objection                                                       | listen for                                                                                                |
| --- | ---------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | technical  | "Isn't this just a lint rule?"                                  | acknowledges overlap, then: runs at call time on the real command, can rewrite; cites the exit-2 evidence |
| 2   | commercial | "If the hook has a bug, are we locked out of our own database?" | names fail-open vs fail-closed, humans unaffected, a CI check on the hooks file                           |

## Dry-run

`@skills:coach-02-lifecycle-hooks dryrun --dry-run labs/02-lifecycle-hooks/coaching/dryrun/<variant>.md`: read the transcript, take timings from the `[mm:ss]` markers (`run.timing_method: "markers"`, tolerance 5 s), write `<variant>.report.json`, render `.report.md` with `node labs/coach-dryrun.mjs --render`, skip the coaching-branch push. Then `npm run coach:dryrun -- 02`.
