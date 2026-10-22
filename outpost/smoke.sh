#!/usr/bin/env bash
# In-container smoke test for the Kadé outpost worker image. Exit 0 = every machine
# dependency the lab relies on is present and no outpost token is baked into the image.
#   docker run --rm --entrypoint bash kade-outpost-worker /usr/local/bin/kade-outpost-smoke
set -u
fail=0
check() { if eval "$2" >/dev/null 2>&1; then echo "ok   $1"; else echo "FAIL $1"; fail=1; fi; }
repo=/workspace/repos/learn-devin-new-features
check "git on PATH" "command -v git"
check "ffmpeg on PATH" "command -v ffmpeg"
check "node 22" "node -v | grep -q '^v22\\.'"
check "python3" "command -v python3"
check "DEVIN_CHROME_PATH executable" "test -x \"\${DEVIN_CHROME_PATH:-/nonexistent}\""
check "repo baked in at $repo" "test -f $repo/package.json && git -C $repo rev-parse HEAD"
check "repo dependencies installed" "test -d $repo/node_modules"
check "runs as non-root" "test \"\$(id -u)\" != 0"
check "no passwordless sudo" "! sudo -n true"
check "no outpost token in the image env" "test -z \"\${DEVIN_OUTPOSTS_TOKEN:-}\""
exit $fail
