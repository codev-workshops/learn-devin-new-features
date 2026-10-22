---
name: verify
description: Run every test, lint and build gate for learn-devin-new-features and report the results
allowed-tools: [read, grep, glob, exec]
---

Run these from the repository root and report each result with counts. Stop at nothing; run all of them.

1. `npm test`
2. `npm run lint`
3. `npm run build`
4. `cd services/payroll-worker && pytest -q && ruff check . && ruff format --check .`

Report as a table: gate, command, pass/fail, key output. For failures include the first error and the file:line. Do not fix anything.
