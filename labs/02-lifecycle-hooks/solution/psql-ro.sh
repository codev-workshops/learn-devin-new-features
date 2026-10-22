#!/usr/bin/env bash
# Read-only psql wrapper: every transaction is READ ONLY, so INSERT/UPDATE/DELETE/DDL fail
# with "cannot execute ... in a read-only transaction". The PreToolUse hook routes psql here.
set -euo pipefail
# Defence in depth for -c/-f arguments; SQL piped on stdin cannot be inspected here, which is why
# the long-term control is a read-only database role, not this wrapper.
for arg in "$@"; do
  sql="$arg"
  [ -f "$arg" ] && sql="$(cat -- "$arg")"
  if printf '%s' "$sql" | grep -qiE 'transaction_read_only|read[[:space:]]+write|session[[:space:]]+characteristics'; then
    echo "psql-ro: refusing SQL that changes the read-only transaction mode" >&2
    exit 2
  fi
done
export PGOPTIONS="${PGOPTIONS:-} -c default_transaction_read_only=on"
exec psql --set ON_ERROR_STOP=1 "$@"
