#!/usr/bin/env bash
# Shared helpers for the Kadé Commerce scenario injectors.
#
# Every injector talks to the platform only through the frozen OpenAPI contract
# (packages/contracts/openapi.yaml). Nothing here touches the database or a
# service's internals, so the same scripts work against services/api, against
# the contract stub used by the tests (scenarios/test/contract-stub.mjs) and
# against any future deployment.
#
# Environment (all optional, see .env.example):
#   KADE_API_URL     base URL of services/api            default http://localhost:3001
#   PAYGATE_SECRET   HMAC key PayGate signs webhooks with default kade-local-paygate-secret
#   KADE_SCENARIO_STATE_DIR  where injectors record what they created (gitignored)
#
# Exit codes shared by every injector:
#   0  the planted symptom was observed
#   2  usage error or precondition not met (API down, missing tool, no seed data)
#   3  no symptom: the plant is fixed (or this is not the main-branch API)
#   4  the API accepted the injection but the worker-side symptom did not appear in time

set -euo pipefail

KADE_API_URL="${KADE_API_URL:-http://localhost:3001}"
# The published local default (.env.example) is only assumed for a loopback API; anything else
# must set PAYGATE_SECRET explicitly so a shared deployment is never signed with a known key.
if [ -z "${PAYGATE_SECRET:-}" ]; then
  case "$KADE_API_URL" in
  http://localhost* | http://127.0.0.1* | http://\[::1\]*) PAYGATE_SECRET="kade-local-paygate-secret" ;;
  *) PAYGATE_SECRET="" ;;
  esac
fi
SCENARIOS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KADE_SCENARIO_STATE_DIR="${KADE_SCENARIO_STATE_DIR:-$SCENARIOS_DIR/.state}"

# curl's HTTP status is written to a file (not a variable) so it survives `$(api …)` command
# substitution. Parallel jobs point API_STATUS_FILE at their own file before calling api.
API_STATUS_FILE="${API_STATUS_FILE:-$(mktemp -t kade-api-status.XXXXXX)}"
export API_STATUS_FILE

# Used by the injectors that source this file.
# shellcheck disable=SC2034
EXIT_SYMPTOM=0
EXIT_USAGE=2
# shellcheck disable=SC2034
EXIT_FIXED=3
# shellcheck disable=SC2034
EXIT_PENDING=4

log() { printf '[%s] %s\n' "${INJECTOR:-scenario}" "$*" >&2; }
die() {
  log "ERROR: $*"
  exit "$EXIT_USAGE"
}

# symptom <message> [json]  — the one line every lab and test looks for.
symptom() {
  printf 'SYMPTOM: %s\n' "$1"
  [ $# -gt 1 ] && printf 'RESULT: %s\n' "$2"
  return 0
}
no_symptom() {
  printf 'NO SYMPTOM: %s\n' "$1"
  [ $# -gt 1 ] && printf 'RESULT: %s\n' "$2"
  return 0
}

require_cmd() {
  for c in "$@"; do
    command -v "$c" >/dev/null 2>&1 || die "missing required tool: $c"
  done
}

# api <METHOD> <path> [json-body] [curl args...]
# Prints the response body; the HTTP status is available afterwards via `last_status`.
# Brand/user/role come from KADE_BRAND, KADE_USER, KADE_ROLE (set per call site).
api() {
  local method="$1" path="$2" body="${3:-}"
  shift 2
  [ $# -gt 0 ] && shift
  [ "${1:-}" = "--" ] && shift
  local tmp
  tmp="$(mktemp)"
  local args=(-sS -o "$tmp" -w '%{http_code}' -X "$method" "$KADE_API_URL$path"
    -H "X-Kade-Brand: ${KADE_BRAND:-lumen-home}"
    -H "X-Kade-User: ${KADE_USER:-customer-001@lumen-home.test}"
    -H "X-Kade-Role: ${KADE_ROLE:-customer}"
    -H 'Accept: application/json')
  if [ -n "$body" ]; then
    args+=(-H 'Content-Type: application/json' --data "$body")
  fi
  curl "${args[@]}" "$@" >"$API_STATUS_FILE" || echo 000 >"$API_STATUS_FILE"
  cat "$tmp"
  rm -f "$tmp"
}
last_status() { cat "$API_STATUS_FILE" 2>/dev/null || echo 000; }

require_api() {
  require_cmd curl jq
  local health
  health="$(api GET /health 2>/dev/null || true)"
  [ "$(last_status)" = "200" ] || die "API not reachable at $KADE_API_URL (GET /health → $(last_status)). Start it with: npm run dev"
  log "API ok: $(printf '%s' "$health" | jq -c . 2>/dev/null || echo "$health")"
}

# sign_body <raw-json>  → "sha256=<hex>" exactly as PayGate signs it.
sign_body() {
  require_cmd openssl
  [ -n "$PAYGATE_SECRET" ] || die "PAYGATE_SECRET is required when KADE_API_URL is not a loopback address ($KADE_API_URL)"
  printf 'sha256=%s' "$(printf '%s' "$1" | openssl dgst -sha256 -hmac "$PAYGATE_SECRET" | sed 's/^.* //')"
}

# post_webhook <event-json>  → HTTP status (body discarded). Signed with PAYGATE_SECRET.
post_webhook() {
  local body="$1" sig event_id
  sig="$(sign_body "$body")"
  event_id="$(printf '%s' "$body" | jq -r .event_id)"
  api POST /webhooks/payments "$body" -- -H "X-PayGate-Signature: $sig" -H "X-PayGate-Event-Id: $event_id" >/dev/null
  last_status
}

now_iso() { date -u +%Y-%m-%dT%H:%M:%SZ; }
# iso_hours_ago <n>  (GNU date on Linux, BSD date on macOS)
iso_hours_ago() {
  date -u -d "-$1 hours" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-"$1"H +%Y-%m-%dT%H:%M:%SZ
}
rand_hex() { od -An -N4 -tx1 /dev/urandom | tr -d ' \n'; }

# record <injector> <json>  — append what we created so lab-reset.sh can report it.
record() {
  mkdir -p "$KADE_SCENARIO_STATE_DIR"
  printf '%s\n' "$2" >>"$KADE_SCENARIO_STATE_DIR/$1.jsonl"
}

# customer_user <brand> <n>  → customer-007@lumen-home.test (seed-spec users.customers.rule)
customer_user() { printf 'customer-%03d@%s.test' "$2" "$1"; }

merchandiser_for() {
  case "$1" in
  lumen-home) printf 'maya@lumenhome.test' ;;
  trailhead-supply) printf 'lena@trailheadsupply.test' ;;
  *) die "unknown brand $1" ;;
  esac
}

