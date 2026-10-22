## Feature fit

- **Security (Security Swarm)** is the scan type for the order leak and the webhook. It builds a threat model of the repo, investigates candidate issues in parallel, validates them, and reports findings with severity, location, reasoning and a fix suggestion. Run it with a profile whose scan model names Kadé's actual trust boundary: the brand comes from `X-Kade-Brand`, so every read of orders, carts or price lists must be constrained by it, and inbound PayGate webhooks are only trusted after the HMAC in `X-PayGate-Signature` is compared in constant time. Include `services/api/**`, exclude `labs/**`, `**/node_modules/**`, `**/dist/**`.
- **Performance** is the scan type for Lamp Week. Its profile says what "slow" means here: statements per request on catalog and collection routes, loops that issue a query per product or line. The finding to expect: `GET /catalog/collections/:slug` calls `buildProduct` per product. Each call runs a price query, a variants query and one stock query per variant (or bundle component), so the page costs 3 + 2N + V statements for N products and V variants. The fixed 3 are brand, collection and product list.
- **Accessibility** is the scan type for the merchandiser console: WCAG 2.2 AA on `apps/web/**`, focus on `/admin`. Expected: the "−" / "+" icon buttons on the inventory page have no accessible name (SC 4.1.2), and `.price-badge` is ≈3.1:1 (SC 1.4.3).
- Profiles are org-shared. Creating or editing them needs **Manage code scans**; running scans, reading findings, assigning to Devin, dismissing and exporting need **Use code scans**. Without Manage, run Security with the default profile and put the focus in guidance, or reuse a profile an admin made.
- Effort: Normal is enough for a lab of this size; Deep traces and validates each finding one at a time and is worth it when you need the exploit path proven for an audit. Other scan types always run at Normal.

## Worked sequence

1. On the Security page, start a Security scan on `codev-workshops/learn-devin-new-features`, default branch `main`, with the brand-isolation profile. Start a Performance scan and an Accessibility scan with their profiles. Three scans, no schedules.
2. While they run, open the orchestrating session of one scan and read its threat model or plan — it shows what the scan decided to look at.
3. **Findings tab:** filter by scan and by status Open, sort by severity. For each finding read title → location (file and line) → severity → reasoning → suggested fix. Check the location against the source before you believe it. Group duplicates: the same root cause reported on two routes is one fix.
4. **Classify** each finding: real and in scope; real but a known plant (record, do not fix on `main`); duplicate; false positive. The fake PayGate secret in fixtures and `.env.example` is the classic false positive here.
5. **Assign to Devin** the clearest real finding (the brand leak is a one-file fix). A remediation session starts, writes the fix with a test, and opens a PR. Review the PR like any other; then close it unmerged, because the plant must stay on `main`.
6. **Dismiss** one finding with a reason a reviewer would accept: "Fixture-only value; PAYGATE_SECRET in `.env.example` is the documented local fake, never deployed. Real secrets come from the environment." Dismissed findings stay visible with the note, so the decision is auditable.
7. **Scan new commits** on the Security scan. It scans only commits that landed on `main` since the last run, and its findings join the same scan. Because the demo PR was closed and nothing new landed, the run reports no new findings — that is the expected result, not a failure. It is refused while a run is still active.
8. **Export SARIF** from the scan and open it: each `runs[].results[]` entry has `ruleId`, `level`, `message` and `locations[].physicalLocation`. That file is what the security lead loads into the existing dashboard or GitHub code scanning.

## Reference run (22 Oct 2026, `main`)

The facilitator's run, exported in `labs/05-code-scans/fixtures/findings.json`, with all three scans at Normal effort:

- **Security:** 12 findings. 1 critical (PayGate HMAC computed but never compared), 4 high (including `GET /orders/:orderId` not scoped to the caller's brand and the client-chosen `X-Kade-Role`), 3 medium, 4 low. The triage phase dismissed 1 of them as a duplicate and left a note naming the primary finding.
- **Performance:** 24 findings, 10 left open. The critical one is the `buildProduct` N+1 behind the collection page. Triage dismissed 14 as duplicates, each with a note, which is the kind of grouping the platform team should expect.
- **Accessibility:** 5 findings. 2 high (unnamed −/+ buttons on the inventory page, one static document title for every route), 2 medium (the price badge measured at 2.8:1, and form-field borders at 1.3–1.5:1), 1 low (the result of an inventory adjustment is not announced).
- The finding about the hard-coded fallback PayGate secret is the one to dismiss. The value is the documented local fake, but a scanner has no way of knowing that.
- Assign to Devin on the brand-leak finding started a remediation session, and that session opened a PR. The facilitator closed the PR unmerged. Scan new commits, run after the PR was closed, added exactly one finding: a low on the cart ownership check that a sibling change had merged into `main` in the meantime (`services/api/src/services/carts.ts`). It also ignores a self-declared staff role. Nothing came from the closed PR. On a base that has not moved, expect zero new findings.

## Pitfalls

- Treating the findings count as the outcome. The CTO wants "are we leaking across brands": answer yes or no, then the count.
- One scan type for everything. A security scan will not tell you about statement counts; a performance scan will not reason about trust boundaries.
- Merging the Devin PR because it is green. In this course the plant stays on `main`.
- Dismissing without a note, or dismissing a real plant as "known". Known is not the same as accepted risk.
- Expecting Scan new commits to re-scan the whole repo.

## Recovery moves

- A scan is still running at T+90: report what the other scans found, and say when the last one will finish.
- No Manage permission: run Security with defaults plus typed guidance; ask an admin for the profile in writing.
- The remediation session fails to open a PR (no GitHub write for the Devin app): keep the session link as evidence and describe the branch it would have pushed.
- A finding's location is wrong: do not dismiss it as false; open the right file, confirm the root cause, and note the corrected location.

## Model answers to the objections

- **Technical (existing SAST):** Acknowledge the pipeline is valuable. Boundary: pattern-based SAST does not know that `X-Kade-Brand` is a trust boundary, so a lookup by ID alone looks fine to it. Evidence: the brand-leak and unverified-signature findings, with reasoning. Offer: export SARIF into the same dashboard so there is one queue, not two.
- **Commercial (triage cost):** Acknowledge triage time is the scarce resource. Boundary: findings are validated before they are reported and duplicates are grouped. Evidence: how many findings you kept, merged and dismissed, and how long that took. Offer: tighten the profile (scope globs, triage guidance) after the first run.
- **Governance (who allowed PRs):** Acknowledge it. Boundary: nothing opens a PR until a person assigns that finding, and the PR goes through normal review and branch protection; nothing merges itself. Evidence: the closed demo PR. Offer: restrict Assign to Devin to roles with Use code scans and keep Manage with the security lead.

## Debrief

- Which finding would you have missed without a profile that names the brand boundary?
- What number did you give the CTO first, and was it the right first number?
- What would change if this ran every night? (Out of scope here — scans in this course are started by hand.)
