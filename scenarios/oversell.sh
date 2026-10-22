#!/usr/bin/env bash
# oversell.sh — fire N concurrent checkouts at a low-stock SKU and show the oversell plant.
#
# Plant: services/api reserves stock read-then-write without SELECT … FOR UPDATE
# (packages/contracts/seed-spec.yaml#planted_edge_cases → oversell).
# Symptom: more checkouts succeed than there are units; GET /admin/inventory shows a negative onHand.
#
# usage: scenarios/oversell.sh [--sku LH-LAMP-03] [--brand lumen-home] [--concurrency 20]
# Reset: npm run lab:reset -- <nn>   (db:seed --reset restores on_hand = 3)
# Idempotent: each run adds one more burst; the symptom shape is identical every time.
set -euo pipefail
export INJECTOR=oversell
# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/common.sh
. "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

SKU="LH-LAMP-03"
BRAND="lumen-home"
CONCURRENCY=20
while [ $# -gt 0 ]; do
  case "$1" in
  --sku) SKU="$2"; shift 2 ;;
  --brand) BRAND="$2"; shift 2 ;;
  --concurrency) CONCURRENCY="$2"; shift 2 ;;
  -h | --help) sed -n '2,12p' "$0"; exit 0 ;;
  *) die "unknown option $1" ;;
  esac
done

require_api
before="$(inventory_on_hand "$BRAND" "$SKU")"
available=$((before > 0 ? before : 0))
[ "$before" -gt 0 ] || log "warning: $SKU is already at $before — only NEW oversell counts; reset with npm run lab:reset -- <nn> for a clean run"
log "$SKU on hand before: $before — firing $CONCURRENCY concurrent checkouts of 1 unit"

work="$(mktemp -d)"
trap 'rm -rf "$work" "$API_STATUS_FILE"' EXIT
for i in $(seq 1 "$CONCURRENCY"); do
  (
    API_STATUS_FILE="$work/$i.status.tmp"
    out="$(create_order "$BRAND" "$(customer_user "$BRAND" "$i")" "$SKU" 1)"
    printf '%s\n' "$(last_status)" >"$work/$i.status"
    [ "$(last_status)" = "201" ] && printf '%s' "$out" | jq -r '.order.id' >"$work/$i.order"
  ) &
done
wait

succeeded="$(cat "$work"/*.status | grep -c '^201$' || true)"
rejected=$((CONCURRENCY - succeeded))
after="$(inventory_on_hand "$BRAND" "$SKU")"
orders="$( (cat "$work"/*.order 2>/dev/null || true) | jq -R . | jq -sc .)"
record oversell "{\"at\":\"$(now_iso)\",\"sku\":\"$SKU\",\"orders\":$orders}"

result="$(jq -nc --arg sku "$SKU" --argjson before "$before" --argjson after "$after" \
  --argjson ok "$succeeded" --argjson rejected "$rejected" --argjson orders "$orders" \
  '{injector:"oversell",sku:$sku,onHandBefore:$before,onHandAfter:$after,succeeded:$ok,rejected:$rejected,orders:$orders}')"
log "succeeded=$succeeded rejected=$rejected on hand after: $after"

# Only damage done by THIS burst counts: more successes than units available before it started.
if [ "$succeeded" -gt "$available" ]; then
  symptom "$succeeded of $CONCURRENCY checkouts succeeded for $SKU with $available unit(s) available; onHand is now $after" "$result"
  exit "$EXIT_SYMPTOM"
fi
if [ "$available" -eq 0 ]; then
  no_symptom "$SKU had no stock to oversell (onHand $before from an earlier run); nothing new happened — reset first" "$result"
  exit "$EXIT_USAGE"
fi
no_symptom "only $succeeded checkout(s) succeeded for $available unit(s); the reservation looks serialised — plant fixed?" "$result"
exit "$EXIT_FIXED"
