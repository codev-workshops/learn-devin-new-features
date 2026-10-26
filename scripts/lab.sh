#!/usr/bin/env bash
# scripts/lab.sh — full lab session: bring-up, throwaway branch, injectors, notes; and its cleanup.
#
#   pnpm lab:session -- start   <nn> [--handle <h>] [--no-injectors] [--no-db] [--no-open]
#   pnpm lab:session -- cleanup <nn> [--no-db] [--db-down]
#   pnpm lab:session -- status  <nn>
#
# The lab's own steps (lab.json#scenarios.reset) come from `pnpm lab:start|lab:cleanup` (scripts/lab.mjs).
# Works with the macOS system bash (3.2) and Linux; needs Node 22 (nvm is picked up
# automatically), pnpm 10 via corepack and Docker for the database steps.
# Only the step summary is printed; full command output goes to .lab/logs/.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ---------------------------------------------------------------- output helpers
if [ -t 1 ] && [ "${NO_COLOR:-}" = "" ]; then
  C_H=$'\033[1;33m'; C_OK=$'\033[1;32m'; C_WARN=$'\033[1;33m'; C_ERR=$'\033[1;31m'; C_DIM=$'\033[2m'; C_0=$'\033[0m'
else
  C_H=""; C_OK=""; C_WARN=""; C_ERR=""; C_DIM=""; C_0=""
fi
head_() { printf '\n%s▸ %s%s\n' "$C_H" "$*" "$C_0"; }
ok()    { printf '  %s✔%s %s\n' "$C_OK" "$C_0" "$*"; }
info()  { printf '  %s·%s %s\n' "$C_DIM" "$C_0" "$*"; }
warn()  { printf '  %s⚠ %s%s\n' "$C_WARN" "$*" "$C_0"; }
fail()  { printf '  %s✖ %s%s\n' "$C_ERR" "$*" "$C_0" >&2; [ -n "${LOG:-}" ] && printf '  %sfull log: %s%s\n' "$C_DIM" "$LOG" "$C_0" >&2; exit 1; }
usage() {
  sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'
  exit 2
}

# `step "label" cmd args…` — run quietly, print one line, show the log tail on failure.
step() {
  local label="$1"; shift
  local t0; t0=$(date +%s)
  [ -t 1 ] && printf '%s  … %s%s\r' "$C_DIM" "$label" "$C_0"
  if "$@" >>"$LOG" 2>&1; then
    [ -t 1 ] && printf '\033[K'
    ok "$label $C_DIM($(( $(date +%s) - t0 ))s)$C_0"
  else
    printf '  %s✖ %s%s\n' "$C_ERR" "$label" "$C_0" >&2
    printf '%s' "$C_DIM" >&2; tail -n 25 "$LOG" | sed 's/^/    │ /' >&2; printf '%s' "$C_0" >&2
    fail "step failed — fix the cause above and rerun"
  fi
}
# Same, but captures stdout so the caller can grep it. Sets $OUT.
step_out() {
  local label="$1"; shift
  local t0; t0=$(date +%s)
  if OUT=$("$@" 2>>"$LOG"); then
    printf '%s\n' "$OUT" >>"$LOG"
    ok "$label $C_DIM($(( $(date +%s) - t0 ))s)$C_0"
  else
    printf '%s\n' "$OUT" >>"$LOG"
    printf '  %s✖ %s%s\n' "$C_ERR" "$label" "$C_0" >&2
    tail -n 25 "$LOG" | sed 's/^/    │ /' >&2
    fail "step failed — fix the cause above and rerun"
  fi
}

# ---------------------------------------------------------------- arguments
[ "${1:-}" = "--" ] && shift  # pnpm passes the separator through
CMD="${1:-}"; [ $# -gt 0 ] && shift
NN=""; HANDLE="${LAB_HANDLE:-}"; NO_INJ=0; NO_DB=0; NO_OPEN=0; DB_DOWN=0
while [ $# -gt 0 ]; do
  case "$1" in
    --) ;;
    --handle) HANDLE="${2:-}"; shift ;;
    --handle=*) HANDLE="${1#--handle=}" ;;
    --no-injectors) NO_INJ=1 ;;
    --no-db) NO_DB=1 ;;
    --no-open) NO_OPEN=1 ;;
    --db-down) DB_DOWN=1 ;;
    -h|--help) usage ;;
    [0-9]) NN="0$1" ;;
    [0-9][0-9]) NN="$1" ;;
    *) echo "unknown argument: $1" >&2; usage ;;
  esac
  shift
