You are done when someone who was not in the room can see each of the following.

1. **The matrix exists.** `~/lab10/matrix.json` has at least one enterprise profile, one organization default and one automation-level profile, and `profile-resolve.mjs --validate` reports no problems for it.
2. **Two destinations, nothing else.** For a normal session the resolver shows `registry.npmjs.org` and a PayGate sandbox host allowed, and `api.paygate.example`, `api.github.com`, `pypi.org` and `example.com` blocked. The MCP list in force is empty.
3. **Opt-out goes nowhere.** A session bound to "no profile" resolves to the same network list as your enterprise profile, and your note says which setting makes that true.
4. **Same opt-out, other setting.** With `injectors/recommended-floor.json` you show the opted-out session and the child session reaching hosts the CISO forbade, and say in one sentence why.
5. **The automation is stricter.** The webhook-triage target resolves to read-only git, read-only Devin MCP and a network list no wider than the normal session's.
6. **Helpers stay inside.** The child target resolves to exactly the parent's profiles, even though the child asked for none.
7. **Timing written down.** For `floor-tightened`, your note gives three answers: the running session now, the same session after it wakes, a new session. The resolver's `--then` output agrees.
8. **Builds checked.** You resolved the `snapshot-build` target, found what the Python install needs, and wrote who must change which profile (or blueprint) so the build passes without widening normal sessions more than the CISO accepts.
9. **Drafts fixed.** The GitHub-token draft and the hurried wildcard draft each have every problem named, with one unintended hostname per wildcard.
10. **Observer evidence.** `probe.sh` output from one of your own sessions is saved, with a sentence on what it tells you about the profile governing you — whether or not you are an admin.
11. **Guardrails table.** For each of the three messages and each AI Guardrails action, your table says what the sender sees, whether Devin acts on it, and where the event shows up later.
12. **Articulation drill completed** with the voice coach (section 8), or against a timer offline. The gap report (or self-score) is saved in `~/lab10/` and not committed.
