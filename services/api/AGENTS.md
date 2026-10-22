# AGENTS.md — services/api

Kadé Commerce order API (Express 5 + TypeScript, PostgreSQL 16). Owned by W1-api together with `db/`.

## Run

```bash
npm run db:up                       # Postgres (repo root)
cp .env.example .env                # DATABASE_URL, API_PORT, PAYGATE_SECRET
npm run db:migrate && npm run db:seed -- --reset
npm run dev -w services/api         # http://localhost:3001
```

`KADE_NOW=2026-10-22T09:00:00Z` pins the API clock (promo windows, abandoned-cart ages); tests set it automatically.

## Gates (run from this directory or via root `npm run gates`)

- `npm test` — Vitest + Supertest against a live Postgres; the global setup migrates and reseeds (`--reset`) first.
- `npm run lint` — ESLint, Prettier check, `tsc --noEmit`.
- `npm run build` — emits `dist/`.

## Layout

- `src/app.ts` builds the Express app; `src/server.ts` listens. `src/db.ts` wraps `pg` (numeric → string) and counts statements.
- `src/middleware/auth.ts` — fake login from `X-Kade-Brand` / `X-Kade-User` / `X-Kade-Role`; `requireRole` guards `/admin`.
- `src/money.ts` — float/half-up money helpers (a planted defect; see `PLANTED.md`).
- `src/routes/*` — one router per OpenAPI tag; `src/services/*` — SQL helpers and API mappers.
- `src/seed/*` — deterministic generator from `packages/contracts/seed-spec.yaml` (`generate.ts`), loader (`load.ts`), CLI (`cli.ts`).
- `test/contract.test.ts` — contract coverage; `test/planted.test.ts` — one skipped test per plant.

## Rules

- Build against `packages/contracts/openapi.yaml`; it is frozen. Propose changes in a PR description.
- Money crosses the boundary as `{ amount: "12.30", currency }`; never a float.
- Do not fix anything listed in `PLANTED.md` on `main`.
- Migrations are SQL files in `db/migrations/` (`-- Up Migration` / `-- Down Migration`) run by node-pg-migrate from this workspace.
