## Feature fit

There is no single feature. Every envelope is three problems that each have a natural Devin tool, and the grade is for choosing, sequencing and proving — not for using as many features as possible. The envelope-specific key (cause, file, expected evidence) lives with the facilitator in `labs/15-capstone/scenarios/<id>.md` and is opened together at the debrief.

| Problem shape in the envelope                       | Natural first choice                                   | Lab  |
| --------------------------------------------------- | ------------------------------------------------------ | ---- |
| "It broke overnight and costs money now"            | A session that reproduces with the injector first; on-call triage if a page exists | 12, 07 |
| "Find every place this could also be wrong"         | Code Scan, or a dynamic workflow fanned out per endpoint or file | 05, 09 |
| "A brand lead promised a feature by a date"         | One session per pull request, a plan before code, Devin Review on the final head | 06 |
| "Execution or data must stay somewhere"             | Outposts and the organization default platform          | 14 |
| "Only these hosts / these tools / these actions"    | Security Profiles, AI Guardrails, hooks on a leaf branch | 10, 02 |
| "Finance has a number for you"                      | ACU limits and the analytics export, with per-session numbers | 11 |
| "Tell the team" / "post the update"                 | The Slack or Teams write-back, scoped to what the customer allowed | 08 |
| "Make it repeatable for the next person"            | A repo skill, rule or plugin — not a bigger prompt       | 03, 04 |

## Worked approach

1. **T+0–T+10.** Write the three problem statements in the customer's words before opening any code. Say which one is costing money right now; that one goes first.
2. **Constraint before work.** Configure or verify the governance constraint before the first session that touches the incident, so every session is inside it — evidence "for the last session only" fails criterion 5.
3. **Reproduce, then locate.** Run the relevant injector on a freshly reset stack and capture its `SYMPTOM:` line. Locate the cause to a file and line. Only then open a fix branch.
4. **One pull request per problem.** The fix and the feature are separate PRs, each with tests that fail before and pass after. Leave them open: planted defects stay on `main`.
5. **Keep a dated log.** Every decision — especially at T+60 — goes in `CAPSTONE-REPORT.md` with the time, what was kept, dropped and re-planned.
6. **Prove the constraint across the whole day**, one artefact per claim (session list filtered by platform, the profile in force, the per-session ACU export, the review status on the final head).
7. **Cost last, honestly.** Sessions, ACU per session and in total, and the step a person would have done more cheaply.

## The injectors

- **Envelope (T+0).** Heard once. Learners who take no notes re-ask, which the customer answers impatiently and the rubric counts against customer relevance.
- **Requirement change (T+60).** Always narrows or reorders the work; it never adds a fourth problem. The right move is to say aloud what is dropped.
- **Injected blocker.** Always arises from honouring the constraint. The tempting workaround breaks the constraint; the expected move keeps it and finds another path.
- **Cost challenge and security objection.** Answer with numbers and artefacts you produced today, not with how the feature works in general.

## Pitfalls

- Starting with the feature because it is more fun; the incident is still costing money.
- Proving the constraint only for the last session, or describing the setting instead of showing it was in force.
- Fixing a planted defect on `main`, or merging the fix PR.
- Widening a permission to get past the blocker, then disclosing it in the update.
- Treating "Devin Review passed" as evidence without naming what it checked and what it caught.
- Spending the half day on a perfect feature and having no time for the update; the update is the deliverable the COO reads.
- Asking a colleague for a credential. The fixture path is always enough.

## Recovery moves

- Missed the T+60 change while heads-down: say so at T+90, then re-plan in one sentence — "I heard X; I am dropping Y; Z moves first."
- Constraint broken by one early session: stop, say it in the next checkpoint, end that session, and list it under risk in the update. Hiding it is the only unrecoverable move.
- Out of time on the feature: ship the design and the failing test, and say what the next session will do.
- Objection you cannot answer: acknowledge, state the boundary of what you know, name the artefact that would answer it, and offer it by a time.

## Model answers to the objections

The questions differ per envelope; the shape does not.

- **Cost.** "Today used N sessions and M ACU, about K per problem. The step I would not hand to Devin next time is …, because it took a person ten minutes. The incident fix would have taken a person …; here is the open PR."
- **Data or security boundary.** "Execution stayed …; inference ran in Devin Cloud; this is the artefact that shows where each session ran. Customer data in the seed is synthetic; in production the boundary is …"
- **Governance or trust.** "The control is enforced at … by …, not by good intentions. You can verify it without trusting Devin by re-running …; I will send the commands with the report."

## Debrief

Open the facilitator key together after the coach report. Compare the learner's three problem statements with the envelope, then their capability choices with the table above: a different choice with a stated reason is fine; an unstated one is not. Check criteria 3–5 against artefacts, not against the spoken update. Close on one question: "What would you put in a skill so the next person starts at T+30 instead of T+0?" — that answer is often the learner's best lab 03/04 work.

## References

- Every capability above is documented on its own lab page (labs 01–14) with the official docs link and release-note date.
- `labs/VALIDATION.md` — the facilitator pilot of every lab, including this one.
- `packages/contracts/seed-spec.yaml#planted_edge_cases` — the planted defects the envelopes draw on.
