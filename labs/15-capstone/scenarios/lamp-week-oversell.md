---
id: lamp-week-oversell
brand: lumen
customer: Priya Raman
role: Head of E-commerce, Lumen Home
---
# Sealed scenario — Lamp Week oversell, back-in-stock alerts and the budget line

## Envelope

> Hi, Priya Raman, Lumen Home. Lamp Week relaunches on Friday at nine and I am not living through last year again.

**Incident** — On staging this morning our load test sold seven Ember Table Lamps when we had three. Last year the same thing cost us forty refunds and a week of angry reviews.

**Feature request** — Marketing wants a "tell me when it is back" sign-up on the three lamps that always sell out, live for Friday.

**Governance constraint** — Finance has put the Lumen team on its own ACU limit for this week, and Trailhead's on-call must never be starved because of us. Also: nothing merges without a clean Devin Review on the final commit.

## Requirement change at T+60

> Priya. Finance just halved what is left of our ACU for the week — a Trailhead incident ate into the shared pool. Same Friday deadline. Tell me what you are cutting.

## Injected blocker

Devin Review on the fix pull request raises a finding that the new lock order can deadlock against the inventory admin update. The learner must answer the finding (fix or justify), not dismiss it, before claiming the review is clean.

## Must-mention

| id  | weight | belonged_in    | point                                                                                                               |
| --- | ------ | -------------- | ------------------------------------------------------------------------------------------------------------------- |
| mm1 | 6      | framing        | The reservation reads stock and then writes it without a row lock, so concurrent checkouts sell lamps that do not exist |
| mm2 | 5      | checkpoint-30  | Reproduced with the oversell injector: twenty concurrent checkouts against a three-unit lamp                           |
| mm3 | 4      | checkpoint-90  | Re-planned for the halved budget: the oversell fix first, the back-in-stock sign-up cut to a small separate pull request |
| mm4 | 5      | update         | Re-running the injector after the fix shows no more than three checkouts succeed and stock never goes negative         |
| mm5 | 4      | update         | The review finding on lock order was answered and Devin Review is clean on the final commit                           |
| mm6 | 3      | update         | Lumen sessions run under the Lumen ACU limit so Trailhead on-call is never blocked                                    |
| mm7 | 3      | objection-2    | A monitor on negative available stock pages a human before customers notice                                           |

## Objections

1. **Cost** — "Finance halved your budget mid-morning. What did you stop doing, and what does that cost Lumen?" Follow-up: "Give me the number, not the feeling."
2. **Reliability** — "How do I know this does not happen again on Friday at nine o'clock?" Follow-up: "And who gets woken up if it does?"
3. **Trust** — "Why should I trust a review done by the same tool that wrote the fix?" Follow-up: "What did the reviewer actually catch that you missed?"

## Facilitator answer key

- Incident: plant `oversell` (`services/api` reservation). `scenarios/oversell.sh` exits 0 with the symptom; after a `SELECT … FOR UPDATE` or guarded atomic decrement on a leaf branch it exits 3. PR left open, never merged.
- Feature: a sign-up table plus an endpoint behind a flag; after the change it shrinks to a reviewed skeleton or a design note — both acceptable if said aloud.
- Constraint: ACU limits and analytics (lab 11) and Devin Review (lab 06). Strong learners show per-session ACU from the analytics fixture.
- Monitor: the Datadog fixture monitor from lab 12, or an equivalent alert on `available < 0`.
- A learner who answers objection 3 with "Devin Review is a different model, so it is independent" without naming the finding loses recovery points.
