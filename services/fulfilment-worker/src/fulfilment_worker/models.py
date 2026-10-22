"""Plain dataclasses mirroring the OpenAPI schemas (field names match the contract).

Everything is JSON-friendly on purpose: timestamps are ISO-8601 strings, money is a two-fractional
digit string. ``dataclasses.asdict`` is the serializer.
"""

from __future__ import annotations

import uuid
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from typing import Any

ORDER_STATUSES = (
    "pending_payment",
    "paid",
    "confirmed",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
    "chargeback",
)

WEBHOOK_EVENT_TYPES = (
    "payment.succeeded",
    "payment.failed",
    "payment.refunded",
    "chargeback.opened",
)


def new_id() -> str:
    return str(uuid.uuid4())


def iso(dt: datetime) -> str:
    return dt.astimezone(UTC).isoformat().replace("+00:00", "Z")


def parse_iso(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC)


@dataclass
class Totals:
    subtotal: str
    tax: str
    shipping: str
    total: str
    currency: str
    taxIncluded: bool = False  # noqa: N815 - contract field name
    discount: str | None = None


@dataclass
class OrderLine:
    sku: str
    name: str
    quantity: int
    unitPrice: str  # noqa: N815
    lineTotal: str  # noqa: N815
    warehouse: str


@dataclass
class Order:
    id: str
    number: str
    brand: str
    user: str
    status: str
    lines: list[OrderLine]
    totals: Totals
    placedAt: str  # noqa: N815
    updatedAt: str  # noqa: N815
    cartId: str | None = None  # noqa: N815
    paymentId: str | None = None  # noqa: N815


@dataclass
class OrderEvent:
    id: str
    orderId: str  # noqa: N815
    type: str
    at: str
    source: str = "worker"
    detail: str | None = None
    from_status: str | None = None
    to_status: str | None = None


@dataclass
class InventoryRow:
    sku: str
    warehouse: str
    onHand: int  # noqa: N815
    reserved: int
    safetyStock: int  # noqa: N815
    updatedAt: str | None = None  # noqa: N815

    @property
    def available(self) -> int:
        return self.onHand - self.reserved


@dataclass
class CartLine:
    id: str
    sku: str
    name: str
    quantity: int
    unitPrice: str  # noqa: N815


@dataclass
class Cart:
    id: str
    brand: str
    user: str
    status: str
    lines: list[CartLine]
    createdAt: str  # noqa: N815
    updatedAt: str  # noqa: N815
    pendingPaymentId: str | None = None  # noqa: N815


@dataclass
class WebhookInboxRow:
    id: str
    event_id: str
    type: str
    payload: dict[str, Any]
    received_at: str
    processed_at: str | None = None
    result: str | None = None


@dataclass
class OutboxRow:
    id: str
    topic: str
    payload: dict[str, Any]
    created_at: str
    processed_at: str | None = None
    attempts: int = 0
    order_id: str | None = None


@dataclass
class EmailMessage:
    to: str
    subject: str
    body: str
    order_id: str | None = None
    sent_at: str | None = None
    meta: dict[str, Any] = field(default_factory=dict)


def to_dict(obj: Any) -> dict[str, Any]:
    return asdict(obj)
