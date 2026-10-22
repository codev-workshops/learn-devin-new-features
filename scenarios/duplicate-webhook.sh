#!/usr/bin/env bash
# duplicate-webhook.sh — deliver the same signed payment.succeeded event twice.
#
# Plant: the fulfilment worker ignores event_id (seed-spec → duplicate-webhook).
# Symptom: the order is confirmed twice, stock is decremented twice and two confirmation
# emails are queued — visible as duplicated events on GET /orders/{id}/events.
#
# usage: scenarios/duplicate-webhook.sh [--brand lumen-home] [--sku LH-CANDLE-01] [--order <uuid>] [--wait 20]
#   Without --order a fresh one-line order is created through the contract first.
#   services/paygate-fake reaches the same outcome with its --duplicate knob; this script
#   is the credential-free path that needs only the API.
# Reset: pnpm lab:reset -- <nn>
set -euo pipefail
export INJECTOR=duplicate-webhook
# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/common.sh
. "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"
trap 'rm -f "$API_STATUS_FILE"' EXIT

BRAND="lumen-home"
SKU="LH-CANDLE-01"
ORDER_ID=""
WAIT=20
while [ $# -gt 0 ]; do
  case "$1" in
  --brand) BRAND="$2"; shift 2 ;;
  --sku) SKU="$2"; shift 2 ;;
  --order) ORDER_ID="$2"; shift 2 ;;
  --wait) WAIT="$2"; shift 2 ;;
  -h | --help) sed -n '2,13p' "$0"; exit 0 ;;
  *) die "unknown option $1" ;;
  esac
done

require_api
user="$(customer_user "$BRAND" 42)"
if [ -z "$ORDER_ID" ]; then
  res="$(create_order "$BRAND" "$user" "$SKU" 2)"
  [ "$(last_status)" = "201" ] || die "checkout failed ($API_STATUS): $res"
  order="$(printf '%s' "$res" | jq -c .order)"
else
  order="$(HARBOURLINE_BRAND="$BRAND" HARBOURLINE_USER="$(merchandiser_for "$BRAND")" HARBOURLINE_ROLE=merchandiser api GET "/orders/$ORDER_ID")"
  [ "$(last_status)" = "200" ] || die "order $ORDER_ID not found in $BRAND ($API_STATUS)"
fi
ORDER_ID="$(printf '%s' "$order" | jq -r .id)"
payment_id="$(printf '%s' "$order" | jq -r '.paymentId // "pay_dup_'"$(rand_hex)"'"')"
amount="$(printf '%s' "$order" | jq -r .totals.total.amount)"
currency="$(printf '%s' "$order" | jq -r .totals.currency)"
cart_id="$(printf '%s' "$order" | jq -r '.cartId // empty')"
before="$(inventory_on_hand "$BRAND" "$SKU")"
events_before="$(order_events "$BRAND" "$ORDER_ID" | jq '[.[] | select(.type == "payment_received")] | length')"

event_id="evt_dup_$(rand_hex)"
mk_event() {
  jq -nc --arg id "$event_id" --arg at "$(now_iso)" --argjson attempt "$1" \
    --arg pid "$payment_id" --arg oid "$ORDER_ID" --arg cid "$cart_id" --arg amt "$amount" --arg cur "$currency" \
    '{event_id:$id,type:"payment.succeeded",occurred_at:$at,attempt:$attempt,
      data:({payment_id:$pid,order_id:$oid,amount:$amt,currency:$cur} + (if $cid != "" then {cart_id:$cid} else {} end))}'
}
s1="$(post_webhook "$(mk_event 1)")"
s2="$(post_webhook "$(mk_event 2)")"
log "order $ORDER_ID: delivered $event_id twice → $s1, $s2"
if [ "$s1" != "202" ] || [ "$s2" != "202" ]; then
  die "receiver rejected a delivery ($s1/$s2); is PAYGATE_SECRET the one the API uses?"
fi
record duplicate-webhook "{\"at\":\"$(now_iso)\",\"order\":\"$ORDER_ID\",\"event_id\":\"$event_id\"}"

deadline=$(( $(date +%s) + WAIT ))
while :; do
  events="$(order_events "$BRAND" "$ORDER_ID")"
  received="$(printf '%s' "$events" | jq '[.[] | select(.type == "payment_received")] | length')"
  emails="$(printf '%s' "$events" | jq '[.[] | select(.type == "email_queued")] | length')"
  new_received=$(( received - events_before ))
  [ "$new_received" -ge 2 ] && break
  [ "$(date +%s)" -ge "$deadline" ] && break
  sleep 1
done
after="$(inventory_on_hand "$BRAND" "$SKU")"
status="$(HARBOURLINE_BRAND="$BRAND" HARBOURLINE_USER="$(merchandiser_for "$BRAND")" HARBOURLINE_ROLE=merchandiser api GET "/orders/$ORDER_ID" | jq -r .status)"
result="$(jq -nc --arg order "$ORDER_ID" --arg event "$event_id" --argjson received "$new_received" --argjson emails "$emails" \
  --argjson before "$before" --argjson after "$after" --arg status "$status" \
  '{injector:"duplicate-webhook",order:$order,eventId:$event,deliveries:2,paymentReceivedEvents:$received,emailQueuedEvents:$emails,onHandBefore:$before,onHandAfter:$after,status:$status}')"

if [ "$new_received" -ge 2 ]; then
  symptom "event $event_id processed $new_received times for order $ORDER_ID (status $status, $emails email(s) queued, $SKU onHand $before → $after)" "$result"
  exit "$EXIT_SYMPTOM"
fi
if [ "$new_received" -eq 1 ]; then
  no_symptom "the duplicate was ignored — event_id is being honoured; plant fixed?" "$result"
  exit "$EXIT_FIXED"
fi
no_symptom "both deliveries were accepted (202) but no payment_received event appeared within ${WAIT}s — is the fulfilment worker running?" "$result"
exit "$EXIT_PENDING"
