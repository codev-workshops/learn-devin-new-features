# Integration fixtures

Offline stand-ins for the integrations labs use. A learner without access to Slack, PagerDuty, Datadog, AWS, GCP, BigQuery or Google Workspace uses these files instead of the live MCP server. Values are fictional. Never add real tokens, hostnames or customer data.

| Folder | Stands in for | Used by |
| --- | --- | --- |
| `observability/` | Datadog monitor, OpenTelemetry collector config, structured logs | Lab 12 (Oncall) |
| `pagerduty/` | A PagerDuty incident webhook payload | Labs 8 and 12 |
| `bigquery/` | Payroll analytics table schema and a reconciliation query | Lab 12 |
| `google-workspace/` | A payroll calendar and an approvals sheet export | Labs 7 and 12 |
