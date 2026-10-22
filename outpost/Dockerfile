# Devin Outposts worker image for Kadé Commerce (lab 14).
#
# Build with outpost/build.sh from a clean checkout: it bundles the committed HEAD
# (`git bundle`), so untracked files, local `.env` files and uncommitted edits never reach
# the image, then runs `docker build -f outpost/Dockerfile .` from the repo root.
# Run (token is passed at run time, never baked in):
#   docker run --rm -e DEVIN_OUTPOSTS_TOKEN kade-outpost-worker worker start --outpost=kade-vpc
#
# Follows https://docs.devin.ai/cloud/outposts/quickstart (Docker tab) and the machine
# dependencies in https://docs.devin.ai/cloud/outposts/overview#machine-dependencies.
# BASE_IMAGE is overridable only so the layers below can be smoke-built offline
# (e.g. outpost/build.sh --build-arg BASE_IMAGE=mirror.gcr.io/library/ubuntu:24.04); a real
# worker needs the official image, whose entrypoint is the Devin CLI.
ARG BASE_IMAGE=public.ecr.aws/e0h8a4b6/devin-cli:stable
# Node 22 to match the repo's engines field (">=22 <23"), copied from the official image
# instead of piping a setup script into a shell.
ARG NODE_IMAGE=mirror.gcr.io/library/node:22-bookworm-slim

FROM ${NODE_IMAGE} AS node

FROM ${BASE_IMAGE}

ARG REPO_NAME=learn-devin-new-features
ARG REPO_URL=https://github.com/codev-workshops/learn-devin-new-features.git

# git is required; ffmpeg enables screen recording; python3 for services/fulfilment-worker.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl git ffmpeg gnupg python3 python3-venv python3-pip xvfb \
    && rm -rf /var/lib/apt/lists/*

# Ubuntu's chromium apt package is a snap stub that does not work in containers, so install
# Google Chrome (amd64) from Google's signed .deb and point the worker at it.
RUN curl -fsSL --proto '=https' --tlsv1.2 -o /tmp/chrome.deb \
      https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get update && apt-get install -y --no-install-recommends /tmp/chrome.deb \
    && rm /tmp/chrome.deb && rm -rf /var/lib/apt/lists/*
ENV DEVIN_CHROME_PATH=/usr/bin/google-chrome

COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/npm
RUN ln -sf ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -sf ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# No passwordless sudo: these workers are long-lived, so sessions get no root. Rebuild the
# image to add tools instead (see outpost/RUNBOOK.md, "Who patches the worker image").
RUN useradd --create-home --shell /bin/bash devin \
    && mkdir -p /workspace/repos && chown -R devin:devin /workspace

# Root-owned and read-only for the worker user.
COPY --chmod=0444 outpost/repo.bundle /opt/kade/repo.bundle
COPY --chmod=0555 outpost/smoke.sh /usr/local/bin/kade-outpost-smoke

USER devin

# The worker runs in /workspace; sessions find their repos under /workspace/repos/<name>.
WORKDIR /workspace
RUN git clone --quiet /opt/kade/repo.bundle repos/${REPO_NAME} \
    && git -C repos/${REPO_NAME} remote set-url origin ${REPO_URL} \
    && cd repos/${REPO_NAME} \
    && npm ci --no-audit --no-fund --ignore-scripts

# The image's entrypoint is the Devin CLI; arguments go straight to `devin`.
CMD ["worker", "start"]
