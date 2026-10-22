from fulfilment_worker.models import OrderLine
from fulfilment_worker.totals import api_totals, recompute, reconcile


def line(sku, qty, price, wh="US-NJ"):
    from decimal import Decimal

    return OrderLine(sku, sku, qty, price, f"{Decimal(price) * qty:.2f}", wh)


def test_lumen_tax_exclusive_totals():
    t = recompute([line("LH-LAMP-03", 1, "47.20")], "lumen-home")
    assert (t.subtotal, t.tax, t.shipping, t.total) == ("47.20", "3.89", "7.95", "59.04")
    assert t.currency == "USD" and t.taxIncluded is False


def test_trailhead_vat_inclusive_and_free_shipping():
    t = recompute([line("TS-TENT-01", 1, "189.00", "DE-HAM")], "trailhead-supply")
    assert (t.subtotal, t.tax, t.shipping, t.total) == ("189.00", "30.18", "0.00", "189.00")
    assert t.taxIncluded is True
    small = recompute([line("TS-SOCK-01-M", 1, "11.95", "DE-HAM")], "trailhead-supply")
    assert small.shipping == "5.90" and small.total == "17.85"


def test_empty_order_has_no_shipping():
    t = recompute([], "lumen-home")
    assert t.total == "0.00" and t.shipping == "0.00"


def test_planted_rounding_mismatch_lumen_half_cent():
    """PLANTED.md#rounding-mismatch: $58.00 * 8.25% = 4.785 -> API 4.79, worker 4.78."""
    lines = [line("LH-LAMP-01", 1, "58.00")]
    api = api_totals(lines, "lumen-home")
    worker = recompute(lines, "lumen-home")
    assert api.tax == "4.79" and worker.tax == "4.78"
    drifts = reconcile("o1", "LH-100302", "lumen-home", lines, api)
    assert {(d.field, d.cents) for d in drifts} == {("tax", -1), ("total", -1)}


def test_planted_rounding_mismatch_trailhead_per_line():
    """Per-line half-up VAT (API) vs order-level banker's VAT (worker) on a two-line order."""
    lines = [line("TS-SOCK-01-M", 2, "11.95", "DE-HAM"), line("TS-TENT-01", 1, "189.00", "DE-HAM")]
    api = api_totals(lines, "trailhead-supply")
    worker = recompute(lines, "trailhead-supply")
    assert api.tax == "34.00" and worker.tax == "33.99"
    assert api.total == worker.total  # VAT inclusive: the gross agrees, the tax split does not


def test_single_line_orders_usually_reconcile():
    lines = [line("TS-TENT-01", 1, "189.00", "DE-HAM")]
    assert (
        reconcile("o", "n", "trailhead-supply", lines, api_totals(lines, "trailhead-supply")) == []
    )
