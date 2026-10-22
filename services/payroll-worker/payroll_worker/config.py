import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    database_url: str
    export_dir: str
    poll_interval_seconds: float
    max_attempts: int

    @classmethod
    def from_env(cls, env: dict[str, str] | None = None) -> "Config":
        env = dict(os.environ if env is None else env)
        return cls(
            database_url=env.get("DATABASE_URL", "postgres://ldnf:ldnf@localhost:5432/ldnf"),
            export_dir=env.get("PAYROLL_EXPORT_DIR", "./exports"),
            poll_interval_seconds=float(env.get("PAYROLL_POLL_INTERVAL_SECONDS", "5")),
            max_attempts=int(env.get("PAYROLL_MAX_ATTEMPTS", "3")),
        )
