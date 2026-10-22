import pytest

from fulfilment_worker import fixtures, outbox, reservations
from fulfilment_worker.models import OrderLine, OutboxRow, iso


def test_reserve_commit_release_cycle(store, clock):
    fixtures.seed_inventory(store, clock)
    order = fixtures.seed_lamp_order(store, clock)
    row = store.get_inventory("LH-LAMP-03", "US-NJ")
    assert (row.onHand, row.reserved) == (3, 1)
    reservations.release(store, order, clock, reason="test")
    assert store.get_inventory("LH-LAMP-03", "US-NJ").reserved == 0
    reservations.reserve(store, order, clock)
    changes = reservations.commit(store, order, clock)
    assert [(c.sku, c.on_hand_before, c.on_hand_after) for c in changes] == [("LH-LAMP-03", 3, 2)]


def test_reserve_refuses_more_than_on_hand(store, clock):
    fixtures.seed_inventory(store, clock)
    order = fixtures.seed_lamp_order(store, clock)
    order.lines = [OrderLine("LH-LAMP-02", "Two Left", 5, "10.00", "50.00", "US-NJ")]
    with pytest.raises(reservations.OutOfStockError):
        reservations.reserve(store, order, clock)


def test_outbox_dispatches_emails_and_logs_unknown_topics(store, clock):
    store.add_outbox(
        OutboxRow(
            id="o1",
            topic="email.order_confirmation",
            order_id="ord",
            payload={"to": "a@b.test", "subject": "hi"},
            created_at=iso(clock.now()),
        )
    )
    store.add_outbox(
        OutboxRow(
            id="o2", topic="weird.topic", order_id="ord", payload={}, created_at=iso(clock.now())
        )
    )
    report = outbox.process_pending(store, clock)
    assert report.by_topic == {"email.order_confirmation": 1, "weird.topic": 1}
    assert [e.to for e in store.list_sent_emails("ord")] == ["a@b.test"]
    assert store.pending_outbox(10) == []


def test_memory_store_round_trips_json(store, clock, tmp_path):
    fixtures.seed_inventory(store, clock)
    order = fixtures.seed_lamp_order(store, clock)
    path = tmp_path / "store.json"
    store.save(path)
    from fulfilment_worker.store import MemoryStore

    other = MemoryStore()
    other.load(path)
    assert other.get_order(order.id).totals == order.totals
    assert other.get_inventory("LH-LAMP-03", "US-NJ").reserved == 1
