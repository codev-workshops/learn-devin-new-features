"""Small deterministic dataset for tests and demos, consistent with the frozen seed-spec
(LH-LAMP-03 has 3 units, Trailhead prices are VAT-inclusive EUR)."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from fulfilment_worker import reservations
from fulfilment_worker.clock import Clock
from fulfilment_worker.models import (
    Cart,
    CartLine,
    InventoryRow,
    Order,
    OrderLine,
    WebhookInboxRow,
    iso,
    new_id,
)
from fulfilment_worker.store import Store
from fulfilment_worker.totals import api_totals, recompute

LAMP_ORDER_ID = "11111111-1111-4111-8111-111111111111"
LAMP_CART_ID = "22222222-2222-4222-8222-222222222222"
LAMP_PAYMENT_ID = "pay_lampweek_0001"
LATE_ORDER_ID = "33333333-3333-4333-8333-333333333333"
LATE_CART_ID = "44444444-4444-4444-8444-444444444444"
LATE_PAYMENT_ID = "pay_late_0002"


def seed_inventory(store: Store, clock: Clock) -> None:
    now = iso(clock.now())
    rows = [
        InventoryRow("LH-LAMP-01", "US-NJ", 40, 0, 5, now),
        InventoryRow("LH-LAMP-02", "US-NJ", 2, 0, 5, now),
        InventoryRow("LH-LAMP-03", "US-NJ", 3, 0, 5, now),
        InventoryRow("LH-LAMP-04", "US-NJ", 25, 0, 5, now),
        InventoryRow("TS-TENT-01", "DE-HAM", 12, 0, 2, now),
        InventoryRow("TS-TENT-01", "NL-RTM", 6, 0, 2, now),
        InventoryRow("TS-SOCK-01-M", "DE-HAM", 80, 0, 10, now),
    ]
    for row in rows:
        store.save_inventory(row)


def make_order(
    order_id: str,
    number: str,
    brand: str,
    user: str,
    lines: list[OrderLine],
    clock: Clock,
    cart_id: str | None = None,
    payment_id: str | None = None,
    placed_at: str | None = None,
    api_style: bool = True,
) -> Order:
    totals = api_totals(lines, brand) if api_style else recompute(lines, brand)
    now = iso(clock.now())
    return Order(
        id=order_id,
        number=number,
        brand=brand,
        user=user,
        status="pending_payment",
        lines=lines,
        totals=totals,
        placedAt=placed_at or now,
        updatedAt=placed_at or now,
        cartId=cart_id,
        paymentId=payment_id,
    )


def seed_lamp_order(store: Store, clock: Clock) -> Order:
    """A Lamp Week checkout for one Ember Table Lamp, reserved and awaiting payment."""
    lines = [OrderLine("LH-LAMP-03", "Ember Table Lamp", 1, "47.20", "47.20", "US-NJ")]
    order = make_order(
        LAMP_ORDER_ID,
        "LH-100042",
        "lumen-home",
        "customer-007@lumen-home.test",
        lines,
        clock,
        cart_id=LAMP_CART_ID,
        payment_id=LAMP_PAYMENT_ID,
    )
    store.save_order(order)
    reservations.reserve(store, order, clock)
    cart = Cart(
        id=LAMP_CART_ID,
        brand="lumen-home",
        user=order.user,
        status="checked_out",
        lines=[CartLine(new_id(), "LH-LAMP-03", "Ember Table Lamp", 1, "47.20")],
        createdAt=order.placedAt,
        updatedAt=order.placedAt,
        pendingPaymentId=LAMP_PAYMENT_ID,
    )
    store.save_cart(cart)
    store.commit()
    return order


def seed_late_cart(store: Store, clock: Clock, age_hours: int = 72) -> Order:
    """An open cart with a pending PayGate session, older than the sweeper's 48 h window."""
    placed = iso(clock.now() - timedelta(hours=age_hours))
    lines = [OrderLine("TS-TENT-01", "Ridge Tent 2P", 1, "189.00", "189.00", "DE-HAM")]
    order = make_order(
        LATE_ORDER_ID,
        "TS-200117",
        "trailhead-supply",
        "customer-031@trailhead-supply.test",
        lines,
        clock,
        cart_id=LATE_CART_ID,
        payment_id=LATE_PAYMENT_ID,
        placed_at=placed,
    )
    store.save_order(order)
    reservations.reserve(store, order, clock)
    cart = Cart(
        id=LATE_CART_ID,
        brand="trailhead-supply",
        user=order.user,
        status="open",
        lines=[CartLine(new_id(), "TS-TENT-01", "Ridge Tent 2P", 1, "189.00")],
        createdAt=placed,
        updatedAt=placed,
        pendingPaymentId=LATE_PAYMENT_ID,
    )
    store.save_cart(cart)
    store.commit()
    return order


