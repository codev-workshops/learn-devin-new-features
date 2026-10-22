Do not open this before you have built your plugin, run the checker on it and done the drill.

## Feature fit

The platform lead wants one procedure everywhere, carrying more than text, changed only through review, and holding no credentials. That is a plugin:

- **One unit.** A plugin bundles skills and, optionally, rules, hooks, MCP servers and subagents, and is installed as a whole. You cannot install one skill out of it. Installed at Organization scope, it reaches every cloud session of the organization from the next session on.
- **Commands everywhere.** Each skill becomes `/<plugin>:<skill>` in cloud sessions, the CLI and Desktop.
- **Governed sharing.** Organization plugins are edited by admins. Since October 19, 2026 a session whose creator cannot edit a shared plugin can still *propose* an edit, and an admin with the right permission approves it; the approval card shows the proposed diff.
- **Credentials outside.** The plugin declares the MCP server; the connection (OAuth or API key) is made after install from the install toast's **Connect MCP** or Customize → MCPs, with Access set to Organization (shared) or Personal.

What it is not: a guaranteed guardrail. Plugin hooks run only in local sessions (CLI and Desktop) and are best effort and fail open. The freeze on `main` is still enforced by branch protection; the hook is an early warning.

## The reference plugin

`labs/04-plugin-engineering/solution/kade-flash-sale/`:

| File | What it is |
| --- | --- |
| `.devin-plugin/plugin.json` | Manifest. Only `name` is required; it must be lowercase |
| `skills/flash-sale-release/SKILL.md` | The eight-step release checklist |
| `skills/flash-sale-incident/SKILL.md` | The first-hour incident procedure |
| `AGENTS.md` | Always-on rule: sale freeze, which command to use when, no tokens in chat |
| `rules/sale-pricing.md` | Triggered rule (`trigger: glob`) for money and stock during a sale |
| `agents/release-checker.md` | Subagent `kade-flash-sale:release-checker` (local sessions only) |
| `hooks.json` | `PreToolUse` on `exec`: exit 2 for `git push … main` while `KADE_SALE_FREEZE=1` |
| `.mcp.json` | `kade-incidents` server with `PAGERDUTY_API_TOKEN: "${PAGERDUTY_API_TOKEN}"` |

The hook command is self-contained (`node -e …`) so it does not depend on where the plugin is unpacked.

Checker on the reference (`node labs/04-plugin-engineering/solution/plugin-check.mjs --kit labs/04-plugin-engineering/solution/kade-flash-sale`), abridged:

```json
{
  "kind": "manifest",
  "name": "kade-flash-sale",
  "commands": ["/kade-flash-sale:flash-sale-incident", "/kade-flash-sale:flash-sale-release"],
  "rules": ["AGENTS.md", "rules/sale-pricing.md"],
  "agents": ["release-checker"],
  "hooks": ["PreToolUse"],
  "mcpServers": [{ "name": "kade-incidents", "envRefs": ["PAGERDUTY_API_TOKEN"], "literals": [], "needsConnection": true }],
  "problems": []
}
```

`cd labs && npx vitest run 04-plugin-engineering` replays every criterion and injector (8 tests).

## Install routes

| Route | Carries | Name | Follows changes? |
| --- | --- | --- | --- |
| **From repository** (`owner/repo`, optional subdirectory) | Everything in the folder | From the manifest | Yes — tracks the default branch (or a `ref`) unless pinned with a `sha`; new content reaches new sessions after merge, Customize after a reindex |
| **Upload .zip** | Everything in the zip | From the manifest | No — pinned to what you uploaded until a new revision is uploaded; every save is in version history |
| **Skills-only repository** (`skills/<name>/SKILL.md`, no manifest) | Skills only | Named after the repo | Like a repository install |
| **CLI** `devin plugins install <source>` | Everything | From the manifest | Personal scope by default; `--local` for this machine only |

A repository install also needs the organization to have access to that repository; otherwise Customize shows *Plugin repos unauthorized* and withholds the content.

## Worked prompts

These are the prompts the reference run used. They live here only; the lab page stays promptless.

```prompt
Package the flash-sale release checklist and the first-hour incident procedure as one Devin plugin named kade-flash-sale in ~/kade-flash-sale. Include: two skills, an always-on AGENTS.md, a glob-triggered pricing rule, a release-checker subagent, a PreToolUse hook that blocks git push to main while KADE_SALE_FREEZE=1, and a PagerDuty MCP server whose token is a ${PAGERDUTY_API_TOKEN} reference. No literal credentials anywhere. Then run labs/04-plugin-engineering/solution/plugin-check.mjs on the folder and fix every problem it reports.
```