done
case "$CMD" in start|cleanup|status) ;; *) usage ;; esac
[ -n "$NN" ] || { echo "lab number missing (e.g. 01)" >&2; usage; }

LAB_DIR=$(ls -d "labs/$NN"-*/ 2>/dev/null | head -n 1 | sed 's:/$::')
[ -n "$LAB_DIR" ] && [ -f "$LAB_DIR/lab.json" ] || { echo "no lab $NN under labs/" >&2; exit 2; }
labjson() { node -p "const j=JSON.parse(require('fs').readFileSync('$LAB_DIR/lab.json','utf8')); $1" 2>/dev/null; }
SLUG=$(labjson 'j.slug'); TITLE=$(labjson 'j.title')
INJECT_SH="$LAB_DIR/injectors/inject.sh"

mkdir -p .lab/logs
LOG="$ROOT/.lab/logs/$CMD-$NN-$(date +%Y%m%d-%H%M%S).log"
: >"$LOG"

# ---------------------------------------------------------------- preflight
node_ok() { command -v node >/dev/null 2>&1 && [ "$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null)" = "22" ]; }
ensure_node() {
  if ! node_ok; then
    local f
    for f in "${NVM_DIR:-$HOME/.nvm}/nvm.sh" /opt/homebrew/opt/nvm/nvm.sh /usr/local/opt/nvm/nvm.sh; do
      if [ -s "$f" ]; then
        # shellcheck disable=SC1090
        . "$f" --no-use >>"$LOG" 2>&1 || true
        nvm use 22 >>"$LOG" 2>&1 || true
        break
      fi
    done
  fi
  node_ok || fail "Node 22 is required (found: $(node -v 2>/dev/null || echo none)). Install with: nvm install 22"
}
ensure_pnpm() {
  if ! command -v pnpm >/dev/null 2>&1; then corepack enable >>"$LOG" 2>&1 || true; fi
  command -v pnpm >/dev/null 2>&1 || fail "pnpm not found. Run: corepack enable   (Node 22 ships corepack)"
  local major; major=$(pnpm --version 2>/dev/null | cut -d. -f1)
  [ "${major:-0}" -ge 10 ] || fail "pnpm 10 is required (found $(pnpm --version)). Run: corepack enable"
}
DOCKER=0
check_docker() {
  if [ "$NO_DB" = 1 ]; then return; fi
  if docker info >/dev/null 2>&1; then DOCKER=1; else
    warn "Docker is not running — skipping the database steps (db:up, migrate, seed, lab:start/lab:cleanup)."
    warn "Start Docker Desktop (macOS) or the Docker daemon and rerun for the full stack."
    NO_DB=1
  fi
}
check_database_url() {
  # lab:reset / db:seed truncate and reseed whatever DATABASE_URL names; only ever run them locally.
  # Effective value, same precedence as services/api/src/config.ts: the environment wins, otherwise
  # the repo-root .env (the API never overrides variables that are already set).
  local src=environment u="${DATABASE_URL:-}" host
  if [ -z "$u" ] && [ -f .env ]; then
    src=.env
    u=$(sed -n 's/^[[:space:]]*\(export[[:space:]]\{1,\}\)\{0,1\}DATABASE_URL=//p' .env | tail -n 1 | tr -d '"'"'"' ')
  fi
  [ -n "$u" ] || return 0
  host=$(printf '%s' "$u" | sed -E 's#^[a-z]+://([^@/]*@)?([^:/?]+).*#\2#')
  case "$host" in localhost|127.0.0.1|::1|postgres|db) return 0 ;; esac
  fail "DATABASE_URL ($src) points at '$host' — refusing to reset a non-local database. Point it at localhost first."
}
preflight() {
  head_ "Preflight"
  ensure_node; ensure_pnpm; check_docker
  [ "$NO_DB" = 1 ] || check_database_url
  local d="Docker not used"; [ "$DOCKER" = 1 ] && d="Docker running"
  ok "Node $(node -v) · pnpm $(pnpm --version) · $d"
}

