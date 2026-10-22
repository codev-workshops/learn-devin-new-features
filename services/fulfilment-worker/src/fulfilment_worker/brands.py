"""Brand pricing rules, mirroring ``packages/contracts/seed-spec.yaml#brands``.

Kept as code so the worker has no file dependency at runtime; ``tests/test_brands.py`` asserts
the values still match the frozen seed-spec.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class BrandRules:
    id: str
    name: str
    currency: str
    tax_inclusive: bool
    tax_rate: Decimal
    shipping_flat: Decimal
    free_shipping_over: Decimal | None
    warehouses: tuple[str, ...]
    order_number_prefix: str


BRANDS: dict[str, BrandRules] = {
    "lumen-home": BrandRules(
        id="lumen-home",
        name="Lumen Home",
        currency="USD",
        tax_inclusive=False,
        tax_rate=Decimal("0.0825"),
        shipping_flat=Decimal("7.95"),
        free_shipping_over=None,
        warehouses=("US-NJ",),
        order_number_prefix="LH",
    ),
    "trailhead-supply": BrandRules(
        id="trailhead-supply",
        name="Trailhead Supply",
        currency="EUR",
        tax_inclusive=True,
        tax_rate=Decimal("0.19"),
        shipping_flat=Decimal("5.90"),
        free_shipping_over=Decimal("80.00"),
        warehouses=("DE-HAM", "NL-RTM"),
        order_number_prefix="TS",
    ),
}


class UnknownBrandError(KeyError):
    pass


def rules_for(brand_id: str) -> BrandRules:
    try:
        return BRANDS[brand_id]
    except KeyError as exc:
        raise UnknownBrandError(brand_id) from exc
