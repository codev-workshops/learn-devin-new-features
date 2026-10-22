#!/usr/bin/env bash
# Observer path for lab 10: run inside a Devin session (no admin rights needed) to see
# which destinations the governing profile lets this machine reach. Read-only; sends
# one HEAD request per host and prints reachable/blocked.
set -u
HOSTS=${*:-"registry.npmjs.org api.sandbox.paygate.example pypi.org files.pythonhosted.org api.github.com example.com"}
for h in $HOSTS; do
  code=$(curl -sS -o /dev/null -m 6 -I -w '%{http_code}' "https://$h/" 2>/dev/null)
  if [ -n "$code" ] && [ "$code" != "000" ]; then echo "reachable  $h (HTTP $code)"; else echo "blocked    $h"; fi
done
