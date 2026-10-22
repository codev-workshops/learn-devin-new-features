"""Environment-driven configuration. Every value has a local-development default."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    database_url: str | None
    store_path: str | None
    paygate_secret: str
    poll_interval_seconds: float
    sweeper_max_age_hours: int
    sweeper_interval_seconds: float
    inbox_port: int
    batch_size: int

    @classmethod
    def from_env(cls, env: dict[str, str] | None = None) -> Settings:
        e = os.environ if env is None else env
        return cls(
            database_url=e.get("DATABASE_URL") or None,
            store_path=e.get("WORKER_STORE_PATH") or None,
            paygate_secret=e.get("PAYGATE_SECRET", "harbourline-local-paygate-secret"),
            poll_interval_seconds=float(e.get("WORKER_POLL_INTERVAL", "2")),
            sweeper_max_age_hours=int(e.get("SWEEPER_MAX_AGE_HOURS", "48")),
            sweeper_interval_seconds=float(e.get("SWEEPER_INTERVAL", "300")),
            inbox_port=int(e.get("WORKER_INBOX_PORT", "3003")),
            batch_size=int(e.get("WORKER_BATCH_SIZE", "50")),
        )
