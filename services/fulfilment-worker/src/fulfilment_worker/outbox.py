"""Transactional-outbox consumer. Topics are dispatched to handlers; unknown topics are logged
and marked processed so the queue never wedges on a message nobody consumes."""

from __future__ import annotations

import logging
from collections.abc import Callable
from dataclasses import dataclass

from fulfilment_worker.clock import Clock
from fulfilment_worker.models import EmailMessage, OutboxRow, iso
from fulfilment_worker.store import Store

log = logging.getLogger("kade.worker.outbox")

Handler = Callable[[Store, OutboxRow, Clock], None]


@dataclass
class OutboxReport:
    processed: list[str]
    by_topic: dict[str, int]


def _send_email(store: Store, row: OutboxRow, clock: Clock) -> None:
    p = row.payload
    store.add_sent_email(
        EmailMessage(
            to=p.get("to", "unknown@kade.test"),
            subject=p.get("subject", row.topic),
            body=p.get("body", f"{row.topic} for order {row.order_id}"),
            order_id=row.order_id,
            sent_at=iso(clock.now()),
            meta={"topic": row.topic},
        )
    )


def _log_only(store: Store, row: OutboxRow, clock: Clock) -> None:
    log.info("outbox %s %s", row.topic, row.payload)


DEFAULT_HANDLERS: dict[str, Handler] = {
    "email.order_confirmation": _send_email,
    "email.payment_failed": _send_email,
    "email.refund": _send_email,
    "order.status_changed": _log_only,
}


def process_pending(
    store: Store,
    clock: Clock,
    batch_size: int = 50,
    handlers: dict[str, Handler] | None = None,
) -> OutboxReport:
    handlers = DEFAULT_HANDLERS if handlers is None else handlers
    report = OutboxReport(processed=[], by_topic={})
    for row in store.pending_outbox(batch_size):
        handler = handlers.get(row.topic, _log_only)
        handler(store, row, clock)
        store.mark_outbox_processed(row.id, clock.now())
        store.commit()
        report.processed.append(row.id)
        report.by_topic[row.topic] = report.by_topic.get(row.topic, 0) + 1
    return report
