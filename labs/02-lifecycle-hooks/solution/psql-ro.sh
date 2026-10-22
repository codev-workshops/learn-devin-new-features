#!/usr/bin/env bash
# Read-only psql wrapper: every transaction is READ ONLY, so INSERT/UPDATE/DELETE/DDL fail
# with "cannot execute ... in a read-only transaction". The PreToolUse hook routes psql here.
set -euo pipefail
export PGOPTIONS="${PGOPTIONS:-} -c default_transaction_read_only=on"
exec psql --set ON_ERROR_STOP=1 "$@"
