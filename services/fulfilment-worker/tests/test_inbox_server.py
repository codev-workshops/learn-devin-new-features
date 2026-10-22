import json
import urllib.error
import urllib.request

import pytest

from fulfilment_worker import fixtures, signing
from fulfilment_worker.inbox_server import InboxServer

SECRET = "whsec_test"


@pytest.fixture
def server(store, clock):
    srv = InboxServer(store, SECRET, port=0, clock=clock).start_background()
    yield srv
    srv.stop()


def _post(port, body: bytes, sig: str | None):
    req = urllib.request.Request(
        f"http://127.0.0.1:{port}/webhooks/payments", data=body, method="POST"
    )
    req.add_header("Content-Type", "application/json")
    if sig is not None:
        req.add_header("X-PayGate-Signature", sig)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as err:
        return err.code, json.loads(err.read())


def test_signature_round_trip():
    sig = signing.sign(SECRET, b"{}")
    assert sig.startswith("sha256=")
    assert signing.verify(SECRET, b"{}", sig)
    assert not signing.verify(SECRET, b"{} ", sig)
    assert not signing.verify("other", b"{}", sig)
    assert not signing.verify(SECRET, b"{}", None)


def test_inbox_accepts_signed_and_rejects_unsigned(server, store, clock):
    fixtures.seed_inventory(store, clock)
    order = fixtures.seed_lamp_order(store, clock)
    body = json.dumps(fixtures.payment_succeeded_event(order, "evt_http_1")).encode()
    assert _post(server.port, body, None)[0] == 401
    assert _post(server.port, body, "sha256=deadbeef")[0] == 401
    status, payload = _post(server.port, body, signing.sign(SECRET, body))
    assert status == 202 and payload["event_id"] == "evt_http_1"
    status, payload = _post(server.port, body, signing.sign(SECRET, body))
    assert status == 202, "a replay of the same event_id is accepted again (planted)"
    assert [r.event_id for r in store.list_webhooks()] == ["evt_http_1", "evt_http_1"]
    with urllib.request.urlopen(f"http://127.0.0.1:{server.port}/health", timeout=5) as resp:
        assert json.loads(resp.read()) == {"ok": True, "pending": 2}
