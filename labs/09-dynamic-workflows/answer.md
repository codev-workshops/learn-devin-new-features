Do not open this before you have run the slice, written your audit note and done the drill.

## Feature fit

The auditor wants per-endpoint verdicts for the whole API, fixes that someone other than the fixer verifies, and a cost per agent. A dynamic workflow fits that shape:

- **Audit fans out.** There are 22 endpoints in 7 route files. Each route file is an independent judgment unit, and you derive the list from code, so it is deterministic.
- **Data flows between stages.** An audit's confirmed leaks become the fixer's prompt, and the fixer's branch and commit become the verifier's prompt. That is a `pipeline()`, not three unrelated sessions.
- **Verification has to be independent.** A fresh agent on its own VM cannot reuse the fixer's assumptions.
- **Cost is visible per agent.** The run prints ACU per agent and per phase. That is the number finance asked for.

What it is not: a reason to use `vm_mode="shared"`. Everything the agents need is on the remote (the repo at a pinned commit), so every agent runs on its own VM. Fixers hand work back **through pushed branches**, the only channel between separate VMs. Shared VM is for local-only state, and fixers sharing one checkout would also collide on files.

## The workflow (reference run)

Small flat schemas: strings and arrays of strings, three to four fields each. The inventory comes from a regex over `services/api/src/routes/*.ts` inside the script, so a resume sees exactly the same list. The slice is data (`SLICE`); to widen, set `SLICE = sorted(MOUNTS)`.