# ---------------------------------------------------------------- state
default_branch() {
  if git show-ref -q --verify refs/heads/main; then echo main
  else git symbolic-ref -q --short refs/remotes/origin/HEAD 2>/dev/null | sed 's:^origin/::' || echo main; fi
}
# Paths the learner keeps between runs: per-lab notes (uncommitted by design) and our logs.
NOTES_GLOB='labs/*/*NOTES*.md'
dirty_paths() { git status --porcelain | grep -v -E ' labs/[0-9]{2}-[^/]+/[A-Z0-9.-]*NOTES[A-Za-z0-9.-]*\.md$' | grep -v -E ' \.lab/' || true; }
unclean_reasons() {
  local br; br=$(git branch --show-current 2>/dev/null || true)
  case "$br" in lab[0-9][0-9]/*) echo "on lab branch '$br'" ;; esac
  local dp; dp=$(dirty_paths)
  if [ -n "$dp" ]; then
    echo "working tree has $(printf '%s\n' "$dp" | wc -l | tr -d ' ') changed path(s): $(printf '%s\n' "$dp" | sed 's/^...//' | head -n 3 | tr '\n' ' ')"
  fi
}
notes_file() {
  local n; n=$(grep -o -E 'labs/[0-9]{2}-[a-z0-9-]+/[A-Z0-9-]+NOTES\.md' "$LAB_DIR/criteria.md" 2>/dev/null | head -n 1 || true)
  [ -n "$n" ] && { echo "$n"; return; }
  echo "$LAB_DIR/$(printf '%s' "$SLUG" | tr '[:lower:]' '[:upper:]')-NOTES.md"
}
handle_() {
  local h="$HANDLE"
  [ -n "$h" ] || h=$(git config user.name 2>/dev/null || true)
  [ -n "$h" ] || h="${USER:-learner}"
  printf '%s' "$h" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9\n' '-' | sed 's/^-*//; s/-*$//; s/--*/-/g'
}

