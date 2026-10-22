---
description: Tenant isolation and SQL safety for API and worker queries
trigger: glob
globs: services/**/*.{js,py,sql}
---

- Every query that reads or writes a tenant's data filters the driving table with `tenant_id = $n` (API) or `tenant_id = %s` (worker). Joined tenant-owned tables match on tenant too (`u.tenant_id = e.tenant_id`).
- Exceptions, by design: login looks a user up by globally unique email before a tenant is known; the worker's shared-queue maintenance (`CLAIM_SQL` picks the next job, `EXPIRE_SQL` fails expired jobs on their final attempt) spans tenants; local seed/reset scripts manage fixture data for every tenant.
- Use placeholders only. Never build SQL from request values; dynamic column names must come from a fixed allow-list (see `GROUPS` in `services/api/src/routes/reports.js`).
- A row from another tenant returns `404`, not `403`, so ids do not leak.
- Add a cross-tenant test in `services/api/test/tenancy.test.js` for any new endpoint.
