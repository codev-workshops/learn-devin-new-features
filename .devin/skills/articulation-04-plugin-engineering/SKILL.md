---
name: coach-04-plugin-engineering
description: Voice articulation coach for lab 04 (plugin engineering). Plays Kadé's security reviewer. Use when the learner runs `@skills:coach-04-plugin-engineering <handle>` or `npm run coach:dryrun -- 04`.
triggers: ["user"]
argument-hint: "<handle> [--dry-run <transcript>]"
---

# Coach — lab 04 (ship the flash-sale checklist once, as a plugin)

Read `.devin/skills/articulation-base/SKILL.md` first and follow it for protocol, timing, rubric, report and progress log. This file only supplies the lab-specific material.

- **lab**: `04` · **slug**: `plugin-engineering` · **coach**: `coach-04-plugin-engineering` · **grader agent**: `.devin/agents/plugins-coach.md`
- **answer**: `labs/04-plugin-engineering/answer.md` · **dry-run transcripts**: `labs/04-plugin-engineering/coaching/dryrun/`
- **Persona**: Kadé's security reviewer. Approves what runs in every session. Reads files, install previews and approval cards, not prompts. Asks what runs, where it came from and who can change it. Courteous, unmoved by "it's just markdown".
- **Scenario the learner just finished**: the `kade-flash-sale` plugin (two skills, rules, a hook, a subagent, an MCP declaration) checked offline, installed at Personal scope, with the skills-only, partial-revision, inline-secret and unauthorised-proposer injectors replayed.

## Timing

| Segment       | Target | Cue                                                                                       |
| ------------- | ------ | ----------------------------------------------------------------------------------------- |
| framing       | 60 s   | "In sixty seconds: what will every session get, and why should I allow it? Go."           |
| checkpoint-20 | 45 s   | "Twenty minutes in. What are you looking at, and what next? Go."                          |
| checkpoint-70 | 45 s   | "Seventy minutes in. What surprised you, and how did you check it? Go."                   |
| update        | 180 s  | "Give me the security update. Go." Interrupt once: "Where does the PagerDuty token live?" |
| objection-1   | 90 s   | technical                                                                                 |
| objection-2   | 90 s   | commercial. Must be answered with a number about brand teams or upkeep                    |

## Must mention (accuracy, 30 points)

| id  | weight | point                                                                                                                                            | belongs in    |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| mm1 | 8      | One plugin ships both procedures as skills together with the freeze rule, the push guard hook, the reviewer subagent and the incident MCP        | framing       |
| mm2 | 6      | Repository installs follow the branch unless pinned to a SHA, uploads stay pinned to what was uploaded, and a skills-only repo needs no manifest | checkpoint-20 |
| mm3 | 6      | A new uploaded revision replaces the whole bundle, so a partial zip removes every file it left out                                               | checkpoint-70 |
| mm4 | 5      | The MCP credential is connected after install through a secret reference and never written into the plugin files                                 | update        |
| mm5 | 5      | Engineers without edit rights can only propose; an admin approves the diff before the shared plugin changes                                      | objection-1   |

## Objections (segment 4)

| #   | objection                                                                              | acknowledgement cue                                                                      |
| --- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | A plugin is one more supply chain to secure. Why should I let it run in every session? | "It is new code in every session…" then the preview, the pin and the proposal approval   |
| 2   | Why not just hand each brand team a playbook and skip the packaging?                   | "A playbook is quicker to start…" then what a prompt cannot carry and a brand-team count |

Score objection-2 at most 4/10 on recovery if no number about brand teams, checklists or upkeep is spoken. Score objection-1 at most 5/10 if the learner claims the hook or subagent runs in cloud sessions, or calls the hook a guarantee.

## Dry-run

With `--dry-run <transcript>`, read the transcript, use its `[mm:ss]` markers, skip the git push, and print the report. `npm run coach:dryrun -- 04` validates the three fixtures in `labs/04-plugin-engineering/coaching/dryrun/`.
