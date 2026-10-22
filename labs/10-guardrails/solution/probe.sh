#!/usr/bin/env bash
# Observer path for lab 10: run inside a Devin session (no admin rights needed) to see
# which destinations the governing profile lets this machine reach. Read-only; sends
# one HEAD request per host and prints reachable/blocked. HTTP 403/407 counts as blocked
# because an egress proxy denying a destination answers that way.
set -u
HOSTS=${*:-"registry.npmjs.org api.sandbox.paygate.example pypi.org files.pythonhosted.org api.github.com example.com"}
for h in $HOSTS; do
  code=$(curl -sS -o /dev/null -m 6 -I -w '%{http_code}' "https://$h/" 2>/dev/null)
  case "$code" in
    "" | 000) echo "blocked    $h" ;;
    403 | 407) echo "blocked    $h (HTTP $code, proxy or policy denial)" ;;
    *) echo "reachable  $h (HTTP $code)" ;;
  esac
done