# ---------------------------------------------------------------- cleanup
do_cleanup() {
  head_ "Cleanup — Lab $NN"
  if [ -x "$INJECT_SH" ] || [ -f "$INJECT_SH" ]; then
    step_out "inject.sh --revert" bash "$INJECT_SH" --revert
    printf '%s' "$OUT" | grep -q '^reverted$' || warn "inject.sh did not print 'reverted' (see log)"
  fi
  local kept; kept=$(git status --porcelain | grep -E ' labs/[0-9]{2}-[^/]+/[A-Z0-9.-]*NOTES' | sed 's/^...//' | tr '\n' ' ' || true)
  # A notes file the learner has `git add`ed would be deleted by reset --hard: unstage it first so it survives as untracked.
  local staged_notes; staged_notes=$(git diff --cached --name-only --diff-filter=A -- "$NOTES_GLOB" 2>/dev/null || true)
  if [ -n "$staged_notes" ]; then
    # shellcheck disable=SC2086
    git reset -q -- $staged_notes >>"$LOG" 2>&1 || true
    info "unstaged notes file(s) so they are kept: $(printf '%s' "$staged_notes" | tr '\n' ' ')"
  fi
  if [ -n "$(dirty_paths)" ]; then
    # Nothing is thrown away: staged, unstaged and untracked changes go to a stash (notes files stay in place).
    local msg="lab:session cleanup $NN $(date +%Y-%m-%d-%H%M%S)"
    step "stash working-tree changes${kept:+ (kept: $kept)}" git stash push -u -q -m "$msg" -- . ":(exclude)$NOTES_GLOB"
    info "restore later with: git stash list  →  git stash pop   ($msg)"
  fi
  step "reset working tree" sh -c "git reset -q --hard && git clean -fdq -e '$NOTES_GLOB' -e '.lab/'"
  local def; def=$(default_branch)
  local cur; cur=$(git branch --show-current 2>/dev/null || true)
  [ "$cur" = "$def" ] || step "git checkout $def" git checkout -q "$def"
  case "$cur" in
    lab$NN/*) step "delete throwaway branch $cur" git branch -D "$cur" ;;
  esac
  local others; others=$(git for-each-ref --format='%(refname:short)' "refs/heads/lab$NN/" | tr '\n' ' ')
  [ -z "$others" ] || warn "other lab$NN/* branches left in place (delete by hand if unwanted): $others"
  if [ "$NO_DB" = 0 ]; then
    step "pnpm lab:cleanup -- $NN --keep-db --force" pnpm lab:cleanup -- "$NN" --keep-db --force
    [ "$DB_DOWN" = 1 ] && step "pnpm db:down" pnpm db:down
  fi
  local left; left=$(dirty_paths)
  if [ -z "$left" ]; then ok "working tree clean on $(git branch --show-current)"; else
    warn "paths still changed after cleanup:"; printf '%s\n' "$left" | sed 's/^/      /'
  fi
}

# ---------------------------------------------------------------- start
do_start() {
  local reasons; reasons=$(unclean_reasons)
  if [ -n "$reasons" ]; then
    head_ "Unclean state detected — running cleanup first"
    printf '%s\n' "$reasons" | while IFS= read -r r; do warn "$r"; done
    do_cleanup
  fi

  head_ "Install and build"
  step "pnpm install" pnpm install --frozen-lockfile
  [ "$NO_DB" = 0 ] && step "pnpm db:up (PostgreSQL 16 via Docker)" pnpm db:up
  step "pnpm build" pnpm build
  [ "$NO_DB" = 0 ] && step "pnpm db:migrate && pnpm db:seed" sh -c "pnpm db:migrate && pnpm db:seed"
  step "pnpm labs:build" pnpm labs:build

  head_ "Lab $NN starting state"
  [ "$NO_DB" = 0 ] && step "pnpm lab:start -- $NN --force" pnpm lab:start -- "$NN" --force
  local h; h=$(handle_)
  local br="lab$NN/$h"
  step "throwaway branch $br" git checkout -q -b "$br"
  INJECTED=""
  if [ "$NO_INJ" = 0 ] && [ -f "$INJECT_SH" ]; then
    local names; names=$(labjson '(j.injectors||[]).map(i=>i.name).join(" ")')
    local n
    for n in $names; do
      step_out "injector $n" bash "$INJECT_SH" "$n"
      local p; p=$(printf '%s\n' "$OUT" | sed -n 's/^injected: \([^ ]*\).*/\1/p' | head -n 1)
      if [ -n "$p" ] && [ -e "$p" ]; then info "→ $p"; INJECTED="$INJECTED $p"; else warn "could not confirm what '$n' wrote (see log)"; fi
    done
  elif [ "$NO_INJ" = 0 ]; then
    info "this lab has no inject.sh — its injectors are applied as described on the lab page"
  fi
  local notes; notes=$(notes_file)
  if [ ! -f "$notes" ]; then
    printf '# Lab %s notes — %s\n\nUncommitted by design (criterion: never commit lab work).\n' "$NN" "$TITLE" >"$notes"
  fi
  ok "notes file $notes $C_DIM(uncommitted)$C_0"

  local page="$LAB_DIR/index.html"
  if [ "$NO_OPEN" = 0 ]; then
    if [ "$(uname)" = Darwin ]; then open "$page" >>"$LOG" 2>&1 || true
    elif [ -n "${DISPLAY:-}" ] && command -v xdg-open >/dev/null 2>&1; then xdg-open "$page" >>"$LOG" 2>&1 || true; fi
  fi

  head_ "Ready — Lab $NN: $TITLE"
  printf '  %-10s %s\n' "Lab page" "$ROOT/$page"
  printf '  %-10s %s %s\n' "Branch" "$br" "${C_DIM}(throwaway — never commit or merge lab work)$C_0"
  printf '  %-10s %s\n' "Notes" "$notes"
  [ -n "$INJECTED" ] && printf '  %-10s%s\n' "Injected" "$INJECTED"
  printf '  %-10s @skills:coach-%s-%s %s %s\n' "Coach" "$NN" "$SLUG" "$h" "${C_DIM}(voice call — Devin Cloud only)$C_0"
  printf '  %-10s pnpm lab:session -- cleanup %s\n' "Cleanup" "$NN"
  printf '  %-10s %s\n' "Log" "$LOG"
}

do_status() {
  head_ "Status — Lab $NN"
  info "branch: $(git branch --show-current 2>/dev/null || echo '?')"
  local r; r=$(unclean_reasons)
  if [ -z "$r" ]; then ok "clean"; else printf '%s\n' "$r" | while IFS= read -r x; do warn "$x"; done; fi
  if docker info >/dev/null 2>&1; then ok "Docker running"; else info "Docker not running"; fi
}

printf '%sHarbourline%s · Lab %s — %s\n' "$C_H" "$C_0" "$NN" "$TITLE"
case "$CMD" in
  start)   preflight; do_start ;;
  cleanup) preflight; do_cleanup ;;
  status)  do_status ;;
esac
