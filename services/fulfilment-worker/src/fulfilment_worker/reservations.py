"""Inventory reservations: reserve on checkout, commit on payment, release on failure/cancel."""

from __future__ import annotations

import logging
from dataclasses import dataclass

from fulfilment_worker.brands import rules_for
from fulfilment_worker.clock import Clock
from fulfilment_worker.models import InventoryRow, Order, OrderEvent, iso, new_id
from fulfilment_worker.store import Store

log = logging.getLogger("harbourline.worker.reservations")


class OutOfStockError(RuntimeError):
    pass


@dataclass(frozen=True)
class StockChange:
    sku: str
    warehouse: str
    on_hand_before: int
    on_hand_after: int
    reserved_before: int
    reserved_after: int


def _pick_warehouse(store: Store, order: Order, sku: str, quantity: int, preferred: str) -> str:
    if preferred:
        return preferred
    for warehouse in rules_for(order.brand).warehouses:
        row = store.get_inventory(sku, warehouse)
        if row and row.available >= quantity:
            return warehouse
    return rules_for(order.brand).warehouses[0]


def _row(store: Store, sku: str, warehouse: str, clock: Clock) -> InventoryRow:
    row = store.get_inventory(sku, warehouse)
    if row is None:
        row = InventoryRow(sku, warehouse, 0, 0, 0, iso(clock.now()))
    return row


def reserve(store: Store, order: Order, clock: Clock) -> list[StockChange]:
    """Hold stock for every line (``reserved += quantity``). Raises when nothing is available."""
    changes: list[StockChange] = []
    for line in order.lines:
        warehouse = _pick_warehouse(store, order, line.sku, line.quantity, line.warehouse)
        row = _row(store, line.sku, warehouse, clock)
        if row.available < line.quantity:
            raise OutOfStockError(f"{line.sku}@{warehouse}: {row.available} < {line.quantity}")
        before = row.reserved
        row.reserved += line.quantity
        row.updatedAt = iso(clock.now())
        line.warehouse = warehouse
        store.save_inventory(row)
        changes.append(
            StockChange(line.sku, warehouse, row.onHand, row.onHand, before, row.reserved)
        )
    store.add_event(
        OrderEvent(
            id=new_id(),
            orderId=order.id,
            type="reservation_made",
            at=iso(clock.now()),
            detail=", ".join(f"{c.sku}x{c.reserved_after - c.reserved_before}" for c in changes),
        )
    )
    return changes


def commit(store: Store, order: Order, clock: Clock) -> list[StockChange]:
    """Payment confirmed: turn the hold into a real decrement (``on_hand -= quantity``)."""
    changes: list[StockChange] = []
    for line in order.lines:
        row = _row(store, line.sku, line.warehouse, clock)
        on_hand_before, reserved_before = row.onHand, row.reserved
        row.onHand -= line.quantity
        row.reserved = max(0, row.reserved - line.quantity)
        row.updatedAt = iso(clock.now())
        store.save_inventory(row)
        changes.append(
            StockChange(
                line.sku, line.warehouse, on_hand_before, row.onHand, reserved_before, row.reserved
            )
        )
        if row.onHand < 0:
            log.warning("negative on-hand for %s@%s: %d", row.sku, row.warehouse, row.onHand)
    return changes


def release(store: Store, order: Order, clock: Clock, reason: str) -> list[StockChange]:
    """Payment failed, order cancelled or cart swept: give the hold back."""
    changes: list[StockChange] = []
    for line in order.lines:
        row = _row(store, line.sku, line.warehouse, clock)
        before = row.reserved
        row.reserved = max(0, row.reserved - line.quantity)
        row.updatedAt = iso(clock.now())
        store.save_inventory(row)
        changes.append(
            StockChange(line.sku, line.warehouse, row.onHand, row.onHand, before, row.reserved)
        )
    store.add_event(
        OrderEvent(
            id=new_id(),
            orderId=order.id,
            type="reservation_released",
            at=iso(clock.now()),
            detail=reason,
        )
    )
    return changes