```prompt
Install ~/kade-flash-sale as a plugin for me only (personal scope). Show me the approval card before you install it. Do not install it for the organization.
```

```prompt
Before you check anything: if I upload labs/04-plugin-engineering/injectors/revision-2/kade-flash-sale as a new revision of kade-flash-sale, list the files the plugin will contain afterwards. Then run plugin-check.mjs --revise against the reference and compare.
```

```prompt
Propose an edit to the organization plugin kade-flash-sale: in skills/flash-sale-release/SKILL.md change "fewer than 10 units" to "fewer than 25 units". I cannot edit organization plugins myself; raise it for an admin to approve and tell me who has to act.
```

## Injector answers

- **skills-only-brand-repo** — installs as a separate skills-only plugin named after the repo (`/lumen-checklists:lumen-sale-checklist` with the checker's `--repo-name`). It cannot carry a rule, hook, MCP or subagent, and it does not replace `kade-flash-sale`; both would be installed side by side. Better: fold its steps into the shared release skill.
- **partial-revision** — a new revision replaces the uploaded bundle. `--revise` shows the result is exactly two files; six are removed (`AGENTS.md`, `rules/sale-pricing.md`, `agents/release-checker.md`, `hooks.json`, `.mcp.json`, the incident skill). Restore from version history, or upload the full folder with the one change. Running sessions keep what they loaded at start.
- **inline-secret** — (1) `"Kade Flash Sale"` is not a valid name: lowercase with `-` or `.`; (2) a literal token in `env` is stripped — use `${PAGERDUTY_API_TOKEN}` and connect after install; (3) an MCP config with a client secret is rejected at activation; a plugin may set an OAuth client ID and scopes only.
- **unauthorised-proposer** — `--propose` returns `outcome: "proposal"`, `applied: false`, `awaiting: "platform-admin"` with a one-line diff. In the product the admin sees an approval card that opens the diff against the saved plugin; nothing changes until it is approved, and then only for new sessions.
- **hook-fails-open** — no. Plugin hooks load in local sessions only, and fail open. The guarantee is branch protection on `main`; the hook catches the mistake earlier.

## Pitfalls

- Installing at Organization scope first. Check at Personal scope; the security notice and preview are your first review.
- Treating a revision upload as a patch.
- Putting the PagerDuty token in `.mcp.json` "just for the demo".
- Claiming the release-checker subagent or the hook runs in cloud sessions.
- Leaving a repository install unpinned and calling it reviewed: the next merge changes what every session runs.

## Recovery moves

- Checker still reports a literal: replace the value with `${NAME}`, then connect from Customize → MCPs.
- Plugin missing after install: check Customize → Plugins → *Installed but blocked* (a forbid at a higher level) and the indexing status; reindex after fixing.
- Revision lost files: open Version history and restore, then re-upload the complete folder.

## Model answers to the objections

- **Supply chain (technical).** "It is new code in every session, so treat it like a dependency. Boundary: it runs rules, skills and, in local sessions only, a hook and a subagent; it holds no credential. Evidence: the install preview and security notice list every file; the upload is pinned to what we reviewed, or the repository install is pinned to a SHA; brand engineers can only propose edits, which an admin approves as a diff. Offer: I will keep it at Personal scope until you have read the preview, and pin the SHA we review."
- **Playbook (commercial).** "A playbook is quicker to start, and fine for one team. Boundary: a playbook is a prompt; it cannot carry the pricing rule, the push guard, the reviewer or the incident MCP, and each brand's copy drifts. Evidence: today two brands keep two different checklists and neither checks stock reservation; the plugin is one install at Organization scope, and one approved edit reaches every team's next session. Offer: one sale cycle with the plugin, counting checklist steps skipped per release."

## Debrief

- **Unit of sharing:** the plugin, not the skill. If two teams need different pieces, split plugins.
- **Revision = replacement:** always upload the whole folder; use version history to undo.
- **Credentials:** declared in the plugin as `${NAME}`, connected after install, shared or personal by the MCP's Access setting.
- **Local-only parts:** plugin hooks and subagents load in the CLI and Desktop; hooks fail open. Do not sell them as cloud guardrails.
- **Change control:** pin (SHA or upload) what was reviewed; non-editors propose, admins approve the diff.
