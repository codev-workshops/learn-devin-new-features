"""PostgreSQL repository. Queries are parameterized; job queries are scoped by tenant_id.

CLAIM_SQL is the one cross-tenant query: it picks the next job from the shared queue.
"""

from decimal import Decimal

import psycopg

from .export import ApprovedHours
from .worker import ExportJob

EXPIRE_SQL = """
UPDATE payroll_exports
   SET status = 'failed', finished_at = now(),
       last_error = 'Worker lease expired on the final attempt'
 WHERE status = 'running'
   AND started_at < now() - make_interval(secs => %(lease)s)
   AND attempts >= %(max_attempts)s
"""

CLAIM_SQL = """
UPDATE payroll_exports
   SET status = 'running', attempts = attempts + 1, started_at = now(), last_error = NULL
 WHERE id = (
   SELECT id FROM payroll_exports
    WHERE status = 'queued'
       OR (status = 'running' AND started_at < now() - make_interval(secs => %(lease)s)
           AND attempts < %(max_attempts)s)
    ORDER BY created_at, id
    LIMIT 1
    FOR UPDATE SKIP LOCKED
 )
RETURNING id, tenant_id, period_start::text, period_end::text, attempts
"""

# Whole ISO weeks that overlap the period, so overtime thresholds see hours outside it.
APPROVED_HOURS_SQL = """
SELECT u.id, u.email, u.name, u.hourly_rate_cents,
       to_char(e.work_date, 'IYYY-"W"IW') AS iso_week,
       SUM(e.hours) AS hours,
       e.work_date::text AS work_date,
       e.work_date BETWEEN %(start)s AND %(end)s AS in_period
  FROM timesheet_entries e
  JOIN users u ON u.id = e.user_id AND u.tenant_id = e.tenant_id
 WHERE e.tenant_id = %(tenant)s
   AND e.status = 'approved'
   AND e.work_date BETWEEN date_trunc('week', %(start)s::date)::date
                       AND date_trunc('week', %(end)s::date)::date + 6
 GROUP BY u.id, u.email, u.name, u.hourly_rate_cents, e.work_date
 ORDER BY u.id, e.work_date
"""


class PostgresRepository:
    def __init__(self, conn: psycopg.Connection, max_attempts: int, lease_seconds: int = 900):
        self.conn = conn
        self.limits = {"lease": lease_seconds, "max_attempts": max_attempts}

    def claim_next(self) -> ExportJob | None:
        with self.conn.transaction():
            self.conn.execute(EXPIRE_SQL, self.limits)
            row = self.conn.execute(CLAIM_SQL, self.limits).fetchone()
        return ExportJob(*row) if row else None

    def approved_hours(self, job: ExportJob) -> list[ApprovedHours]:
        params = {"tenant": job.tenant_id, "start": job.period_start, "end": job.period_end}
        rows = self.conn.execute(APPROVED_HOURS_SQL, params).fetchall()
        return [ApprovedHours(*row[:5], Decimal(row[5]), row[6], row[7]) for row in rows]

    def mark_succeeded(self, job: ExportJob, file_path: str, hours: Decimal, cents: int) -> None:
        with self.conn.transaction():
            self.conn.execute(
                """UPDATE payroll_exports
                      SET status = 'succeeded', file_path = %s, total_hours = %s,
                          total_amount_cents = %s, finished_at = now()
                    WHERE id = %s AND tenant_id = %s AND status = 'running' AND attempts = %s""",
                (file_path, hours, cents, job.id, job.tenant_id, job.attempts),
            )

    def mark_failed(self, job: ExportJob, error: str, retry: bool) -> None:
        with self.conn.transaction():
            self.conn.execute(
                """UPDATE payroll_exports
                      SET status = %s, last_error = %s,
                          finished_at = CASE WHEN %s THEN NULL ELSE now() END
                    WHERE id = %s AND tenant_id = %s AND status = 'running' AND attempts = %s""",
                (
                    "queued" if retry else "failed",
                    error[:500],
                    retry,
                    job.id,
                    job.tenant_id,
                    job.attempts,
                ),
            )
