You are done when all of the following are observable by someone who was not in the room. Each item has a fixture-path version that needs no credentials.

1. **Worker image.** `outpost/build.sh` builds the image from the committed HEAD, or its Ubuntu smoke variant (`--build-arg BASE_IMAGE=…`) builds when the official registry is unreachable, and `node labs/14-outposts/tools/outpost-sim.mjs check-dockerfile outpost/Dockerfile` prints nine `ok` lines.
2. **Repo and dependencies inside.** `outpost/smoke.sh` run in the built image exits 0: git, ffmpeg, Node 22, Chrome at `DEVIN_CHROME_PATH`, the repo under `/workspace/repos/learn-devin-new-features` with dependencies installed, non-root, no passwordless sudo, no token in the environment.
3. **Runbook.** `outpost/RUNBOOK.md` lets a new engineer create the Outpost, store the token, start two workers, route sessions from web, Slack and the default platform, recover a dead worker and patch the image — without asking you.
4. **Queue evidence.** `labs/14-outposts/OUTPOST-REPORT.md` contains the replay of `fixtures/two-workers.json` (or the live equivalent) and states, with times, which session waited and why.
5. **Failure evidence.** The same report shows the claim race, the duplicated acceptor id and the night-time worker loss, each with the one-line lesson.
6. **Injector reviews.** The report answers the no-Chrome image and the baked-token pull request with a verdict and the failing check names.
7. **Live versus rehearsed.** The report ends with a table of every step and whether it ran live, ran on the fixture path, or was not exercised and why.
8. **Coach run.** You ran the coach for this lab and the report is on your coaching branch.
