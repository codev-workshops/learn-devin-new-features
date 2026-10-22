#!/usr/bin/env bash
# End-to-end proof of PLANTED.md#duplicate-webhook using the real wire path:
#   paygate-fake fire --duplicate  ->  worker inbox (HMAC verified)  ->  worker tick
# Both deliveries carry the same event_id; the worker applies both, so LH-LAMP-03 goes 3 -> 1.
# Needs: python3.12 (or python3 >= 3.12), node 22, `npm run build -w services/paygate-fake`.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
worker="$here/.."
repo="$worker/../.."
paygate="$repo/services/paygate-fake"
PY="${PYTHON:-python3}"
PORT="${WORKER_INBOX_PORT:-3103}"
export PAYGATE_SECRET="${PAYGATE_SECRET:-harbourline-local-paygate-secret}"
export WORKER_STORE_PATH="${WORKER_STORE_PATH:-$(mktemp -d)/store.json}"
export PYTHONPATH="$worker/src${PYTHONPATH:+:$PYTHONPATH}"

[ -f "$paygate/dist/cli.js" ] || (cd "$repo" && npm run build -w services/paygate-fake >/dev/null)

echo "# 1. seed the Lamp Week order (1x LH-LAMP-03 reserved, 3 on hand) into $WORKER_STORE_PATH"
seed="$($PY -m fulfilment_worker seed-demo)"
order_id="$(printf '%s' "$seed" | $PY -c 'import json,sys; print(json.load(sys.stdin)["lamp_order_id"])')"
payment_id="$(printf '%s' "$seed" | $PY -c 'import json,sys; print(json.load(sys.stdin)["payment_id"])')"
cart_id="$(printf '%s' "$seed" | $PY -c 'import json,sys; print(json.load(sys.stdin)["cart_id"])')"
amount="$(printf '%s' "$seed" | $PY -c 'import json,sys; print(json.load(sys.stdin)["amount"])')"
currency="$(printf '%s' "$seed" | $PY -c 'import json,sys; print(json.load(sys.stdin)["currency"])')"
$PY -m fulfilment_worker inventory --sku LH-LAMP-03

echo "# 2. start the worker's webhook inbox on :$PORT"
$PY -m fulfilment_worker inbox --port "$PORT" 2>/dev/null &
inbox_pid=$!
trap 'kill $inbox_pid 2>/dev/null || true' EXIT
for _ in $(seq 1 50); do curl -fsS "http://127.0.0.1:$PORT/health" >/dev/null 2>&1 && break; sleep 0.1; done

echo "# 3. PayGate delivers payment.succeeded twice with the SAME event_id (--duplicate)"
node "$paygate/dist/cli.js" fire --duplicate --event-id evt_lampweek_0001 \
  --order-id "$order_id" --payment-id "$payment_id" --cart-id "$cart_id" \
  --amount "$amount" --currency "$currency" \
  --webhook-url "http://127.0.0.1:$PORT/webhooks/payments"
curl -fsS "http://127.0.0.1:$PORT/inbox"; echo
kill $inbox_pid; wait $inbox_pid 2>/dev/null || true; trap - EXIT

echo "# 4. one worker tick drains the inbox and the outbox"
$PY -m fulfilment_worker once

echo "# 5. result: LH-LAMP-03 was decremented twice (idempotent processing would leave 2)"
$PY -m fulfilment_worker inventory --sku LH-LAMP-03
on_hand="$($PY -m fulfilment_worker inventory --sku LH-LAMP-03 | $PY -c 'import json,sys; print(json.load(sys.stdin)[0]["onHand"])')"
if [ "$on_hand" = "1" ]; then
  echo "=> DOUBLE DECREMENT reproduced: on_hand 3 -> $on_hand for one distinct event_id (PLANTED.md#duplicate-webhook)"
else
  echo "!! expected on_hand 1, got $on_hand — the plant has been fixed or the demo is broken" >&2
  exit 1
fi
