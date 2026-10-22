"""``kade-worker`` command line.

    kade-worker run                     poll outbox + webhook inbox, sweep carts on a timer
    kade-worker once [--sweep]          one tick (what the Compose healthcheck and tests use)
    kade-worker sweep                   run the abandoned-cart sweeper once
    kade-worker reconcile               totals drift report (API half-up vs worker banker's)
    kade-worker inbox [--port 3003]     HTTP webhook receiver for the fixture path
    kade-worker seed-demo               write the demo fixture into the configured store
    kade-worker demo <name>             duplicate-webhook | abandoned-cart | rounding-drift

Store selection: DATABASE_URL → PostgreSQL; WORKER_STORE_PATH → JSON file; otherwise in-memory.
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from collections.abc import Sequence
from dataclasses import asdict

from fulfilment_worker import fixtures, outbox, sweeper, totals, webhooks
from fulfilment_worker.clock import FixedClock, SystemClock
from fulfilment_worker.config import Settings
from fulfilment_worker.store import MemoryStore, Store, open_store


def _print(label: str, payload) -> None:
    print(f"{label}: {json.dumps(payload, indent=2, default=str)}")


def _inventory(store: Store, sku: str) -> list[dict]:
    return [
        {"sku": r.sku, "warehouse": r.warehouse, "onHand": r.onHand, "reserved": r.reserved}
        for r in store.list_inventory(sku)
    ]


def demo_duplicate_webhook(store: Store | None = None, quiet: bool = False) -> dict:
    """PLANTED.md#duplicate-webhook: the same payment.succeeded twice → stock decremented twice."""
    clock = FixedClock()
    store = store or MemoryStore()
    fixtures.seed_inventory(store, clock)
    order = fixtures.seed_lamp_order(store, clock)
    before = _inventory(store, "LH-LAMP-03")
    event = fixtures.payment_succeeded_event(order, "evt_lampweek_0001", attempt=1)
    store.add_webhook(fixtures.inbox_row(event, clock))
    redelivered = dict(event, attempt=2)
    store.add_webhook(fixtures.inbox_row(redelivered, clock))
    store.commit()
    results = webhooks.process_pending(store, clock)
    outbox.process_pending(store, clock)
    after = _inventory(store, "LH-LAMP-03")
    emails = store.list_sent_emails(order.id)
    confirmations = [
        e
        for e in store.list_events(order.id)
        if e.type == "status_changed" and e.to_status == "confirmed"
    ]
    summary = {
        "event_ids_processed": [r.event_id for r in results],
        "distinct_event_ids": len({r.event_id for r in results}),
        "on_hand_before": before[0]["onHand"],
        "on_hand_after": after[0]["onHand"],
        "expected_on_hand_if_idempotent": before[0]["onHand"] - 1,
        "times_confirmed": len(confirmations),
        "confirmation_emails": len(emails),
        "order_status": store.get_order(order.id).status,
    }
    if not quiet:
        print("Duplicate-webhook demo (planted defect, see PLANTED.md#duplicate-webhook)")
        _print("LH-LAMP-03 before", before)
        _print("webhooks processed", summary["event_ids_processed"])
        _print("LH-LAMP-03 after", after)
        print(
            f"=> {summary['distinct_event_ids']} distinct event_id, decremented twice: "
            f"on_hand {summary['on_hand_before']} -> {summary['on_hand_after']} "
            f"(idempotent would be {summary['expected_on_hand_if_idempotent']}); "
            f"confirmed {summary['times_confirmed']}x, {summary['confirmation_emails']} emails"
        )
    return summary


def demo_abandoned_cart(store: Store | None = None, quiet: bool = False) -> dict:
    """PLANTED.md#abandoned-cart-sweeper: sweeper deletes a cart with a pending payment; the late
    webhook then confirms a ghost order with no lines."""
    clock = FixedClock()
    store = store or MemoryStore()
    fixtures.seed_inventory(store, clock)
    order = fixtures.seed_late_cart(store, clock, age_hours=72)
    fresh = fixtures.seed_fresh_cart(store, clock, age_hours=3)
    report = sweeper.sweep(store, clock, max_age_hours=48)
    late = fixtures.payment_succeeded_event(order, "evt_late_0002")
    store.add_webhook(fixtures.inbox_row(late, clock))
    store.commit()
    webhooks.process_pending(store, clock)
    ghost = store.get_order(order.id)
    summary = {
        "swept_cart_ids": report.deleted_cart_ids,
        "swept_with_pending_payment": report.swept_with_pending_payment,
        "fresh_cart_survived": store.get_cart(fresh.id) is not None,
        "ghost_order_status": ghost.status,
        "ghost_order_line_count": len(ghost.lines),
        "ghost_order_total": ghost.totals.total,
    }
    if not quiet:
        print("Abandoned-cart demo (planted defect, see PLANTED.md#abandoned-cart-sweeper)")
        _print("sweep report", report.__dict__)
        _print(
            "ghost order", {"status": ghost.status, "lines": ghost.lines, "totals": ghost.totals}
        )
        print(
            f"=> cart {order.cartId} swept while payment {order.paymentId} was pending; "
            f"late webhook confirmed order {ghost.number} with {len(ghost.lines)} lines"
        )
    return summary


