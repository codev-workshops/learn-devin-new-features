# learn-devin-new-features

Practice platform for recent Devin features. A multi-tenant workforce app (web, API, payroll worker, mobile) plus promptless labs under `labs/`.

## Non-negotiables
- Every SQL query is parameterized and scoped by `tenant_id` (exceptions are listed in `.devin/rules/tenant-isolation.md`). Employees see only their own rows; managers see themselves and direct reports; admins see their whole tenant and never another tenant.
- Validate every API request body, query and route param with the Joi schemas in `services/api/src/validation/schemas.js`. Errors use `{ error: { code, message, details? } }`.
- Write an `audit_log` row for every state change in the API.
- Frontend: React 19 + TypeScript strict + MUI only; server state goes through the TanStack Query hooks in `apps/web/src/api/hooks.ts`.
- Never commit secrets. `.env.example` holds local-only defaults; real values come from Devin secrets.
- Lab pages in `labs/*.html` are generated. Edit `labs/src/**`, then run `npm run labs:build` and commit sources and output together.

## Commands
- Install: `npm install` (root workspaces: `services/api`, `apps/web`) and `pip install -e "services/payroll-worker[dev]"`.
- Test: `npm test` (API + web + lab format) and `cd services/payroll-worker && pytest -q`.
- Lint: `npm run lint` and `cd services/payroll-worker && ruff check . && ruff format --check .`.
- Build: `npm run build` (web build + lab freshness check).
- Database: `docker compose up -d postgres && npm run db:migrate && npm run db:seed -- --reset`.
- Run: `npm run dev:api` (port 3001) and `npm run dev:web` (port 5173, proxies `/api`).
- Worker: `cd services/payroll-worker && python -m payroll_worker`.

## Layout
- `services/api` Express API (`src/routes`, `src/validation`, `src/middleware`, migrations in `src/db/migrations`). Tests use pg-mem and need no database.
- `services/payroll-worker` Python worker that claims `payroll_exports` rows with `FOR UPDATE SKIP LOCKED`.
- `apps/web` React app. `apps/mobile` Expo app (installed separately).
- `labs/src` lab sources, `labs/*.html` generated lab pages. `fixtures/` integration fixtures. `infra/` AWS and GCP descriptors. `outpost/` self-hosted worker.
- Seeded logins (training only, no password): `ava.admin@acme.test`, `mia.manager@acme.test`, `eli@acme.test`, `noah@acme.test`, `gus.admin@globex.test`, `gia.manager@globex.test`, `omar@globex.test`.

## Working on labs
- Keep the section order enforced by `scripts/labs/lib.mjs`. Facilitator notes and rubrics live entirely inside `:::answer` blocks.
- Every feature claim links to an official https://docs.devin.ai page. Update `lastVerified` when you re-check one.
- Never put a copy-and-paste solution prompt outside an answer block.
