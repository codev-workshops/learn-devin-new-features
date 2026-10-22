Do not open this before you have finished the evidence table and the drill.

## Feature fit

The customer is asking for **enforcement at the tool call**, which is exactly what lifecycle hooks are: commands that Devin runs before and after each tool call, receive the event as JSON on stdin and decide by exit code. A rule in `AGENTS.md` or `.devin/rules/` is advice the model reads; a `PreToolUse` hook is code the harness runs whether or not the model agrees.

- **`PreToolUse` on `exec`** — exit `0` continues, exit `2` blocks and the reason (stderr, or `{"decision":"block","reason":…}` on stdout) is shown to the agent; any other exit code is logged and does **not** block.
- **`hookSpecificOutput.updatedInput`** — printed by a `PreToolUse` hook, it is merged into the tool's arguments, so `psql …` can be rewritten into `psql-ro.sh …` without the agent having to cooperate.
- **`PostToolUse`** — sees `tool_response` (`success`, `output`, `error`); the right place for the audit trail of what actually ran.
- **`Stop`** — can block the end of a turn with a reason; guard it with `stop_hook_active` so it cannot loop.
- **`matcher`** — a regex on `tool_name`, unanchored (`exec` means "contains exec"); `""` or omitted matches every tool. Since the 21 October 2026 release a matcher written as a list matches **any** entry, not only the first.

The whole of `.devin/hooks.v1.json` is the hooks object (no `"hooks"` wrapper key); the `/hooks` command in the Devin CLI lists what was loaded and from which file.

## Worked policy

The reference implementation lives in `labs/02-lifecycle-hooks/solution/` (outside `.devin/` on purpose, so nothing on `main` is enforced). Copy `solution/hooks.v1.json` to `.devin/hooks.v1.json` on your throwaway branch:

```json
{
  "PreToolUse": [
    { "matcher": "^exec$", "hooks": [{ "type": "command", "command": "node \"$DEVIN_PROJECT_DIR/labs/02-lifecycle-hooks/solution/pretool-guard.mjs\"", "timeout": 5 }] }
  ],
  "PostToolUse": [
    { "matcher": "^exec$", "hooks": [{ "type": "command", "command": "node \"$DEVIN_PROJECT_DIR/labs/02-lifecycle-hooks/solution/posttool-audit.mjs\"", "timeout": 5 }] }
  ],
  "Stop": [
    { "matcher": "", "hooks": [{ "type": "command", "command": "node \"$DEVIN_PROJECT_DIR/labs/02-lifecycle-hooks/solution/stop-check.mjs\"", "timeout": 5 }] }
  ]
}
```

- `pretool-guard.mjs` — blocks `db:seed --reset`, `lab:reset` and migrations unless the effective `DATABASE_URL` (inline assignment, else environment, else the Compose default) is the lab database; blocks `git apply`/`git am` of a patch whose Up migration contains destructive DDL, and `db:migrate` while such a migration is in `db/migrations/`; rewrites every `psql` into `psql-ro.sh` via `updatedInput`; **fails closed** — unreadable input is a block.
- `psql-ro.sh` — sets `default_transaction_read_only=on` through `PGOPTIONS`, so a `DELETE` fails with "cannot execute DELETE in a read-only transaction".
- `posttool-audit.mjs` / `.devin/hook-audit.log` — one JSON line per decision and per executed command (`*.log` is git-ignored).
- `stop-check.mjs` — refuses to stop while `db/migrations/*currency-nullable*.sql` is present; lets the second stop through.
- `simulate.mjs` — the offline replay; `hooks.test.mjs` is the evidence table as a Vitest suite (`npm test` in `labs/`).

## Worked prompt sequence

```prompt
Read the hooks overview and lifecycle-hooks pages of the Devin docs. On a new branch lab/02-<handle>, write .devin/hooks.v1.json with a PreToolUse hook on the exec tool only (anchored matcher) that runs a committed Node script. The script must exit 2 with a readable reason for any db:seed --reset, lab:reset or migration whose DATABASE_URL is not postgres://kade:kade@localhost:5432/kade, and must exit 2 if its own stdin is not valid JSON. Do not touch main or .devin/config.json.
```

