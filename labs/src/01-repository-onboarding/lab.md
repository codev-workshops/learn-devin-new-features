---
number: 1
slug: repository-onboarding
title: Repository onboarding without a prompt
feature: AGENTS.md, rules, skills and repository setup
level: foundation
status: pilot
durationMinutes: 60
lastVerified: 2026-10-22
summary: Get Devin productive in an unfamiliar multi-service repository, then explain to the customer what Devin will and will not do on its own.
fallback: Everything in this lab runs on a local clone. No admin rights or integrations are needed.
docs:
  - title: AGENTS.md
    url: https://docs.devin.ai/onboard-devin/agents-md
  - title: Devin CLI extensibility overview
    url: https://docs.devin.ai/cli/extensibility/index
  - title: Rules and AGENTS.md
    url: https://docs.devin.ai/cli/extensibility/rules
---

## Goal

Start from a repository you have never seen, find out how it builds and tests, and leave it in a state where any Devin session (cloud, Desktop or CLI) follows the team's conventions without being told. You then explain the instruction hierarchy to a customer in plain language.

## Prerequisites

- A clone of this repository on the base branch, Node.js 20 and Docker.
- Database reset: `docker compose up -d postgres && npm run db:migrate && npm run db:seed -- --reset`.
- Optional: Devin CLI or Devin Desktop to compare how local sessions load the same files.

## Customer scenario

> “We are a workforce platform. New engineers take two weeks before they can ship safely in this repo, and Devin sessions keep making the same mistakes: queries that forget the tenant, frontend code that bypasses our API layer. I want Devin to behave like a senior engineer on this team from the first minute. What would you set up, and how would we know it worked?” — Head of Platform, Acme Logistics

## Acceptance criteria

- The learner states the build, test and lint commands for every package, and has run them.
- The learner names the three most important conventions a new contributor must follow, with the file that proves each.
- The learner explains which instructions load always, which load only for some files, and which load only on demand.
- A fresh Devin session, given a small change request, follows the tenant-isolation convention without being reminded.

## Expected evidence

- Terminal output of the passing test, lint and build commands.
- A short list of conventions, each linked to a file path.
- One Devin session link where the agent applied a convention it was not told about in the prompt.

## Guided version

1. Read `README.md` and `AGENTS.md` at the root. List the packages and their commands.
2. Run `npm install`, `npm test`, `npm run lint` and `npm run build`. Note anything slow or flaky.
3. Open `.devin/` and identify which files are rules, skills, agents, hooks and MCP configuration. Use the extensibility overview to check what each one does.
4. Pick one convention (for example, every query is scoped by `tenant_id`) and find where it is written down and where the code enforces it.
5. Start a Devin session with a small, realistic change request that touches the API. Check whether the result follows the convention without you asking.

## Unguided version

Use the customer scenario only. Plan out loud for two minutes, then drive Devin to the acceptance criteria. Do not open the Guided version.

:::answer A strong first prompt
“This is a multi-tenant workforce platform I have not worked in. Before changing anything, map the repository: list each package with its install, test, lint and build commands, run them, and report failures. Then read AGENTS.md and everything under .devin/ and summarise which instructions are always on, which are scoped by path, and which are on-demand skills or agents. Finish with the three conventions a new engineer is most likely to break, each with the file that defines it and the code that enforces it. Do not modify files.”

Why it works: it separates discovery from change, asks for verified commands rather than guessed ones, forces the instruction hierarchy into the answer, and ends with evidence the customer can check.
:::

:::answer Follow-up that proves the setup
Ask for a small change such as “add a `GET /api/projects/:id` endpoint” without mentioning tenants. A good result scopes the query by `tenant_id`, validates `:id` with Joi, returns `404` for other tenants' projects, and adds a test. If it does not, the convention is not discoverable enough: improve `AGENTS.md` or add a path-scoped rule, then repeat.
:::

## Edge cases and failure injection

- **Contradictory docs:** add a line to `services/api/AGENTS.md` that contradicts the root file (for example “use string-built SQL for speed”). Ask Devin which instruction wins and why. The answer should flag the conflict instead of silently picking one.
- **Stale command:** rename the `lint` script in one package. Devin should report the failure and find the real command instead of claiming success.
- **Missing database:** stop Postgres and run the API. The learner should distinguish the unit tests (in-memory database) from the running service (needs Postgres).
- **Oversized instructions:** only the first 16 KiB of each `AGENTS.md` is loaded automatically. Discuss what you would move into skills or path-scoped rules if the file grew past that.

## Facilitator notes

:::answer Facilitator notes
- Timebox discovery to 20 minutes. Strong learners verify commands before they read the rules; weaker ones summarise files without running anything.
- Probe: “If the customer only has Devin cloud, which of these files still matter?” Root `AGENTS.md` and repository knowledge matter everywhere; `.devin/hooks.v1.json`, CLI rules and `mcp_config.json` are read by Devin CLI and Desktop sessions.
- Common mistake: treating every markdown file as always-on. Path-scoped rules and skills only load when relevant.
- Debrief question: what would you put in a blueprint or setup step versus in AGENTS.md?
:::

## Solution rubric

:::answer Rubric
| Criterion | Meets | Exceeds |
| --- | --- | --- |
| Commands | All commands run and reported with real output | Notes timing, flakiness and prerequisites (Postgres, Node version) |
| Conventions | Three conventions with file evidence | Shows where each is enforced in code and in tests |
| Instruction hierarchy | Explains always-on versus scoped versus on-demand | Explains how cloud and local sessions differ |
| Proof | One session that followed a convention unprompted | Shows a failure, fixes the instructions and re-tests |
| Communication | Clear customer summary | Leads with the outcome and states one risk and next step |
:::

## Articulation exercises

- **60-second framing:** “The customer needs ___. I would set up ___ because ___. I will prove it works by ___.”
- **Think-aloud checkpoints:** after running the commands, after reading `.devin/`, and after the proof session, say what you observed, what it means and what you will check next.
- **Three-minute customer update:** outcome, evidence, one risk and the next step.
- **Objections:** “Why not just write a long onboarding wiki?” and “Will this slow Devin down or cost more ACUs?”
