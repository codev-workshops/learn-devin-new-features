"""Proves PLANTED.md#duplicate-webhook: the worker ignores event_id."""

from fulfilment_worker import fixtures, outbox, webhooks


def _inv(store, sku="LH-LAMP-03", wh="US-NJ"):
    row = store.get_inventory(sku, wh)
    return row.onHand, row.reserved


def test_payment_succeeded_confirms_and_commits_stock(store, clock):
    fixtures.seed_inventory(store, clock)
    order = fixtures.seed_lamp_order(store, clock)
    assert _inv(store) == (3, 1)
    store.add_webhook(fixtures.inbox_row(fixtures.payment_succeeded_event(order, "evt_1"), clock))
    results = webhooks.process_pending(store, clock)
    assert [r.outcome for r in results] == ["confirmed"]
    assert store.get_order(order.id).status == "confirmed"
    assert _inv(store) == (2, 0)
    statuses = [(e.from_status, e.to_status) for e in store.list_events(order.id) if e.to_status]
    assert statuses == [("pending_payment", "paid"), ("paid", "confirmed")]


def test_duplicate_event_id_decrements_twice(store, clock):
    fixtures.seed_inventory(store, clock)
    order = fixtures.seed_lamp_order(store, clock)
    event = fixtures.payment_succeeded_event(order, "evt_dup_001")
    retry = dict(event, attempt=2)
    store.add_webhook(fixtures.inbox_row(event, clock))
    store.add_webhook(fixtures.inbox_row(retry, clock))

    results = webhooks.process_pending(store, clock)
    assert [r.event_id for r in results] == ["evt_dup_001", "evt_dup_001"]
    assert [r.outcome for r in results] == ["confirmed", "confirmed"]

    on_hand, reserved = _inv(store)
    assert on_hand == 1, "planted: idempotent processing would leave 2 on hand"
    assert reserved == 0
    confirmations = [e for e in store.list_events(order.id) if e.to_status == "confirmed"]
    assert len(confirmations) == 2
    report = outbox.process_pending(store, clock)
    assert report.by_topic["email.order_confirmation"] == 2
    assert len(store.list_sent_emails(order.id)) == 2


def test_duplicate_rows_are_both_marked_processed(store, clock):
    fixtures.seed_inventory(store, clock)
    order = fixtures.seed_lamp_order(store, clock)
    for attempt in (1, 2, 3):
        ev = fixtures.payment_succeeded_event(order, "evt_same", attempt=attempt)
        store.add_webhook(fixtures.inbox_row(ev, clock))
    webhooks.process_pending(store, clock)
    rows = store.list_webhooks()
    assert len(rows) == 3 and all(r.processed_at for r in rows)
    assert len({r.event_id for r in rows}) == 1
    assert store.pending_webhooks(10) == []


def test_payment_failed_releases_reservation(store, clock):
    fixtures.seed_inventory(store, clock)
    order = fixtures.seed_lamp_order(store, clock)
    ev = fixtures.payment_succeeded_event(order, "evt_f")
    ev["type"] = "payment.failed"
    ev["data"]["reason"] = "card_declined"
    store.add_webhook(fixtures.inbox_row(ev, clock))
    results = webhooks.process_pending(store, clock)
    assert results[0].outcome == "cancelled"
    assert _inv(store) == (3, 0)


def test_invalid_event_is_rejected_not_applied(store, clock):
    fixtures.seed_inventory(store, clock)
    order = fixtures.seed_lamp_order(store, clock)
    ev = fixtures.payment_succeeded_event(order, "evt_bad")
    ev["type"] = "payment.exploded"
    store.add_webhook(fixtures.inbox_row(ev, clock))
    results = webhooks.process_pending(store, clock)
    assert results[0].outcome.startswith("rejected")
    assert store.get_order(order.id).status == "pending_payment"
    assert _inv(store) == (3, 1)
