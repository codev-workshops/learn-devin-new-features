"""Storage abstraction.

``MemoryStore`` backs the tests, the demos and the fixture path (optionally persisted to a JSON
file so several processes can share it). ``store_postgres.PostgresStore`` speaks to the real
database described in ``db/expected-schema.sql``. Both expose the same methods; every unit of
work ends with ``commit()``.
"""

from __future__ import annotations

import json
from dataclasses import asdict
from datetime import datetime
from pathlib import Path
from typing import Any, Protocol

from fulfilment_worker.models import (
    Cart,
    CartLine,
    EmailMessage,
    InventoryRow,
    Order,
    OrderEvent,
    OrderLine,
    OutboxRow,
    Totals,
    WebhookInboxRow,
    parse_iso,
)


class Store(Protocol):
    # orders
    def get_order(self, order_id: str) -> Order | None: ...
    def save_order(self, order: Order) -> None: ...
    def list_orders(self, brand: str | None = None) -> list[Order]: ...
    def pending_order_for_cart(self, cart_id: str) -> Order | None: ...
    # events
    def add_event(self, event: OrderEvent) -> None: ...
    def list_events(self, order_id: str) -> list[OrderEvent]: ...
    # inventory
    def get_inventory(self, sku: str, warehouse: str) -> InventoryRow | None: ...
    def list_inventory(self, sku: str | None = None) -> list[InventoryRow]: ...
    def save_inventory(self, row: InventoryRow) -> None: ...
    # carts
    def get_cart(self, cart_id: str) -> Cart | None: ...
    def save_cart(self, cart: Cart) -> None: ...
    def list_open_carts_older_than(self, cutoff: datetime) -> list[Cart]: ...
    def delete_cart(self, cart_id: str) -> None: ...
    # webhook inbox
    def add_webhook(self, row: WebhookInboxRow) -> None: ...
    def pending_webhooks(self, limit: int) -> list[WebhookInboxRow]: ...
    def mark_webhook_processed(self, row_id: str, at: datetime, result: str) -> None: ...
    def list_webhooks(self) -> list[WebhookInboxRow]: ...
    # outbox
    def add_outbox(self, row: OutboxRow) -> None: ...
    def pending_outbox(self, limit: int) -> list[OutboxRow]: ...
    def mark_outbox_processed(self, row_id: str, at: datetime) -> None: ...
    def list_outbox(self, order_id: str | None = None) -> list[OutboxRow]: ...
    # emails "sent" by the outbox consumer
    def add_sent_email(self, email: EmailMessage) -> None: ...
    def list_sent_emails(self, order_id: str | None = None) -> list[EmailMessage]: ...
    # unit of work
    def commit(self) -> None: ...
    def close(self) -> None: ...


