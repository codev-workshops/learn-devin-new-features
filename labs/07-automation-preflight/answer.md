## Feature fit

The Automation already has the right trigger (Webhook) and the right action (start a session). What is wrong is the gate in between. Conditions narrow a trigger on fields of a single event; they cannot remember that `evt_lab07_a` failed twice already. A Preflight check runs after each trigger and before Devin starts, and it comes in two forms: a natural-language filter that judges each event on its own, and a script that runs in an isolated short-lived environment with a small persisted state file. This customer's problem — "the same event, again" — is a memory problem, so the script is the fit. The natural-language filter is still the right tool for questions like "is this about payments at all?".

## Worked approach

1. Replay the noise first: `node labs/07-automation-preflight/tools/preflight-replay.mjs --run-now` → 11 dispatched. That is the baseline for the update.
2. Read the fixture and group by `event_id`: `evt_lab07_a` fails three times (503), `evt_lab07_b` fails once and recovers, `evt_lab07_c` is a 401 `signature_mismatch`, plus a redelivered notification, a ping and a malformed body. Two real incidents that morning, one more the next day.
3. Decide the rules, one per sentence: skip anything that is not a `delivery.*` notification; skip a notification id already seen (STATE_FILE); skip a transient attempt that is not the final one; skip a recovery; let through the final failed attempt or any non-retryable error class (`signature_mismatch`, `schema_invalid`) on its first attempt; never let the same event and replay through twice.
4. Emit an item, not `run: true`: `{"items":[{"id":"paygate:<event_id>","version":"<replay_seq>","title":"…"}]}`. The id makes the Automation itself refuse to start a second session for the same event even if your state were lost; the version lets a manual replay from the PayGate dashboard (`replay_seq` 2) count as a new occurrence. The title is what the on-call reads first.
5. Keep STATE_FILE small: notification ids seen in the last 14 days (capped at 500) and one entry per event@replay. It stays far under 64 KiB (the replay prints `state_bytes`, about 560 for the fixture).
6. Replay: `--script labs/07-automation-preflight/preflight.mjs --state-dir labs/07-automation-preflight/.state` → `RESULT: events=11 sessions=3 skipped=8 failed=0`. Run it again with the same state dir → `sessions=0`.
7. Timeout: the script reads two small files and does no network I/O, so 10–30 s is generous; the default 60 s is fine too. Anything from 1 to 300 s is accepted. If the script later calls PayGate's API to enrich the title, raise it and say why.
8. Write `PREFLIGHT-REPORT.md` with the before/after numbers, the rules, the injector lines and the not-exercised list.

The reference script is `labs/07-automation-preflight/solution/preflight.mjs`; `solution/preflight.test.mjs` replays every acceptance case.

## The injectors

- **Notification redelivery** (`ntf_705` twice): the seen-set in STATE_FILE skips the second one with "already seen". Even without it, the item id would be a duplicate and no session would start.
- **Duplicate event, new version** (`ntf_710`): same `event_id`, `replay_seq` 2, `max_attempts` 1. It is a new occurrence — the lead replayed it on purpose and it failed again — so it becomes `paygate:evt_lab07_a@2`. If you had used only the event id with no version, it would have been silently dropped.
- **Timeout** (`slow-preflight.mjs --timeout 1`): the event stops before any action, no state is saved and the event is not retried automatically. Treat a timeout as an alert about the Preflight, not as "skip".
- **Invalid output** (`invalid-output.mjs`): `{"run": true, "items": []}` is not exactly one decision. The event fails, the scribbled state is discarded, and the next good run sees the old state — so replaying `ntf_705` with the reference script still opens `evt_lab07_a@1`.
- **Run now**: bypasses Preflight and runs the actions directly — 11 sessions, the ping included. It tests the action and the session prompt, never the filter. Test the filter with the replay (or by sending one fixture notification to the live webhook).
- **Naive items** (`naive-items.mjs`): keyed on notification id, so every retry is a new item — 8 sessions. Item dedupe only helps when the id is the incident, not the delivery.

## Pitfalls

- Using the LLM filter and asking it to "ignore duplicates": it has no memory of earlier events, so retries look identical to first failures.
- Keying items on the notification id or the attempt number — the dedupe then dedupes nothing.
- Dropping the version: the next-day replay never reaches Devin.
- Skipping attempts 1–2 of a `signature_mismatch`: a permanent error will fail all three attempts, so waiting only delays the investigation by the retry window.
- Writing `run: false` for malformed bodies without a reason, or letting the script crash on them — a crash fails the event with no retry and shows up as a Preflight failure, not as a skip.
- Letting STATE_FILE grow forever (one entry per notification, never pruned) until it passes 64 KiB and every run fails.
- "Testing" with Run now and reporting that the filter works.
- Leaving a live demo Automation enabled after the lab.

## Recovery moves

- If the replay shows `failed=` above 0, run the same event alone with `--only <id>` and read the `log` field in `--json` output before changing logic.
- If a real failure was skipped, add the notification to the fixture, replay with a fresh `--state-dir`, and fix the rule — not the state file.
- If the coach catches you saying "it dedupes" without a key, restate it as "same event id and replay number means same investigation".

## Model answers to the objections

**"Won't we miss a real failure?"** — Acknowledge: missing one is worse than an extra session, and you said so. Boundary: the script only skips four things — retries that are not the last attempt, deliveries that recovered, notifications it has already seen, and events that are not delivery failures. Evidence: on the fixture morning both real failures still opened, the signature failure on its first attempt; a manual replay opens a new investigation through the version; if the script itself breaks, the event fails loudly rather than being skipped. Offer: keep every skip reason in the Automation's activity, and review a week of skips together before tightening anything.

**"What does every skipped event cost us?"** — Acknowledge: a fair question for finance. Boundary: a skip costs a short Preflight run, not a Devin session; a session costs agent time and an on-call reader. Evidence: 11 notifications became 3 sessions, so 8 sessions a morning like this one are avoided, and the platform on-call reads three focused investigations instead of eleven overlapping ones. Offer: compare a week of Automation activity before and after, sessions and ACUs, and report it next Thursday.

## Debrief

- What made the script the right Preflight here, in one sentence?
- Which rule would you remove first if the payments lead wanted more sessions, not fewer?
- What did the item version buy you that STATE_FILE alone did not?
- If PayGate sends 200 failure notifications in five minutes during an outage, what do concurrent runs and queue depth do — and is one investigation per event still what the lead wants? (Hint: consider grouping by error class and minute, and asking the lead with a structured question in the session.)

## References

- Devin docs — [Automations](https://docs.devin.ai/product-guides/automations): triggers and conditions, webhook triggers and secret, Preflight checks (natural-language filter, script, EVENT_FILE / STATE_FILE / LAST_RUN_FILE / OUTPUT_FILE, item ids and versions, limits, failure behaviour), Run now, queueing. Fetched 2026-10-22.
- Devin [release notes 2026](https://docs.devin.ai/release-notes/2026): Preflight Checks for Automations (Sep 30, 2026); Structured Questions in Automation Sessions (Sep 25, 2026).
- `observability/runbooks/RB-201-webhook-failure-rate.md` and monitor `48213802` in `observability/datadog/`.
