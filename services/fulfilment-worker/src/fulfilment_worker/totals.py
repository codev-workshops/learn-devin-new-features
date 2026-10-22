"""Totals recomputation with ``Decimal`` and banker's rounding.

Planted: the API (services/api) rounds tax half-up on JS floats, line by line; this module rounds
half-even (``ROUND_HALF_EVEN``) on the order subtotal. Lumen subtotals that put the 8.25% tax on an
exact half cent (e.g. $58.00 → 4.785) and multi-line VAT-inclusive Trailhead orders disagree by one
cent, so the reconciliation report never balances. See PLANTED.md#rounding-mismatch.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from decimal import Decimal

from fulfilment_worker.brands import BrandRules, rules_for
from fulfilment_worker.models import OrderLine, Totals
from fulfilment_worker.money import bankers, fmt, parse

ONE = Decimal("1")


def line_total(line: OrderLine) -> Decimal:
    return bankers(parse(line.unitPrice) * line.quantity)


def recompute(lines: list[OrderLine], brand_id: str) -> Totals:
    rules: BrandRules = rules_for(brand_id)
    subtotal = sum((line_total(line) for line in lines), Decimal("0"))
    if rules.tax_inclusive:
        # VAT is already inside every list price; report the portion that is tax.
        tax = bankers(subtotal - subtotal / (ONE + rules.tax_rate))
        taxable_total = subtotal
    else:
        tax = bankers(subtotal * rules.tax_rate)
        taxable_total = subtotal + tax
    free = rules.free_shipping_over is not None and subtotal >= rules.free_shipping_over
    shipping = Decimal("0.00") if free or not lines else rules.shipping_flat
    return Totals(
        subtotal=fmt(subtotal),
        tax=fmt(tax),
        shipping=fmt(shipping),
        total=fmt(taxable_total + shipping),
        currency=rules.currency,
        taxIncluded=rules.tax_inclusive,
    )


def api_totals(lines: list[OrderLine], brand_id: str) -> Totals:
    """What services/api stores: JS-style floats, tax rounded half-up *per line* and summed.

    Used by fixtures and the reconciliation demo to model the other side of the plant; the
    worker never uses it for real totals.
    """
    rules = rules_for(brand_id)
    subtotal_f = 0.0
    tax_f = 0.0
    for line in lines:
        gross = float(line.unitPrice) * line.quantity
        subtotal_f += gross
        if rules.tax_inclusive:
            tax_f += _js_round(gross - gross / (1 + float(rules.tax_rate)))
        else:
            tax_f += _js_round(gross * float(rules.tax_rate))
    subtotal = Decimal(str(_js_round(subtotal_f)))
    tax = Decimal(str(_js_round(tax_f)))
    taxable_total = subtotal if rules.tax_inclusive else subtotal + tax
    free = rules.free_shipping_over is not None and subtotal >= rules.free_shipping_over
    shipping = Decimal("0.00") if free or not lines else rules.shipping_flat
    return Totals(
        subtotal=fmt(subtotal),
        tax=fmt(tax),
        shipping=fmt(shipping),
        total=fmt(taxable_total + shipping),
        currency=rules.currency,
        taxIncluded=rules.tax_inclusive,
    )


def _js_round(value: float) -> float:
    """``Math.round(x * 100) / 100`` — half-up on floats, as the API does it."""
    return math.floor(value * 100 + 0.5) / 100


@dataclass(frozen=True)
class Drift:
    order_id: str
    number: str
    field: str
    api: str
    worker: str

    @property
    def cents(self) -> int:
        return int((parse(self.worker) - parse(self.api)) * 100)


def reconcile(order_id: str, number: str, brand_id: str, lines: list[OrderLine], api: Totals):
    """Compare the totals the API stored with what the worker recomputes."""
    ours = recompute(lines, brand_id)
    drifts: list[Drift] = []
    for name in ("subtotal", "tax", "shipping", "total"):
        theirs = getattr(api, name)
        mine = getattr(ours, name)
        if parse(theirs) != parse(mine):
            drifts.append(Drift(order_id, number, name, theirs, mine))
    return drifts