# create_order <brand> <user> <sku> <qty> [sku qty ...]
# Cart → line(s) → checkout. Prints the CheckoutResult JSON (or an Error body); see last_status.
create_order() {
  local brand="$1" user="$2"
  shift 2
  local cart cart_id
  cart="$(KADE_BRAND="$brand" KADE_USER="$user" api POST /carts)"
  [ "$(last_status)" = "201" ] || {
    printf '%s' "$cart"
    return 0
  }
  cart_id="$(printf '%s' "$cart" | jq -r .id)"
  while [ $# -ge 2 ]; do
    KADE_BRAND="$brand" KADE_USER="$user" api POST "/carts/$cart_id/lines" "{\"sku\":\"$1\",\"quantity\":$2}" >/dev/null
    [ "$(last_status)" = "200" ] || {
      printf '{"code":"conflict","message":"addCartLine %s → %s"}' "$1" "$(last_status)"
      return 0
    }
    shift 2
  done
  local address='{"name":"Lab Customer","line1":"1 Fixture Way","city":"Testville","postalCode":"00000","country":"US"}'
  [ "$brand" = "trailhead-supply" ] && address='{"name":"Lab Customer","line1":"Fixturestraße 1","city":"Hamburg","postalCode":"20095","country":"DE"}'
  KADE_BRAND="$brand" KADE_USER="$user" api POST /checkout \
    "{\"cartId\":\"$cart_id\",\"email\":\"$user\",\"shippingAddress\":$address,\"idempotencyKey\":\"${INJECTOR:-scenario}-$(rand_hex)\"}"
}

# inventory_on_hand <brand> <sku>  → total onHand across warehouses via GET /admin/inventory
inventory_on_hand() {
  local brand="$1" sku="$2"
  KADE_BRAND="$brand" KADE_USER="$(merchandiser_for "$brand")" KADE_ROLE=merchandiser api GET /admin/inventory |
    jq --arg sku "$sku" '[.[] | select(.sku == $sku) | .onHand] | add // 0'
}

# inventory_available <brand> <sku>  → total available (onHand - reserved) via GET /admin/inventory
inventory_available() {
  local brand="$1" sku="$2"
  KADE_BRAND="$brand" KADE_USER="$(merchandiser_for "$brand")" KADE_ROLE=merchandiser api GET /admin/inventory |
    jq --arg sku "$sku" '[.[] | select(.sku == $sku) | .available] | add // 0'
}

# order_events <brand> <order-id>  → JSON array
order_events() {
  KADE_BRAND="$1" KADE_USER="$(merchandiser_for "$1")" KADE_ROLE=merchandiser api GET "/orders/$2/events"
}
