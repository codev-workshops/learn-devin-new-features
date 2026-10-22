## Feature fit

Outposts move session **execution** onto machines Harbourline runs: commands, file edits and repository access happen on the worker inside the VPC, while planning and inference stay in Devin Cloud. That answers the CISO's two concrete asks — the repo is checked out only on Harbourline hosts, and PayGate sandbox keys can live in the VPC's own secret store and environment rather than in Devin-hosted machines. It does not make Devin "air-gapped": the model still sees the code it reads and the commands it runs. Say that first; the first objection is built on it.

An Outpost is a named queue. Each worker process watches the queue and runs one session at a time, so two containers give two concurrent sessions and the third waits (with a wait banner, not an error) until a worker frees up.

## Worked approach

1. **Create the Outpost** (org admin: Settings → Devin → Outposts → Create Outpost, e.g. `harbourline-vpc`). Copy the worker token immediately into the secret manager; it is shown once.
2. **Build the image** with `outpost/build.sh`, which bundles the committed HEAD (`git bundle`) and runs `docker build -f outpost/Dockerfile .` from the repo root. The Dockerfile starts from `public.ecr.aws/e0h8a4b6/devin-cli:stable`, adds git, ffmpeg, Node 22, Python and Google Chrome (`DEVIN_CHROME_PATH=/usr/bin/google-chrome`, because Ubuntu's chromium package is a snap stub in containers), creates a non-root user, clones the bundle into `/workspace/repos/learn-devin-new-features` and runs `pnpm install --frozen-lockfile --ignore-scripts`, and defaults to `CMD ["worker", "start"]`. `outpost/Dockerfile.dockerignore` admits only the bundle and the smoke test, so `.env` files, untracked files and `node_modules` cannot be copied in.
3. **Prove the image**: `check-dockerfile` (nine `ok`) and `harbourline-outpost-smoke` inside the image. If the official registry is unreachable, build the same layers on Ubuntu with `--build-arg BASE_IMAGE=mirror.gcr.io/library/ubuntu:24.04` and say that the CLI layer was not exercised.
4. **Start two workers**: `export DEVIN_OUTPOSTS_TOKEN=…` from the secret manager, then `docker compose -f outpost/compose.outpost.yml up -d`. Each service has its own data volume, so each keeps its own acceptor id; `restart: unless-stopped` brings a dead container back.
5. **Route engineers to it**: web (pick the Outpost when starting a session), Slack (`@Devin !outpost harbourline-vpc …`; `!outpost` alone lists the choices), and the organization default platform so nobody has to remember.
6. **Replay the queue and failures** with `outpost-sim.mjs` and paste the logs into `OUTPOST-REPORT.md`, then fill in the live-versus-rehearsed table.

## The injectors

- **token-shown-once** — treat the pasted token as leaked: revoke it, create a new one, store it in the secret manager, inject it at run time. There is no "show it again".
- **no-chrome** — the `chrome` check fails; any session that needs a browser (checkout UI repro, screenshots) fails on that worker. Keep Chrome and `DEVIN_CHROME_PATH`.
- **third-session** — S3 waits until S1 finishes; the engineer sees the wait banner. If waits are routine at 09:00, add a third worker.
- **claim-race** — one claim wins, the loser gets 409 and keeps watching; a failed provision releases the session back to the queue, so it runs once.
- **shared-acceptor-id** — the second container is rejected; give every worker its own data directory.
- **baked-token** — reject: the token is in an image layer forever and the sudoers line gives every session root on a long-lived host.
- **worker-down** — the session waits for a machine rather than failing, and the restart policy (or the host's supervisor) brings the worker back.

## Pitfalls

- Saying "nothing leaves the VPC". The model still receives the context it works on.
- Baking the token or a PayGate key into the image or the compose file.
- Copying one worker's data directory to start a second.
- Enabling passwordless sudo on long-lived workers "to make installs easier".
- Calling the replay a live test. It reproduces the documented rules, not the Devin UI.

## Recovery moves

- Lost the thread: return to the boundary — what runs where.
- Asked for something you did not run: "I rehearsed that on the fixture path; here is what I would run live and what I expect to see."
- Stuck on a number: the queue log has times; read them.

## Model answers to the objections

- **Data boundary** — "Fair. Inference still happens in Devin Cloud, so the model sees what the session reads. What changes is execution: the checkout, the keys and every command live on our hosts, behind our egress rules. Evidence: the image, the smoke test and the runbook. If you want the model's view narrowed further, we keep PayGate keys out of the repo and scope what sessions can read."
- **Availability** — "A session waits for a machine instead of failing, and the container restarts on its own. Two workers means one can die and the other keeps serving. Next step: an alert on worker count below two."
- **Ownership** — "Platform engineering owns it. We rebuild from the stable base on a weekly schedule and on CVE notices, roll one worker at a time so capacity never drops to zero, and the smoke test gates every rollout."

## Debrief

- Where did you first state the boundary precisely, and did the CISO have to pull it out of you?
- Which claims in your update were live, and which were rehearsed — and did you say so?
- What capacity number would you commit to for 09:00, and why?

## References

See the lab page's References section; all Outposts behaviour above is from the official docs fetched on 2026-10-22.
