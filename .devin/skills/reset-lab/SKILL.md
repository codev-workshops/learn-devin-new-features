---
name: reset-lab
description: Reset the local database and generated files to the clean state every lab starts from
allowed-tools: [read, exec]
---

1. `docker compose up -d postgres` and wait until `docker compose ps` shows it healthy.
2. `npm run db:migrate && npm run db:seed -- --reset`.
3. Remove generated payroll files: `rm -f exports/*.csv`.
4. Confirm with `curl -s localhost:3001/health/ready` if the API is running.

Report what was reset. Never run this against a non-local `DATABASE_URL`; stop and ask instead.
