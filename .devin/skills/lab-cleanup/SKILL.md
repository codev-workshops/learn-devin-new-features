---
name: lab-cleanup
description: Clean up after a Harbourline lab (revert injectors, remove lab branches and scratch files, reseed, stop Postgres) using the lab's own steps from lab.json. Use when the learner types `@skills:lab-cleanup <nn>` after finishing or abandoning a lab.
triggers: ["user"]
argument-hint: "<nn> [--keep-db] [--force]"
---

# Clean up lab `$1`

Runs `pnpm lab:cleanup -- <nn>` (`scripts/lab.mjs`). It replays the lab's reset steps from `labs/<nn>-*/lab.json#scenarios.reset`, including the ones marked "only if …", then runs `pnpm db:down` unless `--keep-db` is given.

1. If `$1` is not a two-digit lab number, ask the learner which lab (00–15) and stop.
2. Run `pnpm lab:cleanup -- $1 --dry-run`. Show the plan and point out the destructive steps (`git branch -D`, `git clean`, `rm -rf`, `git checkout main -- …`). Ask the learner to confirm, because their lab branches and scratch files will be deleted. If they want to keep something, they should push or copy it first.
3. After they confirm, run `pnpm lab:cleanup -- $1` and pass on any `--keep-db` they asked for.
   - Exit 3 means uncommitted changes. List them and only re-run with `--force` after the learner explicitly agrees to lose them: `--force` discards all uncommitted progress (`git switch --discard-changes`).
   - Any other failure: report the failing command and its last 20 lines.
4. Confirm the printed clean state with `git status --short` and `git branch --list`, then report in two or three sentences.

Never push, force-push or delete remote branches. Never fix a planted defect.
