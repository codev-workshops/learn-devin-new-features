---
name: lab-cleanup
description: Return the repository to the clean starting state after a Harbourline lab — reverts injectors, discards lab-branch changes, deletes the throwaway branch and reseeds. Use when the learner says "clean up lab <nn>" or types @skills:lab-cleanup <nn>.
triggers: ["user"]
argument-hint: "<nn> [--db-down]"
---

# Clean up a lab

1. Run `bash scripts/lab.sh cleanup <nn>` from the repository root. It runs the lab's `inject.sh --revert`, discards working-tree changes (the learner's `labs/<nn>-*/*NOTES*.md` files are kept — they are uncommitted by design), checks out `main`, deletes every `lab<nn>/*` branch and runs `pnpm lab:reset -- <nn>`. Add `--db-down` to also stop Postgres.
2. Relay the summary. `working tree clean on main` is the expected last line; if it lists leftover paths, show them and ask the learner before touching anything else.
3. Never commit, merge or push lab work (criterion 10 in every lab). Lab branches are throwaway.
