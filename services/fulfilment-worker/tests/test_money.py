from decimal import Decimal

import pytest

from fulfilment_worker import money
from fulfilment_worker.brands import BRANDS, rules_for


def test_parse_accepts_two_decimal_strings():
    assert money.parse("47.20") == Decimal("47.20")
    assert money.parse("0.00") == Decimal("0")


@pytest.mark.parametrize("bad", ["47.2", "47", "47.200", "abc", "", "1,00"])
def test_parse_rejects_malformed_strings(bad):
    with pytest.raises(money.InvalidMoneyError):
        money.parse(bad)


def test_parse_rejects_floats():
    with pytest.raises(money.InvalidMoneyError):
        money.parse(47.2)  # type: ignore[arg-type]


def test_bankers_vs_half_up_differ_on_half_cents():
    assert money.bankers(Decimal("4.785")) == Decimal("4.78")
    assert money.half_up(Decimal("4.785")) == Decimal("4.79")
    assert money.bankers(Decimal("0.495")) == Decimal("0.50")
    assert money.fmt(Decimal("5")) == "5.00"


def test_brand_rules_match_seed_spec():
    lumen = rules_for("lumen-home")
    trail = rules_for("trailhead-supply")
    assert (lumen.currency, lumen.tax_inclusive, lumen.tax_rate) == (
        "USD",
        False,
        Decimal("0.0825"),
    )
    assert (trail.currency, trail.tax_inclusive, trail.tax_rate) == ("EUR", True, Decimal("0.19"))
    assert trail.free_shipping_over == Decimal("80.00")
    assert set(BRANDS) == {"lumen-home", "trailhead-supply"}
    with pytest.raises(KeyError):
        rules_for("nope")
