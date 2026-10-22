You are done when someone who was not in the room can see each of the following.

1. **One manifest, one name.** The plugin folder has `.devin-plugin/plugin.json` with a lowercase name, and the offline checker (`node labs/04-plugin-engineering/solution/plugin-check.mjs --kit <dir>`) reports no problems for it.
2. **Both procedures are skills.** The release checklist and the incident procedure are separate `skills/<name>/SKILL.md` files, and after install they appear as two `/<plugin>:<skill>` commands.
3. **More than text.** The same bundle carries at least one always-on or triggered rule, one `hooks.json` entry, one subagent and one MCP server declaration, and the install preview or details panel lists them.
4. **The guard behaves.** With the sale freeze set, the hook refuses a push to `main` and allows everything else; with the freeze unset it allows the push. Your note says where plugin hooks run and what happens when one fails.
5. **No credentials in the bundle.** Every credential in the MCP declaration is a `${NAME}` reference. Your note says when and where the connection is made, and who it is shared with.
6. **Installed at Personal scope first.** A screenshot shows the plugin installed for you, with the security notice you accepted, before any shared-scope step.
7. **Install routes compared.** Your note says, for repository, uploaded `.zip` and skills-only repository installs: what each can carry, what name it gets, and whether it follows later changes or stays fixed.
8. **Revision predicted, then checked.** You wrote down what the installed plugin would contain after the partial revision-2 upload before you checked it, then confirmed with the checker's `--revise` output or the plugin's version history.
9. **The unauthorised edit goes nowhere on its own.** For the brand engineer without edit rights, you show a pending proposal with a diff, the person who must approve it, and the unchanged installed plugin in the meantime.
10. **Inline-secret draft fixed.** All three problems in `injectors/inline-secret/` are named, and you say what Devin does with each.
11. **Articulation drill completed** with the voice coach (section 8), or against a timer offline. The gap report (or self-score) is saved next to your note and not committed.