def seed_fresh_cart(store: Store, clock: Clock, age_hours: int = 3) -> Cart:
    at = iso(clock.now() - timedelta(hours=age_hours))
    cart = Cart(
        id=new_id(),
        brand="lumen-home",
        user="customer-050@lumen-home.test",
        status="open",
        lines=[CartLine(new_id(), "LH-LAMP-01", "Arc Floor Lamp", 1, "129.00")],
        createdAt=at,
        updatedAt=at,
    )
    store.save_cart(cart)
    store.commit()
    return cart


def seed_reconciliation_orders(store: Store, clock: Clock) -> list[Order]:
    """Delivered orders with API-side (float, half-up, per-line) totals. About a third of them
    disagree with the worker's Decimal/banker's recomputation by one cent."""
    specs = [
        ("lumen-home", "LH-100301", [("LH-LAMP-04", "Lumen Desk Lamp", 1, "49.00")]),
        ("lumen-home", "LH-100302", [("LH-LAMP-01", "Arc Floor Lamp", 1, "58.00")]),
        ("lumen-home", "LH-100303", [("LH-LAMP-01", "Arc Floor Lamp", 1, "129.00")]),
        ("trailhead-supply", "TS-200201", [("TS-SOCK-01-M", "Merino Sock M", 1, "11.95")]),
        (
            "trailhead-supply",
            "TS-200202",
            [
                ("TS-SOCK-01-M", "Merino Sock M", 2, "11.95"),
                ("TS-TENT-01", "Ridge Tent 2P", 1, "189.00"),
            ],
        ),
        ("trailhead-supply", "TS-200203", [("TS-TENT-01", "Ridge Tent 2P", 1, "189.00")]),
        (
            "trailhead-supply",
            "TS-200204",
            [
                ("TS-SOCK-01-M", "Merino Sock M", 1, "11.95"),
                ("TS-TENT-01", "Ridge Tent 2P", 1, "129.00"),
            ],
        ),
        ("trailhead-supply", "TS-200205", [("TS-SOCK-01-M", "Merino Sock M", 3, "11.95")]),
    ]
    orders = []
    for brand, number, raw in specs:
        warehouse = "US-NJ" if brand == "lumen-home" else "DE-HAM"
        lines = [
            OrderLine(sku, name, qty, price, _mul(price, qty), warehouse)
            for sku, name, qty, price in raw
        ]
        order = make_order(
            new_id(), number, brand, f"customer-{number[-3:]}@{brand}.test", lines, clock
        )
        order.status = "delivered"
        store.save_order(order)
        orders.append(order)
    store.commit()
    return orders


def _mul(price: str, qty: int) -> str:
    from decimal import Decimal

    return f"{Decimal(price) * qty:.2f}"


def payment_succeeded_event(order: Order, event_id: str, attempt: int = 1, at: str | None = None):
    return {
        "event_id": event_id,
        "type": "payment.succeeded",
        "occurred_at": at or order.placedAt,
        "attempt": attempt,
        "data": {
            "payment_id": order.paymentId or "pay_unknown",
            "order_id": order.id,
            "cart_id": order.cartId,
            "amount": order.totals.total,
            "currency": order.totals.currency,
        },
    }


def inbox_row(event: dict[str, Any], clock: Clock) -> WebhookInboxRow:
    return WebhookInboxRow(
        id=new_id(),
        event_id=event["event_id"],
        type=event["type"],
        payload=event,
        received_at=iso(clock.now()),
    )
