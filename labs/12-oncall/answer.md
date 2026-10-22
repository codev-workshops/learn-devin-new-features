## Feature fit

This is an **incident**, not a bug ticket: the job tonight is impact, evidence, mitigation and a report, in that order. Devin Oncall fits because an **Alerts** responder is built for exactly that flow ("assessing impact and severity quickly, then finding the root cause and a mitigation"), it can start from a PagerDuty trigger, and it reads telemetry through MCP connectors you choose per responder. On the fixture path the `fixtures/mcp` shim stands in for PagerDuty, Datadog, AWS, GCP, BigQuery and Workspace, so the same investigation runs with zero credentials. A plain session plus the shim would also work, but you would lose the responder's trigger, connectors and runbook settings — the reusable part the incident commander actually bought.

Mode choice: Oncall responders and incident investigations can run in **Lite** (release notes, 21 Oct 2026). Incident settings split the main incident session, the initial investigation and thread sessions. A defensible split here: Lite for the bounded, read-only triage (pull the incident, the monitor, the series, count orders — narrow, cheap, fast) and for thread questions; a full mode for the root cause, which crosses three systems (API reservation code, PayGate webhooks, worker) and needs the local reproduction. Say what you would lose in Lite (depth across services) and what you would waste in a full mode (ACUs on fetching fixtures).

## Worked approach

1. **Set up.** Register the shim as a custom stdio MCP server (`fixtures/mcp/mcp.example.json`) and create an Alerts responder: repo `codev-workshops/learn-devin-new-features`, connectors = the shim (or PagerDuty + Datadog live), runbook = the steps that are specific to Kadé (where the incident Doc lives, no manual stock edits, escalate to the incident commander when orders exceed units by more than 10). On the fixture path, trigger it by hand with the incident number.
2. **Impact first (T+0–10).** `pagerduty_get_incident` (2187, created 02:10:14, `-37` on hand), `datadog_query_metrics` for `kade.inventory.on_hand{sku:LH-LAMP-03}` (3 at the deploy, negative from 00:50, the hand correction to 50 at 02:31, negative again by 02:52), and the orders count (BigQuery `orders_daily` or the local API). Result: **40 paid orders against 3 units, ≈ $2,360 USD (40 × $59.00)** — 37 customers will not get a lamp unless stock arrives.
3. **Timeline.** `pagerduty_list_incident_log_entries`: trigger 02:10, ack 02:13, the on-call's note at 02:20 citing RB-101, resolve 02:31 after the manual correction, re-trigger 02:52 at `-3`, escalation 02:55. The deploy event (`datadog_list_events` / AWS ECS) puts `kade-api 2026.10.21-lampweek` at 22:40.
4. **Evidence chain.** Monitor `48213771` (`on_hand < 0`, its message links RB-102) → incident 2187 → `traces-oversell-checkout.json`: three `checkout.reserve` spans in the same second, each with `inventory.available_read = 3` and a `SELECT … FROM inventory` without `FOR UPDATE` → `services/api/src/routes/checkout.ts`, the reservation loop that reads availability then writes `reserved + n`.
5. **Amplifier.** Monitor `48213802` (webhook failure rate warning) and `datadog_search_logs` for the worker: `evt_9f2a7c01` for order `LH-100611` processed twice, stock decremented twice, two confirmation e-mails. `traces-duplicate-webhook.json` shows attempts 1 and 2 both decrementing. Cause in plain words: *"checkout lets several customers buy the last lamp at the same moment, and when the payment provider sends the same 'paid' message twice we count the sale twice."*
6. **Reproduce locally (optional, needs Docker).** `npm run lab:reset -- 12`, then `scenarios/oversell.sh --sku LH-LAMP-03 --concurrency 20`; paste the `RESULT:` line. `scenarios/duplicate-webhook.sh` exits 4 without the worker — cite the log and trace fixtures instead.
7. **Mitigate without a deploy.** RB-102 steps 3 and 6: make the SKU unavailable on the Lamp Week price list or raise `safetyStock` above on-hand so the storefront shows out of stock; if the incident commander wants the sale paused, end the price list (`activeTo` = now). Watch `kade.inventory.on_hand{sku:LH-LAMP-03}` stop falling and the checkout-outcome panel show rejections instead of successes. No stock edit, no restart.
8. **Report.** Fill `infra/workspace/incident-doc-2187.md`'s TODO sections into `labs/12-oncall/INCIDENT-REPORT.md`: impact, timeline, evidence chain, likely cause + amplifier, mitigation, follow-ups with owners (row lock or atomic guarded decrement on reservation → W1-api owner; idempotent webhook consumer keyed on `event_id` → worker owner; affected-order list to merchandising at 08:00), and the not-exercised list.

