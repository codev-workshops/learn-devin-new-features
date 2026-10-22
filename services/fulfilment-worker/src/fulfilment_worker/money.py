"""Money helpers. Amounts cross every boundary as two-fractional-digit strings, never floats."""

from __future__ import annotations

import re
from decimal import ROUND_HALF_EVEN, ROUND_HALF_UP, Decimal

MONEY_PATTERN = re.compile(r"^-?\d+\.\d{2}$")
CENT = Decimal("0.01")


class InvalidMoneyError(ValueError):
    pass


def parse(amount: str | Decimal | int) -> Decimal:
    """Parse a contract money string. Floats are rejected on purpose."""
    if isinstance(amount, float):
        raise InvalidMoneyError("floats never cross a boundary; pass a string")
    if isinstance(amount, Decimal | int):
        return Decimal(amount)
    if not MONEY_PATTERN.match(amount):
        raise InvalidMoneyError(f"not a money string: {amount!r}")
    return Decimal(amount)


def bankers(value: Decimal) -> Decimal:
    """Round to the cent with banker's rounding (ROUND_HALF_EVEN)."""
    return value.quantize(CENT, rounding=ROUND_HALF_EVEN)


def half_up(value: Decimal) -> Decimal:
    """Round to the cent half-up. Only used to *measure* the drift against the API's method."""
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def fmt(value: Decimal) -> str:
    return f"{value.quantize(CENT):.2f}"
