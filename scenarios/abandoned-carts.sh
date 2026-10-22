#!/usr/bin/env bash
# abandoned-carts.sh — make a late webhook land on a cart the sweeper has deleted.
#
# Plant: the sweeper deletes carts older than 48 h even when a payment is pending
# (seed-spec → abandoned-cart-sweeper). Symptom: payment.succeeded arrives for a deleted cart
# and the order becomes a "ghost" — paid/confirmed with no lines.
#
# The sweeper's effect is reproduced through the contract (DELETE /carts/{cartId}) so this
# works without the worker's schedule. The seed ships 4 pending carts older than 48 h; when they
# have all been consumed the script builds a fresh cart + checkout and ages nothing (same mechanics).
#
# usage: scenarios/abandoned-carts.sh [--brand lumen-home] [--older-than 48] [--count 1] [--fresh] [--wait 20]
# Reset: npm run lab:reset -- <nn>
set -euo pipefail
export INJECTOR=abandoned-carts
# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/common.sh
. "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"
trap 'rm -f "$API_STATUS_FILE"' EXIT

BRAND="lumen-home"
OLDER=48
COUNT=1
FRESH=0
WAIT=20
while [ $# -gt 0 ]; do
  case "$1" in
  --brand) BRAND="$2"; shift 2 ;;
  --older-than) OLDER="$2"; shift 2 ;;
  --count) COUNT="$2"; shift 2 ;;
  --fresh) FRESH=1; shift ;;
  --wait) WAIT="$2"; shift 2 ;;
  -h | --help) sed -n '2,14p' "$0"; exit 0 ;;
  *) die "unknown option $1" ;;
  esac
done

require_api
merch="$(merchandiser_for "$BRAND")"
targets="[]"
if [ "$FRESH" -eq 0 ]; then
  abandoned="$(KADE_BRAND="$BRAND" KADE_USER="$merch" KADE_ROLE=merchandiser api GET "/admin/carts/abandoned?olderThanHours=$OLDER")"
  [ "$(last_status)" = "200" ] || die "GET /admin/carts/abandoned → $API_STATUS"
  pending_orders="$(KADE_BRAND="$BRAND" KADE_USER="$merch" KADE_ROLE=merchandiser api GET "/admin/orders?status=pending_payment&limit=200" | jq -c '.items')"
  targets="$(jq -nc --argjson carts "$abandoned" --argjson orders "$pending_orders" --argjson n "$COUNT" '
    [ $carts[] | select(.pendingPaymentId != null) as $c
      | ($orders[] | select(.paymentId == $c.pendingPaymentId or .cartId == $c.cart.id)) as $o
      | {cartId: $c.cart.id, ageHours: $c.ageHours, order: $o} ] | .[:$n]')"
  log "$(printf '%s' "$targets" | jq length) seeded pending cart(s) older than ${OLDER}h with a matching pending_payment order"
fi
if [ "$(printf '%s' "$targets" | jq length)" -eq 0 ]; then
  log "no seeded candidates left — creating a fresh cart + checkout instead"
  res="$(create_order "$BRAND" "$(customer_user "$BRAND" 77)" "LH-MUG-01" 1)"
  [ "$BRAND" = "trailhead-supply" ] && res="$(create_order "$BRAND" "$(customer_user "$BRAND" 77)" "TS-MAP-01" 1)"
  [ "$(last_status)" = "201" ] || die "checkout failed ($API_STATUS): $res"
  targets="$(printf '%s' "$res" | jq -c '[{cartId: .order.cartId, ageHours: 0, order: .order}]')"
fi

ghosts=0
details="[]"
while IFS= read -r row; do
  cart_id="$(printf '%s' "$row" | jq -r .cartId)"
  order_id="$(printf '%s' "$row" | jq -r .order.id)"
  payment_id="$(printf '%s' "$row" | jq -r '.order.paymentId // "pay_late_'"$(rand_hex)"'"')"
  amount="$(printf '%s' "$row" | jq -r .order.totals.total.amount)"
  currency="$(printf '%s' "$row" | jq -r .order.totals.currency)"

  # 1. What the sweeper does at 48 h: the cart goes away while the payment is still pending.
  KADE_BRAND="$BRAND" KADE_USER="$merch" KADE_ROLE=merchandiser api DELETE "/carts/$cart_id" >/dev/null
  log "cart $cart_id deleted (sweeper) → $(last_status); order $order_id still pending_payment"

  # 2. The late PayGate delivery (attempt 3, occurred when the customer actually paid).
  event="$(jq -nc --arg id "evt_late_$(rand_hex)" --arg at "$(iso_hours_ago "$((OLDER + 1))")" \
    --arg pid "$payment_id" --arg oid "$order_id" --arg cid "$cart_id" --arg amt "$amount" --arg cur "$currency" \
    '{event_id:$id,type:"payment.succeeded",occurred_at:$at,attempt:3,data:{payment_id:$pid,order_id:$oid,cart_id:$cid,amount:$amt,currency:$cur}}')"
  st="$(post_webhook "$event")"
  [ "$st" = "202" ] || die "webhook for $order_id rejected ($st)"
  record abandoned-carts "{\"at\":\"$(now_iso)\",\"order\":\"$order_id\",\"cart\":\"$cart_id\"}"

  # 3. Wait for the worker: a ghost order is paid/confirmed with zero lines.
  deadline=$(( $(date +%s) + WAIT ))
  while :; do
    o="$(KADE_BRAND="$BRAND" KADE_USER="$merch" KADE_ROLE=merchandiser api GET "/orders/$order_id")"
    status="$(printf '%s' "$o" | jq -r .status)"
    lines="$(printf '%s' "$o" | jq '.lines | length')"
    [ "$status" != "pending_payment" ] && break
    [ "$(date +%s)" -ge "$deadline" ] && break
    sleep 1
  done
  ghost=false
  if [ "$status" != "pending_payment" ] && [ "$lines" -eq 0 ]; then ghost=true; ghosts=$((ghosts + 1)); fi
  details="$(printf '%s' "$details" | jq -c --arg o "$order_id" --arg c "$cart_id" --arg s "$status" --argjson l "$lines" --argjson g "$ghost" \
    '. + [{order:$o,cart:$c,status:$s,lines:$l,ghost:$g}]')"
done < <(printf '%s' "$targets" | jq -c '.[]')

result="$(jq -nc --argjson ghosts "$ghosts" --argjson details "$details" '{injector:"abandoned-carts",ghostOrders:$ghosts,orders:$details}')"
if [ "$ghosts" -gt 0 ]; then
  symptom "$ghosts ghost order(s): paid for a cart the sweeper deleted, zero lines — $(printf '%s' "$details" | jq -r '[.[] | select(.ghost) | .order] | join(", ")')" "$result"
  exit "$EXIT_SYMPTOM"
fi
if printf '%s' "$details" | jq -e 'all(.status == "pending_payment")' >/dev/null; then
  no_symptom "late webhook accepted but no order left pending_payment within ${WAIT}s — is the fulfilment worker running?" "$result"
  exit "$EXIT_PENDING"
fi
no_symptom "orders were paid with their lines intact — the worker handled the missing cart; plant fixed?" "$result"
exit "$EXIT_FIXED"