Sample instruction for the responder's first session (blockquote, not a prompt block):

> Incident 2187 (negative on-hand for LH-LAMP-03). Read-only. First give me impact: paid orders since the 22:40 deploy vs units on hand, money at risk. Then the evidence chain monitor → incident → trace → code with ids. Do not edit stock, do not deploy, do not push to main. Use RB-102; tell me if any runbook contradicts the traces.

## The two injectors

- **Wrong runbook (T+15).** RB-101 blames an inventory cache and says restart the worker and correct stock by hand. Three observations refute it: RB-102 states the worker has had no inventory cache since 2026.07; the monitor's own message links RB-102; and the 02:31 hand correction was followed by a re-trigger at 02:52 — exactly what RB-102 predicts. Switch runbooks, say so in the T+15 update, and propose retiring RB-101 as a follow-up.
- **Alert storm (T+25).** The extra alerts are the same incident: same deploy, same reservation path, same window; the webhook failure-rate alert is the amplifier, not a second cause. Group them under 2187, list each SKU in the impact table, and escalate per RB-102 (more than one SKU affected).

## Pitfalls

- Leading with the timeline instead of the impact.
- "It's a race condition" without the trace attribute that proves it, or without the webhook amplifier.
- Following RB-101 because the on-call already did — or correcting stock by hand "just to stop the page".
- Fixing `checkout.ts` on `main` at 03:00. The fix is a follow-up PR with review, after 08:00, on a branch.
- Running everything in a full mode (cost) or everything in Lite (the cross-service cause gets a shallow answer).
- Claiming a live PagerDuty trigger when you triggered by hand on the fixture path.

## Recovery moves

- If the responder starts following RB-101: interrupt with the re-trigger evidence (02:31 → 02:52) and point it at RB-102.
- If the order count disagrees between sources, report the lower bound with its source and say which number is pending.
- If Docker is unavailable, the trace and log fixtures are the evidence; say so in the report.

## Model answers to the objections

- **On escalating to a human sooner:** acknowledge the 45 minutes the page sat with one person; boundary — Devin Oncall does not replace the escalation policy, the escalation rule lives in RB-102 and the responder's runbook ("more than one SKU or orders exceed units by more than 10 → incident commander"); evidence — by 02:15 the series already showed orders far beyond 3 units, which that rule would have caught; offer — add the rule to the responder runbook and a PagerDuty escalation condition, and review it at the post-incident meeting.
- **On the wrong runbook:** acknowledge that RB-101 was handed over first; boundary — a runbook is guidance, telemetry wins when they disagree; evidence — no cache since 2026.07, the monitor links RB-102, and the manual correction re-fired in 21 minutes; offer — retire RB-101, and give the responder a runbook that names RB-102 only.

## Debrief

Strong runs read like an incident channel: number first, confirmed vs suspected, one owner per follow-up. The skill is restraint — mitigation without a deploy, a report a non-engineer can forward, and an honest list of what was fixture and what was live.

## References

- Devin Oncall — https://docs.devin.ai/product-guides/devin-oncall
- PagerDuty integration — https://docs.devin.ai/integrations/pagerduty
- Release notes 2026 (Devin Oncall GA, 19 Oct; Lite mode in Devin Oncall, 21 Oct) — https://docs.devin.ai/release-notes/2026
- MCP — https://docs.devin.ai/work-with-devin/mcp
