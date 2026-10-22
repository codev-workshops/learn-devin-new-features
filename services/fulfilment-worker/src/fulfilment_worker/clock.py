from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Protocol


class Clock(Protocol):
    def now(self) -> datetime: ...


class SystemClock:
    def now(self) -> datetime:
        return datetime.now(UTC)


class FixedClock:
    """Deterministic clock for tests and demos; ``advance`` moves it forward."""

    def __init__(self, at: datetime | str = "2026-10-22T00:00:00Z") -> None:
        if isinstance(at, str):
            at = datetime.fromisoformat(at.replace("Z", "+00:00"))
        self._at = at.astimezone(UTC)

    def now(self) -> datetime:
        return self._at

    def advance(self, **kwargs: float) -> datetime:
        self._at += timedelta(**kwargs)
        return self._at