```python
import asyncio
import json
import re
from pathlib import Path

REPO = "codev-workshops/learn-devin-new-features"
BASE_SHA = "c94b9daee71eaf438c0dd38e2f7bf46ba01831c8"
ROUTES_DIR = Path("/home/ubuntu/repos/learn-devin-new-features/services/api/src/routes")
MOUNTS = {"system.ts": "", "catalog.ts": "/catalog", "carts.ts": "/carts", "checkout.ts": "/checkout",
          "orders.ts": "/orders", "admin.ts": "/admin", "webhooks.ts": "/webhooks"}
SLICE = ["carts.ts", "orders.ts"]  # run on a slice first; widen to sorted(MOUNTS) once the slice is clean
ROUTE_RE = re.compile(r'r\.(get|post|put|patch|delete)\(\s*"([^"]*)"')

AUDIT_SCHEMA = {"type": "object", "properties": {
    "route_file": {"type": "string"},
    "endpoints_checked": {"type": "array", "items": {"type": "string"}},
    "leaks": {"type": "array", "items": {"type": "string"}},
    "evidence": {"type": "string"}},
    "required": ["route_file", "endpoints_checked", "leaks", "evidence"]}
FIX_SCHEMA = {"type": "object", "properties": {
    "branch": {"type": "string"}, "commit_sha": {"type": "string"},
    "fixed": {"type": "array", "items": {"type": "string"}}, "tests": {"type": "string"}},
    "required": ["branch", "commit_sha", "fixed", "tests"]}
VERIFY_SCHEMA = {"type": "object", "properties": {
    "branch": {"type": "string"}, "verdict": {"type": "string", "enum": ["pass", "fail"]},
    "endpoints_proven": {"type": "array", "items": {"type": "string"}}, "notes": {"type": "string"}},
    "required": ["branch", "verdict", "endpoints_proven", "notes"]}

COMMON = (f"Repository {REPO}, commit {BASE_SHA} (check it out exactly; never push to main, never open a PR, "
          "never merge anything). Kade Commerce has two brands; the caller's brand is the X-Kade-Brand header "
          "(services/api/src/middleware/auth.ts sets req.caller.brand). An endpoint LEAKS when a caller of one brand "
          "can read or change a row that belongs to the other brand. ")


def inventory():
    out = {}
    for name in sorted(MOUNTS):
        src = (ROUTES_DIR / name).read_text()
        out[name] = sorted(f"{m.upper()} {MOUNTS[name]}{p}".rstrip("/") or "/" for m, p in ROUTE_RE.findall(src))
    return out


async def call(prompt, phase, schema, label, mode):
    try:
        return await agent(prompt, phase=phase, schema=schema, label=label, mode=mode, repos=[REPO],
                           soft_time_limit_minutes=25)
    except WorkflowAgentError as err:
        log(f"{label}: agent failed ({err}); retrying once in the inherited mode")
        return await agent(prompt + " (retry)", phase=phase, schema=schema, label=f"{label}-retry",
                           repos=[REPO], soft_time_limit_minutes=25)


def audit_stage(inv):
    async def run(route_file):
        expected = inv[route_file]
        prompt = (COMMON + f"Audit services/api/src/routes/{route_file} for cross-brand leaks. Endpoints in scope "
                  f"(exactly these): {json.dumps(expected)}. Read the code and the services it calls; you may run "
                  "the API tests (npm ci && npm test -w services/api) but change nothing. Report every endpoint in "
                  "endpoints_checked using the same 'METHOD /path' strings, each confirmed leak in leaks as "
                  "'METHOD /path: one-line reason', and file:line evidence in one string.")
        res = await call(prompt, "audit", AUDIT_SCHEMA, f"audit-{route_file}", "lite")
        missing = sorted(set(expected) - set(res.get("endpoints_checked", [])))
        if missing:  # invalid output: the agent skipped endpoints -> one corrective retry, then fail loudly
            log(f"audit-{route_file}: missed {missing}; re-asking")
            res = await call(prompt + f" Your previous answer skipped {json.dumps(missing)}; cover them.",
                             "audit", AUDIT_SCHEMA, f"audit-{route_file}-recheck", "lite")
            missing = sorted(set(expected) - set(res.get("endpoints_checked", [])))
            if missing:
                raise RuntimeError(f"audit-{route_file} still skips {missing}")
        log(f"audit-{route_file}: {len(expected)} endpoints, {len(res['leaks'])} leak(s)")
        return res
    return run


async def fix_stage(audit):
    if not audit["leaks"]:
        return {"audit": audit, "fix": None}
    stem = audit["route_file"].removesuffix(".ts")
    branch = f"audit/lab09-{stem}-fix"  # one branch per route file: fixers never collide
    prompt = (COMMON + f"Fix these confirmed leaks in services/api/src/routes/{audit['route_file']} and nothing "
              f"else: {json.dumps(audit['leaks'], sort_keys=True)}. Add or un-skip a Vitest test per leak that "
              "fails before and passes after. Run npm ci && npm test -w services/api && npm run lint -w services/api. "
              f"Commit on a new branch {branch} cut from {BASE_SHA} and push it. This is a throwaway demo branch.")
    fix = await call(prompt, "fix", FIX_SCHEMA, f"fix-{stem}", None)
    log(f"fix-{stem}: {fix['branch']} @ {fix['commit_sha'][:7]}")
    return {"audit": audit, "fix": fix}


async def verify_stage(item):
    audit, fix = item["audit"], item["fix"]
    if fix is None:
        return {**item, "verify": None}
    stem = audit["route_file"].removesuffix(".ts")
    prompt = (COMMON + f"Independently verify branch {fix['branch']} at {fix['commit_sha']}. Do not trust its "
              f"tests: for every endpoint in {json.dumps(audit['endpoints_checked'])} decide from the diff and a "
              "test of your own (run locally, do not push) whether a caller of the other brand is now refused. "
              "verdict is pass only if every listed leak is closed and no endpoint regressed.")
    ver = await call(prompt, "verify", VERIFY_SCHEMA, f"verify-{stem}", "lite")
    log(f"verify-{stem}: {ver['verdict']}")
    return {**item, "verify": ver}


async def main():
    await register_workflow({
        "name": "lab09-brand-isolation-audit",
        "description": "Audit services/api routes for cross-brand leaks, fix on throwaway branches, verify independently",
        "product": "Kade Commerce services/api",
        "soft_time_limit_minutes": 25,
        "phases": [
            {"title": "audit", "detail": "one agent per route file, read-only", "labels": [f"audit-{f}" for f in SLICE]},
            {"title": "fix", "detail": "one agent per route file with confirmed leaks, own branch"},
            {"title": "verify", "detail": "fresh agent re-checks every fix branch"},
        ],
    })
    inv = inventory()
    log(f"inventory: {sum(len(v) for v in inv.values())} endpoints in {len(inv)} files; slice {SLICE}")
    results = await pipeline(SLICE, audit_stage(inv), fix_stage, verify_stage)
    for r in results:
        a, f, v = r["audit"], r["fix"], r["verify"]
        log(json.dumps({"file": a["route_file"], "endpoints": len(a["endpoints_checked"]), "leaks": a["leaks"],
                        "branch": f and f["branch"], "verdict": v and v["verdict"]}, sort_keys=True))


asyncio.run(main())
```

Kick-off you would type into a session that has the dynamic-workflows skill:

```prompt
Write a dynamic workflow that audits services/api for cross-brand leaks. Enumerate endpoints deterministically from services/api/src/routes inside the script. Use one read-only audit agent per route file, run as a pipeline into one fixer per file with confirmed leaks (own branch audit/lab09-<file>-fix, pinned base commit, never main), then a fresh verifier per fix branch. Use flat schemas only. Run it on carts.ts and orders.ts first, then show me ACU per agent before widening.
```

### What the reference run actually did (2026-10-22, run `wfr-b3ece5951a8b489e89f6b17a4a19e602`)

| Agent | Phase | Result | ACU |
| --- | --- | --- | --- |
| audit-carts.ts | audit | **failed at session creation**: requested mode `lite` is not available to the org | 0 |
| audit-carts.ts-retry | audit | 5 endpoints checked, 0 leaks | 0.99 |
| audit-orders.ts | audit | **failed at session creation** (same reason) | 0 |
| audit-orders.ts-retry | audit | 4 endpoints checked, 1 leak: `GET /orders/:orderId` filters on id only, so a merchandiser/admin of one brand reads the other brand's order | 0.71 |
| fix-…/orders | fix | commit `a9313cf` on a throwaway `audit/lab09-…` branch: `WHERE id = $1 AND brand = $2`, planted test un-skipped | 0.96 |
| verify-…/orders | verify | **failed at session creation** (same reason) | 0 |
| verify-…/orders-retry | verify | `pass`: the other brand now gets 404, no endpoint regressed | 0.84 |
| **Slice total** | | 2 of 7 route files, 9 of 22 endpoints, wall time 616 s | **3.49** |