def demo_rounding_drift(store: Store | None = None, quiet: bool = False) -> dict:
    """PLANTED.md#rounding-mismatch: API half-up totals vs worker banker's rounding."""
    clock = FixedClock()
    store = store or MemoryStore()
    orders = fixtures.seed_reconciliation_orders(store, clock)
    drifts = []
    for o in orders:
        drifts.extend(totals.reconcile(o.id, o.number, o.brand, o.lines, o.totals))
    summary = {
        "orders_checked": len(orders),
        "orders_with_drift": len({d.number for d in drifts}),
        "drifts": [d.__dict__ | {"cents": d.cents} for d in drifts],
    }
    if not quiet:
        print("Rounding-drift demo (planted defect, see PLANTED.md#rounding-mismatch)")
        for d in drifts:
            print(f"  {d.number} {d.field}: api={d.api} worker={d.worker} ({d.cents:+d}c)")
        print(f"=> {summary['orders_with_drift']}/{len(orders)} orders never reconcile")
    return summary


DEMOS = {
    "duplicate-webhook": demo_duplicate_webhook,
    "abandoned-cart": demo_abandoned_cart,
    "rounding-drift": demo_rounding_drift,
}


def cmd_reconcile(store: Store) -> int:
    drifts = []
    orders = store.list_orders()
    for o in orders:
        drifts.extend(totals.reconcile(o.id, o.number, o.brand, o.lines, o.totals))
    for d in drifts:
        print(f"{d.number}\t{d.field}\tapi={d.api}\tworker={d.worker}\t{d.cents:+d}c")
    print(f"{len(orders)} orders, {len({d.order_id for d in drifts})} with drift")
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="kade-worker",
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("-v", "--verbose", action="store_true")
    sub = p.add_subparsers(dest="command", required=True)
    sub.add_parser("run")
    once = sub.add_parser("once")
    once.add_argument("--sweep", action="store_true")
    sub.add_parser("sweep")
    sub.add_parser("reconcile")
    inv = sub.add_parser("inventory")
    inv.add_argument("--sku", default=None)
    inbox = sub.add_parser("inbox")
    inbox.add_argument("--port", type=int, default=None)
    sub.add_parser("seed-demo")
    demo = sub.add_parser("demo")
    demo.add_argument("name", choices=sorted(DEMOS))
    demo.add_argument("--json", action="store_true", help="print the summary as JSON only")
    return p


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(name)s %(levelname)s %(message)s",
        stream=sys.stderr,
    )
    settings = Settings.from_env()

    if args.command == "demo":
        summary = DEMOS[args.name](quiet=args.json)
        if args.json:
            print(json.dumps(summary, indent=2, default=str))
        return 0

    store = open_store(settings.database_url, settings.store_path)
    clock = SystemClock()
    try:
        if args.command == "run":
            from fulfilment_worker.worker import run_forever

            run_forever(store, settings, clock)
        elif args.command == "once":
            from fulfilment_worker.worker import tick

            result = tick(store, settings, clock, run_sweeper=args.sweep)
            print(json.dumps(result.__dict__))
        elif args.command == "sweep":
            report = sweeper.sweep(store, clock, settings.sweeper_max_age_hours)
            print(json.dumps(report.__dict__, indent=2))
        elif args.command == "reconcile":
            return cmd_reconcile(store)
        elif args.command == "inventory":
            print(json.dumps([asdict(r) for r in store.list_inventory(args.sku)], indent=2))
        elif args.command == "seed-demo":
            fixtures.seed_inventory(store, clock)
            order = fixtures.seed_lamp_order(store, clock)
            fixtures.seed_late_cart(store, clock)
            fixtures.seed_reconciliation_orders(store, clock)
            print(
                json.dumps(
                    {
                        "lamp_order_id": order.id,
                        "payment_id": order.paymentId,
                        "cart_id": order.cartId,
                        "amount": order.totals.total,
                        "currency": order.totals.currency,
                    }
                )
            )
        elif args.command == "inbox":
            from fulfilment_worker.inbox_server import InboxServer

            server = InboxServer(store, settings.paygate_secret, args.port or settings.inbox_port)
            print(f"inbox listening on :{server.port} (POST /webhooks/payments)", file=sys.stderr)
            try:
                server.serve_forever()
            except KeyboardInterrupt:
                server.stop()
    finally:
        store.close()
    return 0
