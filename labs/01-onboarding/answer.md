## Feature fit

This lab is about putting each kind of onboarding knowledge where Devin will use it. **Machine setup** (runtime, installs, database, idempotent commands) belongs in the repository **blueprint**: `initialize` runs once when the snapshot is built, `maintenance` keeps dependencies current and is surfaced to the agent, and the blueprint's `knowledge` entries give environment context. **How to work in this repo** (ownership, gates, what never to do) belongs in `AGENTS.md`, layered root → service → deeper folders. **Reusable procedures** (bring-up, reset, gate sequence) belong in a **skill**. Mixing them is how Harbourline got here.

The two numbers to know: Devin automatically includes the **first 16 KiB of each `AGENTS.md`**; anything after that is only read if Devin goes looking. Knowledge is being retired in favour of **Skills** (organization skills in plugins, or repo `SKILL.md` files under `.agents/skills/`, `.devin/skills/` and friends); existing notes are migrated, not lost.

## Worked approach

1. **Ask first, cheaply.** Use Ask Devin (or read the repo) for "where is setup defined?", "which AGENTS.md files exist?", "where is the seed?" — questions with answers already in the code. Switch to an Agent session only for things that must *run*: installing, gates, reset.
2. **Audit the blueprint against the tree.** The live repo blueprint in settings still runs `pip install -e "services/payroll-worker[dev]"`; the directory is `services/fulfilment-worker`. That single stale path is why snapshot builds fail and sessions start with no `node_modules` and no worker package. `docs/blueprint.proposed.yaml` already has the corrected line. Apply it, rebuild, and keep the file and settings in sync.
3. **Find the other stale lines.** `services/api/AGENTS.md` tells you to `cp .env.example .env` inside `services/api`, but `.env.example` lives at the root. `.devin/skills/harbourline-dev/SKILL.md` and the blueprint's `knowledge` still say the database scripts are no-ops until the API lands — they are not any more. Each is a one-line correction on a throwaway branch.
4. **Measure the hierarchy.** `node labs/01-onboarding/tools/agents-budget.mjs` lists seven files totalling about 16.5 KiB — no single file is over the limit, because the limit is *per file*. The lesson is to keep each file short and front-loaded, and move procedures into skills, not to merge everything into one file.
5. **Close the unsafe reset.** The supported reset is `npm run lab:reset -- <nn>`: it reseeds through `db:seed -- --reset` using `DATABASE_URL` from your environment (default `postgres://harbourline:harbourline@localhost:5432/harbourline`, the Compose database) and then runs the lab's scenario script. Note what it does *not* do: nothing refuses a non-local URL. So the safety comes from the documents — every doc points at `lab:reset`, nobody's notes export a shared URL, and `.env.example` holds only local values. A code guard (refuse `--reset` when the host is not local) is a sensible proposal for the API owners, not something to slip in here.
6. **Move repeated guidance into a skill.** Bring-up and gates already live in `harbourline-dev`; anything you find repeated across `AGENTS.md` files (gate order, "never fix a plant") stays once in the root and is referenced elsewhere.

## The three injectors

- **contradictory-agents.** The deeper `services/api/src/AGENTS.md` says to run tests against a shared database and to reset with `docker compose down -v`. Deeper files are more specific, but specificity does not beat safety: the root file's ownership and gate rules win, and the deeper file is simply wrong. Delete it (or rewrite it to agree) on the throwaway branch; do not add a fourth file explaining which to believe.
- **stale-setup-doc.** `docs/SETUP.md` names `services/payroll-worker`, Node 18 and a reset against a shared host. Replace it with a three-line pointer to the root `AGENTS.md` and the `harbourline-dev` skill, or delete it. Every command that still matters already lives in the blueprint or the skill.
- **missing-paygate-secret.** The services all fall back to the same local default key, so a *missing* key silently works locally and a *different* key makes the worker inbox answer `401 invalid_signature` to every delivery — which is why the injector also points `PAYGATE_WEBHOOK_URL` at the worker (`:3003`). Sent to the default target, the API, the same deliveries are accepted, because the API does not verify signatures (a planted defect; do not fix it). The variable **name** `PAYGATE_SECRET` is already in the root `.env.example` with a local-only value; the fix is to point the stale `services/api/AGENTS.md` line at that root file and to mention the name in the skill. Never put a value in the blueprint; a real key belongs in Devin's secrets.

## Pitfalls

- Pasting setup commands into `AGENTS.md` instead of the blueprint: Devin reads them but the machine is still not ready when the session starts.
- Putting a secret value in a blueprint or skill "because it is only local".
- Treating "deeper `AGENTS.md` wins" as absolute and following an unsafe instruction.
- Fixing the API's missing signature check while you are there — that is a planted defect.
- Starting an Agent session for questions Ask Devin answers in seconds; or using Ask for something that must actually run.
- Explaining the 16 KiB limit as a limit on the whole hierarchy.

## Recovery moves

- Snapshot build fails: read the build log for the first failing command, run it by hand on a session VM, fix the path in the blueprint, rebuild.
- You edited a shared file on the wrong branch: `git stash`, switch to your throwaway branch, `git stash pop`.
- You ran an injector and lost track: `bash labs/01-onboarding/injectors/inject.sh --revert` then `npm run lab:reset -- 01`.

## Model answers to the objections

**"Why not just fix the README?"** — "Because the README is not what Devin or the machine reads first. I did fix the stale lines, on a branch. But the reason Monday's starter will be productive is that the environment now builds itself from the blueprint — the gates ran on a fresh session with no manual steps — and the instructions Devin reads are short, layered and agree with each other. A README helps a human read; a blueprint and `AGENTS.md` make the setup happen and keep it true. Next step: I'll delete the old setup page and point to the skill."

**"Will the new hire still learn the codebase if Devin does it for them?"** — "Yes, because setup is not where learning happens — it is where the first week disappears. Devin gets the machine ready and the reset safe; the new starter spends week one in the code, with Ask Devin to answer 'where is this defined?' and the same `AGENTS.md` rules Devin follows, so they learn the real conventions. The things they must learn by hand — the money rules, the brand differences, what never to fix — are written down once. Next step: Priya and I pair them on one real ticket on day two."

## Debrief

What changed on Monday: the blueprint references only real paths and the snapshot builds; the instruction files agree; the unsafe reset path is gone; secrets are named, not stored. What you did not hand to Devin: deciding which document is authoritative and deleting the losers — that is an ownership decision a person makes.

## References

See the reference list for this lab.
