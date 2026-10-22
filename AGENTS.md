# AGENTS.md — Kadé Commerce

Rules for every agent (Devin child sessions, learners, reviewers) working in this repository. Read this before touching anything; `.devin/rules/` repeats the short version.

## 1. What this repo is

A production-shaped but deliberately imperfect multi-brand e-commerce fixture used by the Devin practice course in `labs/`. Two brands: **Lumen Home** (USD, tax-exclusive, 8.25% sales tax) and **Trailhead Supply** (EUR, 19% VAT inclusive, free shipping over €80). The defects listed in `packages/contracts/seed-spec.yaml#planted_edge_cases` are **features of the course**: never fix one on `main`. Remediation demos happen on throwaway branches that are closed without merging.

## 2. Stack and gates

Node 22 + npm 10 workspaces (`apps/*`, `services/*`, `packages/*`, `labs`), Python 3.12 for `services/fulfilment-worker`, PostgreSQL 16 via `docker compose` (`mirror.gcr.io/library/postgres:16-alpine`).

| Command                                                           | Does                                                                             |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `npm run db:up` / `db:down`                                       | Start (and wait for) / stop Postgres                                             |
| `npm run db:migrate`, `npm run db:seed`                           | Delegated to `services/api`; `db:seed -- --reset` rebuilds the seed-spec dataset |
| `npm run lab:reset -- <nn>`                                       | Reseed, then `scenarios/lab-reset.sh <nn>` when present                          |
| `npm test`, `npm run lint`, `npm run build`, `npm run labs:build` | The four gates; `npm run gates` runs all four                                    |
| `npm run coach:dryrun -- <nn>`                                    | Transcript-driven articulation coach dry run                                     |

Root scripts go through `scripts/ws.mjs`, which runs a script in every workspace that defines it and treats a not-yet-delivered workspace as "nothing to do". That is why all four gates are green on an empty tree; each W1 child is responsible for adding real `test`, `lint` and `build` scripts to its workspace. Python services must also pass `pytest -q` and `ruff check` locally; they are invoked from the workspace `test`/`lint` scripts, not from the root.

Before every commit: `npm run gates`. Conventional-commit messages. One PR per task, no stacked PRs. Merge to `main` only after Devin Review is clean on the final head and the gates are green with the latest `origin/main` merged in.

## 3. Shared-file ownership

Children work in parallel. Touch only the paths your brief owns. If a shared or frozen file must change, do **not** change it: write the proposal in your PR description and in your report's `not_exercised`.

| Path                                                                                                               | Owner                           | Rule for everyone else                                                              |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------- | ----------------------------------------------------------------------------------- |
| root `package.json`, `package-lock.json`, `scripts/ws.mjs`, `scripts/lab-reset.mjs`                                | W0-A                            | Add scripts inside your own workspace `package.json`; root names are pre-registered |
| root `docker-compose.yml`                                                                                          | W0-A, then W1-api adds `api`    | Other services add their own `compose.<name>.yml` and reference it from docs        |
| `packages/contracts/openapi.yaml`, `seed-spec.yaml`, `src/index.ts`                                                | W0-A, **frozen after W0**       | Propose changes through the parent as a W1-api follow-up PR                         |
| `.devin/config.json`, `.devin/rules/`, `.devin/hooks.v1.json`, `.devin/skills/kade-dev/`, root `AGENTS.md`         | W0-A                            | Per-service `AGENTS.md` files are owned by the service's child                      |
| `.devin/skills/articulation-base/SKILL.md`                                                                         | W0-A, **frozen after W0**       | Per-lab coaches (`.devin/skills/articulation-<nn>-*/`) are owned by W2 lab children |
| `.devin/skills/articulation-sample/`, `.devin/agents/sample-coach.md`                                              | W0-A                            | Worked example; copy, don't edit                                                    |
| `labs/coach-report.schema.json`, `labs/coach-dryrun.mjs`, `labs/build.mjs`, `labs/package.json`, `labs/00-sample/` | W0-B                            | Lab children add `labs/<nn>-*/` only                                                |
| `labs/<nn>-*/`                                                                                                     | the W2 child for lab `nn`       | —                                                                                   |
| `services/api`, `db/`                                                                                              | W1-api                          | —                                                                                   |
| `services/fulfilment-worker`                                                                                       | W1-worker                       | —                                                                                   |
| `services/paygate-fake`, `scenarios/`, `fixtures/mcp`, `observability/`, `infra/`, `outpost/`                      | W1-fixtures                     | —                                                                                   |
| `apps/web`, `apps/mobile`                                                                                          | W1-web                          | —                                                                                   |
| `plan.md`                                                                                                          | everyone, **one row per child** | Append your row; on conflict keep every row from both sides                         |
| `docs/blueprint.proposed.yaml`                                                                                     | W0-A                            | Parent applies it; children propose edits in their PR description                   |

## 4. Contracts

`packages/contracts` is the single source of truth for routes, headers, money, order statuses and the seed dataset. Build against it; do not wait for siblings. Fake auth is three headers (`X-Kade-Brand`, `X-Kade-User`, `X-Kade-Role`) — there are no tokens and no real PII anywhere in the seed. Money is a decimal string with two fractional digits plus a currency code; never a float across a boundary.

## 5. Labs

Labs are **promptless**: learner-facing files contain no fenced block tagged `prompt`. Each lab ships a customer brief, constraints, starting state, observable acceptance criteria, credentials or fixture fallback, edge-case injectors, an articulation drill, a hidden answer (`<template>` revealed by a button; no localStorage, cookies, hash or query state), a debrief and references. Every lab has a voice articulation coach that follows `.devin/skills/articulation-base/SKILL.md`; coaching is always started manually by the learner — no Automations, no scheduled drills, no hooks.

## 6. Integrations and credentials

Never ask the user for credentials. Every live integration (PagerDuty, Datadog, AWS, GCP, BigQuery, Google Workspace, Slack, Outposts, macOS) has a fixture path under `fixtures/`; build and verify the fixture path and list the live path as not exercised.

## 7. Devin configuration

- `.devin/config.json` — project config (tool permissions).
- `.devin/rules/*.md` — `repo-conventions` (always on) and `money-and-brands` (glob on services/apps/db).
- `.devin/skills/` — `kade-dev` (bring-up and gates), `articulation-base` (coach protocol), `articulation-sample` (lab 00 coach), later `articulation-<nn>-*`.
- `.devin/agents/sample-coach.md` — subagent definition for the lab 00 coach.
- `.devin/hooks.v1.json` — intentionally empty (`{}`); labs that teach hooks add them on a throwaway branch.

Skill layout note: W0-A probed the nested `articulation/<name>/SKILL.md` layout with the skill-discovery tool and it was not listed, so the coaches use the documented flat layout `.devin/skills/articulation-<name>/SKILL.md` (`articulation-base`, `articulation-sample`, later `articulation-<nn>-<slug>`). Nothing else depends on the directory shape.
