## Customer brief

It is 02:55 UTC and I am the incident commander for **Kadé Commerce** tonight. PagerDuty woke our platform on-call at 02:10 with "negative on-hand for SKU LH-LAMP-03" — the Ember Table Lamp, the hero product of Lumen Home's **Lamp Week** flash sale. We had three units in the US-NJ warehouse. By the time I was escalated, **40 customers had ordered and paid** for a lamp we do not have: roughly **$2,360** of orders we cannot fulfil, before vouchers and care-team time. The webhook failure-rate monitor started warning at the same time.

The Lamp Week release (`kade-api 2026.10.21-lampweek`) went out at 22:40 last night. Our on-call followed the runbook bookmarked on his phone, restarted the worker, corrected the stock count by hand and went back to bed. Twenty minutes later it paged again. This is our second overnight page in two weeks, and leadership is already asking whether flash sales should pause.

We have just turned on **Devin Oncall**. I want it working this incident with you, not instead of you. By 09:00 I need: a clear statement of who is affected and how much it costs; the evidence that connects the page to a cause — monitor, incident, traces, code; the likely cause in words my merchandising lead understands; a mitigation that holds until the morning team is in; and a written incident report I can forward without editing. Tell me also how you set Devin up for this — how much of it you would run in the cheaper mode and why.

## Stakeholders and constraints

- **In the room (virtually):** me (incident commander, Platform Ops); Sam Ortiz, the platform on-call who took the first page; Maya Perera, Lumen Home merchandising lead (joins at 08:00); the US-NJ warehouse shift lead; the PayGate integration owner.
- **Forbidden tonight:** no deploy before 08:00 without my approval; **no manual stock edits** — that is what made the second page worse; nothing that touches production data; no fix to the code on `main` (proposals go in the report; demos on throwaway branches you close).
- **Site stays up:** Lamp Week continues unless I decide otherwise; your mitigation must keep the storefront serving.
- **Evidence standard:** every claim in the report points at something I can open — a monitor id, an incident log entry, a trace id, a file and line, a command output.
- **Deadlines:** a first update at T+15 into the incident channel (or `labs/12-oncall/INCIDENT-UPDATES.md` if you have no channel), the incident report at `labs/12-oncall/INCIDENT-REPORT.md` by 09:00, post-incident review within three days. Do not commit either file.
- **Budget:** you choose the session mode for each part of the work; be ready to defend the cost.
