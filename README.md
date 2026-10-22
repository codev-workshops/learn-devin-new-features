# Kadé Commerce — Devin practice course

A production-shaped, deliberately imperfect multi-brand e-commerce fixture (Lumen Home · USD, Trailhead Supply · EUR) with fifteen promptless labs for practising Devin on recognisable problems: overselling, duplicate payment webhooks, cross-brand data leaks, rounding drift, slow catalog pages and accessibility gaps.

## Quick start

```bash
nvm use 22                 # Node 22 + npm 10
npm install                # all workspaces: apps/*, services/*, packages/*, labs
npm run db:up              # PostgreSQL 16 from mirror.gcr.io, waits for healthy
npm run db:migrate && npm run db:seed
npm run gates              # test, lint, build, labs:build
```

Open `labs/index.html` after `npm run labs:build`. Each lab has a hidden answer and a voice articulation coach (`npm run coach:dryrun -- <nn>` for the transcript-driven dry run).

## Layout

| Path                                                                   | Contents                                                                  | Wave        |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------- |
| `packages/contracts`                                                   | Frozen OpenAPI, seed-data spec, shared TS types                           | W0-A        |
| `.devin/`                                                              | Project config, rules, skills (incl. articulation coaches), agents, hooks | W0-A        |
| `labs/`                                                                | Fifteen promptless labs, lab build, coach dry-run, report schema          | W0-B + W2   |
| `services/api`                                                         | Node 22 + Express + TypeScript API                                        | W1-api      |
| `services/fulfilment-worker`                                           | Python 3.12 worker (webhooks, outbox, sweeper)                            | W1-worker   |
| `services/paygate-fake`                                                | Fake payment provider with signed, at-least-once webhooks                 | W1-fixtures |
| `apps/web`, `apps/mobile`                                              | React 19 + Vite storefront/admin, Expo SDK 54 app                         | W1-web      |
| `db`, `scenarios`, `observability`, `infra`, `fixtures/mcp`, `outpost` | Migrations, injectors, dashboards, IaC, MCP fixtures                      | W1          |

Agent and contributor rules live in [`AGENTS.md`](AGENTS.md); progress per child is in [`plan.md`](plan.md).
