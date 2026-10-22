# infra/ — AWS, GCP, BigQuery and Google Workspace descriptors (W1-fixtures)

Fixture descriptors for the MCP clinic and lab 12. Nothing here is deployed; the MCP shim in `fixtures/mcp/` serves these files when the live AWS/GCP/BigQuery/Workspace integrations are not available.

| Path                                          | What                                                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `aws/ecs-task-definition-harbourline-api.json`       | Fargate task definition for `harbourline-api` (secrets by Secrets Manager ARN, OTLP to the Datadog agent) |
| `aws/ecs-service-harbourline-api.json`               | `describe-services`: the 22:40 UTC Lamp Week deployment (`ecs-svc/8821`) and the previous one      |
| `aws/s3-export-bucket.json`                   | `harbourline-prod-exports` bucket and the `orders_daily/` objects that feed BigQuery                      |
| `gcp/cloud-run-fulfilment-worker.yaml`        | Knative Service for the fulfilment worker (sweeper max age 48 h, Pub/Sub subscription)             |
| `gcp/pubsub-paygate-webhooks.yaml`            | Topic, worker + audit subscriptions (at-least-once), DLQ, 02:30 backlog snapshot                   |
| `bigquery/orders_daily.schema.json`, `.csv`   | `analytics.orders_daily` schema and 41 rows (15–22 Oct) showing `LH-LAMP-03` at −37 on 22 Oct      |
| `bigquery/queries.sql`                        | Reference queries the shim answers with `bigquery_query_orders_daily` filters                      |
| `workspace/merchandiser-sheet-lamp-week.json` | Sheets values: the hand-kept Lamp Week plan (3 units on hand, 60 expected demand for the hero SKU) |
| `workspace/incident-doc-2187.md`              | The shared incident Doc with its timeline filled in and TODO sections for the responder            |

Account ids, project ids, ARNs and hostnames are fictional.
