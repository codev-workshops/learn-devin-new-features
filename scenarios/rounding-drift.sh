#!/usr/bin/env bash
# rounding-drift.sh — place orders and show the 1-cent drift between API and worker totals.
#
# Plant: services/api totals use JS floats and half-up rounding; the fulfilment worker
# recomputes with Decimal and banker's rounding (seed-spec → currency-rounding).
# Symptom: on a share of orders the API tax/total differs by one cent from the exact
# recomputation, so the daily reconciliation never balances. Against services/api the ties of
# the 8.25% tax-exclusive Lumen Home rule (e.g. subtotal 10.00 → 0.825) are where it shows,
# so lumen-home is the default; --brand trailhead-supply exercises the VAT-inclusive path.
#
# usage: scenarios/rounding-drift.sh [--orders 40] [--brand lumen-home] [--seed 7]
#   Baskets are deterministic for a given --seed so a run is reproducible.
# Reset: pnpm lab:reset -- <nn>
set -euo pipefail
export INJECTOR=rounding-drift
# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/common.sh
. "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

ORDERS=40
BRAND="lumen-home"
SEED=7
while [ $# -gt 0 ]; do
  case "$1" in
  --orders) ORDERS="$2"; shift 2 ;;
  --brand) BRAND="$2"; shift 2 ;;
  --seed) SEED="$2"; shift 2 ;;
  -h | --help) sed -n '2,12p' "$0"; exit 0 ;;
  *) die "unknown option $1" ;;
  esac
done

require_api
require_cmd node
# High-stock, variant-free SKUs so the run never trips the oversell plant.
case "$BRAND" in
trailhead-supply) BASKET=(TS-STAKE-01 TS-MAP-01 TS-FIRST-01 TS-SOCK-01-M TS-FLTR-01 TS-LAMP-01 TS-KNIFE-01 TS-STOVE-01 TS-BTL-01-BLU TS-BTL-01-BLK) ;;
lumen-home) BASKET=(LH-BULB-01 LH-CANDLE-01 LH-TOWEL-01 LH-MUG-01 LH-THROW-01 LH-FRAME-01) ;;
*) die "unknown brand $BRAND" ;;
esac

placed=0
mismatches=0
drifted="[]"
rows="$(mktemp)"
trap 'rm -f "$rows" "$API_STATUS_FILE"' EXIT
# Tiny LCG so baskets are reproducible per --seed (a function, not a subshell, so the state advances).
rnd=$SEED
next_rnd() {
  rnd=$(((rnd * 1103515245 + 12345) % 2147483648))
  RND=$((rnd / 65536))
}

for i in $(seq 1 "$ORDERS"); do
  next_rnd
  n_lines=$((RND % 3 + 1))
  args=()
  for _ in $(seq 1 "$n_lines"); do
    next_rnd
    sku="${BASKET[$((RND % ${#BASKET[@]}))]}"
    next_rnd
    qty=$((RND % 4 + 1))
    args+=("$sku" "$qty")
  done
  res="$(create_order "$BRAND" "$(customer_user "$BRAND" "$((i % 120 + 1))")" "${args[@]}")"
  if [ "$(last_status)" != "201" ]; then
    log "order $i skipped ($(last_status)): $(printf '%s' "$res" | jq -r '.message // .')"
    continue
  fi
  placed=$((placed + 1))
  printf '%s\n' "$res" | jq -c .order >>"$rows"
done
[ "$placed" -gt 0 ] || die "no order could be placed"

# Exact recomputation (integer cents, banker's rounding) — the worker's arithmetic.
report="$(node "$SCENARIOS_DIR/lib/recompute-totals.mjs" <"$rows")"
mismatches="$(printf '%s' "$report" | jq '[.[] | select(.drift)] | length')"
drifted="$(printf '%s' "$report" | jq -c '[.[] | select(.drift) | {order: .order, number: .number, apiTotal: .api.total, exactTotal: .exact.total, apiTax: .api.tax, exactTax: .exact.tax}]')"
record rounding-drift "{\"at\":\"$(now_iso)\",\"orders\":$(printf '%s' "$report" | jq -c '[.[].order]')}"

pct=$(( mismatches * 100 / placed ))
result="$(jq -nc --argjson placed "$placed" --argjson mismatches "$mismatches" --argjson pct "$pct" --argjson drifted "$drifted" \
  '{injector:"rounding-drift",ordersPlaced:$placed,mismatches:$mismatches,driftPercent:$pct,drifted:$drifted}')"
if [ "$mismatches" -gt 0 ]; then
  symptom "$mismatches of $placed orders (${pct}%) have API totals that differ from the exact Decimal recomputation by at least one cent" "$result"
  exit "$EXIT_SYMPTOM"
fi
no_symptom "all $placed order totals match the exact recomputation — try more --orders, or the plant is fixed" "$result"
exit "$EXIT_FIXED"
