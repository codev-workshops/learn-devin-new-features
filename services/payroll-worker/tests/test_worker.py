from decimal import Decimal

from payroll_worker.export import ApprovedHours
from payroll_worker.worker import ExportJob, run_once


class FakeRepo:
    def __init__(self, jobs, hours=None, fail=False):
        self.jobs = list(jobs)
        self.hours = hours or []
        self.fail = fail
        self.succeeded = []
        self.failed = []

    def claim_next(self):
        return self.jobs.pop(0) if self.jobs else None

    def approved_hours(self, job):
        if self.fail:
            raise RuntimeError("database timeout")
        return self.hours

    def mark_succeeded(self, job, file_path, hours, cents):
        self.succeeded.append((job.id, file_path, hours, cents))

    def mark_failed(self, job, error, retry):
        self.failed.append((job.id, error, retry))


JOB = ExportJob(7, 1, "2026-09-01", "2026-09-30", 1)
HOURS = [ApprovedHours(3, "eli@acme.test", "Eli", 4500, "2026-W37", Decimal("8"))]


def test_empty_queue_returns_false(tmp_path):
    assert run_once(FakeRepo([]), str(tmp_path), 3) is False


def test_success_writes_csv_and_marks_job(tmp_path):
    repo = FakeRepo([JOB], HOURS)
    assert run_once(repo, str(tmp_path), 3) is True
    job_id, path, hours, cents = repo.succeeded[0]
    assert job_id == 7 and hours == Decimal("8") and cents == 36000
    assert path.endswith("tenant-1_2026-09-01_2026-09-30_export-7.csv")
    assert "eli@acme.test" in open(path, encoding="utf-8").read()
    assert not list(tmp_path.glob("*.tmp"))


def test_failure_requeues_until_max_attempts(tmp_path):
    repo = FakeRepo([JOB, ExportJob(7, 1, "2026-09-01", "2026-09-30", 3)], fail=True)
    run_once(repo, str(tmp_path), 3)
    run_once(repo, str(tmp_path), 3)
    assert [(retry, "database timeout" in error) for _, error, retry in repo.failed] == [
        (True, True),
        (False, True),
    ]
    assert repo.succeeded == []
