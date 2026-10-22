# outpost/ — Harbourline's Devin Outposts worker

Files for running Devin sessions on Harbourline-owned machines (lab 14). Start with [`RUNBOOK.md`](RUNBOOK.md).

| File                      | What it is                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `build.sh`                | Bundles the committed HEAD (`git bundle`) and runs `docker build`                              |
| `Dockerfile`              | Worker image: official Devin CLI base, git, ffmpeg, Node 22, Chrome, the repo baked in, non-root |
| `Dockerfile.dockerignore` | Admits only the bundle and `smoke.sh` to the build context                                     |
| `compose.outpost.yml`     | Two workers (`worker-a`, `worker-b`) on one host, each with its own data volume                 |
| `smoke.sh`                | In-image checks (installed as `harbourline-outpost-smoke`)                                             |

No token or key is stored here. The token comes from your secret manager at run time.
