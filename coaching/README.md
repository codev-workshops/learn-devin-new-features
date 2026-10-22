# Coaching progress branch

Long-lived branch `coaching` (Decision 13a): **never merged into `main`**. One directory per learner:

```
coaching/<handle>/index.md                 one row per coach run (source of truth for trends)
coaching/<handle>/progress/<nn>/<run>.json the coach's report (labs/coach-report.schema.json)
coaching/aggregate.mjs                     record runs, render trend tables, preflight lookup
```

## After a coach run (the learner starts every run manually; no Automations, no schedules)

```
git fetch origin coaching && git worktree add .coaching coaching   # or: git worktree add -b coaching .coaching origin/coaching
cd .coaching
node coaching/aggregate.mjs --record <handle> <path/to/report.json>
node coaching/aggregate.mjs --check <handle>
git add coaching/<handle> && git commit -m "chore(coaching): <handle> lab <nn> run <run_at>" && git push origin coaching
cd .. && git worktree remove .coaching
```

Dry-run mode skips the push (base protocol §6) and only prints the path it would have written.

## Preflight in a later session (read the previous run without checking out the branch)

```
git fetch origin coaching
git show origin/coaching:coaching/aggregate.mjs > /tmp/aggregate.mjs
node /tmp/aggregate.mjs --ref origin/coaching --previous <handle> <nn>   # feeds previous_run_comparison
node /tmp/aggregate.mjs --ref origin/coaching <handle>                   # full trend table
```

`--previous` prints `no previous run for <handle> on lab <nn>` for a first run.

## Sample learner

`coaching/sample/` holds six runs recorded from the committed lab 00, 05 and 12 dry-run reports
(off-track → mediocre → strong on lab 00), so `node coaching/aggregate.mjs sample` has a trend to show.

## Note on the base protocol

`.devin/skills/articulation-base/SKILL.md` §6 still describes per-learner branches
`coaching/<learner-slug>` with `progress/<nn>/<run_at>.json`. Git cannot hold a `coaching` branch and
`coaching/<x>` branches at once, so Decision 13a's single branch uses `coaching/<handle>/` directories
instead. Updating the frozen base skill is proposed to the parent (W5-coach PR).
