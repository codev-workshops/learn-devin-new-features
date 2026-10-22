---
trigger: always_on
---

# Kadé Commerce conventions

- Read the root `AGENTS.md` first; it carries the shared-file ownership table and the gate commands.
- Run `npm run gates` (test, lint, build, labs:build) before every commit. Python changes also need `pytest -q` and `ruff check` in the service directory.
- Never fix a planted defect (see `packages/contracts/seed-spec.yaml#planted_edge_cases`) on `main`. Remediation demos live on throwaway branches that are closed without merging.
- `packages/contracts/openapi.yaml`, `seed-spec.yaml` and `.devin/skills/articulation-base/` are frozen; propose changes in a PR description instead of editing them.
- Conventional-commit messages (`feat:`, `fix:`, `docs:`, `chore:`, …). One PR per task, no stacked PRs.
- Lab pages in `labs/` are promptless: no fenced block tagged `prompt` in learner-facing files.
