# Devin configuration in this repository

| Artifact | Location | Used by |
| --- | --- | --- |
| Always-on rules | `AGENTS.md` | Every Devin session (cloud, Desktop, CLI) |
| Path-scoped rules | `.devin/rules/tenant-isolation.md`, `lab-authoring.md` (glob) | Devin CLI and Desktop |
| Model-decision rule | `.devin/rules/payroll-money.md` | Devin CLI and Desktop |
| Skills | `.devin/skills/verify`, `.devin/skills/reset-lab` | `/verify`, `/reset-lab` |
| Custom subagents | `.devin/agents/api-worker.md`, `lab-author.md`, `reviewer.md` | Devin CLI and Desktop |
| Lifecycle hook | `.devin/hooks.v1.json` → `scripts/hooks/block-destructive.mjs` | Blocks destructive shell commands (exit code 2). Lab 2 extends it. |
| MCP servers | `.devin/mcp_config.json` | Project MCP servers. Personal servers and secrets go in the gitignored `.devin/mcp_config.local.json`. |

Integration MCP servers (Slack, PagerDuty, Datadog, AWS, GCP, BigQuery, Google Workspace) are connected per user or org in Devin settings, not committed here. Labs that need them describe a fixture fallback under `fixtures/`.
