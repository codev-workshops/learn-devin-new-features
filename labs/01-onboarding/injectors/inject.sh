#!/usr/bin/env bash
# Lab 01 edge-case injectors. Run on a throwaway branch; `--revert` restores the starting state.
#   bash labs/01-onboarding/injectors/inject.sh contradictory-agents|stale-setup-doc|missing-paygate-secret|--revert
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/../../.." && pwd)"
targets=("services/api/src/AGENTS.md" "docs/SETUP.md" "labs/01-onboarding/.env.lab")

case "${1:-}" in
  contradictory-agents)
    cp "$here/contradictory-agents.AGENTS.md" "$root/services/api/src/AGENTS.md"
    echo "injected: services/api/src/AGENTS.md" ;;
  stale-setup-doc)
    cp "$here/stale-setup-doc.SETUP.md" "$root/docs/SETUP.md"
    echo "injected: docs/SETUP.md" ;;
  missing-paygate-secret)
    cp "$here/missing-paygate-secret.env" "$root/labs/01-onboarding/.env.lab"
    echo "injected: labs/01-onboarding/.env.lab (source it in the shell that starts paygate-fake)" ;;
  --revert)
    for t in "${targets[@]}"; do rm -f "$root/$t"; done
    echo "reverted" ;;
  *)
    echo "usage: inject.sh contradictory-agents|stale-setup-doc|missing-paygate-secret|--revert" >&2
    exit 2 ;;
esac