```prompt
Extend the same script: when the command runs psql, print hookSpecificOutput.updatedInput with the command rewritten to call labs/02-lifecycle-hooks/solution/psql-ro.sh (or your own wrapper that sets default_transaction_read_only=on). Add a PostToolUse hook that appends the executed command and tool_response.success to .devin/hook-audit.log, and a Stop hook that blocks while db/migrations contains the currency-nullable migration, guarded by stop_hook_active.
```

```prompt
Now prove it. For each case — ordinary command, lab-DB reset, staging reset, psql read, psql DELETE, git apply scenarios/bad-migration.patch — run it, then show me the hook exit code, the reason or rewritten command, and the matching audit-log line in one table. Do not retry a blocked command another way.
```

```prompt
Replace .devin/hooks.v1.json with labs/02-lifecycle-hooks/injectors/malformed-hooks.v1.json, then slow-hook.v1.json, then matcher-glob.v1.json. For each, run the staging reset again (it must not reach any database — if the guard is not loaded, stop and tell me instead) and report what /hooks lists, what happened to the call and how long it took. Restore the reference file afterwards.
```

If you have no Devin CLI, the last two prompts become replay runs: `node labs/02-lifecycle-hooks/solution/simulate.mjs --config <file> --command '<cmd>'` prints the outcome, the exit code, the reason and the rewritten input.

## Expected evidence

| Case | Outcome | What proves it |
|---|---|---|
| `npm test` | allow | exit 0, input unchanged |
| `npm run db:seed -- --reset` (lab DB) | allow | exit 0 |
| `DATABASE_URL=…staging… npm run db:seed -- --reset` | block | exit 2, reason "targets … not the lab database" |
| `psql "$DATABASE_URL" -c "delete from carts"` | rewrite | `updatedInput.command` calls `psql-ro.sh`; PostgreSQL answers "read-only transaction"; cart count unchanged |
| `docker compose exec postgres psql … -c "delete …"` | rewrite | `-e PGOPTIONS='-c default_transaction_read_only=on'` is injected after `exec` (the host wrapper does not exist inside the container) |
| `psql -c 'SET default_transaction_read_only=off; …'` | block | exit 2; switching the transaction mode is refused |
| `git apply scenarios/bad-migration.patch` | block | exit 2, reason names the patch and "destructive DDL"; no migration file appears |
| malformed `hooks.v1.json` | guard not loaded → the call is **allowed** | `/hooks` (or the replay) shows no hooks; this is fail-open |
| slow hook (sleep 15, timeout 3) | killed after ~3 s, call **not blocked** | replay `outcome: timeout`; the docs do not specify this — record what the CLI did |
| `"matcher": "*exec*"` | guards nothing | `*exec*` is not a valid regex (nothing to repeat); `^exec$` or `["^exec$"]` is |

## Pitfalls

- **The matcher is a regex, not a glob.** `*exec*` is invalid; `mcp__neon__*` means "`mcp__neon_` followed by any number of `_`" and happens to work by accident; `edit` also matches `notebook_edit`. Anchor what you mean: `^exec$`, `^mcp__neon__.*`. A list (`["^exec$", "^write_to_process$"]`) matches any entry since 21 Oct 2026 — before that only the first entry counted, so older examples that relied on the list silently guarded one tool.
- **Exit 1 does not block.** A script that crashes (exit 1) or uses `process.exit(1)` for "deny" lets the command through. Only exit 2 or `decision: "block"` blocks.
- **Fail-open by construction.** A hooks file that does not parse, a missing interpreter or a timed-out hook all end with the guard not deciding. The policy can only fail closed *inside* the script (treat bad input as a block); a broken config file has to be caught before merge — validate it in CI or a pre-commit check.
- **Rewrite, don't block, the read path.** Blocking every `psql` makes Devin route around it (`docker compose exec postgres psql`, a Node one-off). Rewriting keeps the agent productive and is invisible to it; the guard regex must also catch `psql` after `exec`, `&&` and `;`.
- **A read-only default is not a read-only role.** `default_transaction_read_only=on` can be switched off by the SQL itself (`SET … = off`, `BEGIN READ WRITE`); the guard and wrapper refuse those strings in arguments, but SQL piped on stdin is invisible to both. Treat the hook as the agent-side layer and ask the DBA for a read-only role as the database-side one.
- **Parse the target like the client does.** Check every `DATABASE_URL=` in the command (the last one wins in the shell) and reject query parameters such as `?host=` that override the address libpq connects to.
- **Stop hooks can loop.** Always return early when `stop_hook_active` is true.
- **Hooks live on the branch.** Committing an enforcing `.devin/hooks.v1.json` to `main` changes every learner's session; keep it on the throwaway branch.

