"""The run loop: outbox, webhook inbox and (on its own cadence) the cart sweeper."""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass

from fulfilment_worker import outbox, sweeper, webhooks
from fulfilment_worker.clock import Clock, SystemClock
from fulfilment_worker.config import Settings
from fulfilment_worker.store import Store

log = logging.getLogger("kade.worker")


@dataclass
class Tick:
    webhooks: int
    outbox: int
    swept: int | None


def tick(store: Store, settings: Settings, clock: Clock, run_sweeper: bool) -> Tick:
    wh = webhooks.process_pending(store, clock, settings.batch_size)
    ob = outbox.process_pending(store, clock, settings.batch_size)
    swept = None
    if run_sweeper:
        swept = len(sweeper.sweep(store, clock, settings.sweeper_max_age_hours).deleted_cart_ids)
    return Tick(len(wh), len(ob.processed), swept)


def run_forever(store: Store, settings: Settings, clock: Clock | None = None) -> None:
    clock = clock or SystemClock()
    last_sweep = 0.0
    log.info(
        "worker started (poll %.1fs, sweep every %.0fs)",
        settings.poll_interval_seconds,
        settings.sweeper_interval_seconds,
    )
    while True:
        now = time.monotonic()
        due = now - last_sweep >= settings.sweeper_interval_seconds
        result = tick(store, settings, clock, run_sweeper=due)
        if due:
            last_sweep = now
        if result.webhooks or result.outbox or result.swept:
            log.info(
                "tick: webhooks=%d outbox=%d swept=%s", result.webhooks, result.outbox, result.swept
            )
        time.sleep(settings.poll_interval_seconds)
