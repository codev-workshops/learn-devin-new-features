# fixtures/mcp — fixture MCP shim (W1-fixtures)

A zero-dependency [Model Context Protocol](https://modelcontextprotocol.io/) server over stdio that serves the Harbourline fixtures for **PagerDuty, Datadog, AWS, GCP, BigQuery and Google Workspace**. Labs use it when the live integration (and its credentials) is not available; the tools mirror what the real MCP servers return for the Lamp Week incident, read-only.

```sh
node fixtures/mcp/shim.mjs --list                                   # tool catalogue
node fixtures/mcp/shim.mjs --call pagerduty_get_incident '{"incident_id":"2187"}'
node fixtures/mcp/shim.mjs                                          # stdio MCP server
node --test 'fixtures/mcp/test/*.test.mjs'                          # smoke test (clean env, every tool)
```

Register it in Devin as a custom stdio MCP server with `mcp.example.json` (command `node`, args `fixtures/mcp/shim.mjs`, run from the repo root). No environment variables, tokens or secrets.

## Tools (21)

| Prefix       | Tools                                                                                                                  | Data                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `pagerduty_` | `list_incidents`, `get_incident`, `list_incident_log_entries`, `list_incident_alerts`, `list_services`, `list_oncalls` | `pagerduty/*.json`, `observability/pagerduty/` |
| `datadog_`   | `list_monitors`, `get_monitor`, `get_dashboard`, `query_metrics`, `search_logs`, `list_events`                         | `datadog/*.json`, `observability/datadog/`     |
| `aws_`       | `ecs_describe_services`, `ecs_describe_task_definition`, `s3_list_objects`                                             | `infra/aws/`                                   |
| `gcp_`       | `cloudrun_get_service`, `pubsub_describe` (YAML text)                                                                  | `infra/gcp/`                                   |
| `bigquery_`  | `list_tables`, `query_orders_daily` (brand/sku/from/to/limit filters instead of SQL)                                   | `infra/bigquery/`                              |
| `workspace_` | `get_sheet`, `get_doc`                                                                                                 | `infra/workspace/`                             |

Resources: every file under `fixtures/mcp`, `observability` and `infra` is readable as `harbourline-fixture://<path>`.

## Layout

- `tools.json` — the catalogue (name, description, JSON-schema input, handler, example arguments used by the smoke test).
- `<provider>/*.json` — MCP-shaped responses. Where the data already lives in `observability/` or `infra/`, the fixture inlines it with `{"$file": "path"}` so there is one source of truth.
- `shim.mjs` — JSON-RPC 2.0 over newline-delimited stdio: `initialize`, `ping`, `tools/list`, `tools/call`, `resources/list`, `resources/read`.

## Live path (not exercised here)

With real credentials the labs use the official PagerDuty, Datadog, AWS, GCP, BigQuery and Google Workspace MCP servers; the fixture tools are named so that a learner can map each call one-to-one. The live path is listed as not exercised in every lab's credential matrix until a session with those integrations runs it.
