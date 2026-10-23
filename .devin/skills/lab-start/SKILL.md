---
name: lab-start
description: Start a Harbourline lab in one step — brings the stack up, resets the lab, creates the throwaway branch, applies the lab's injectors and prints the coach command. Use when the learner says "start lab <nn>" or types @skills:lab-start <nn> [handle].
triggers: ["user"]
argument-hint: "<nn> [handle]"
---

# Start a lab

Arguments: the two-digit lab number and, optionally, the learner's handle (default: the git user name).

1. Run `bash scripts/lab.sh start <nn> --handle <handle> --no-open` from the repository root and wait for it to finish. It installs, starts Postgres, builds, migrates, seeds, renders the lab pages, runs `lab:reset`, creates `lab<nn>/<handle>`, applies every injector listed in `labs/<nn>-*/lab.json` and creates the uncommitted notes file. Only the step summary is printed; full output is in `.lab/logs/`.
2. If it prints `Unclean state detected — running cleanup first`, tell the learner what was found (branch or changed paths) — the script already cleaned up and continued.
3. If a step fails the script shows the failing command's last 25 lines. Report that verbatim with the log path; do not retry blindly and do not change repository files to make it pass.
4. Open `labs/<nn>-*/index.html` in the browser for the learner, then relay the `Ready` block: lab page, branch, notes file, injected files, coach command, cleanup command.
5. Stop there. Do not solve the lab, do not fix a planted defect, do not commit or push anything on the lab branch.

Articulation coach: the learner starts it with `@skills:coach-<nn>-<slug> <handle>` and a voice call. Voice calls exist only in Devin Cloud sessions — not in the desktop app or the CLI — so if this skill runs anywhere else, say so and point the learner to a Cloud session for the drill. `pnpm coach:dryrun -- <nn>` is the scripted dry run and works everywhere.

When done, the learner runs `@skills:lab-cleanup <nn>` (or `scripts/lab.sh cleanup <nn>`).
