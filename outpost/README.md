# Outpost worker (lab 14)

A container image for a self-hosted [Devin Outpost](https://docs.devin.ai/cloud/outposts/overview) worker that can build this repository. Lab 14 walks through creating the Outpost, running the worker and sending sessions to it.

```bash
docker build -t ldnf-outpost-worker outpost/
docker run --rm -e OUTPOST_NAME=<outpost-name> -e OUTPOST_TOKEN ldnf-outpost-worker
```

- Pass the token through the environment (`-e OUTPOST_TOKEN` reads it from your shell). Never bake it into the image or commit it. It is shown only once when you create the Outpost.
- One worker serves one session at a time. Run N workers for N concurrent sessions.
- The Devin CLI install step follows the [Outposts quickstart](https://docs.devin.ai/cloud/outposts/quickstart); check it for the current command before building.
