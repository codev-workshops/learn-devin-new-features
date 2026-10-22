You are done when someone who was not in the room can check every item below from the artefacts alone. The envelope decides the content; the evidence shape is the same for every envelope.

1. **Capstone report.** `labs/15-capstone/CAPSTONE-REPORT.md` exists on your leaf branch (not on `main`) and opens with three one-sentence problem statements — incident, feature, constraint — in the customer's words.
2. **Capability choices.** For each of the three, the report names the Devin capability you used, one sentence on why it beat the alternative you rejected, and a link to the session, scan, review, run or report it produced.
3. **Incident evidence.** The incident is reproduced on the local stack (the injector's `SYMPTOM:` line or an equivalent observation), its cause is located to a file and line, and the containment or fix is a pull request against `main` that you leave open, with the re-run that proves it.
4. **Feature evidence.** The feature is a separate pull request (or a written design if the change at T+60 moved it), sized for review, with tests that fail before and pass after.
5. **Constraint evidence.** The report shows, with one artefact per claim, that the constraint held for every session you started — not only the last one.
6. **Change handling.** The report has a dated entry for the T+60 change: what you kept, what you dropped, what you re-planned and why.
7. **Blocker handling.** The report names the blocker you hit, how you noticed it and what you did instead, without widening a permission or weakening the constraint.
8. **Cost.** Sessions started, ACU used per session and in total, and the one step you would not run with Devin next time.
9. **Live versus fixture.** A table of every integration you touched and whether it ran live, ran on a fixture, or was not exercised and why.
10. **Coach run.** The capstone coach's gap report for your run is on your coaching branch.
