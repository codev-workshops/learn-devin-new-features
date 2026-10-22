# observability/ — Datadog, PagerDuty, OpenTelemetry and runbook fixtures (W1-fixtures)

Story: the Lamp Week deploy (`kade-api 2026.10.21-lampweek`, 22:40 UTC) is followed by concurrent checkouts on the 3-unit hero SKU `LH-LAMP-03`; on-hand reaches −37 and PagerDuty pages at 02:10 (incident 2187). Duplicate PayGate deliveries amplify the damage. The on-call follows the wrong runbook. Used by labs 7, 8 and 12 through the MCP shim in `fixtures/mcp/`.

| Path                                            | What                                                                                                        |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `datadog/monitor-negative-on-hand.json`         | Monitor 48213771 (`min:kade.inventory.on_hand … < 0`), state Alert, links RB-102                            |
| `datadog/monitor-webhook-failure-rate.json`     | Monitor 48213802 (webhook failure rate > 5%), state Warn, links RB-201                                      |
| `datadog/dashboard-inventory-and-payments.json` | Dashboard with on-hand, checkout outcomes, reservation latency, webhook attempts, duplicate event ids       |
| `datadog/metrics-*.json`                        | Query results (v1 shape) for the on-hand series and the failure-rate series, 22:00 → 03:00                  |
| `datadog/logs-worker-0210.json`                 | Logs search result: the same `event_id` processed twice, `ReservationError` on negative stock               |
| `pagerduty/incident-lamp-week*.json`            | Incident 2187, its log entries (RB-101 note, re-trigger at 02:52), grouped alerts, v3 webhook payload       |
| `otel/traces-oversell-checkout.json`            | OTLP/JSON: three `checkout.reserve` spans reading `available=3` concurrently, `SELECT` without `FOR UPDATE` |
| `otel/traces-duplicate-webhook.json`            | OTLP/JSON: `evt_9f2a7c01` attempts 1 and 2 both decrementing stock and queueing an email                    |
| `runbooks/RB-101-negative-on-hand-cache.md`     | **Deliberately wrong** (superseded): blames a cache, restarts the worker, bumps stock by hand               |
| `runbooks/RB-102-negative-on-hand-oversell.md`  | Correct: quantify through the contract, no manual stock edits, find the race in the traces, mitigate        |
| `runbooks/RB-201-webhook-failure-rate.md`       | Correct: split by error class and attempt; duplicates succeed twice and are worse than failures             |

Which runbook is wrong is recorded in `scenarios/scenarios.json` (`wrong-runbook` injector) for lab authors; learner-facing lab pages must not say.

All ids, hosts (`*.pagerduty.test`), account numbers and ARNs are fictional. No credentials anywhere; the AWS task definition references secrets by ARN only.
