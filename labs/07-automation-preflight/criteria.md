You are done when all of the following are observable by someone who was not on the call. Every item can be met on the fixture path with zero credentials.

1. **A Preflight script exists.** `labs/07-automation-preflight/preflight.mjs` (or `.py`) reads the event, reads and writes its state file, and writes one decision. It is not committed to `main`; keep it on your own branch or attach it to your report.
2. **The numbers.** `node labs/07-automation-preflight/tools/preflight-replay.mjs --script labs/07-automation-preflight/preflight.mjs --state-dir labs/07-automation-preflight/.state` prints a `RESULT:` line, and `labs/07-automation-preflight/PREFLIGHT-REPORT.md` quotes it with the count in, the count out, and which events became investigations.
3. **Every skip has a reason.** Each skipped line in the replay carries a reason a payments lead could read (transient attempt, recovered, already seen, not a delivery, malformed). No line says only "skipped".
4. **Idempotent.** Running the same replay a second time against the same `--state-dir` opens zero new investigations. Paste both `RESULT:` lines.
5. **The replay injector.** After the `duplicate-event-new-version` injector, the report says whether the next-day failure is a new investigation, and the replay output agrees with what you said.
6. **Filter choice justified.** One paragraph compares the natural-language filter with a script for this customer, names what each one can and cannot see, and says which you chose.
7. **Failure behaviour.** The report says what happens to an event when the Preflight times out, exits non-zero or writes an invalid decision, what timeout you set and why, and shows the `timeout` and `invalid-output` injector lines.
8. **Run now.** One sentence on what the Run now button does to the filter and how the payments lead should test the Preflight instead.
9. **Load.** One sentence on whether this Automation needs queueing (concurrent runs, queue depth) on a bad morning, with the number you would set.
10. **Credential honesty.** A short "not exercised" list: whether a live Automation received anything, and that PayGate was a fixture. If you created a live Automation, a screenshot showing it disabled or deleted.
11. **Articulation drill completed** with the voice coach (section 8) or against a timer, and the gap report (or your self-score) saved as `labs/07-automation-preflight/PREFLIGHT-REPORT.coach.md`. Do not commit it.
