You are done when someone who was not in the room can see each of the following on your throwaway branch, without re-running anything.

1. **The policy is reviewable.** `.devin/hooks.v1.json` on your branch defines a `PreToolUse` entry for shell commands, a `PostToolUse` entry and a `Stop` entry, and every command it runs is a script committed in the repository (not an inline one-liner nobody can read).
2. **Allowed case evidenced.** An ordinary command (for example the test suite) and a reset against the lab database both run unchanged; the evidence shows exit 0 and the original input.
3. **Blocked case evidenced.** A reset or migration pointed at any other database is denied: the evidence shows exit code 2 and the reason text the agent receives, and the command never ran.
4. **Rewritten case evidenced.** A `psql` command is executed through the read-only wrapper instead of as typed; the evidence shows the original and the rewritten command side by side, and — if PostgreSQL is up — a write attempted through it failing with a read-only error while the row count is unchanged.
5. **Bad migration stopped.** After the `bad-migration` injector, `db/migrations/` gains no currency-nullable migration that reached the database, the audit entry names the patch and the reason, and the `Stop` hook refuses to let the session finish while the file is in the working tree.
6. **Timed-out case evidenced.** After the `slow-hook` injector you record what happened to the tool call (blocked, delayed or allowed), how long it took, and whether that is documented behaviour or something you observed.
7. **Malformed-config case evidenced.** After the `malformed-hooks` injector you record whether the guard still ran, state in one sentence whether the policy fails open or closed in that situation, and name the one change that would make the outcome safe.
8. **Matcher pitfall explained.** After the `matcher-glob` injector you show which tool names the broken matcher guards (if any) and the corrected matcher, with one sentence on the difference between a single pattern and a list of patterns.
9. **Audit trail.** One log file lists every allow, block and rewrite decision with a timestamp and the command; it is not committed.
10. **Articulation drill completed** with the voice coach (section 8), or against a timer if you work offline. Save the gap report next to your evidence; do not commit it.
11. **Clean exit.** `main` is untouched, the throwaway branch is not merged, and the reset commands in section 4 return the repository to the clean state.