class MemoryStore:
    """Dict-backed store; ``path`` makes it persist to JSON on every ``commit()``."""

    def __init__(self, path: str | Path | None = None) -> None:
        self.path = Path(path) if path else None
        self.orders: dict[str, Order] = {}
        self.events: list[OrderEvent] = []
        self.inventory: dict[tuple[str, str], InventoryRow] = {}
        self.carts: dict[str, Cart] = {}
        self.webhooks: list[WebhookInboxRow] = []
        self.outbox: list[OutboxRow] = []
        self.emails: list[EmailMessage] = []
        if self.path and self.path.exists():
            self.load(self.path)

    # orders
    def get_order(self, order_id: str) -> Order | None:
        return self.orders.get(order_id)

    def save_order(self, order: Order) -> None:
        self.orders[order.id] = order

    def list_orders(self, brand: str | None = None) -> list[Order]:
        return [o for o in self.orders.values() if brand is None or o.brand == brand]

    def pending_order_for_cart(self, cart_id: str) -> Order | None:
        for order in self.orders.values():
            if order.cartId == cart_id and order.status == "pending_payment":
                return order
        return None

    # events
    def add_event(self, event: OrderEvent) -> None:
        self.events.append(event)

    def list_events(self, order_id: str) -> list[OrderEvent]:
        return [e for e in self.events if e.orderId == order_id]

    # inventory
    def get_inventory(self, sku: str, warehouse: str) -> InventoryRow | None:
        return self.inventory.get((sku, warehouse))

    def list_inventory(self, sku: str | None = None) -> list[InventoryRow]:
        rows = [r for r in self.inventory.values() if sku is None or r.sku == sku]
        return sorted(rows, key=lambda r: (r.sku, r.warehouse))

    def save_inventory(self, row: InventoryRow) -> None:
        self.inventory[(row.sku, row.warehouse)] = row

    # carts
    def get_cart(self, cart_id: str) -> Cart | None:
        return self.carts.get(cart_id)

    def save_cart(self, cart: Cart) -> None:
        self.carts[cart.id] = cart

    def list_open_carts_older_than(self, cutoff: datetime) -> list[Cart]:
        return [
            c for c in self.carts.values() if c.status == "open" and parse_iso(c.updatedAt) < cutoff
        ]

    def delete_cart(self, cart_id: str) -> None:
        self.carts.pop(cart_id, None)

    # webhook inbox
    def add_webhook(self, row: WebhookInboxRow) -> None:
        self.webhooks.append(row)

    def pending_webhooks(self, limit: int) -> list[WebhookInboxRow]:
        return [w for w in self.webhooks if w.processed_at is None][:limit]

    def mark_webhook_processed(self, row_id: str, at: datetime, result: str) -> None:
        for w in self.webhooks:
            if w.id == row_id:
                w.processed_at = _iso(at)
                w.result = result

    def list_webhooks(self) -> list[WebhookInboxRow]:
        return list(self.webhooks)

    # outbox
    def add_outbox(self, row: OutboxRow) -> None:
        self.outbox.append(row)

    def pending_outbox(self, limit: int) -> list[OutboxRow]:
        return [o for o in self.outbox if o.processed_at is None][:limit]

    def mark_outbox_processed(self, row_id: str, at: datetime) -> None:
        for o in self.outbox:
            if o.id == row_id:
                o.processed_at = _iso(at)
                o.attempts += 1

    def list_outbox(self, order_id: str | None = None) -> list[OutboxRow]:
        return [o for o in self.outbox if order_id is None or o.order_id == order_id]

    # emails
    def add_sent_email(self, email: EmailMessage) -> None:
        self.emails.append(email)

    def list_sent_emails(self, order_id: str | None = None) -> list[EmailMessage]:
        return [e for e in self.emails if order_id is None or e.order_id == order_id]

    # unit of work
    def commit(self) -> None:
        if self.path:
            self.save(self.path)

    def close(self) -> None:
        self.commit()

    # persistence
    def dump(self) -> dict[str, Any]:
        return {
            "orders": [asdict(o) for o in self.orders.values()],
            "events": [asdict(e) for e in self.events],
            "inventory": [asdict(r) for r in self.inventory.values()],
            "carts": [asdict(c) for c in self.carts.values()],
            "webhooks": [asdict(w) for w in self.webhooks],
            "outbox": [asdict(o) for o in self.outbox],
            "emails": [asdict(e) for e in self.emails],
        }

    def save(self, path: str | Path) -> None:
        Path(path).write_text(json.dumps(self.dump(), indent=2, sort_keys=True) + "\n")

    def load(self, path: str | Path) -> None:
        data = json.loads(Path(path).read_text())
        self.orders = {o["id"]: _order(o) for o in data.get("orders", [])}
        self.events = [OrderEvent(**e) for e in data.get("events", [])]
        self.inventory = {
            (r["sku"], r["warehouse"]): InventoryRow(**r) for r in data.get("inventory", [])
        }
        self.carts = {c["id"]: _cart(c) for c in data.get("carts", [])}
        self.webhooks = [WebhookInboxRow(**w) for w in data.get("webhooks", [])]
        self.outbox = [OutboxRow(**o) for o in data.get("outbox", [])]
        self.emails = [EmailMessage(**e) for e in data.get("emails", [])]


def _iso(dt: datetime) -> str:
    from fulfilment_worker.models import iso

    return iso(dt)


def _order(d: dict[str, Any]) -> Order:
    d = dict(d)
    d["lines"] = [OrderLine(**line) for line in d["lines"]]
    d["totals"] = Totals(**d["totals"])
    return Order(**d)


def _cart(d: dict[str, Any]) -> Cart:
    d = dict(d)
    d["lines"] = [CartLine(**line) for line in d["lines"]]
    return Cart(**d)


def open_store(database_url: str | None, store_path: str | None):
    """Pick the store from the environment: Postgres when DATABASE_URL is set, else JSON/memory."""
    if database_url:
        from fulfilment_worker.store_postgres import PostgresStore

        return PostgresStore.connect(database_url)
    return MemoryStore(store_path)
