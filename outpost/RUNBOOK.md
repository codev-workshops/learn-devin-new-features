# Runbook — Kadé Devin Outpost (`kade-vpc`)

Sources: [overview](https://docs.devin.ai/cloud/outposts/overview), [quickstart](https://docs.devin.ai/cloud/outposts/quickstart), [orchestration](https://docs.devin.ai/cloud/outposts/orchestration), [reference](https://docs.devin.ai/cloud/outposts/reference) (fetched 2026-10-22).

## What runs where

- **On Kadé's worker (inside the VPC):** command execution, file edits, the repository checkout, and any keys you put in the worker's environment.
- **In Devin Cloud:** planning, inference and session orchestration. The model still sees what a session reads and runs; Outposts move execution, not inference.
- **Network:** workers make outbound HTTPS connections only. No inbound ports, public IP or VPN.

## 1. Create the Outpost (org admin, once)

1. Settings → Devin → Outposts → **Create Outpost**, name `kade-vpc`. Outposts must be enabled for the organization (Pro, Max or Teams).
2. Copy the worker token **now** into the secret manager (e.g. `kade/devin/outposts/kade-vpc`). It is shown once. If it is lost or pasted anywhere else, revoke it and create a new one.
3. API alternative: a v3 API token with `account.outposts.write`. Read-only observers need `account.outposts.read` (lists Outposts and workers; cannot create).

## 2. Build the worker image

From the repo root (the repo is the build context and is baked into `/workspace/repos/learn-devin-new-features`):

```bash
docker build -f outpost/Dockerfile -t kade-outpost-worker:$(git rev-parse --short HEAD) -t kade-outpost-worker .
docker run --rm --entrypoint bash kade-outpost-worker /usr/local/bin/kade-outpost-smoke
node labs/14-outposts/tools/outpost-sim.mjs check-dockerfile outpost/Dockerfile
```

Offline smoke build (no Devin CLI, cannot register; proves the other layers):

```bash
docker build -f outpost/Dockerfile --build-arg BASE_IMAGE=mirror.gcr.io/library/ubuntu:24.04 -t kade-outpost-worker:smoke .
docker run --rm --entrypoint bash kade-outpost-worker:smoke /usr/local/bin/kade-outpost-smoke
```

Image policy: official `devin-cli:stable` base; git (required), ffmpeg (screen recording), Chrome with `DEVIN_CHROME_PATH` (Ubuntu's chromium package is a snap stub in containers); non-root `devin` user and **no passwordless sudo** (these workers are long-lived; only grant sudo on machines recycled after each session); no token, key or `.env` in any layer.

## 3. Start workers

One worker process = one concurrent session. Start one:

```bash
export DEVIN_OUTPOSTS_TOKEN="$(your-secret-manager get kade/devin/outposts/kade-vpc)"
docker run -d --name kade-worker-a --restart unless-stopped -e DEVIN_OUTPOSTS_TOKEN \
  -v kade-worker-a:/home/devin/.devin/worker kade-outpost-worker worker start --outpost=kade-vpc
```

The equivalent without the env var is `devin worker start --outpost=kade-vpc --token=<token>`; prefer the env var so the token never lands in shell history or `ps`.

Two workers (payments + storefront at 09:00):

```bash
OUTPOST_NAME=kade-vpc docker compose -f outpost/compose.outpost.yml up -d --build
docker compose -f outpost/compose.outpost.yml ps
```

Each worker needs its **own** data directory/volume so it keeps a unique acceptor id. Never clone a worker by copying another worker's data directory — the duplicate is rejected and you silently have one worker.

## 4. Route engineers to the Outpost

- **Web:** pick `kade-vpc` as the environment when starting a session.
- **Slack:** `@Devin !outpost kade-vpc fix the PayGate sandbox webhook test`. `!outpost` on its own lists available Outposts; a unique prefix or the ID also works.
- **Default:** org admin sets Settings → Devin → **Default platform** → `kade-vpc`, so sessions land on the Outpost without anyone choosing it (also settable via the v3 API).

## 5. Capacity and queueing

- N online workers serve N sessions at once. Session N+1 is queued; the user sees a wait banner and the session starts when a worker frees up. It does not fail.
- Claims are atomic: if two workers race for one session, one wins and the other gets `409` and keeps watching. A worker that fails to provision releases the session back to the queue; a claim that is not confirmed before its deadline expires and the session returns to pending.
- Rehearse all of this offline: `node labs/14-outposts/tools/outpost-sim.mjs scenario labs/14-outposts/fixtures/two-workers.json`.
- If the wait banner is routine at 09:00, add a worker (`docker compose … up -d --scale` does not work with per-worker volumes; add a `worker-c` service).

## 6. Worker down at 2 a.m.

- Sessions waiting for that worker wait for a machine; they do not error out.
- `restart: unless-stopped` restarts a crashed container; for a dead host, the second host's workers keep serving.
- Alert when fewer than two worker containers are healthy (host container monitoring); `GET /opbeta/outposts/{outpost_id}` with a read token shows the Outpost status, including active claims.
- Rehearse: `node labs/14-outposts/tools/outpost-sim.mjs scenario labs/14-outposts/fixtures/worker-down.json`.

## 7. Who patches the worker image

Platform engineering owns it.

1. Weekly (and on any CVE notice for Chrome, git, Node or the base): `docker pull public.ecr.aws/e0h8a4b6/devin-cli:stable`, rebuild with `--pull`, run the smoke test and the policy check.
2. Roll one worker at a time: stop `worker-a`, start it on the new image, confirm it is online, then `worker-b`. Capacity never drops to zero.
3. Keep the previous tag for rollback.

## 8. Observer path (no Outpost permission)

If you cannot create an Outpost or have no token, do not ask for one. Build the image (or the smoke variant), run the smoke test, replay `labs/14-outposts/fixtures/*.json` and the injectors with `outpost-sim.mjs`, and record every live step as not exercised. With an `account.outposts.read` token you can still confirm the organization's Outposts: `curl -H "Authorization: Bearer $TOKEN" https://api.devin.ai/opbeta/outposts`.
