# Runbook: payroll export failures

1. Check `payroll_exports` for rows with `status = 'failed'` and read `last_error`.
2. Check worker logs for `event:export.failed` and the attempt count.
3. Check database connectivity from the worker (`DATABASE_URL`, connection limits).
4. Re-queue a failed export only after the cause is fixed: set `status = 'queued'`, `attempts = 0` for that id and tenant.
5. Post an update in the incident channel: impact (tenants, periods), cause, mitigation, next update time.
