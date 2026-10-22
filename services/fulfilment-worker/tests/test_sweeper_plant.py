"""Proves PLANTED.md#abandoned-cart-sweeper: carts with pending payments are swept too."""

from fulfilment_worker import fixtures, sweeper, webhooks


def test_fresh_carts_survive_and_old_empty_carts_go(store, clock):
    fresh = fixtures.seed_fresh_cart(store, clock, age_hours=3)
    old = fixtures.seed_fresh_cart(store, clock, age_hours=72)
    report = sweeper.sweep(store, clock)
    assert report.deleted_cart_ids == [old.id]
    assert report.swept_with_pending_payment == []
    assert store.get_cart(fresh.id) is not None and store.get_cart(old.id) is None


def test_sweeper_deletes_cart_with_pending_payment(store, clock):
    fixtures.seed_inventory(store, clock)
    order = fixtures.seed_late_cart(store, clock, age_hours=72)
    report = sweeper.sweep(store, clock)
    assert report.swept_with_pending_payment == [fixtures.LATE_CART_ID]
    assert report.emptied_order_ids == [order.id]
    assert store.get_cart(fixtures.LATE_CART_ID) is None
    swept = store.get_order(order.id)
    assert swept.status == "cancelled" and swept.lines == []
    assert store.get_inventory("TS-TENT-01", "DE-HAM").reserved == 0


def test_late_webhook_after_sweep_confirms_ghost_order(store, clock):
    fixtures.seed_inventory(store, clock)
    order = fixtures.seed_late_cart(store, clock, age_hours=72)
    event = fixtures.payment_succeeded_event(order, "evt_late_1")
    sweeper.sweep(store, clock)
    clock.advance(minutes=5)
    store.add_webhook(fixtures.inbox_row(event, clock))
    results = webhooks.process_pending(store, clock)
    assert results[0].outcome == "confirmed"
    ghost = store.get_order(order.id)
    assert ghost.status == "confirmed"
    assert ghost.lines == [], "planted: nothing to pick, yet the customer was charged"
    assert ghost.totals.total == "189.00"
    assert results[0].stock_changes == []


def test_webhook_for_unknown_order_creates_ghost_from_payload(store, clock):
    fixtures.seed_inventory(store, clock)
    order = fixtures.seed_late_cart(store, clock, age_hours=72)
    event = fixtures.payment_succeeded_event(order, "evt_orphan")
    event["data"]["order_id"] = "99999999-9999-4999-8999-999999999999"
    store.add_webhook(fixtures.inbox_row(event, clock))
    results = webhooks.process_pending(store, clock)
    ghost = store.get_order("99999999-9999-4999-8999-999999999999")
    assert results[0].outcome == "confirmed" and ghost is not None and ghost.lines == []
    notes = [e for e in store.list_events(ghost.id) if e.type == "note"]
    assert any("missing" in (n.detail or "") for n in notes)
