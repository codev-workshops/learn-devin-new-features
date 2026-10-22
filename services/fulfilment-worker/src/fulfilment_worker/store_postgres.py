"""PostgreSQL store (psycopg 3) against the tables in ``db/expected-schema.sql``.

``db/`` is owned by W1-api. If its migrations name things differently, this file is the only
place to reconcile. Not exercised against the real W1-api schema yet — see PR description.
"""

from __future__ import annotations

import json
from dataclasses import asdict
from datetime import datetime
from typing import Any

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
    iso,
)


def _ts(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return iso(value)
    return str(value)


def _jsonb(value: Any) -> str:
    return json.dumps(value)


class PostgresStore:
    def __init__(self, conn) -> None:
        self.conn = conn

    @classmethod
    def connect(cls, database_url: str) -> PostgresStore:
        import psycopg
        from psycopg.rows import dict_row

        return cls(psycopg.connect(database_url, row_factory=dict_row, autocommit=False))

    def _rows(self, sql: str, params: tuple = ()) -> list[dict]:
        with self.conn.cursor() as cur:
            cur.execute(sql, params)
            return list(cur.fetchall())

    def _exec(self, sql: str, params: tuple = ()) -> None:
        with self.conn.cursor() as cur:
            cur.execute(sql, params)

    # orders
    def _order_from(self, row: dict) -> Order:
        lines = [
            OrderLine(
                sku=line["sku"],
                name=line["name"],
                quantity=line["quantity"],
                unitPrice=str(line["unit_price"]),
                lineTotal=str(line["line_total"]),
                warehouse=line["warehouse"],
            )
            for line in self._rows(
                "SELECT sku, name, quantity, unit_price, line_total, warehouse "
                "FROM order_lines WHERE order_id = %s ORDER BY position, sku",
                (row["id"],),
            )
        ]
        totals = row["totals"] if isinstance(row["totals"], dict) else json.loads(row["totals"])
        return Order(
            id=str(row["id"]),
            number=row["number"],
            brand=row["brand"],
            user=row["user_email"],
            status=row["status"],
            lines=lines,
            totals=Totals(**totals),
            placedAt=_ts(row["placed_at"]) or "",
            updatedAt=_ts(row["updated_at"]) or "",
            cartId=str(row["cart_id"]) if row["cart_id"] else None,
            paymentId=row["payment_id"],
        )

    def get_order(self, order_id: str) -> Order | None:
        rows = self._rows("SELECT * FROM orders WHERE id = %s", (order_id,))
        return self._order_from(rows[0]) if rows else None

    def save_order(self, order: Order) -> None:
        self._exec(
            """
            INSERT INTO orders (id, number, brand, user_email, cart_id, status, currency, totals,
                                payment_id, placed_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status, totals = EXCLUDED.totals,
                payment_id = EXCLUDED.payment_id, updated_at = EXCLUDED.updated_at,
                cart_id = EXCLUDED.cart_id
            """,
            (
                order.id,
                order.number,
                order.brand,
                order.user,
                order.cartId,
                order.status,
                order.totals.currency,
                _jsonb(asdict(order.totals)),
                order.paymentId,
                order.placedAt,
                order.updatedAt,
            ),
        )
        self._exec("DELETE FROM order_lines WHERE order_id = %s", (order.id,))
        for position, line in enumerate(order.lines):
            self._exec(
                """
                INSERT INTO order_lines (order_id, position, sku, name, quantity, unit_price,
                                         line_total, warehouse)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    order.id,
                    position,
                    line.sku,
                    line.name,
                    line.quantity,
                    line.unitPrice,
                    line.lineTotal,
                    line.warehouse,
                ),
            )

    def list_orders(self, brand: str | None = None) -> list[Order]:
        sql = (
            "SELECT * FROM orders" + (" WHERE brand = %s" if brand else "") + " ORDER BY placed_at"
        )
        return [self._order_from(r) for r in self._rows(sql, (brand,) if brand else ())]

    def pending_order_for_cart(self, cart_id: str) -> Order | None:
        rows = self._rows(
            "SELECT * FROM orders WHERE cart_id = %s AND status = 'pending_payment' LIMIT 1",
            (cart_id,),
        )
        return self._order_from(rows[0]) if rows else None

    # events
    def add_event(self, event: OrderEvent) -> None:
        self._exec(
            """
            INSERT INTO order_events
                (id, order_id, type, from_status, to_status, source, detail, at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                event.id,
                event.orderId,
                event.type,
                event.from_status,
                event.to_status,
                event.source,
                event.detail,
                event.at,
            ),
        )

    def list_events(self, order_id: str) -> list[OrderEvent]:
        return [
            OrderEvent(
                id=str(r["id"]),
                orderId=str(r["order_id"]),
                type=r["type"],
                at=_ts(r["at"]) or "",
                source=r["source"],
                detail=r["detail"],
                from_status=r["from_status"],
                to_status=r["to_status"],
            )
            for r in self._rows(
                "SELECT * FROM order_events WHERE order_id = %s ORDER BY at, id", (order_id,)
            )
        ]

    # inventory
    def _inv(self, r: dict) -> InventoryRow:
        return InventoryRow(
            r["sku"],
            r["warehouse"],
            r["on_hand"],
            r["reserved"],
            r["safety_stock"],
            _ts(r["updated_at"]),
        )

    def get_inventory(self, sku: str, warehouse: str) -> InventoryRow | None:
        rows = self._rows(
            "SELECT * FROM inventory WHERE sku = %s AND warehouse = %s", (sku, warehouse)
        )
        return self._inv(rows[0]) if rows else None

    def list_inventory(self, sku: str | None = None) -> list[InventoryRow]:
        sql = "SELECT * FROM inventory" + (" WHERE sku = %s" if sku else "")
        sql += " ORDER BY sku, warehouse"
        return [self._inv(r) for r in self._rows(sql, (sku,) if sku else ())]

    def save_inventory(self, row: InventoryRow) -> None:
        self._exec(
            """
            INSERT INTO inventory (sku, warehouse, on_hand, reserved, safety_stock, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (sku, warehouse) DO UPDATE SET
                on_hand = EXCLUDED.on_hand, reserved = EXCLUDED.reserved,
                safety_stock = EXCLUDED.safety_stock, updated_at = EXCLUDED.updated_at
            """,
            (row.sku, row.warehouse, row.onHand, row.reserved, row.safetyStock, row.updatedAt),
        )

    # carts
    def _cart_from(self, r: dict) -> Cart:
        lines = [
            CartLine(
                str(line["id"]),
                line["sku"],
                line["name"],
                line["quantity"],
                str(line["unit_price"]),
            )
            for line in self._rows(
                "SELECT id, sku, name, quantity, unit_price FROM cart_lines WHERE cart_id = %s "
                "ORDER BY id",
                (r["id"],),
            )
        ]
        return Cart(
            id=str(r["id"]),
            brand=r["brand"],
            user=r["user_email"],
            status=r["status"],
            lines=lines,
            createdAt=_ts(r["created_at"]) or "",
            updatedAt=_ts(r["updated_at"]) or "",
            pendingPaymentId=r["pending_payment_id"],
        )

    def get_cart(self, cart_id: str) -> Cart | None:
        rows = self._rows("SELECT * FROM carts WHERE id = %s", (cart_id,))
        return self._cart_from(rows[0]) if rows else None

    def save_cart(self, cart: Cart) -> None:
        self._exec(
            """
            INSERT INTO carts (id, brand, user_email, status, pending_payment_id, created_at,
                               updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status, pending_payment_id = EXCLUDED.pending_payment_id,
                updated_at = EXCLUDED.updated_at
            """,
            (
                cart.id,
                cart.brand,
                cart.user,
                cart.status,
                cart.pendingPaymentId,
                cart.createdAt,
                cart.updatedAt,
            ),
        )
        self._exec("DELETE FROM cart_lines WHERE cart_id = %s", (cart.id,))
        for line in cart.lines:
            self._exec(
                "INSERT INTO cart_lines (id, cart_id, sku, name, quantity, unit_price) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (line.id, cart.id, line.sku, line.name, line.quantity, line.unitPrice),
            )

    def list_open_carts_older_than(self, cutoff: datetime) -> list[Cart]:
        return [
            self._cart_from(r)
            for r in self._rows(
                "SELECT * FROM carts WHERE status = 'open' AND updated_at < %s ORDER BY updated_at",
                (cutoff,),
            )
        ]

    def delete_cart(self, cart_id: str) -> None:
        self._exec("DELETE FROM cart_lines WHERE cart_id = %s", (cart_id,))
        self._exec("DELETE FROM carts WHERE id = %s", (cart_id,))

    # webhook inbox
    def _wh(self, r: dict) -> WebhookInboxRow:
        payload = r["payload"] if isinstance(r["payload"], dict) else json.loads(r["payload"])
        return WebhookInboxRow(
            id=str(r["id"]),
            event_id=r["event_id"],
            type=r["type"],
            payload=payload,
            received_at=_ts(r["received_at"]) or "",
            processed_at=_ts(r["processed_at"]),
            result=r["result"],
        )

    def add_webhook(self, row: WebhookInboxRow) -> None:
        self._exec(
            "INSERT INTO webhook_inbox (id, event_id, type, payload, received_at) "
            "VALUES (%s, %s, %s, %s::jsonb, %s)",
            (row.id, row.event_id, row.type, _jsonb(row.payload), row.received_at),
        )

    def pending_webhooks(self, limit: int) -> list[WebhookInboxRow]:
        return [
            self._wh(r)
            for r in self._rows(
                "SELECT * FROM webhook_inbox WHERE processed_at IS NULL "
                "ORDER BY received_at, id LIMIT %s FOR UPDATE SKIP LOCKED",
                (limit,),
            )
        ]

    def mark_webhook_processed(self, row_id: str, at: datetime, result: str) -> None:
        self._exec(
            "UPDATE webhook_inbox SET processed_at = %s, result = %s WHERE id = %s",
            (at, result, row_id),
        )

    def list_webhooks(self) -> list[WebhookInboxRow]:
        return [self._wh(r) for r in self._rows("SELECT * FROM webhook_inbox ORDER BY received_at")]

    # outbox
    def _ob(self, r: dict) -> OutboxRow:
        payload = r["payload"] if isinstance(r["payload"], dict) else json.loads(r["payload"])
        return OutboxRow(
            id=str(r["id"]),
            topic=r["topic"],
            payload=payload,
            created_at=_ts(r["created_at"]) or "",
            processed_at=_ts(r["processed_at"]),
            attempts=r["attempts"],
            order_id=str(r["order_id"]) if r["order_id"] else None,
        )

    def add_outbox(self, row: OutboxRow) -> None:
        self._exec(
            "INSERT INTO outbox (id, topic, payload, order_id, created_at, attempts) "
            "VALUES (%s, %s, %s::jsonb, %s, %s, %s)",
            (row.id, row.topic, _jsonb(row.payload), row.order_id, row.created_at, row.attempts),
        )

    def pending_outbox(self, limit: int) -> list[OutboxRow]:
        return [
            self._ob(r)
            for r in self._rows(
                "SELECT * FROM outbox WHERE processed_at IS NULL "
                "ORDER BY created_at, id LIMIT %s FOR UPDATE SKIP LOCKED",
                (limit,),
            )
        ]

    def mark_outbox_processed(self, row_id: str, at: datetime) -> None:
        self._exec(
            "UPDATE outbox SET processed_at = %s, attempts = attempts + 1 WHERE id = %s",
            (at, row_id),
        )

    def list_outbox(self, order_id: str | None = None) -> list[OutboxRow]:
        sql = "SELECT * FROM outbox" + (" WHERE order_id = %s" if order_id else "")
        sql += " ORDER BY created_at, id"
        return [self._ob(r) for r in self._rows(sql, (order_id,) if order_id else ())]

    # emails
    def add_sent_email(self, email: EmailMessage) -> None:
        self._exec(
            "INSERT INTO sent_emails (to_email, subject, body, order_id, sent_at, meta) "
            "VALUES (%s, %s, %s, %s, %s, %s::jsonb)",
            (
                email.to,
                email.subject,
                email.body,
                email.order_id,
                email.sent_at,
                _jsonb(email.meta),
            ),
        )

    def list_sent_emails(self, order_id: str | None = None) -> list[EmailMessage]:
        sql = "SELECT * FROM sent_emails" + (" WHERE order_id = %s" if order_id else "")
        sql += " ORDER BY sent_at, id"
        return [
            EmailMessage(
                to=r["to_email"],
                subject=r["subject"],
                body=r["body"],
                order_id=str(r["order_id"]) if r["order_id"] else None,
                sent_at=_ts(r["sent_at"]),
                meta=r["meta"] if isinstance(r["meta"], dict) else json.loads(r["meta"] or "{}"),
            )
            for r in self._rows(sql, (order_id,) if order_id else ())
        ]

    # unit of work
    def commit(self) -> None:
        self.conn.commit()

    def close(self) -> None:
        self.conn.close()
