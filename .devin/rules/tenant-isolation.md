---
description: Tenant isolation and SQL safety for API and worker queries
trigger: glob
globs: services/**/*.{js,py,sql}
---

- Every query includes `tenant_id = $n` (API) or `tenant_id = %s` (worker) for every tenant-owned table, including joins.
- Use placeholders only. Never build SQL from request values; dynamic column names must come from a fixed allow-list (see `GROUPS` in `services/api/src/routes/reports.js`).
- A row from another tenant returns `404`, not `403`, so ids do not leak.
- Add a cross-tenant test in `services/api/test/tenancy.test.js` for any new endpoint.
