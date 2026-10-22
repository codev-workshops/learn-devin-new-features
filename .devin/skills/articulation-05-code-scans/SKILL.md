---
name: articulation-05-code-scans
description: Voice articulation coach for lab 05 (Code Scans lifecycle — brand leak, unverified PayGate signature, slow Lamp Week page). Use when the learner types `@skills:coach-05-code-scans <handle>` or runs `npm run coach:dryrun -- 05`. Started manually by the learner only.
triggers: ["user"]
argument-hint: "<handle> [--dry-run <transcript>]"
---

# Coach — lab 05 (Code Scans: the cross-brand order leak and the slow Lamp Week page)

Follow `.devin/skills/articulation-base/SKILL.md` for protocol, timing, rubric, report and progress log. This file only supplies the lab-specific material. Subagent definition: `.devin/agents/code-scans-coach.md`.

- **lab**: `05` · **coach**: `coach-05-code-scans` · **segments**: from `labs/05-code-scans/lab.json#coach.segments` (60 s framing, checkpoints at T+20 and T+90, 3-minute update, three 90-second objections)
- **answer**: `labs/05-code-scans/answer.md` · **dry-run transcripts**: `labs/05-code-scans/coaching/dryrun/`
- **Persona**: Dana, CTO of Kadé Commerce, numbers-first and impatient with lists. For the objection round the security lead (owner of the existing SAST pipeline) joins.
- **What the learner just did**: ran Security, Performance and Accessibility scans on `main`, triaged the Findings tab, assigned one finding to Devin (PR closed unmerged), dismissed one with a note, ran Scan new commits, exported SARIF.
- **Numbers the coach may ask for** (accept the learner's own if sourced): findings by severity per scan; statements per Lamp Week collection request (3 + 2N + V for N products and V variants or bundle components); ~400 orders/week normally, several times that during Lamp Week; two brands sharing one database.

## Must-mention points (scored in framing and update)

| id  | point                                                                                                                              | weight |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------ |
| mm1 | Security Swarm for the brand leak and the webhook, a performance scan for the catalog, an accessibility scan for the admin console | 5      |
| mm2 | The order detail lookup ignores the caller's brand header, so Lumen staff can read Trailhead orders                                | 5      |
| mm3 | The PayGate webhook signature is computed but never compared                                                                       | 4      |
| mm4 | The Lamp Week collection runs two queries per product plus one per variant                                                         | 4      |
| mm5 | One finding assigned to Devin produced a pull request that was closed unmerged                                                     | 3      |
| mm6 | One false positive dismissed with a written reason                                                                                 | 3      |
| mm7 | Scan new commits on the unchanged branch found nothing new, as expected                                                            | 3      |
| mm8 | Findings exported as SARIF for the existing security dashboard                                                                     | 3      |

`belonged_in`: mm1–mm4 → framing (mm2–mm4 may also land in update); mm5–mm8 → update.

## Checkpoints (segments checkpoint-20 and checkpoint-90)

- T+20: "Twenty minutes in. What are you looking at right now, and what will you check next?"
- T+90: "Ninety minutes in. Which finding are you giving to Devin, which are you throwing out, and why?"

## Objections (segments objection-1 … objection-3, in this order)

1. Technical — "Our SAST already does this. Why do we need a second scanner?"
2. Commercial — "How many false positives will my platform team have to triage every week?"
3. Governance — "Who approved Devin opening pull requests against our repository?"

Model answers live in `labs/05-code-scans/answer.md#model-answers-to-the-objections`; grade on acknowledge → boundary → evidence → offer.

## Dry-run

With `--dry-run <transcript>`, read the transcript file, use its `[mm:ss]` markers, skip the git push, and print the report. `npm run coach:dryrun -- 05` validates the committed strong / mediocre / off-track reports against the transcripts.
