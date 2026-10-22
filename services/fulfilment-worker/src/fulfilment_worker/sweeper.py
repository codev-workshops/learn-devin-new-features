"""Abandoned-cart sweeper.

Planted (PLANTED.md#abandoned-cart-sweeper): carts older than ``max_age_hours`` are deleted even
when a PayGate hosted-checkout session is still pending on them. The pending order is emptied and
cancelled; when the late ``payment.succeeded`` arrives, the webhook processor confirms an order
with no lines (a "ghost order").
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import timedelta

from fulfilment_worker import reservations
from fulfilment_worker.clock import Clock
from fulfilment_worker.models import OrderEvent, iso, new_id
from fulfilment_worker.store import Store

log = logging.getLogger("harbourline.worker.sweeper")


@dataclass
class SweepReport:
    cutoff: str
    deleted_cart_ids: list[str] = field(default_factory=list)
    swept_with_pending_payment: list[str] = field(default_factory=list)
    emptied_order_ids: list[str] = field(default_factory=list)


def sweep(store: Store, clock: Clock, max_age_hours: int = 48) -> SweepReport:
    cutoff = clock.now() - timedelta(hours=max_age_hours)
    report = SweepReport(cutoff=iso(cutoff))
    for cart in store.list_open_carts_older_than(cutoff):
        order = store.pending_order_for_cart(cart.id)
        if order is not None:
            report.swept_with_pending_payment.append(cart.id)
            reservations.release(store, order, clock, reason="cart swept as abandoned")
            order.lines = []
            order.status = "cancelled"
            order.updatedAt = iso(clock.now())
            store.add_event(
                OrderEvent(
                    id=new_id(),
                    orderId=order.id,
                    type="note",
                    at=iso(clock.now()),
                    detail=f"cart {cart.id} swept after {max_age_hours}h; lines removed",
                )
            )
            store.save_order(order)
            report.emptied_order_ids.append(order.id)
        store.delete_cart(cart.id)
        report.deleted_cart_ids.append(cart.id)
        log.info("swept cart %s (pending payment: %s)", cart.id, cart.pendingPaymentId)
    store.commit()
    return report
