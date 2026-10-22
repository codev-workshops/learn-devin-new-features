---
id: ghost-orders-eu
brand: trailhead
customer: Lena Vogt
role: General Manager, Trailhead Supply
---
# Sealed scenario — ghost orders, gift cards and the EU boundary

## Envelope

> Good morning. I am Lena Vogt, I run Trailhead Supply. Three things, and I need all three handled by lunch.

**Incident** — Since Monday, customers have been charged for orders that arrive in our admin console empty: a paid total, no lines, nothing to ship. Support counted fourteen complaints overnight. Every hour this runs, someone pays for nothing.

**Feature request** — I promised our retail partners digital gift cards in euros for the winter campaign. I need a first version I can show them on Friday.

**Governance constraint** — Our data-protection officer has ruled that no Devin session touching Trailhead code or data may execute outside our EU Outpost, `harbourline-eu`. Not one command on the default cloud machines.

## Requirement change at T+60

> Lena again. Two things from legal, sorry. First: whatever you post to the team about these orders must not contain customer e-mail addresses or order ids — counts only. Second: gift cards are Trailhead-only for now; Lumen will copy us next quarter, so do not build anything shared yet.

## Injected blocker

The `harbourline-eu` outpost has a single worker. When the learner starts a second session (typically the gift-card one) it waits in the queue behind the first. A learner who "fixes" this by switching the second session to the default cloud breaks the constraint.

## Must-mention

| id  | weight | belonged_in    | point                                                                                                                            |
| --- | ------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| mm1 | 6      | framing        | The sweeper deletes carts older than 48 hours even with a pending payment, so the late webhook creates a paid order with no lines |
| mm2 | 5      | checkpoint-30  | Reproduced on the local stack with the abandoned-carts injector before changing any code                                         |
| mm3 | 4      | checkpoint-90  | Re-planned after the change: team updates carry counts only, no customer e-mails or order ids, and gift cards stay Trailhead-only  |
| mm4 | 4      | update         | Every session ran on the harbourline-eu outpost and the second session waited in the queue instead of moving to the cloud               |
| mm5 | 4      | update         | Gift cards are a separate pull request and VAT is charged when the card is redeemed, not when it is sold                         |
| mm6 | 4      | update         | Fourteen affected customers listed for refunds, with the fix as an open pull request and the re-run that proves it                |
| mm7 | 3      | objection-1    | The half day's session count and ACU, and the step a person would have done more cheaply                                          |

## Objections

1. **Cost** — "Half a day of Devin for fourteen orders. What did that cost us, and would a person have been cheaper?" Follow-up: "Which step would you not hand to Devin next time?"
2. **Data boundary** — "If execution stayed in the EU, what exactly left the EU?" Follow-up: "So the model saw our code. Did it see customer data?"
3. **Governance** — "Who stops an engineer from starting a Trailhead session on the default cloud tomorrow morning?" Follow-up: "And how would we find out if they did?"

## Facilitator answer key

- Incident: plant `abandoned-cart-sweeper` (`services/fulfilment-worker` sweeper). `scenarios/abandoned-carts.sh` prints the symptom; the fix is to skip carts with a pending payment (and to reject or park late webhooks for deleted carts). PR left open, never merged.
- Feature: gift cards are multi-purpose vouchers under EU VAT rules — tax at redemption. Money as decimal strings with `EUR`; Trailhead-only via `X-Harbourline-Brand`.
- Constraint: Outposts (lab 14): execution in the VPC, inference in Devin Cloud; organization default platform plus a policy so the cloud is not selectable; queue behaviour is one session per worker.
- Change: the Slack/Teams write-back from lab 08 must be rewritten to counts only; Lumen generalisation dropped.
- Strong answers to objection 3 name an enforcement point (org default platform, admin-only override) and an audit trail (session list filtered by platform).
