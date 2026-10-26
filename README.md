# Harbourline — Devin practice course

Harbourline — a multi-brand online store run out of three port warehouses (Newark, Hamburg, Rotterdam).

A production-shaped, deliberately imperfect multi-brand e-commerce fixture (Lumen Home · USD, Trailhead Supply · EUR) with fifteen promptless labs for practising Devin on recognisable problems: overselling, duplicate payment webhooks, cross-brand data leaks, rounding drift, slow catalog pages and accessibility gaps.

## Quick start

```bash
nvm use 22                 # Node 22 + pnpm 10
pnpm install                # all workspaces: apps/*, services/*, packages/*, labs
pnpm db:up              # PostgreSQL 16 from mirror.gcr.io, waits for healthy
pnpm build              # first: services/api seed, tests and lab:reset import the built @harbourline/contracts
pnpm db:migrate && pnpm db:seed
pnpm gates              # test, lint, build, labs:build
```

Two levels per lab: `pnpm lab:start -- <nn>` / `pnpm lab:cleanup -- <nn>` run the lab's own starting-state steps (`lab.json#scenarios.reset`, the list on the lab page; `@skills:lab-start <nn>` / `@skills:lab-cleanup <nn>` in Devin Cloud). `pnpm lab:session -- start <nn> --handle <you>` is the full bring-up on top of that: install, db, build, seed, `labs:build`, `lab:start`, the throwaway branch `lab<nn>/<handle>`, every injector, the uncommitted notes file and a Ready block with the coach command; `pnpm lab:session -- cleanup <nn>` stashes leftovers, returns to `main`, deletes that branch and runs `lab:cleanup`. If `start` finds an unclean tree or a leftover lab branch it runs the cleanup first and says so.

By hand, before a lab: `pnpm lab:reset -- <nn>` (reseeds, then runs the lab's reset step). Labs that inject incidents also need the API and, for the payment-webhook and cart-sweeper injectors, the fulfilment worker:

```bash
pnpm --filter @harbourline/api run dev                                   # http://localhost:3001
(cd services/fulfilment-worker && DATABASE_URL=postgres://harbourline:harbourline@localhost:5432/harbourline python3 -m fulfilment_worker run)
```

Open `labs/index.html` after `pnpm labs:build`. Each lab has a hidden answer and a voice articulation coach that the learner starts by hand (`@skills:coach-<nn>-<slug> <handle>`; `pnpm coach:dryrun -- <nn>` for the transcript-driven dry run).

## Labs

| #   | Lab                                                                                                                                 | Budget  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 00  | [Read the brief, write the plan — a Harbourline warm-up](labs/00-sample/brief.md)                                                   | 20 min  |
| 01  | [Onboarding — make Harbourline safe and fast to set up before Monday's new starter](labs/01-onboarding/brief.md)                    | 120 min |
| 02  | [Guard the database — a lifecycle hook policy for Harbourline](labs/02-lifecycle-hooks/brief.md)                                    | 120 min |
| 03  | [Customization scopes — standardise checkout review without overriding brand teams](labs/03-customization-scopes/brief.md)          | 90 min  |
| 04  | [Ship the flash-sale release checklist once — a plugin every brand team installs](labs/04-plugin-engineering/brief.md)              | 120 min |
| 05  | [Code Scan lifecycle — find the brand leak and the slow Lamp Week page](labs/05-code-scans/brief.md)                                | 150 min |
| 06  | [Review and remediation — the price-drift fix that touches totals and tax](labs/06-review-remediation/brief.md)                     | 90 min  |
| 07  | [Automation with Preflight — investigate only real payment-webhook failures](labs/07-automation-preflight/brief.md)                 | 120 min |
| 08  | [Stop the 'charged twice' pile-up — triage #harbourline-bugs and answer in the thread](labs/08-slack-triage/brief.md)               | 90 min  |
| 09  | [Prove no endpoint leaks across brands — an audit → fix → verify workflow](labs/09-dynamic-workflows/brief.md)                      | 180 min |
| 10  | [the package registry and the PayGate sandbox, nothing else — a security floor every session inherits](labs/10-guardrails/brief.md) | 75 min  |
| 11  | [ACU governance and analytics — control cost without blocking brand teams](labs/11-acu-analytics/brief.md)                          | 75 min  |
| 12  | [Oncall investigation — the 02:10 oversell page after the Lamp Week deploy](labs/12-oncall/brief.md)                                | 150 min |
| 13  | [Expo mobile on iOS and Android — order status on both phones](labs/13-expo-mobile/brief.md)                                        | 180 min |
| 14  | [Outposts — keep PayGate sandbox keys and the repo inside Harbourline's VPC](labs/14-outposts/brief.md)                             | 120 min |
| 15  | [Customer capstone — one sealed envelope: an incident, a feature request and a governance constraint](labs/15-capstone/brief.md)    | 240 min |

Lab 00 is the sample; labs 01–14 each teach one capability; lab 15 is the sealed-envelope capstone. Facilitator pilot results are in [`labs/VALIDATION.md`](labs/VALIDATION.md); cross-lab coach calibration in [`labs/COACH-CALIBRATION.md`](labs/COACH-CALIBRATION.md).

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
