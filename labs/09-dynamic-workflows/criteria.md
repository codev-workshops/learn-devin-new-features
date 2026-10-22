You are done when someone who was not in the room can see each of the following.

1. **Full endpoint inventory.** The audit note lists every endpoint served by `services/api` (22 on the clean baseline) with one verdict each, *leaks* or *isolated*, and a file:line reference for every verdict. The inventory was derived from the code, not typed from memory.
2. **Slice first.** The run log shows a first run limited to a small slice of route files, and the slice's cost appears before any wider run. Widening the run changes data, not the workflow's structure.
3. **The workflow script exists only in your hidden notes.** It uses separate agent calls for audit, fix and verify, chains them so results flow from one stage to the next, and returns small flat structured outputs. Nothing about it is committed to `main`.
4. **Execution graph captured.** A screenshot of the workflow run shows its phases and its agents.
5. **At least one agent failure handled.** The run log shows an agent that failed or returned invalid output, and shows what the script did about it (bounded retry, corrective re-ask or loud stop). The audit note says whether that failure changed any verdict.
6. **Resume demonstrated.** A second invocation with the same run ID shows completed agents replaying from the record rather than starting new sessions, and you can explain what would make an agent run again.
7. **Fixes on throwaway branches only.** Each confirmed leak has a fix branch named by the script, so no two fixers can collide, with a test that fails on the baseline and passes on the branch. `main` still contains every planted defect, and the branch is closed or deleted without merging.
8. **Independent verification.** A different agent from the fixer gives a pass/fail verdict per fix branch, based on its own check.
9. **ACU per agent reported.** The audit note has a table with one row per agent (including retries) plus the run total. It also projects the cost of the full fan-out from the slice numbers.
10. **Injectors absorbed.** The note says how branch names avoid collision, and predicts what adding a date to a prompt would do on resume.
11. **Articulation drill completed** with the voice coach (section 8), or against a timer offline. The gap report (or self-score) is saved next to the audit note and not committed.
