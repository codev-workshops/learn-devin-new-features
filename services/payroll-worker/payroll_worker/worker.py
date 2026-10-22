"""Claims queued payroll exports and processes them with retries."""

import json
import logging
import os
import time
from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol

from .export import ApprovedHours, compute_pay_lines, render_csv, totals

log = logging.getLogger("payroll_worker")


@dataclass(frozen=True)
class ExportJob:
    id: int
    tenant_id: int
    period_start: str
    period_end: str
    attempts: int


class Repository(Protocol):
    def claim_next(self) -> ExportJob | None: ...
    def approved_hours(self, job: ExportJob) -> list[ApprovedHours]: ...
    def mark_succeeded(
        self, job: ExportJob, file_path: str, hours: Decimal, cents: int
    ) -> None: ...
    def mark_failed(self, job: ExportJob, error: str, retry: bool) -> None: ...


def export_filename(job: ExportJob) -> str:
    return f"tenant-{job.tenant_id}_{job.period_start}_{job.period_end}_export-{job.id}.csv"


def process_job(repo: Repository, job: ExportJob, export_dir: str, max_attempts: int) -> bool:
    try:
        lines = compute_pay_lines(repo.approved_hours(job))
        os.makedirs(export_dir, exist_ok=True)
        path = os.path.join(export_dir, export_filename(job))
        tmp_path = f"{path}.tmp"
        with open(tmp_path, "w", encoding="utf-8", newline="") as handle:
            handle.write(render_csv(lines))
        os.replace(tmp_path, path)
        hours, cents = totals(lines)
        repo.mark_succeeded(job, path, hours, cents)
        log.info(
            json.dumps({"event": "export.succeeded", "export_id": job.id, "lines": len(lines)})
        )
        return True
    except Exception as error:  # every failure must be recorded on the job
        retry = job.attempts < max_attempts
        repo.mark_failed(job, f"{type(error).__name__}: {error}", retry)
        log.error(
            json.dumps(
                {
                    "event": "export.failed",
                    "export_id": job.id,
                    "attempt": job.attempts,
                    "retry": retry,
                    "error": type(error).__name__,
                }
            )
        )
        return False


def run_once(repo: Repository, export_dir: str, max_attempts: int) -> bool:
    """Processes one job. Returns False when the queue is empty."""
    job = repo.claim_next()
    if job is None:
        return False
    process_job(repo, job, export_dir, max_attempts)
    return True


def run_forever(repo: Repository, export_dir: str, max_attempts: int, poll_seconds: float) -> None:
    while True:
        if not run_once(repo, export_dir, max_attempts):
            time.sleep(poll_seconds)
