from __future__ import annotations

import pytest

from fulfilment_worker.clock import FixedClock
from fulfilment_worker.store import MemoryStore


@pytest.fixture
def clock() -> FixedClock:
    return FixedClock("2026-10-22T09:00:00Z")


@pytest.fixture
def store() -> MemoryStore:
    return MemoryStore()
