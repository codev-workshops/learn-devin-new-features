---
name: harbourline-dev
description: Bring up the Harbourline stack locally (Postgres via Compose, migrate, seed) and run the gate scripts. Use when the user asks to run, reset or verify the repo.
triggers: ["user"]
argument-hint: "[gates|reset <nn>|up]"
---

# Harbourline local development

1. Node 22 is required (`node --version`). Use `nvm use 22` if needed.
2. `pnpm install` at the root installs every workspace (`apps/*`, `services/*`, `packages/*`, `labs`).
3. `pnpm db:up` starts PostgreSQL 16 from `mirror.gcr.io/library/postgres:16-alpine` and waits for the healthcheck. Credentials live in `.env.example` (copy to `.env`).
4. `pnpm db:migrate && pnpm db:seed` builds the seed in `packages/contracts/seed-spec.yaml` (delegated to `services/api`; both report "not present" until W1-api lands).
5. `pnpm gates` runs the four gates: `test`, `lint`, `build`, `labs:build`. They succeed on a tree where later-wave workspaces are still absent.
6. `pnpm lab:reset -- <nn>` reseeds the database and replays `scenarios/lab-reset.sh <nn>` when it exists.

Report the exact failing command and its last 20 lines when a gate fails; do not retry blindly.
