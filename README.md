# learn-devin-new-features

A practice platform for mastering recent Devin features before customer sessions. It has two parts:

1. **A realistic codebase**: a multi-tenant workforce platform with a React web app, an Express + PostgreSQL API, a Python payroll worker, integration fixtures, cloud descriptors and Devin configuration.
2. **Promptless labs**: each lab gives you a customer brief and an evidence contract, not a prompt. You plan and prompt on the spot, then practise explaining the result. Answers sit behind a “Show answer” button and hide again when you reload.

Open [`labs/index.html`](labs/index.html) in a browser to start.

## Quick start

```bash
npm install
pip install -e "services/payroll-worker[dev]"
docker compose up -d postgres
npm run db:migrate && npm run db:seed -- --reset
npm run dev:api        # http://localhost:3001
npm run dev:web        # http://localhost:5173
```

Sign in with any seeded account, for example `eli@acme.test` (employee), `mia.manager@acme.test` (manager) or `ava.admin@acme.test` (admin). There are no passwords: this is training data.

## Gates

| Gate | Command |
| --- | --- |
| Tests | `npm test` and `cd services/payroll-worker && pytest -q` |
| Lint | `npm run lint` and `cd services/payroll-worker && ruff check . && ruff format --check .` |
| Build | `npm run build` (includes the lab freshness check) |

## Repository map

| Path | What it is |
| --- | --- |
| `services/api` | Multi-tenant timesheet and payroll API (Joi validation, tenant scoping, audit log) |
| `services/payroll-worker` | Claims queued payroll exports, computes overtime and writes CSV files |
| `apps/web` | React 19 + MUI app for employees, managers and admins |
| `apps/mobile` | Expo app for iOS and Android (lab 13) |
| `labs/` | Generated lab pages; sources in `labs/src/` |
| `fixtures/` | Offline stand-ins for Slack, PagerDuty, Datadog, BigQuery and Google Workspace |
| `infra/` | AWS and GCP deployment descriptors (not deployed) |
| `outpost/` | Self-hosted Outpost worker image (lab 14) |
| `.devin/` | Rules, skills, subagents, hooks and MCP configuration; see `.devin/README.md` |

## Adding or editing a lab

Copy `labs/src/_template/` to `labs/src/NN-slug/`, add the lab to `labs/src/catalog.yaml`, write it, then run `npm run labs:build` and commit the source and the generated page together. `npm run labs:check` fails when a page is out of date.
