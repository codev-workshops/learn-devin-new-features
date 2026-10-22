## Customer brief

> "PayGate retries failed webhooks three times; we want one investigation per incident, not three."
> — Kadé payments lead, Thursday stand-up

Last week the payments lead wired PayGate's delivery-failure notifications straight into a Devin Automation with a Webhook trigger. Every notification started a session. One bad morning produced eleven sessions for what turned out to be two problems: a Lumen Home order whose confirmation webhook kept hitting a 503, and a Lumen Home `payment.failed` event rejected for a bad signature. The rest were retries of the same event, a delivery that recovered on its second attempt, a notification PayGate sent twice, a `test.ping` and one notification with no event id at all.

The lead wants the Automation kept, because the two real failures were caught quickly. What has to change is what reaches Devin: one investigation per real failure, a second one only when the same event fails again after a manual replay, and nothing for noise. They will ask you how you know nothing real is being dropped.

The file `labs/07-automation-preflight/fixtures/paygate-notifications.json` holds that morning's eleven notifications in arrival order, plus the next-day replay. Monitor `48213802` (webhook failure rate above 5% over 15 minutes) and runbook `RB-201` are the context the investigations themselves would use.

## Stakeholders and constraints

- **Payments lead (Lumen Home and Trailhead Supply)** — owns PayGate and the Automation. Wants fewer sessions, but a missed real failure is worse than an extra session. Reads your update in three minutes.
- **Finance controller** — pays for every session the Automation starts. Will ask what the filtering costs and what it saves.
- **Platform on-call** — reads the investigations. Wants each one to name the event, the order, the error class and the attempt.

Constraints:

- One Automation, one Webhook trigger. No scheduled Automations and no weekly drills; any Automation you create live is disabled or deleted before you finish.
- The filter must survive PayGate sending the same notification twice and the same event failing again on a later day.
- The duplicate-webhook defect in the fulfilment worker is a planted course defect. Do not fix it on `main`.
- Money is a decimal string with a currency code; never a float, never mixed currencies in one total.
- No real PayGate account and no customer data: the fixture notifications are all you get.
