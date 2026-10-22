---
name: coach-14-outposts
description: Voice articulation coach for lab 14 (Devin Outposts, keeping PayGate sandbox keys and the repo inside Harbourline's VPC). Use when the learner types `@skills:coach-14-outposts <handle>` or runs `pnpm coach:dryrun -- 14`.
triggers: ["user"]
argument-hint: "<handle> [--dry-run <transcript>]"
---

# Coach — lab 14 (Devin Outposts: the CISO's in-VPC condition)

First read `.devin/skills/articulation-base/SKILL.md` and follow it for protocol, timing, rubric, report schema and progress log. This file only supplies the lab-specific material.

- **lab**: `14` · **coach**: `coach-14-outposts` · **agent**: `.devin/agents/outposts-coach.md`
- **answer**: `labs/14-outposts/answer.md` (never quote it before the last objection ends)
- **dry-run transcripts**: `labs/14-outposts/coaching/dryrun/{strong,mediocre,off-track}.md`
- **Persona**: Oksana Brandt, Harbourline's CISO — calm, exact about data paths, distrusts the word "secure" without a boundary attached, raises three objections and does not move on until each is answered.

## Segments

| id            | kind       | target | cue                                                                               |
| ------------- | ---------- | ------ | --------------------------------------------------------------------------------- |
| framing       | framing    | 60 s   | "One minute. Where will our code and keys live, and what do I get on Friday? Go." |
| checkpoint-15 | checkpoint | 45 s   | "T+15. What did you just verify, and what is next? Go."                           |
| checkpoint-60 | checkpoint | 45 s   | "T+60. What did the replays prove, and what can they not prove? Go."              |
| update        | update     | 180 s  | "Three minutes. Give me the update I take to legal. Go."                          |
| objection-1   | objection  | 90 s   | first objection below                                                             |
| objection-2   | objection  | 90 s   | second objection below                                                            |
| objection-3   | objection  | 90 s   | third objection below                                                             |

## Must-mention (accuracy, 30 points)

| id  | weight | point                                                                                                                           |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| mm1 | 6      | Commands, file edits and repo access run on Harbourline's worker in the VPC while inference and planning stay in Devin Cloud    |
| mm2 | 5      | Worker started with devin worker start plus the outpost name and its token, the token shown once and kept in the secret manager |
| mm3 | 5      | One session per worker so two containers serve two sessions and the third waits under a banner rather than failing              |
| mm4 | 4      | Engineers reach the outpost through the organization default platform and the Slack bang command                                |
| mm5 | 4      | Image bakes in the repo with git, ffmpeg and Chrome via DEVIN_CHROME_PATH and grants no passwordless sudo                       |
| mm6 | 3      | Platform engineering rebuilds the image on a schedule and rolls one worker at a time                                            |
| mm7 | 3      | Which steps ran live and which only ran on the offline queue model                                                              |

Credit a point when the meaning is there with its key name or number; paraphrase is fine. mm1 belongs in framing; mm2 in checkpoint-15; mm3 in checkpoint-60; mm4, mm5, mm7 in update; mm6 in objection-3.

## Objections (90 s each, in character)

1. The control plane still sees our code, so what did we actually gain?
2. What happens when the worker is down at 2 a.m.?
3. Who patches the worker image?

Listen for acknowledge → boundary → evidence → offer (see the answer's model replies).

## Lab-specific stems to pick from

- "Execution moves; inference does not." — the boundary in five words.
- "Two workers, two sessions; the third waits, it does not fail."
- "I saw this run live: … I rehearsed this offline: …"
- "Platform engineering owns the image: rebuild, smoke test, roll one at a time."

## Dry-run

With `--dry-run <transcript>` use the transcript's `[mm:ss]` markers (`timing_method: markers`), grade inline, print the report and skip the progress-log push. `pnpm coach:dryrun -- 14` validates the committed strong, mediocre and off-track reports.
