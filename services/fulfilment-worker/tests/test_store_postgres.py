"""Runs the duplicate-webhook plant through PostgresStore against db/expected-schema.sql.

Needs a reachable database: ``HARBOURLINE_TEST_DATABASE_URL=postgres://harbourline:harbourline@localhost:5432/harbourline``
(``pnpm db:up`` at the repo root). Skipped otherwise so ``pytest -q`` stays green offline.
"""

import os
from pathlib import Path

import pytest

from fulfilment_worker import fixtures, outbox, webhooks

DATABASE_URL = os.environ.get("HARBOURLINE_TEST_DATABASE_URL")
SCHEMA = Path(__file__).resolve().parents[1] / "db" / "expected-schema.sql"

pytestmark = pytest.mark.skipif(not DATABASE_URL, reason="HARBOURLINE_TEST_DATABASE_URL not set")


@pytest.fixture
def pg_store():
    psycopg = pytest.importorskip("psycopg")
    from fulfilment_worker.store_postgres import PostgresStore

    conn = psycopg.connect(DATABASE_URL, autocommit=True)
    schema = "worker_test"
    with conn.cursor() as cur:
        cur.execute(f"DROP SCHEMA IF EXISTS {schema} CASCADE")
        cur.execute(f"CREATE SCHEMA {schema}")
        cur.execute(f"SET search_path TO {schema}")
        cur.execute(SCHEMA.read_text())
    conn.close()
    url = DATABASE_URL + ("&" if "?" in DATABASE_URL else "?") + f"options=-csearch_path%3D{schema}"
    store = PostgresStore.connect(url)
    yield store
    store.close()


def test_duplicate_webhook_double_decrements_in_postgres(pg_store, clock):
    fixtures.seed_inventory(pg_store, clock)
    order = fixtures.seed_lamp_order(pg_store, clock)
    event = fixtures.payment_succeeded_event(order, "evt_pg_dup")
    pg_store.add_webhook(fixtures.inbox_row(event, clock))
    pg_store.add_webhook(fixtures.inbox_row(dict(event, attempt=2), clock))
    pg_store.commit()
    results = webhooks.process_pending(pg_store, clock)
    assert [r.outcome for r in results] == ["confirmed", "confirmed"]
    row = pg_store.get_inventory("LH-LAMP-03", "US-NJ")
    assert (row.onHand, row.reserved) == (1, 0)
    assert pg_store.get_order(order.id).status == "confirmed"
    assert outbox.process_pending(pg_store, clock).by_topic == {"email.order_confirmation": 2}
    assert len(pg_store.list_sent_emails(order.id)) == 2
