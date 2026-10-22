"""Tiny HTTP receiver for the fixture path: PayGate posts webhooks here when ``services/api`` is not
running (``docker-compose.services.yml`` and the scripted demos point PAYGATE_WEBHOOK_URL at it).

Signatures are verified (unlike the planted API receiver); accepted events land in the webhook
inbox of the configured store with ``X-PayGate-Event-Id`` copied verbatim, so the processor sees
exactly what PayGate sent — duplicates included.
"""

from __future__ import annotations

import json
import logging
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from fulfilment_worker import signing
from fulfilment_worker.clock import Clock, SystemClock
from fulfilment_worker.models import WebhookInboxRow, iso, new_id
from fulfilment_worker.store import Store

log = logging.getLogger("harbourline.worker.inbox")


def make_handler(store: Store, secret: str, clock: Clock, lock: threading.Lock):
    class Handler(BaseHTTPRequestHandler):
        server_version = "harbourline-worker-inbox/0.1"

        def log_message(self, fmt, *args):  # quiet by default
            log.debug(fmt, *args)

        def _json(self, status: int, body: dict) -> None:
            data = json.dumps(body).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):  # noqa: N802
            if self.path == "/health":
                with lock:
                    pending = len(store.pending_webhooks(10_000))
                self._json(200, {"ok": True, "pending": pending})
            elif self.path == "/inbox":
                with lock:
                    rows = [
                        {
                            "event_id": r.event_id,
                            "type": r.type,
                            "processed_at": r.processed_at,
                            "result": r.result,
                        }
                        for r in store.list_webhooks()
                    ]
                self._json(200, {"rows": rows})
            else:
                self._json(404, {"code": "not_found", "message": self.path})

        def do_POST(self):  # noqa: N802
            if self.path != "/webhooks/payments":
                self._json(404, {"code": "not_found", "message": self.path})
                return
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(length)
            if not signing.verify(secret, raw, self.headers.get("X-PayGate-Signature")):
                self._json(401, {"code": "invalid_signature", "message": "bad X-PayGate-Signature"})
                return
            try:
                event = json.loads(raw)
            except json.JSONDecodeError:
                self._json(400, {"code": "bad_request", "message": "body is not JSON"})
                return
            event_id = self.headers.get("X-PayGate-Event-Id") or event.get("event_id")
            if not event_id or not isinstance(event, dict) or "type" not in event:
                self._json(400, {"code": "bad_request", "message": "missing event_id or type"})
                return
            row = WebhookInboxRow(
                id=new_id(),
                event_id=event_id,
                type=event["type"],
                payload=event,
                received_at=iso(clock.now()),
            )
            with lock:
                store.add_webhook(row)
                store.commit()
            log.info("accepted %s %s attempt=%s", event_id, event["type"], event.get("attempt"))
            self._json(202, {"accepted": True, "event_id": event_id})

    return Handler


class InboxServer:
    def __init__(self, store: Store, secret: str, port: int, clock: Clock | None = None):
        self.lock = threading.Lock()
        handler = make_handler(store, secret, clock or SystemClock(), self.lock)
        self.httpd = ThreadingHTTPServer(("0.0.0.0", port), handler)
        self.port = self.httpd.server_address[1]
        self._thread: threading.Thread | None = None

    def start_background(self) -> InboxServer:
        self._thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self._thread.start()
        return self

    def serve_forever(self) -> None:
        self.httpd.serve_forever()

    def stop(self) -> None:
        self.httpd.shutdown()
        self.httpd.server_close()
