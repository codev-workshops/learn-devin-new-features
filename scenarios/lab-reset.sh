#!/usr/bin/env bash
# lab-reset.sh <nn> — roll back lab-specific injectors after the database has been reseeded.
#
# Called by `pnpm lab:reset -- <nn>` (scripts/lab-reset.mjs) right after
# `pnpm db:seed -- --reset`. Everything the injectors create lives in the database and is
# already gone by the time this runs; what remains is file-level state and process knobs:
#
#   1. revert scenarios/bad-migration.patch if a lab applied it to the working tree
#   2. clear scenarios/.state (what each injector recorded for the debrief)
#   3. print the lab's starting state so the learner can check "clean"
#
#   4. reset the services/paygate-fake delivery knobs (PUT /knobs) when the service is reachable
#      at PAYGATE_URL (default http://localhost:3002); otherwise it just says so
set -euo pipefail
LAB="${1:-}"
[[ "$LAB" =~ ^[0-9]{2}$ ]] || {
  echo "usage: scenarios/lab-reset.sh <nn>" >&2
  exit 2
}
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
STATE_DIR="${HARBOURLINE_SCENARIO_STATE_DIR:-$HERE/.state}"
PAYGATE_URL="${PAYGATE_URL:-http://localhost:3002}"
log() { printf '[lab-reset %s] %s\n' "$LAB" "$*"; }

cd "$ROOT"
if git apply -R --check scenarios/bad-migration.patch >/dev/null 2>&1; then
  git apply -R scenarios/bad-migration.patch
  log "reverted scenarios/bad-migration.patch (db/migrations/*orders-currency-nullable.sql removed)"
else
  log "bad-migration.patch not applied — nothing to revert"
fi

if [ -d "$STATE_DIR" ] && [ -n "$(ls -A "$STATE_DIR" 2>/dev/null)" ]; then
  for f in "$STATE_DIR"/*.jsonl; do
    [ -f "$f" ] || continue
    log "clearing $(wc -l <"$f" | tr -d ' ') recorded run(s) of $(basename "$f" .jsonl)"
  done
  rm -rf "${STATE_DIR:?}"/*
else
  log "no injector state recorded"
fi

if curl -fsS -m 2 "$PAYGATE_URL/health" >/dev/null 2>&1; then
  knobs="$(curl -fsS -m 5 -X PUT "$PAYGATE_URL/knobs" -H 'Content-Type: application/json' \
    --data '{"duplicate":false,"outOfOrder":false,"delayMs":0,"gapMs":0}' 2>/dev/null || echo '{}')"
  log "paygate-fake knobs reset at $PAYGATE_URL: $knobs"
else
  log "paygate-fake not reachable at $PAYGATE_URL — knobs untouched (they live in that process; restart it if it was started with --duplicate/--out-of-order/--delay)"
fi

case "$LAB" in
02) log "starting state: .devin/hooks.v1.json is {} on main; bad-migration.patch is NOT applied; no db/migrations file mentions currency-nullable" ;;
05) log "starting state: seed-spec dataset; LH-LAMP-03 on_hand = 3; no scenario orders. Plants stay in place — never fix them on main" ;;
07) log "starting state: 12 pending webhooks in the inbox (6 fresh, 3 duplicates, 2 late, 1 failed); paygate-fake knobs all off" ;;
09) log "starting state: seed-spec dataset, both brands; no audit branches checked out (git branch --list 'audit/*')" ;;
12) log "starting state: LH-LAMP-03 on_hand = 3, no negative inventory, no Lamp Week orders beyond the seed; fixtures/mcp shim serves the 02:10 incident; paygate-fake knobs all off" ;;
15) log "starting state: seed-spec dataset; every injector available; no scenario orders; bad-migration.patch not applied" ;;
*) log "no lab-specific steps for lab $LAB — database reset only" ;;
esac
log "done — verify with: git status --short (clean) and GET \${HARBOURLINE_API_URL:-http://localhost:3001}/admin/inventory?belowSafety=true"