ACU figures are as printed at the end of the first run. On the resume a few minutes later the same four sessions reported 1.02 / 0.73 / 1.01 / 0.89 = 3.64, because usage settles after a session finishes. Quote the settled figure, and say that you did.

**Failure handling.** Three agents failed. `call()` catches `WorkflowAgentError` and retries once in the inherited mode, labelled `-retry` so the journal and the cost table stay honest. The coverage check is the second guard: if an audit's `endpoints_checked` misses any endpoint from the deterministic inventory, the script re-asks once, then raises. A skipped endpoint can never read as "isolated".

**The bug the run exposed.** The orders auditor returned `route_file` as `services/api/src/routes/orders.ts` instead of `orders.ts`. `fix_stage` built the branch name from that output, which produced `audit/lab09-services/api/src/routes/orders-fix`. It was harmless here, but it is exactly how two fixers collide. **Derive keys (labels, branch names) from the input item, never from agent output.** Pass the route file through the pipeline yourself, for example `{"route_file": f, **res}`.

**Resume.** Re-invoking `run_workflow` with the same run ID took 271 s and logged `recorded result (replay)` for all four completed agents. No new session did any work. The three `lite` calls failed again at creation (they have no recorded result) and cost nothing.

**Date-in-prompt injector.** Recorded results replay only while the agent's call (prompt, schema, options) is byte-identical. Add `f"Today is {date.today()}"` to the audit prompt and every audit misses replay and runs again. Each new audit result is new data, so every downstream fixer and verifier prompt changes too, and the whole slice is paid for again (≈3.5 ACU). If the auditor needs a date, pin it as a constant in the script, or record it with `log()`.

**Projection for the full fan-out.** Audits average ≈0.85 ACU each, so 7 route files cost ≈6 ACU. Each route file with a confirmed leak adds ≈1.85 ACU (fix plus verify). With the one known leak, the full proof costs about **8 ACU**. Allow ≈10 if another route file turns out to leak. One large single session would read all 22 endpoints in one context for less. But it gives no per-endpoint journal, no independent verifier, no resume and no per-agent bill.

### Clean-up

The fix branch was deleted after its SHA was recorded. `main` still has the planted leak and the skipped test (`git grep -n "it.skip(\"cross-brand-leak" services/api/test`).

## Pitfalls

- Hard-coding the endpoint list in a prompt instead of deriving it in the script. The first new route silently escapes the audit.
- Fixers that share a branch name, or a shared VM. The second push overwrites the first, or the second fixer edits the first one's files.
- Treating "the fixer's tests pass" as verification. The auditor asked for independent evidence.
- Requesting a mode the org does not have and assuming the run is fine. Read the log: the retry is visible and must appear in the cost table.
- Quoting a monthly total instead of ACU per agent, or quoting the unsettled number without saying so.
- Merging the fix. The leak is a planted course defect, so the branch is evidence, not a delivery.

## Recovery moves

- If the coach asks "how do you know it covered everything?", give the number first ("22 endpoints, derived from code, 9 in the slice"), then the guard (the coverage check raises).
- If you lose the thread in the update, go back to the skeleton heading you are on and say one number.
- If you do not have the settled ACU figure, say "3.5 ACU for the slice, as printed; the settled figure may be slightly higher".

## Model answers to the objections

- **Technical: "How do I know an agent didn't skip endpoints and call it clean?"** Acknowledge: an agent can omit things. Boundary: the endpoint list is computed by the script from the route files, not by an agent. Evidence: every audit's `endpoints_checked` is compared with that list, a gap triggers one re-ask and then a hard failure, and the run log shows all 9 slice endpoints accounted for. Offer: widen to all 22 with the same check and attach the log.
- **Commercial: "Why pay for a fan-out of agents when one engineer could read 22 endpoints in an afternoon?"** Acknowledge: one reader is cheaper per line read. Boundary: what you are buying is an independent verifier and a per-agent bill. Evidence: the slice cost 3.49 ACU across four working agents (0.99 and 0.71 per audit, 0.96 for the fix, 0.84 for the verifier), and the full proof projects to about 8 ACU. Offer: approve the full run at a 10 ACU cap, with each extra leaking file adding about 1.9.

## Debrief

- **Single large session.** Wins when the inventory is small and nobody needs per-agent cost or independent verification. Here it would be cheaper but weaker evidence.
- **`parallel()` of audits only, fixes by hand.** Wins when fixes need human judgment or touch frozen contracts.
- **Shared-VM agents.** Wins only when inputs exist only on your machine (uncommitted work, local fixtures). It is billed to your session and cannot isolate fixers.
- **Pipeline (what we did).** Wins when one stage's output is the next stage's prompt and stages should not wait for each other. The orders fixer started while the carts audit was still running.
