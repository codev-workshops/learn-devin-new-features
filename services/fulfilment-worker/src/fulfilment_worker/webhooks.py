"""PayGate webhook processor.

Reads unprocessed rows from the webhook inbox (filled by ``services/api`` through the outbox or by
``inbox_server`` on the fixture path) and applies them to orders and inventory.

Planted (PLANTED.md#duplicate-webhook): ``event_id`` is read but never used as an idempotency key.
A redelivered ``payment.succeeded`` confirms the order again, decrements stock again and queues a
second confirmation email.

Planted (PLANTED.md#abandoned-cart-sweeper, second half): a late ``payment.succeeded`` whose order
was emptied by the sweeper is still confirmed, producing a "ghost order" with no lines.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

from fulfilment_worker import reservations
from fulfilment_worker.brands import rules_for
from fulfilment_worker.clock import Clock
from fulfilment_worker.models import (
    WEBHOOK_EVENT_TYPES,
    Order,
    OrderEvent,
    OutboxRow,
    Totals,
    iso,
    new_id,
)
from fulfilment_worker.store import Store

log = logging.getLogger("kade.worker.webhooks")


class WebhookError(ValueError):
    pass


@dataclass
class WebhookResult:
    row_id: str
    event_id: str
    type: str
    order_id: str
    outcome: str
    stock_changes: list[reservations.StockChange] = field(default_factory=list)


def _set_status(store: Store, order: Order, to: str, clock: Clock, source: str = "webhook"):
    frm = order.status
    order.status = to
    order.updatedAt = iso(clock.now())
    store.add_event(
        OrderEvent(
            id=new_id(),
            orderId=order.id,
            type="status_changed",
            at=iso(clock.now()),
            source=source,
            from_status=frm,
            to_status=to,
        )
    )


def _queue_email(store: Store, order: Order, topic: str, subject: str, clock: Clock) -> None:
    store.add_outbox(
        OutboxRow(
            id=new_id(),
            topic=topic,
            payload={"to": order.user, "subject": subject, "order_id": order.id},
            created_at=iso(clock.now()),
            order_id=order.id,
        )
    )
    store.add_event(
        OrderEvent(
            id=new_id(),
            orderId=order.id,
            type="email_queued",
            at=iso(clock.now()),
            detail=subject,
        )
    )


def _ghost_order(event: dict[str, Any], clock: Clock) -> Order:
    """The payment was taken, so an order must exist. Built from the webhook alone — no lines."""
    data = event["data"]
    currency = data["currency"]
    brand = next((b.id for b in _brands() if b.currency == currency), "lumen-home")
    amount = data["amount"]
    totals = Totals(
        subtotal=amount,
        tax="0.00",
        shipping="0.00",
        total=amount,
        currency=currency,
        taxIncluded=rules_for(brand).tax_inclusive,
    )
    now = iso(clock.now())
    return Order(
        id=data["order_id"],
        number=f"{rules_for(brand).order_number_prefix}-GHOST-{data['payment_id'][-6:]}",
        brand=brand,
        user="unknown@kade.test",
        status="pending_payment",
        lines=[],
        totals=totals,
        placedAt=now,
        updatedAt=now,
        cartId=data.get("cart_id"),
        paymentId=data["payment_id"],
    )


def _brands():
    from fulfilment_worker.brands import BRANDS

    return BRANDS.values()


def validate(event: dict[str, Any]) -> None:
    for key in ("event_id", "type", "occurred_at", "data"):
        if key not in event:
            raise WebhookError(f"missing {key}")
    if event["type"] not in WEBHOOK_EVENT_TYPES:
        raise WebhookError(f"unknown type {event['type']}")
    for key in ("payment_id", "order_id", "amount", "currency"):
        if key not in event["data"]:
            raise WebhookError(f"missing data.{key}")


def apply_event(store: Store, event: dict[str, Any], clock: Clock) -> WebhookResult:
    validate(event)
    data = event["data"]
    order = store.get_order(data["order_id"])
    result = WebhookResult("", event["event_id"], event["type"], data["order_id"], "")
    if order is None:
        order = _ghost_order(event, clock)
        store.save_order(order)
        store.add_event(
            OrderEvent(
                id=new_id(),
                orderId=order.id,
                type="note",
                at=iso(clock.now()),
                detail="order row missing when webhook arrived; created from webhook payload",
            )
        )
    order.paymentId = data["payment_id"]

    if event["type"] == "payment.succeeded":
        _set_status(store, order, "paid", clock)
        result.stock_changes = reservations.commit(store, order, clock)
        store.add_event(
            OrderEvent(
                id=new_id(),
                orderId=order.id,
                type="payment_received",
                at=iso(clock.now()),
                detail=f"{data['amount']} {data['currency']} via {data['payment_id']}",
            )
        )
        _set_status(store, order, "confirmed", clock, source="worker")
        _queue_email(
            store, order, "email.order_confirmation", f"Order {order.number} confirmed", clock
        )
        result.outcome = "confirmed"
    elif event["type"] == "payment.failed":
        reservations.release(store, order, clock, reason=data.get("reason", "payment failed"))
        store.add_event(
            OrderEvent(
                id=new_id(),
                orderId=order.id,
                type="payment_failed",
                at=iso(clock.now()),
                detail=data.get("reason"),
            )
        )
        _set_status(store, order, "cancelled", clock)
        _queue_email(
            store, order, "email.payment_failed", f"Payment for {order.number} failed", clock
        )
        result.outcome = "cancelled"
    elif event["type"] == "payment.refunded":
        _set_status(store, order, "refunded", clock)
        _queue_email(store, order, "email.refund", f"Refund for {order.number}", clock)
        result.outcome = "refunded"
    elif event["type"] == "chargeback.opened":
        _set_status(store, order, "chargeback", clock)
        result.outcome = "chargeback"
    store.save_order(order)
    return result


def process_pending(store: Store, clock: Clock, batch_size: int = 50) -> list[WebhookResult]:
    """Drain the inbox. Every row is applied — there is no check on ``event_id``."""
    results: list[WebhookResult] = []
    for row in store.pending_webhooks(batch_size):
        try:
            result = apply_event(store, row.payload, clock)
            result.row_id = row.id
            store.mark_webhook_processed(row.id, clock.now(), result.outcome)
            log.info("webhook %s %s -> %s", row.event_id, row.type, result.outcome)
        except WebhookError as exc:
            result = WebhookResult(row.id, row.event_id, row.type, "", f"rejected: {exc}")
            store.mark_webhook_processed(row.id, clock.now(), result.outcome)
            log.warning("webhook %s rejected: %s", row.event_id, exc)
        store.commit()
        results.append(result)
    return results