## Recovery moves

- Blocked yourself? The CLI reads the file at session start — fix the script, or move `.devin/hooks.v1.json` aside, and start a new session; `/hooks` confirms what is loaded.
- Guard not firing? Run `/hooks`, then add a temporary `PostToolUse` hook with `matcher: ""` that appends stdin to a file, to see the real `tool_name`.
- Rewrite not applied? `updatedInput` must sit inside `hookSpecificOutput` with `hookEventName: "PreToolUse"`, and the hook must exit 0.

## Model answers to the objections

- **Technical — "Isn't this just a lint rule?"** Acknowledge: both encode a policy. Boundary: a lint rule checks code someone wrote; a hook runs at the moment the agent calls the tool, on the actual command, and can refuse or rewrite it — there is nothing to lint in `npm run db:seed -- --reset`. Evidence: the staging reset was denied with exit 2 and the audit line; the `psql` delete was rewritten and failed read-only, with the row count unchanged. Offer: keep the lint rule for migrations in review *and* the hook for execution; they cover different moments.
- **Commercial / governance — "If the hook has a bug, are we locked out of our own database?"** Acknowledge: a policy that blocks everything is an outage. Boundary: hooks only govern the agent's tool calls, never a human's terminal, and they are read from a file on a branch — removing it and starting a new session restores the old behaviour. Evidence: the malformed-config injector showed the opposite risk (fail-open), and the slow hook was killed at its timeout rather than hanging the session. Offer: a CI check that parses `hooks.v1.json` and replays the evidence table on every PR, so a broken policy never merges, plus the audit log for the on-call engineer.
- **Follow-up the coach may ask — "So which is it, open or closed?"** Inside the script: closed (bad input → exit 2). Around the script (bad config, crash, timeout): open. Say both, then the CI check.

## Debrief

**Alternatives considered.** (a) A rule in `AGENTS.md` / `.devin/rules/` — cheapest, but advisory: the model can ignore or forget it. (b) Permissions in `.devin/config.json` (`deny: ["Bash(npm run db:seed*)"]`) — enforced and simple, but pattern-based on the command text: it cannot inspect `DATABASE_URL`, cannot rewrite, and cannot explain why. (c) Database-side controls (a read-only role for the agent, no network route to staging) — the strongest, and the right long-term answer, but they live outside the repo and take a DBA ticket. (d) Hooks — enforced, inspect the full input, rewrite, log, and live in the repo for review.

**When each would win.** (a) for style and conventions; (b) when a command is always forbidden regardless of arguments; (c) for production, always, alongside hooks; (d) when the decision depends on arguments or context and the customer wants evidence in the repo.

**Cost note.** Hooks add milliseconds per guarded tool call and no ACU of their own (command hooks run locally; `prompt` hooks would cost model calls). The lab is one session of roughly 3–6 ACU plus your verification; the reference scripts and replay are free to rerun.

**Self-score (offline path).** Accuracy 30 — exit codes, the rewrite, the regex matcher, open versus closed, the bad migration stopped with evidence. Structure 25 — Outcome → Evidence → Risk → Next action → Ask. Customer relevance 20 — the lost price-list edits and replayed orders, the 2 a.m. worker crash. Brevity and fluency 15 — framing within 60 s ± 5, fillers under 3 per minute. Recovery 10 — both objections answered acknowledge → boundary → evidence → offer.
