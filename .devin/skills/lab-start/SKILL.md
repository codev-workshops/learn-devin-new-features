---
name: lab-start
description: Put the session VM in a Harbourline lab's starting state (install, Postgres, reseed, lab-specific reset steps from lab.json). Use when the learner types `@skills:lab-start <nn>` before starting a lab.
triggers: ["user"]
argument-hint: "<nn> [--force]"
---

# Start lab `$1`

Runs the same steps the lab page lists under "Starting state", via `pnpm lab:start -- <nn>` (`scripts/lab.mjs`, which reads `labs/<nn>-*/lab.json#scenarios.reset`).

1. If `$1` is not a two-digit lab number, ask the learner which lab (00–15) and stop.
2. Run `pnpm lab:start -- $1 --dry-run` and show the learner the plan.
3. Run `pnpm lab:start -- $1`.
   - Exit 3 means uncommitted changes. Show the listed files and ask the learner whether to discard them. Only re-run with `--force` after they say yes. Never stash, commit or push for them.
   - Any other non-zero exit: report the failing command and its last 20 lines. Do not retry blindly and do not edit lab files to make it pass.
4. Check the printed clean state yourself, for example with `git status --short` and `git branch --show-current`. Tell the learner in two or three sentences that the lab is ready, or what is not clean yet.
5. Stop there. Do not start the lab work, open the brief's answer or start the coach. The learner does that.

Never fix a planted defect while doing this (see `AGENTS.md`).
